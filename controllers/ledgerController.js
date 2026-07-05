import { Property } from "../models/property.js";
import { Tax } from "../models/tax.js";
import { Payment } from "../models/payment.js";
import { NagarNigamProperty } from "../models/nagarNigamProperty.js";
import { uploadToS3 } from "../config/S3.js";
import puppeteer from "puppeteer";
import fs from "fs";
import { randomUUID } from "crypto";

export const generateLedger = async (req, res) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ success: false, message: "propertyId is required" });
    }

    const property = await Property.findById(propertyId).lean();
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    const tax = await Tax.findOne({ propertyId }).lean();
    if (!tax) {
      return res.status(404).json({ success: false, message: "Tax record not found" });
    }

    const preNagarNigamData = await NagarNigamProperty.findOne({ propertyId: propertyId }).lean();

    const waterTaxBakaya = (isNaN(Number(preNagarNigamData?.prevWaterTax)) ? Number(preNagarNigamData?.prevWaterTax) : 0) || 0;
    const houseTaxBakaya = (isNaN(Number(preNagarNigamData?.prevHouseTax)) ? 0 : Number(preNagarNigamData?.prevHouseTax)) || 0;
    const totalPrevBakaya = tax?.bakaya || (waterTaxBakaya + houseTaxBakaya);

    const payments = await Payment.find({ propertyId }).sort({ paymentDate: 1 }).lean();

    // Setup ledger rows
    const ledgerRows = [];

    // Opening Balance
    if (totalPrevBakaya > 0) {
      ledgerRows.push({
        // date: '01/Apr/2017', // Sample date, could be dynamic
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        particulars: 'OPENING BAL. OF ARREAR',
        debit: totalPrevBakaya,
        credit: 0
      });
    }

    // Current Bill
    const houseTax = tax.taxBreakdown?.houseTax || 0;
    const waterTax = tax.taxBreakdown?.waterTax || 0;
    const currentTax = houseTax + waterTax;

    if (currentTax > 0) {
      ledgerRows.push({
        date: new Date(tax.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        particulars: 'Bill ' + (new Date().getFullYear()) + '-' + (new Date().getFullYear() + 1),
        debit: currentTax,
        credit: 0
      });
    }

    // Payments
    for (const p of payments) {
      ledgerRows.push({
        date: new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        particulars: `PAID BY ${p.method.toUpperCase()}, RECEIPT NO. ${p._id}`,
        debit: 0,
        credit: p.amountPaid
      });
    }

    console.log("Ledger rows:", ledgerRows);

    // Calculate Totals
    const totalDebit = ledgerRows.reduce((sum, r) => sum + r.debit, 0);
    const totalCredit = ledgerRows.reduce((sum, r) => sum + r.credit, 0);
    const closingBalance = totalDebit - totalCredit;

    const fontPath = '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf';
    const fallbackFontPath = '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf';
    const devanagariFont = fs.existsSync(fontPath) ? fs.readFileSync(fontPath).toString('base64') : '';
    const englishFont = fs.existsSync(fallbackFontPath) ? fs.readFileSync(fallbackFontPath).toString('base64') : '';

    const trs = ledgerRows.map(r => `
      <tr>
        <td>${r.date}</td>
        <td style="text-align: left;">${r.particulars}</td>
        <td>${r.debit > 0 ? r.debit.toFixed(2) : '0'}</td>
        <td>${r.credit > 0 ? r.credit.toFixed(2) : '0'}</td>
      </tr>
    `).join('');

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>Ledger - ${property.PTIN}</title>
  <style>
    @font-face {
      font-family: 'NotoSansDevanagari';
      src: url(data:font/truetype;charset=utf-8;base64,${devanagariFont}) format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'NotoSans';
      src: url(data:font/truetype;charset=utf-8;base64,${englishFont}) format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'NotoSansDevanagari', 'NotoSans', sans-serif !important;
      padding: 20px;
      font-size: 14px;
    }
    .container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }
    .title {
      text-align: center;
      text-decoration: underline;
      font-weight: bold;
      font-size: 18px;
      margin-bottom: 20px;
    }
    .info-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .info-col div {
      margin-bottom: 5px;
    }
    .info-col span.label {
      font-weight: bold;
      display: inline-block;
      width: 140px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: center;
    }
    th {
      background-color: #f2f2f2;
    }
    .total-row {
      font-weight: bold;
    }
    .closing-balance {
      text-align: right;
      font-weight: bold;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">LEDGER FOR PROPERTY NO - ${property.PTIN || 'N/A'}</div>
    
    <div class="info-grid">
      <div class="info-col">
        <div><span class="label">Name</span> ${property.ownerName || 'N/A'}</div>
        <div><span class="label">Father/Husband Name</span> ${property.fatherName || property.guardianName || 'N/A'}</div>
        <div><span class="label">Mohalla Name</span> ${property.locality || 'N/A'}</div>
        <div><span class="label">ARV</span> ${tax?.arv || 'N/A'}</div>
        <div><span class="label">ADDRESS</span> ${property.address || property.houseNumber || 'N/A'}</div>
      </div>
      <div class="info-col">
        <div><span class="label">Property No</span> ${property.PTIN || 'N/A'}</div>
        <div><span class="label">E-Ward No</span> ${property.wardNumber || property.ward || 'N/A'}</div>
        <div><span class="label">House No</span> ${property.houseNumber || 'N/A'}</div>
        <div><span class="label">Type</span> ${property.propertyClass || 'N/A'}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>DATE</th>
          <th>PARTICULARS</th>
          <th>DEBIT</th>
          <th>CREDIT</th>
        </tr>
      </thead>
      <tbody>
        ${trs}
        <tr class="total-row">
          <td colspan="2" style="text-align: left;">TOTAL</td>
          <td>${totalDebit.toFixed(2)}</td>
          <td>${totalCredit.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="closing-balance">
      <div>Closing Balance:</div>
      <div>${closingBalance.toFixed(2)} (${closingBalance >= 0 ? 'DEBIT' : 'CREDIT'})</div>
    </div>
  </div>
</body>
</html>
`;

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--font-render-hinting=medium',
        '--enable-font-antialiasing'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(htmlTemplate, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();

    // Upload to S3
    const bucket = process.env.AWS_BUCKET || "nagar-nigam-new-v2";
    const key = `tax-ledger/${Date.now()}-${randomUUID()}-ledger.pdf`;

    await uploadToS3(bucket, key, pdfBuffer, 'application/pdf');

    const fileUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Update Property
    await Property.findByIdAndUpdate(propertyId, { ledger: fileUrl });

    return res.status(200).json({
      success: true,
      message: "Ledger generated successfully",
      data: { url: fileUrl }
    });

  } catch (error) {
    console.error("Error generating ledger:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
