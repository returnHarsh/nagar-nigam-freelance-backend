import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  // 1️⃣ Load the TTF file and convert it to base64
  const fontPath = '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf';
  const fontBase64 = fs.readFileSync(fontPath).toString('base64');

  // 2️⃣ Create the HTML with the embedded font
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="hi">
  <head>
    <meta charset="UTF-8">
    <title>Hindi Test</title>
    <style>
      @font-face {
        font-family: 'NotoSansDevanagari';
        src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
        font-weight: 400;
        font-style: normal;
      }

      body {
        font-family: 'NotoSansDevanagari', sans-serif;
        font-size: 22px;
        padding: 40px;
        color: #222;
      }
    </style>
  </head>
  <body>
    <p>नमस्ते! यह एक परीक्षण है।</p>
    <p>यह लाइन हिंदी में दिखनी चाहिए।</p>
  </body>
  </html>
  `;

  // 3️⃣ Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--font-render-hinting=medium',
      '--enable-font-antialiasing',
    ],
  });

  // 4️⃣ Render the page and generate PDF
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: 'HindiTest.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
  });

  await browser.close();
  console.log('✅ PDF generated successfully: HindiTest.pdf');
})();
