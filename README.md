# FujiCam 📷

Minimalistisk mobilkameraapp inspirerad av Fujifilm X-serien och klassiska analoga emulsioner. Byggd med React, TypeScript, WebGL och Tailwind CSS.

---

## 📸 Funktioner

- **Monokromt & Minimalistiskt UI**: Svartvitt gränssnitt inspirerat av Fujifilm X100V och X-Pro3.
- **Autentiska Fujifilm Film Recipes (inklusive Fuji X Weekly Topp 2025 & Osan Bilgi)**:
  - **⭐ Topp 2025 & Favoriter**:
    - *Classic Cuban Negative* (Osan Bilgis virala recept: Varma gyllene högdagrar, mjuk drömsk lyster [Clarity -4], rik kontrast med subtil grön skugga och kraftigt korn)
    - *Reggie's Portra* (#1 mest populära receptet 2025 på Fuji X Weekly: varma pastelltoner, krämig hud, mjuk highlight roll-off)
    - *Kodachrome 64* (#2 på Fuji X Weekly: Ikonisk National Geographic-look, cyanblå himmel, mättade primärfärger)
    - *Vibrant Arizona* (#3 på Fuji X Weekly: Solmättad ökenmagi, terrakotta och turkos)
    - *Pacific Blues* (Stilla Havets sommarvibbar: teal vågor, dämpad solblekning)
    - *California Summer* (Gyllene kustsommar med mjuka pasteller och disig glöd)
  - **🎞️ Kodak Emulsioner**:
    - *Kodak Portra 400 v2* (Modern porträttklassiker)
    - *Kodak Gold 200* (Nostalgisk 90-tals semesterkänsla)
    - *Kodak Portra 800 v3* (Högkänslig gyllene skymningsfilm)
    - *McCurry Kodachrome* (Steve McCurry-stil med mättade färger och djup kontrast)
    - *Vintage Kodachrome* (Blekta 50/60-tals diabilder)
    - *Classic Color* (70-tals tidskriftsfärg)
  - **📷 Fujifilm Original & Färgfilm**:
    - *Fujifilm Negative (Superia)* (90-tals snabbköpsfilm)
    - *Universal Negative* (Mångsidigt gatufoto)
    - *Reala Ace & Easy Reala Ace* (Fjärde färglagret, naturtroget och mjukt)
    - *PRO Negative 160C* (Studio- och modefilm med rena svala skuggor)
    - *Classic Chrome, Classic Negative, Velvia / Vivid, Provia / Standard, Astia / Soft, Nostalgic Negative*
  - **🎬 Cinema & Svartvitt**:
    - *CineStill 800T* (Nattfilm med distinkt röd halationsglöd runt lampor)
    - *Eterna / Cinema* (Filmisk mjuk kontrast)
    - *Bleach Bypass* (Rå silverlook)
    - *Kodak Tri-X 400* (Rått fotojournalistiskt korn)
    - *Acros (S/V) & Acros + Röd Filter* (Legendarisk monokrom)
- **Halation & Bloom**:
  - Simulerar rött/orange halationssken runt starka ljuskällor (typiskt för analoga emulsioner på Facebook Fujifilm-grupper).
  - Mjuk optisk diffusion (Black Pro-Mist-filter).
- **Organiskt Filmkorn**:
  - Silverhalid-korn med tyngdpunkt i mellantoner.
- **Vitt Linjehistogram**:
  - Realtids-luminanshistogram i sökaren ritat med rena vita linjer.
- **Optisk Sensorupplösning & Orientering**:
  - Fångar foton med kamerans fulla sensorupplösning (via `ImageCapture` och hög-bitrate videoströmmar).
  - Intelligent identifiering av mobilens porträtt/landskap-läge: porträttbilder sparas i äkta 2:3 stående format utan distorsion.
  - Sökaren anpassar sig sömlöst med formatväljare i HUD:en (2:3 Porträtt, 3:2 Landskap, 1:1 Kvadrat, 4:3, 16:9).
- **Enkel Solid Rund Fotoknapp**:
  - Taktil avtryckare med mekaniskt slutarljud och vit blixtindikator.
- **Snabbkontroller**:
  - Till vänster: Minimalistisk rullista med alla film recipes.
  - Till höger: Checkbox för att slå på/av live-preview i realtid.
- **Galleri med Mappar (Rullar)**:
  - Spara och organisera bilder i separata mappar/filmer (t.ex. *Rulle 01*, *Gatufoto*, *Porträtt*).
  - Skapa nya mappar, flytta bilder och ladda ner högupplösta filer direkt till enheten.
  - All data sparas lokalt med IndexedDB.

---

## 🚀 Kom igång lokalt

### Förutsättningar
- [Node.js](https://nodejs.org/) (version 18 eller senare)
- npm

### Installation
```bash
# Klona repot
git clone https://github.com/ditt-namn/fujicam.git
cd fujicam

# Installera beroenden
npm install

# Starta utvecklingsservern
npm run dev
```

Appen körs nu på `http://localhost:3000`.

---

## 🔨 Bygg för produktion

```bash
npm run build
```

Detta genererar en optimerad produktions-bundle i `dist/`-mappen.

---

## 📱 Kompilera och ladda ner APK till mobilen

FujiCam kan installeras direkt som en **PWA (Progressive Web App)** eller laddas ner som färdigkompilerad **Android APK**:

### Alternativ 1: Ladda ner färdig APK direkt från GitHub Actions 📦
Varje gång kod pushas eller ett bygge startas på GitHub kompileras automatiskt en komplett Android-APK via GitHub Actions:
1. Gå till fliken **Actions** i ditt GitHub-repository.
2. Klicka på det senaste körda bygget (*"FujiCam CI & Android APK Build"*).
3. Under rubriken **Artifacts** längst ner på sidan klickar du på **`FujiCam-Debug-APK`**.
4. Packa upp zip-filen på din dator eller direkt i telefonen och installera `app-debug.apk` på din Android-telefon!
*(Tips: Om Android frågar om "Okända källor" vid installation, godkänn installationen).*

### Alternativ 2: Installera direkt som PWA i webbläsaren 📲
1. Öppna appens URL i Chrome på din Android-telefon.
2. Tryck på **Installera app**-knappen i toppmenyn (eller Chrome-menyn: **Installera app** / **Lägg till på startskärmen**).
3. FujiCam körs nu i äkta fullskärm utan webbläsargränssnitt, med offline-stöd och snabb åtkomst från startskärmen.

### Alternativ 3: Bygg APK lokalt med Android Studio
1. Kör synkroniseringen:
   ```bash
   npm run cap:sync
   ```
2. Öppna Android-projektet:
   ```bash
   npx cap open android
   ```
3. I Android Studio: Välj **Build > Build Bundle(s) / APK(s) > Build APK(s)**.


---

## ⚙️ GitHub Actions CI

Projektet innehåller en automatisk GitHub Actions workflow i `.github/workflows/build.yml` som verifierar och bygger koden vid varje push till `main`.

---

## 📄 Licens

Apache-2.0
