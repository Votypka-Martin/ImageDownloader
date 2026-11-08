# 🪐 Cosmos.so Image Downloader – Webová verze (Vercel)

Webová aplikace pro vyhledávání, plynulé prohlížení a stahování obrázků ze stránek [cosmos.so](https://www.cosmos.so/) s plnou podporou nasazení na **Vercel**.

---

## 🌟 Funkce

* **Bypass CORS přes lehký backend (Serverless API)**:
  * Dotazy na `https://api.cosmos.so/graphql` se provádí ze serverless funkce `/api/search` se všemi potřebnými hlavičkami.
* **Průběžné stránkování (Infinite scroll)**:
  * Při scrollování dolů se automaticky načítá dalších 40 obrázků pomocí kurzoru `nextPageCursor`.
  * Tlačítko pro ruční načtení dalších dávek s indikátorem postupu.
* **Hromadné stažení jako ZIP**:
  * Přímo v prohlížeči generuje `.zip` archiv všech načtených obrázků pomocí `JSZip` a proxy endpointu `/api/image`.
* **Detailní náhled (Lightbox)**:
  * Zobrazení v plném rozlišení, rozměry (`šířka × výška px`), přímé stažení, kopírování URL.
* **Inspekce surové odpovědi**:
  * Tlačítko `📄 Odpověď serveru` zobrazí kompletní GraphQL JSON odpověď.

---

## 🚀 Lokální spuštění

Aplikace nevyžaduje žádnou instalaci externích balíčků (`npm install` není potřeba!), běží přímo na nativním Node.js:

1. Otevřete terminál ve složce `web`:
   ```bash
   cd web
   ```

2. Spusťte lokální server:
   ```bash
   npm start
   # nebo přímo:
   node dev-server.js
   ```

3. Otevřete prohlížeč na adrese:
   👉 **http://localhost:3000**

---

## ☁️ Nasazení na Vercel

Projekt je připraven pro okamžité nasazení na Vercel (1 kliknutím z GitHubu):

### Možnost 1: Přes GitHub (Doporučeno)
1. Nahrajte projekt na svůj GitHub repozitář.
2. Přejděte na [vercel.com](https://vercel.com) a přihlaste se.
3. Klikněte na **Add New...** -> **Project**.
4. Vyberte váš repozitář.
5. Jako **Root Directory** nastavte složku `web`.
6. Klikněte na **Deploy**.

Vercel automaticky nasadí serverless funkce z `/api` a statický frontend z `/public`.

### Možnost 2: Přes Vercel CLI
```bash
cd web
npm i -g vercel
vercel
```
