/* Browser regressions: no external site, microphone or real clipboard needed.
   Engine cases call application handlers; UI cases use mouse/keyboard/CDP touch.
   npm ci && npx playwright install --with-deps chromium && npm test */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const cases = [];
function test(name, fn, options = {}) { cases.push({name, fn, options}); }
function engine(name, fn) { test(name, async p => { const [actual, expected] = await p.evaluate(fn); assert.deepEqual(actual, expected); }); }

engine('startup builds all keyboard panels', () => [document.querySelectorAll('.key').length, 237]);
engine('paste cannot make Yukt overwrite a non-consonant', () => {
  insertCharacter(CP.KA); teInsertTextAtCursor('x'); onYukt(); insertCharacter(CP.GA);
  return [output, CP.KA + 'x' + CP.GA];
});
engine('pasted consonant establishes fresh context', () => {
  insertCharacter(CP.KA); teInsertTextAtCursor(CP.GA); onYukt(); insertCharacter(CP.MA);
  return [output, CP.KA + CP.GA + CP.VIRAMA + CP.MA];
});
engine('nukta sequence advances two codepoints before suffix', () => {
  insertCharacter('x'); teSetCursor(0); insertCharacter(CP.KA + CP.NUKTA);
  const cursor = getCursorIndex(), row = state.row1;
  insertCharacter(CP.VS_AA);
  return [[cursor, row, output], [2, 'matra', CP.KA + CP.NUKTA + CP.VS_AA + 'x']];
});
engine('nukta sequence at end enables matras', () => {
  insertCharacter(CP.PHA + CP.NUKTA); return [state.row1, 'matra'];
});
engine('multi-codepoint emoji inserted before suffix keeps caret after it', () => {
  insertTextBulk('x'); teSetCursor(0); insertCharacter('👩‍💻'); insertCharacter('!');
  return [output, '👩‍💻!x'];
});
engine('Yukt ordinary conjunct before suffix', () => {
  insertCharacter('x'); teSetCursor(0); insertCharacter(CP.KA); onYukt(); insertCharacter(CP.GA);
  return [output, CP.KA + CP.VIRAMA + CP.GA + 'x'];
});
engine('Yukt REPHA before suffix', () => {
  insertCharacter('x'); teSetCursor(0); insertCharacter(CP.RA); onYukt(); insertCharacter(CP.GA);
  return [output, CP.REPHA + CP.GA + 'x'];
});
engine('Yukt RA-KARA with nukta and matra before suffix', () => {
  insertCharacter('x'); teSetCursor(0); insertCharacter(CP.KA + CP.NUKTA); onYukt(); insertCharacter(CP.RA);
  const row = state.row1; onVocalicRTap();
  return [[row, output], ['matra', CP.KA + CP.NUKTA + CP.RAKARA + CP.VS_R + 'x']];
});
engine('pending Yukt followed by space commits HALANTA before suffix', () => {
  insertCharacter('x'); teSetCursor(0); insertCharacter(CP.KA); onYukt(); onSpace();
  return [output, CP.KA + CP.HALANTA + ' x'];
});
engine('pending REPHA followed by Enter retains RA and HALANTA', () => {
  insertCharacter(CP.RA); onYukt(); onEnter(); return [output, CP.RA + CP.HALANTA + '\n'];
});
engine('cursor movement cancels pending composition', () => {
  insertTextBulk(CP.KA + CP.GA); onYukt(); teSetCursor(0); insertCharacter(CP.MA);
  return [output, CP.MA + CP.KA + CP.GA];
});
engine('composition validates its source text before replacement', () => {
  insertCharacter(CP.KA); onYukt(); output = 'x'; insertCharacter(CP.GA);
  return [output, 'x' + CP.GA];
});
engine('backspace context comes from cursor, not document tail', () => {
  insertTextBulk(CP.KA + 'x' + CP.MA + CP.VS_AA); teSetCursor(2); backspace();
  return [[output, state.row1, state.lastCons], [CP.KA + CP.MA + CP.VS_AA, 'matra', CP.KA]];
});
engine('vocalic-R does not duplicate a previously typed consonant', () => {
  insertCharacter(CP.KA); insertCharacter(CP.VS_AA); onVocalicRTap();
  return [output, CP.KA + CP.VS_AA + CP.VS_R];
});
engine('paste replaces selection and refreshes IME', () => {
  insertTextBulk('old'); teSelectAll(); teInsertTextAtCursor(CP.GA);
  return [[output, state.selAnchor, state.row1], [CP.GA, null, 'matra']];
});
engine('large paste avoids JavaScript spread-argument limits', () => {
  const large = '𑴌'.repeat(150000); teInsertTextAtCursor(large);
  return [[output.length, getCursorIndex()], [large.length, 150000]];
});
engine('selection deletion clears stale consonant context', () => {
  insertCharacter(CP.KA); teSelectAll(); teDeleteActive(); onYukt(); insertCharacter(CP.GA);
  return [[output, state.row1], [CP.GA, 'matra']];
});
engine('failed Cut keeps text and selection', async () => {
  insertTextBulk('important'); teSelectAll(); copyToClipboard = async () => false; await teCut();
  return [[output, getSelRange()], ['important', [0, 9]]];
});
engine('throwing clipboard helper does not delete selected text', async () => {
  insertTextBulk('safe'); teSelectAll(); copyToClipboard = async () => {throw Error('denied');}; await teCut();
  return [output, 'safe'];
});
engine('successful Cut removes selection and remains undoable', async () => {
  insertTextBulk(CP.KA + CP.GA); teSelectAll(); copyToClipboard = async () => true; await teCut();
  const cut = output; performUndo();
  return [[cut, output, getSelRange()], ['', CP.KA + CP.GA, [0, 2]]];
});
engine('Cut does not delete a document edited while copy was pending', async () => {
  insertTextBulk('old'); teSelectAll(); let resolve;
  copyToClipboard = () => new Promise(r => {resolve = r;});
  const pending = teCut(); teInsertTextAtCursor('new'); resolve(true); await pending;
  return [output, 'new'];
});
engine('Cut does not delete a selection moved while copy was pending', async () => {
  insertTextBulk('old'); teSelectAll(); let resolve;
  copyToClipboard = () => new Promise(r => {resolve = r;});
  const pending = teCut(); teSetCursor(1); resolve(true); await pending;
  return [output, 'old'];
});
engine('Undo and Redo restore middle composition and caret', () => {
  insertTextBulk('x'); teSetCursor(0); insertCharacter(CP.KA); onYukt(); insertCharacter(CP.GA);
  const composed = output; performUndo(); const undone = output; performRedo();
  return [[composed, undone, output, getCursorIndex()], [CP.KA + CP.VIRAMA + CP.GA + 'x', 'x', CP.KA + CP.VIRAMA + CP.GA + 'x', 3]];
});
engine('new edit after Undo invalidates Redo', () => {
  insertTextBulk('a'); insertTextBulk('b'); performUndo(); insertCharacter('c'); performRedo();
  return [output, 'ac'];
});
engine('Clear resets selection and supports Undo', () => {
  insertTextBulk('abc'); teSelectAll(); document.getElementById('clearBtn').click();
  const cleared = [output, state.selAnchor]; performUndo();
  return [[cleared, output], [['', null], 'abc']];
});
engine('converter handles precomposed and decomposed nukta clusters', () => {
  const expected = CP.PHA + CP.NUKTA + CP.VIRAMA + CP.TA;
  return [[convertDevanagariToGondi('\u095e्त'), convertDevanagariToGondi('फ़्त')], [expected, expected]];
});
engine('converter handles plain nukta and terminal HALANTA', () => {
  return [[convertDevanagariToGondi('फ़'), convertDevanagariToGondi('फ़्')], [CP.PHA + CP.NUKTA, CP.PHA + CP.NUKTA + CP.HALANTA]];
});
engine('converter handles dedicated and chained conjuncts', () => {
  return [['क्ष', 'ज्ञ', 'त्र', 'स्त्र', 'क्ष्म'].map(convertDevanagariToGondi),
    [CP.KSSA, CP.JNYA, CP.TRA, CP.SA + CP.VIRAMA + CP.TRA, CP.KSSA + CP.VIRAMA + CP.MA]];
});
engine('converter handles REPHA, RA-KARA and nukta RA clusters', () => {
  return [['र्क', 'क्र', 'र्क्र', 'फ़्र', 'र्फ़'].map(convertDevanagariToGondi),
    [CP.REPHA + CP.KA, CP.KA + CP.RAKARA, CP.REPHA + CP.KA + CP.RAKARA,
     CP.PHA + CP.NUKTA + CP.RAKARA, CP.REPHA + CP.PHA + CP.NUKTA]];
});
engine('converter retains punctuation and maps Devanagari/Latin digits', () => {
  return [convertDevanagariToGondi('क १२ 12! abc'), CP.KA + ' ' + CP.D1 + CP.D2 + ' ' + CP.D1 + CP.D2 + '! abc'];
});
engine('one-shot Shift affects only the next letter', () => {
  state.kbMode = 'qwerty'; render(); onQwertyLetterTap('x'); onQwertyShift(); onQwertyLetterTap('a'); onQwertyLetterTap('b');
  return [output, 'XAb'];
});
engine('Caps Lock remains active across letters', () => {
  state.kbMode = 'qwerty'; render(); onQwertyShift(); onQwertyShift(); onQwertyLetterTap('a'); onQwertyLetterTap('b');
  return [output, 'AB'];
});
engine('auto-capitalization follows cursor position', () => {
  state.kbMode = 'qwerty'; insertTextBulk('abc'); teSetCursor(0); onQwertyLetterTap('x');
  return [output, 'Xabc'];
});
engine('malformed clipboard storage does not crash rendering', () => {
  storageSet(CP_STORAGE_KEY, '{}'); openClipboardPanel(); const a = cpLoad();
  storageSet(CP_STORAGE_KEY, '[null, 2, {"id":"bad"}]'); const b = cpLoad();
  storageSet(CP_STORAGE_KEY, '{broken'); const c = cpLoad();
  return [[a, b, c], [[], [], []]];
});
engine('stored clipboard IDs and records are validated', () => {
  const good = {id:'c1', text:'safe', pinned:true, timestamp:Date.now()};
  storageSet(CP_STORAGE_KEY, JSON.stringify([good, good, {...good,id:'x"]'}, {...good,id:'c2',text:2}]));
  return [cpLoad(), [good]];
});
engine('unpinned expired clips are pruned but pinned clips remain', () => {
  cpSave([{id:'old',text:'old',pinned:false,timestamp:Date.now()-CP_TTL_MS-1},
    {id:'pin',text:'pin',pinned:true,timestamp:0}]);
  return [cpPruneExpired().map(c => c.id), ['pin']];
});
engine('user text renders as text, not HTML', () => {
  insertTextBulk('<img src=x onerror=alert(1)>');
  return [[document.querySelector('#out img') === null, document.getElementById('out').textContent], [true, output]];
});

