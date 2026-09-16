# Mgboard_Web — Masaram Gondi Web Keyboard

**|| जय सेवा ||**

🌿 **Mgboard_Web** is a privacy-first responsive Web Keyboard with zero runtime JavaScript dependencies for the **Masaram Gondi Script** (मासाराम गोंडी लिपि). Developed by **[Saiyyam Ji (@saiyyamdeveloper)](https://github.com/saiyyamdeveloper)**.

---

## 🌟 Live Demo & Hosting

When hosted on GitHub Pages under the repository `Mgboard_Web`:
👉 ⌨️[Mgboard Web](https://saiyyamdeveloper.github.io/Mgboard_Web/)

## ⌨️ Key Features & Capabilities

1. **🌐 3-Mode Smart Keyboard Switcher:**
   - **Masaram Gondi (Native 6-Row Layout):** Uses Unicode Masaram Gondi characters, with 10 independent vowels (`𑴀`–`𑴋`), 37 consonants/conjuncts (`𑴌`–`𑴰`), and 10 matras (U+11D31–U+11D3F, with gaps).
   - **Hindi Devanagari → Gondi (6-Row Layout):** Type using familiar Devanagari glyphs with instant Masaram Gondi Unicode output. Supports Nukta letters (`क़`, `ख़`, `ग़`, `ज़`, `ड़`, `ढ़`, `फ़`, `य़`) via long-press.
   - **English QWERTY (4-Row Standard Layout):** Auto-capitalization, single-tap Shift (one-shot), double-tap Caps-Lock.

2. **🔤 Dynamic Vowel ↔ Matra State Switch (Row 1):**
   - Automatically switches Row 1 into 10 dependent vowel signs (Matras) upon typing a consonant.
   - Exact 10-key layout including Vocalic-R matra (`ृ` / `𑴶`), ensuring no empty/blank button slots.

3. **🔗 Yukt (युक्ताक्षर Engine):**
   - Seamless conjunct character creation (`C1 + युक्त + C2` → half consonants, Ra-kara `𑴎𑵇`, or Repha `𑵆𑴎`).

4. **📱 Spacebar Trackpad Cursor Navigation:**
   - Drag finger left or right across the spacebar to smoothly position the text cursor.

5. **🔢 3-Page Symbol & Calculator Modes:**
   - **Gondi Digits & Symbols:** Native Gondi numbers (`𑵐`–`𑵙`) plus cultural symbols (`࿕` Swastik, `☸` Dharmachakra, `❀` Florette, `₹` Rupee).
   - **QWERTY Symbols:** Page 1 (Punctuation), Page 2 (Math & Currency), Page 3 (5-column vertical calculator layout).

6. **🛠️ Built-in Tools:**
   - 📋 **Copy:** Clipboard copy with fallback support.
   - ⬇️ **Save:** Direct `.txt` download.
   - 📤 **Share:** Mobile native Web Share API.
   - 🔍 **Unicode Inspector:** Inspect hex codepoints (e.g., `U+11D0C U+11D31`).
   - 😊 **Emoji Picker:** Categorized emoji selector with instant live search.

---

## 📁 Repository Structure

```text
├── index.html          # Main web application (entry point for GitHub Pages)
├── Mgboard_Web.html    # Standalone HTML file
├── README.md           # Documentation & instructions
├── FIXES-HI.md         # हिंदी सुधार और deployment गाइड
├── TEST-RESULTS.txt    # Local regression-test results
├── scripts/sync-html.cjs # Generate standalone copy from index.html
├── tests/regression.cjs # Chromium engine/UI regression tests
└── package.json        # Development/test tooling only
```

---

## 🚀 How to Host on GitHub Pages

1. Create a new GitHub repository named `Mgboard_Web` under your account ([`@saiyyamdeveloper`](https://github.com/saiyyamdeveloper)).
2. Upload/push `index.html` (or `Mgboard_Web.html`) and `README.md`.
3. Go to **Settings** → **Pages** in your repository.
4. Under **Build and deployment** > **Branch**, select `main` (or `master`) and folder `/ (root)`.
5. Click **Save**. Within 1–2 minutes, your website will be live at:
   `https://saiyyamdeveloper.github.io/Mgboard_Web/`

---

## 🔗 Related Projects by Saiyyam Ji

- 🔄 [Hindi-Masaram-Gondi-Script-Converter](https://github.com/saiyyamdeveloper/Hindi-Masaram-Gondi-Script-Converter) — Script converter, 75-key keyboard.
- 📖 [MasaramGondiLipi-dictionary](https://github.com/saiyyamdeveloper/MasaramGondiLipi-dictionary) — Gondi language and script dictionary.
- 📱 [Mgboard Web](https://saiyyamdeveloper.github.io/Mgboard_Web/) 
---

**|| सेवा जोहार ||**

---

## 🎤 Update v16.3 (16 September 2026)

- **Voice typing add hua!** 🎙️ — Mic dabao, Hindi bolo, turant **Masaram Gondi lipi** me likha jayega
- Unicode 17.0 rules: REPHA, RA-KARA, KSSA/JNYA/TRA, HALANTA/VIRAMA
- Nukta fix: ड़/ढ़/क़/ख़/ग़/ज़/फ़/य़ ab base + 𑵂 (U+11D42), NFC-normalized input
- Backspace **hold-to-repeat** delete (400ms baad, har 70ms)
- **Live site:** https://saiyyamdeveloper.github.io/Mgboard_Web/


## 🛠️ Local maintenance update v16.3.1

**हिंदी गाइड:** [FIXES-HI.md](FIXES-HI.md)

This local maintenance version fixes the eight reviewed issues: stale paste/IME context, destructive failed Cut, multi-codepoint insertion, middle-of-text conjuncts, nukta-cluster conversion, one-shot Shift, storage failures, and keyboard activation. It also makes Hindi and Gondi dictation output consistent and guards cancelled speech sessions. This is transliteration, not Hindi-to-Gondi language translation.

**60/60 local Chromium regressions passed.** Mouse and keyboard interactions and Chromium-emulated mobile touch were tested. Actual microphone/clipboard permissions, speech accuracy, physical phones, Safari, Firefox and WebView still need testing. Publishing the commit and deploying GitHub Pages are separate steps; check the repository Actions/Pages status after pushing.

### Development and tests

`index.html` is the canonical self-contained source. After editing it, synchronize the downloadable HTML:

```bash
npm ci
npx playwright install --with-deps chromium
npm run sync
npm test
```

The test command checks that the two HTML files are byte-identical, then runs the browser regressions. Playwright is a **development dependency only**; the hosted keyboard needs no npm installation. The optional `.github/workflows/test.yml` workflow runs the same checks on pushes and pull requests when installed (uploading workflows needs the corresponding GitHub permission).

### Privacy and retention

- Ordinary typing and script conversion happen in this page. Browser speech recognition may send audio to a vendor service; the first microphone use in each page session asks for acknowledgment.
- Opt-in clipboard history stores plaintext in this browser. With browser permission, external clipboard text can be read on focus/visibility changes and while the clipboard panel is open.
- Pinned clips remain until deleted. Unpinned clips expire after one hour and are removed during cleanup while the app is running or on a later load. Cleanup cannot run while the page is closed.
- If storage is blocked or full, settings and clipboard history fall back to session memory. Main editor text is not automatically persisted: Copy or Save before closing/reloading.
