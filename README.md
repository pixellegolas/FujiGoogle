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

## 📱 Kompilera till Android (APK)

FujiCam kan installeras direkt som en **PWA (Progressive Web App)** eller kompileras till en fristående **Android APK** med Capacitor:

### Alternativ 1: Installera som PWA på Android
1. Öppna appen i Chrome på din Android-telefon.
2. Klicka på **Installera app**-knappen eller välj i Chrome-menyn: **Lägg till på startskärmen**.
3. FujiCam körs nu i fullskärm som en native app med offline-stöd och full kameratillgång.

### Alternativ 2: Kompilera Android APK med Capacitor & Android Studio
1. Installera Capacitor CLI och Android-plattformen:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```
2. Bygg webb-koden och synka med Android:
   ```bash
   npm run build
   npx cap add android
   npx cap copy
   ```
3. Öppna i Android Studio:
   ```bash
   npx cap open android
   ```
4. I Android Studio: Välj **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

## ⚙️ GitHub Actions CI

Projektet innehåller en automatisk GitHub Actions workflow i `.github/workflows/build.yml` som verifierar och bygger koden vid varje push till `main`.

---

## 📄 Licens

Apache-2.0
