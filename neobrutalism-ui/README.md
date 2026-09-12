# class_notes_vault // Neo-Brutalist Academic Bento UI

A standalone student note-sharing dashboard crafted strictly under **Neo-Brutalist** and **Bento Box** visual design principles.

---

## 🎨 Design Rules Implemented

- **Bento Box Structure:** Rigid, fluid CSS Grid layout divided into distinct, abutting rectangular cells (`12-column` grid with responsive vertical collapse for mobile/tablet).
- **Hard Boundaries:** Every card, container, button, and input has a raw solid black border (`2px` to `4px` solid `#000000`).
- **Zero Softness:** Strict `0px border-radius` everywhere — absolutely no rounded corners.
- **Color Palette:**
  - Background: Stark off-white / light gray (`#F4F4F0`) and pure white (`#FFFFFF`).
  - Section Headers: Strictly lowercase, bold, harsh saturated blue (`#0000CC`) styled like raw terminal/data outputs.
  - Functional Accents: Mustard Yellow (`#FFDE59`), Harsh Orange (`#FF5E00`), Toxic Green (`#00E676`).
- **Typography:** Stark system sans-serif (`Space Grotesk`) for titles and huge metrics, paired with raw monospace (`JetBrains Mono`) for tags, dates, file sizes, and status readouts.
- **Mechanical Tactility:** Hard block drop-shadows (`4px 4px 0px #000000`) that mechanically depress on `:hover` and `:active` (`translate(3px, 3px)` with `1px 1px 0px #000000`).

---

## 📦 Bento Cell Breakdown

1. **Header Cell (`class_notes_vault`):**
   - Utilitarian terminal system ticker.
   - Thick black outlined live search filter.
   - Mechanical `+ upload note` brutalist button.
2. **Stat Cell 1 (`total uploads`):**
   - Harsh blue lowercase header.
   - Massive unstyled black counter (`42`).
3. **Stat Cell 2 (`active subjects`):**
   - Harsh blue lowercase header.
   - Massive fractional progress counter (`5 / 6`).
4. **Activity Cell (`download history`):**
   - 7-day download activity rendered as a flat, harsh orange/yellow block bar chart sitting on a solid black x-axis.
5. **Main Feed Cell (`recent files`):**
   - Category filter pills (`ALL`, `PDF`, `PPT`, `DOC`, `ZIP`).
   - Raw file rows displaying file name, subject code badge, date, and file size in monospace with immediate download actions.
6. **Upload Zone Cell (`quick drop`):**
   - Heavy dashed black border with `[ drop files here ]` drop zone.
   - Supports native drag-and-drop file upload with live counter updates.

---

## 🚀 How to Run / Preview

Since this is a lightweight vanilla web dashboard (HTML, CSS, JavaScript), no heavy builds or package managers are required.

### Option 1: Direct File Open
Double-click `index.html` in your file explorer or open it in any web browser:
```
D:\CollegeTB\Projects\notesforall\neobrutalism-ui\index.html
```

### Option 2: Live Local Server
Run with Python:
```bash
cd D:\CollegeTB\Projects\notesforall\neobrutalism-ui
python -m http.server 3000
```
Then visit `http://localhost:3000` in your browser.

Or run with Node / npx:
```bash
npx serve D:\CollegeTB\Projects\notesforall\neobrutalism-ui
```

---

## 🔌 Backend Integration

`app.js` automatically probes `http://localhost:8080/api/notes` and `http://localhost:8080/api/subjects` on startup:
- If the Spring Boot backend is active, it seamlessly merges live database records.
- If offline, it operates with full local persistence and instant feedback using mock data.