// Real keyboard/mouse actions.
test('native Enter and Space activate a focused key once each', async p => {
  await p.evaluate(() => {state.kbMode='qwerty';render();});
  const key=p.locator('#kbQ .qwertyKey').first(); await key.focus();
  await p.keyboard.press('Enter'); await p.keyboard.press('Space');
  assert.equal(await p.evaluate(() => output), 'Qq');
});
test('mouse clicks do not insert duplicate characters', async p => {
  await p.evaluate(() => {state.kbMode='qwerty';render();});
  await p.locator('#kbQ .qwertyKey').nth(0).click(); await p.locator('#kbQ .qwertyKey').nth(1).click();
  assert.equal(await p.evaluate(() => output), 'Qw');
});
test('mouse long-press emits one nukta sequence and enables matras', async p => {
  await p.evaluate(() => {state.kbMode='hindi';render();});
  const key=p.locator('#kbH .key').filter({hasText:/^क$/}); await key.hover();
  await p.mouse.down(); await p.waitForTimeout(350); await p.mouse.up();
  assert.deepEqual(await p.evaluate(() => [output,state.row1]), ['𑴌𑵂','matra']);
});
test('Space key keyboard activation inserts only one space', async p => {
  await p.locator('#kbL .wide').focus(); await p.keyboard.press('Enter');
  assert.equal(await p.evaluate(() => output), ' ');
});
engine('pointercancel is not a key tap', () => {
  const b=document.querySelector('#kbL .key');
  b.dispatchEvent(new PointerEvent('pointerdown',{pointerId:8,button:0,pointerType:'mouse'}));
  b.dispatchEvent(new PointerEvent('pointercancel',{pointerId:8,pointerType:'mouse'}));
  return [output,''];
});
engine('spacebar pointercancel inserts nothing', () => {
  const b=document.querySelector('#kbL .wide');
  b.dispatchEvent(new PointerEvent('pointerdown',{pointerId:8,button:0,pointerType:'mouse'}));
  b.dispatchEvent(new PointerEvent('pointercancel',{pointerId:8,pointerType:'mouse'}));
  return [output,''];
});
test('spacebar drag moves caret without inserting a space', async p => {
  await p.evaluate(() => insertTextBulk('abcdef'));
  const r=await p.locator('#kbL .wide').boundingBox(); const x=r.x+r.width/2,y=r.y+r.height/2;
  await p.mouse.move(x,y); await p.mouse.down(); await p.mouse.move(x-32,y,{steps:4}); await p.mouse.up();
  assert.deepEqual(await p.evaluate(() => [output,getCursorIndex()]),['abcdef',4]);
});
test('matra-row keyboard activation keeps focus in the replacement row', async p => {
  await p.evaluate(() => insertCharacter(CP.KA)); await p.locator('#row1 .key').first().focus();
  await p.keyboard.press('Enter');
  assert.equal(await p.evaluate(() => document.activeElement === document.querySelector('#row1 .key')),true);
});
engine('icon-only keyboard controls have accessible names', () => {
  return [[...document.querySelectorAll('.globeKey, .enter, .danger.key, #qwertyShiftKey')].every(b=>!!b.getAttribute('aria-label')), true];
});

async function touchPoint(p, selector){
  const key=p.locator(selector); await key.scrollIntoViewIfNeeded(); const r=await key.boundingBox();
  return {x:r.x+r.width/2,y:r.y+r.height/2};
}
test('mobile touch taps do not double-insert', async p => {
  await p.evaluate(() => {state.kbMode='qwerty';render();});
  await p.locator('#kbQ .qwertyKey').first().tap(); await p.locator('#kbQ .qwertyKey').first().tap();
  assert.equal(await p.evaluate(() => output),'Qq');
},{mobile:true});
test('mobile long-press commits only its alternate on release', async (p,c) => {
  await p.evaluate(() => {state.kbMode='hindi';render();});
  const point=await touchPoint(p,'#kbH .row:nth-child(2) .key:first-child');
  const cdp=await c.newCDPSession(p); await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  await p.waitForTimeout(350); assert.equal(await p.evaluate(() => output),'');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await p.evaluate(() => output),'𑴌𑵂');
},{mobile:true});
test('mobile cancelled long-press does not insert an alternate', async (p,c) => {
  await p.evaluate(() => {state.kbMode='hindi';render();});
  const point=await touchPoint(p,'#kbH .row:nth-child(2) .key:first-child'); const cdp=await c.newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]}); await p.waitForTimeout(350);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  assert.equal(await p.evaluate(() => output),'');
},{mobile:true});
test('mobile backspace hold repeats and stops on release', async (p,c) => {
  await p.evaluate(() => {state.kbMode='qwerty';insertTextBulk('abcdefghij');});
  const point=await touchPoint(p,'#kbQ .danger'); const cdp=await c.newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]}); await p.waitForTimeout(630);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); const first=await p.evaluate(() => output);
  assert.ok(first.length < 9 && first.length > 0); await p.waitForTimeout(160);
  assert.equal(await p.evaluate(() => output),first);
},{mobile:true});
test('mobile symbol popup drag inserts exactly the selected symbol', async (p,c) => {
  await p.evaluate(() => {state.kbMode='qwerty';render();});
  const key=p.locator('#kbQ .key').filter({hasText:/^\.\.$/});
  await key.scrollIntoViewIfNeeded(); const r=await key.boundingBox();
  const cdp=await c.newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});
  await p.waitForTimeout(400);
  const item=p.locator('#multiPop .multiPopItem').first(); const ir=await item.boundingBox(); const text=await item.textContent();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:ir.x+ir.width/2,y:ir.y+ir.height/2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await p.evaluate(() => output),text);
},{mobile:true});

// Optional browser integrations: simulated failures and recognizer callbacks.
test('blocked storage still supports typing, settings, themes and clipboard', async p => {
  const result=await p.evaluate(() => {
    insertCharacter(CP.KA); openSettings(); applyTheme('light'); cpSetEnabled(true); cpAddClip('session');
    openClipboardPanel(); return [output,cpLoad()[0].text,storageGet(SET_THEME_KEY),document.querySelectorAll('.key').length];
  });
  assert.deepEqual(result,['𑴌','session','light',237]);
},{storage:'blocked'});
test('quota failure falls back to memory instead of stale persistent values', async p => {
  assert.deepEqual(await p.evaluate(() => {
    applyTheme('light'); cpSetEnabled(true);cpAddClip('in-memory');cpSave([]);
    return [getSavedTheme(),cpIsEnabled(),cpLoad()];
  }),['light',true,[]]);
},{storage:'quota'});
engine('Hindi and Gondi dictation both output Gondi; English stays English', () => {
  window.confirm=()=>true;
  window.SpeechRecognition=class{start(){}stop(){}abort(){}};
  const results=[];
  for(const mode of ['hindi','gondi','qwerty']){
    state.kbMode=mode; micStart(); _micRecognition.onresult({results:[[{transcript:mode==='qwerty'?'hello':'कमल'}]]});
    results.push(output); micForceStop(); document.getElementById('clearBtn').click();
  }
  const gondi=CP.KA+CP.MA+CP.LA+' ';
  return [results,[gondi,gondi,'hello ']];
});
engine('voice privacy cancellation never starts recording', () => {
  window.confirm=()=>false; let count=0;
  window.SpeechRecognition=class{constructor(){count++;}start(){}}; micStart();
  return [[count,_micActive],[0,false]];
});
engine('cancelled voice session cannot insert a late result', () => {
  window.confirm=()=>true; window.SpeechRecognition=class{start(){}stop(){}abort(){}};
  micStart(); const result=_micRecognition.onresult; micForceStop(); result({results:[[{transcript:'कमल'}]]});
  return [[output,_micActive],['',false]];
});
engine('old recognizer callbacks cannot reset a newer voice session', () => {
  window.confirm=()=>true;window.SpeechRecognition=class{start(){}stop(){}abort(){}};
  micStart(); const oldStart=_micRecognition.onstart, oldError=_micRecognition.onerror, oldEnd=_micRecognition.onend;
  micForceStop(); micStart(); const current=_micRecognition;
  oldStart();oldError({error:'network'});oldEnd();
  return [[_micRecognition===current,_micActive,_micListening],[true,true,false]];
});
engine('speech constructor or start errors do not leave active session', () => {
  window.confirm=()=>true;window.SpeechRecognition=class{constructor(){throw Error('unsupported');}};micStart();
  const a=_micActive;
  window.SpeechRecognition=class{start(){throw Error('denied');}abort(){}};micStart();
  return [[a,_micActive,_micRecognition],[false,false,null]];
});
engine('successful voice result is one undoable edit', () => {
  window.confirm=()=>true;window.SpeechRecognition=class{start(){}abort(){}};
  insertTextBulk('prefix ');state.kbMode='hindi';micStart();_micRecognition.onresult({results:[[{transcript:'कमल'}]]});
  performUndo();return [output,'prefix '];
});

(async()=>{
  const browser=await chromium.launch({headless:true}); let failed=0;
  try {
    for(const {name,fn,options} of cases){
      const context=await browser.newContext(options.mobile ? {viewport:{width:390,height:844},isMobile:true,hasTouch:true} : {viewport:{width:1280,height:900}});
      await context.route('https://mgboard.test/**',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:html}));
      if(options.storage==='blocked') await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Access denied','SecurityError');}}));
      if(options.storage==='quota') await context.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});
      const page=await context.newPage();page.setDefaultTimeout(7000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try {
        await page.goto('https://mgboard.test/'); await fn(page,context);
        assert.deepEqual(errors,[], 'unexpected page errors');console.log('PASS '+name);
      } catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}
      finally {await context.close();}
    }
  } finally {await browser.close();}
  console.log(`\n${cases.length-failed}/${cases.length} tests passed.`);
  if(failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
