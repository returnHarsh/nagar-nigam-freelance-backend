// services/pdfGenerator.js
import puppeteer from 'puppeteer';
import fs from "fs"
import { NagarNigamProperty } from '../../models/nagarNigamProperty.js';
import { NagarNigamPrerequisite } from '../../models/NagarNigamPrerequisite.js';

export const generateTaxBillPDF = async (property, tax) => {

  // extracting the form number for this Nagar Nigam
  const nagarNigamPrerequisite = (await NagarNigamPrerequisite.findOne({}).sort({ createdAt: -1 }));
  const formNumber = nagarNigamPrerequisite?.formNumber;
  const nagarNigamName = nagarNigamPrerequisite?.nagarNigamName


  // Extract data from models
  // const formNo = property.PTIN || property._id.toString().slice(-6);
  const demandNumber = property?.demandNumber;

  // ============= Calculate tax values from taxBreakdown ================
  const breakdown = tax.taxBreakdown || {};
  const houseTax = breakdown.houseTax || 0;
  const waterTax = breakdown.waterTax || 0;
  const arv = tax.arv;

  const query = {
    houseNumber: property.houseNumber
  }

  const preNagarNigamData = await NagarNigamProperty.findOne(query)

  // ============= Calculate bakaya (arrears) ===============
  const waterTaxBakaya = (isNaN(Number(preNagarNigamData?.prevWaterTax)) ? Number(preNagarNigamData?.prevWaterTax) : 0) || 0;
  const houseTaxBakaya = (isNaN(Number(preNagarNigamData?.prevHouseTax)) ? 0 : Number(preNagarNigamData?.prevHouseTax)) || 0;
  const totalPrevBakaya = tax?.bakaya || (waterTaxBakaya + houseTaxBakaya);

  // Calculate interest on bakaya
  const interestRate = tax?.interestOnBakaya || 0;
  const interestAmount = tax?.interestAmountOnBakaya || (totalPrevBakaya * interestRate) / 100;

  // Calculate छूट (discount) - 0 for current year taxes
  const discount = 0;

  // Get paid amount from tax model
  const paidAmount = tax.paidAmount || 0;

  // Calculate देय धनराशि (total amount due) - after subtracting paid amount
  // const totalDemand = houseTax + waterTax + totalPrevBakaya + interestAmount - discount - paidAmount;
  // const totalTaxToPay = (tax?.dueAmount + interestAmount) - discount;


  const totalTaxToPay = (tax?.dueAmount) - discount;

  // Get due amount directly from tax model
  const dueAmount = tax?.dueAmount || 0;

  // Format dates
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // ✅ Load Devanagari + Latin font locally and embed in Base64
  const fontPath = '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf';
  const fallbackFontPath = '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf';
  const devanagariFont = fs.existsSync(fontPath)
    ? fs.readFileSync(fontPath).toString('base64')
    : '';
  const englishFont = fs.existsSync(fallbackFontPath)
    ? fs.readFileSync(fallbackFontPath).toString('base64')
    : '';

  //   const htmlTemplate = `
  // <!DOCTYPE html>
  // <html lang="hi">
  // <head>
  //   <meta charset="UTF-8">
  //   <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //   <title>Property Tax Bill - ${property.PTIN}</title>
  //   <style>
  //     @font-face {
  //       font-family: 'NotoSansDevanagari';
  //       src: url(data:font/truetype;charset=utf-8;base64,${devanagariFont}) format('truetype');
  //       font-weight: 400;
  //       font-style: normal;
  //     }

  //     @font-face {
  //       font-family: 'NotoSans';
  //       src: url(data:font/truetype;charset=utf-8;base64,${englishFont}) format('truetype');
  //       font-weight: 400;
  //       font-style: normal;
  //     }

  //     * {
  //       margin: 0;
  //       padding: 0;
  //       box-sizing: border-box;
  //     }

  //     body {
  //       font-family: 'NotoSansDevanagari', 'NotoSans', sans-serif !important;
  //       -webkit-font-smoothing: antialiased;
  //       color: #000;
  //       padding: 20px;
  //       background: white;
  //     }

  //     .container {
  //       max-width: 900px;
  //       margin: 0 auto;
  //       border: 2px solid #000;
  //       padding: 0;
  //     }

  //     .header {
  //       display: flex;
  //       align-items: center;
  //       justify-content: space-between;
  //       padding: 15px 20px;
  //       border-bottom: 2px solid #000;
  //     }

  //     .header-logo {
  //       width: 80px;
  //       height: auto;
  //     }

  //     .header-center {
  //       text-align: center;
  //       flex: 1;
  //       padding: 0 20px;
  //     }

  //     .header-title {
  //       font-size: 20px;
  //       font-weight: 700;
  //       margin-bottom: 5px;
  //     }

  //     .header-subtitle {
  //       font-size: 16px;
  //       font-weight: 600;
  //     }

  //     .swachh-logo {
  //       width: 100px;
  //       height: auto;
  //     }

  //     .content {
  //       padding: 20px;
  //     }

  //     .info-section {
  //       display: flex;
  //       justify-content: space-between;
  //       margin-bottom: 20px;
  //       font-size: 14px;
  //     }

  //     .info-left, .info-right {
  //       flex: 1;
  //     }

  //     .info-row {
  //       display: flex;
  //       margin-bottom: 8px;
  //     }

  //     .info-label {
  //       font-weight: 600;
  //       min-width: 100px;
  //     }

  //     .bill-table {
  //       width: 100%;
  //       border-collapse: collapse;
  //       margin-bottom: 15px;
  //       font-size: 13px;
  //     }

  //     .bill-table th,
  //     .bill-table td {
  //       border: 1px solid #000;
  //       padding: 8px;
  //       text-align: center;
  //     }

  //     .bill-table th {
  //       background-color: #f0f0f0;
  //       font-weight: 600;
  //     }

  //     .bill-table .label-cell {
  //       text-align: left;
  //       font-weight: 600;
  //     }

  //     .bill-table .arv-cell {
  //       font-weight: 600;
  //     }

  //     .remarks-cell {
  //       text-align: left !important;
  //       font-size: 11px;
  //       line-height: 1.5;
  //       padding: 10px !important;
  //       vertical-align: top;
  //     }

  //     .remarks-cell ol {
  //       margin: 0;
  //       padding-left: 20px;
  //     }

  //     .remarks-cell li {
  //       margin-bottom: 5px;
  //     }

  //     .total-row {
  //       font-weight: 700;
  //       font-size: 14px;
  //     }

  //     .footer-notes {
  //       font-size: 11px;
  //       line-height: 1.6;
  //       margin-bottom: 20px;
  //     }

  //     .signatures {
  //       display: flex;
  //       justify-content: space-between;
  //       padding-top: 40px;
  //       font-size: 13px;
  //     }

  //     .signature-box {
  //       text-align: center;
  //     }

  //     .signature-line {
  //       border-top: 1px solid #000;
  //       width: 150px;
  //       margin-bottom: 5px;
  //     }

  //     @media print {
  //       body { 
  //         background: white;
  //         padding: 0;
  //       }
  //     }
  //   </style>
  // </head>
  // <body>
  //   <div class="container">
  //     <!-- Header -->
  //     <div class="header">
  //       <img src="https://nagar-nigam.s3.ap-south-1.amazonaws.com/public-images/up-logo.jpg" class="header-logo" alt="UP Logo" />
  //       <div class="header-center">
  //         <div class="header-title">नगर पंचायत करहल, मैनपुरी</div>
  //         <div class="header-subtitle">बिल गृहकर एवं जलकर</div>
  //       </div>
  //       <img src="https://nagar-nigam.s3.ap-south-1.amazonaws.com/public-images/swadesh-logo.jpg" class="swachh-logo" alt="Swachh Bharat" />
  //     </div>

  //     <!-- Content -->
  //     <div class="content">
  //       <!-- Property Info Section -->
  //       <div class="info-section">
  //         <div class="info-left">
  //           <div class="info-row">
  //             <span class="info-label">फॉर्म नंबर .</span>
  //             <span>${formNo}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">PTIN:</span>
  //             <span>${property.PTIN || 'N/A'}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">श्री/श्रीमती.</span>
  //             <span>${property.ownerName || 'N/A'}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">पिता/पति.</span>
  //             <span>${property.fatherName || property.guardianName || 'N/A'}</span>
  //           </div>
  //         </div>
  //         <div class="info-right">
  //           <div class="info-row">
  //             <span class="info-label">बिल नंबर:</span>
  //             <span></span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">Ward.</span>
  //             <span>${property.ward || 'N/A'}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label"></span>
  //             <span>मोहल्ला: ${property.locality || 'N/A'}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label"></span>
  //             <span>पुराना भवन संख्या. ${property.houseNumber || 'N/A'}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label"></span>
  //             <span>नया भवन संख्या. ${property.houseNumber || 'N/A'}</span>
  //           </div>
  //         </div>
  //       </div>

  //       <!-- Tax Table -->
  //       <table class="bill-table">
  //         <thead>
  //           <tr>
  //             <th></th>
  //             <th>विवरण अवधि</th>
  //             <th>गृहकर</th>
  //             <th>जलकर</th>
  //             <th>टिप्पणी</th>
  //             <th></th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           <tr>
  //             <td rowspan="2" class="arv-cell">
  //               वार्षिक मूल्यांकन<br>${arv}
  //             </td>
  //             <td>2025-2026</td>
  //             <td>${houseTax}</td>
  //             <td>${waterTax}</td>
  //             <td rowspan="8" class="remarks-cell">
  //               <ol>
  //                 <li><strong>1.यह स्वामित्व का प्रमाण नहीं है। यह एक प्रोविजनल बिल है</strong></li>
  //                 <li><strong>2. यह बिल कंप्यूटर द्वारा निर्गत किया गया है हस्ताक्षर की आवश्यकता नहीं है</strong></li>
  //                 <li><strong>3. निनीय वर्ष की संपत्ति के उपरांत बकाये पर 12% का अधिभार देय होगा</strong></li>
  //               </ol>
  //             </td>
  //             <td rowspan="2">
  //               जारी करने की तिथि<br>${formatDate(tax.createdAt)}
  //             </td>
  //           </tr>
  //           <tr>
  //             <td>बकाया</td>
  //             <td colspan="2">${totalPrevBakaya.toFixed(2)}</td>
  //           </tr>
  //           <tr>
  //             <td rowspan="2">
  //               मूल्यांकन तिथि<br>${formatDate(tax.createdAt)}
  //             </td>
  //             <td>अधिभार</td>
  //             <td colspan="2">${interestAmount.toFixed(2)}</td>
  //             <td rowspan="2">
  //               अंतिम तिथि<br>${formatDate(tax.dueDate)}
  //             </td>
  //           </tr>
  //           <tr>
  //             <td>छूट</td>
  //             <td colspan="2">${discount}</td>
  //           </tr>
  //           <tr>
  //             <td rowspan="2">${property?.propertyClass || 'Mixed'}</td>
  //             <td class="label-cell">भुगतान कर</td>
  //             <td colspan="2">${paidAmount.toFixed(2)}</td>
  //             <td rowspan="2">
  //               कुल देय धनराशि<br><strong>₹${dueAmount.toFixed(2)}</strong>
  //             </td>
  //           </tr>
  //           <tr>
  //             <td class="label-cell">देय धनराशि</td>
  //             <td colspan="2" class="total-row">${totalTaxToPay.toFixed(2)}</td>
  //           </tr>
  //         </tbody>
  //       </table>

  //       <!-- Footer Notes -->
  //       <div class="footer-notes">
  //         <p><strong>1.</strong> यदि संपत्ति के स्वामी/अध्यासी करदाता को इस बिल के संबंध में किसी प्रकार की कोई आपत्ति है तो प्रोविजनल बिल प्राप्ति दिनांक से 15 दिवस के अंदर नगर पंचायत करहल, मैनपुरी के कर विभाग में लिखित रूप से दर्ज करा सकते है अन्यथा इस बिल को अंतिम मानकर वसूली की जाएगी</p>
  //       </div>

  //       <!-- Signatures -->
  //       <div class="signatures">
  //         <div class="signature-box">
  //           <div class="signature-line"></div>
  //           <div>बिल क्लर्क /दिनांक</div>
  //         </div>
  //         <div class="signature-box">
  //           <div class="signature-line"></div>
  //           <div>चेकिंग क्लर्क /दिनांक</div>
  //         </div>
  //         <div class="signature-box">
  //           <div class="signature-line"></div>
  //           <div>कर अधीक्षक /अधिशासी अधिकारी</div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // </body>
  // </html>
  //   `;


  // ========================= Original Single Reciept Template ========================
  // const htmlTemplate = `
  // <!DOCTYPE html>
  // <html lang="hi">
  // <head>
  //   <meta charset="UTF-8">
  //   <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //   <title>Property Tax Bill - ${property.PTIN}</title>
  //   <style>
  //     @font-face {
  //       font-family: 'NotoSansDevanagari';
  //       src: url(data:font/truetype;charset=utf-8;base64,${devanagariFont}) format('truetype');
  //       font-weight: 400;
  //       font-style: normal;
  //     }

  //     @font-face {
  //       font-family: 'NotoSans';
  //       src: url(data:font/truetype;charset=utf-8;base64,${englishFont}) format('truetype');
  //       font-weight: 400;
  //       font-style: normal;
  //     }

  //     * {
  //       margin: 0;
  //       padding: 0;
  //       box-sizing: border-box;
  //     }

  //     body {
  //       font-family: 'NotoSansDevanagari', 'NotoSans', sans-serif !important;
  //       -webkit-font-smoothing: antialiased;
  //       color: #000;
  //       padding: 20px;
  //       background: white;
  //     }

  //     .container {
  //       max-width: 900px;
  //       margin: 0 auto;
  //       border: 2px solid #000;
  //       padding: 0;
  //     }

  //     .header {
  //       display: flex;
  //       align-items: center;
  //       justify-content: space-between;
  //       padding: 15px 20px;
  //       border-bottom: 2px solid #000;
  //     }

  //     .header-logo {
  //       width: 80px;
  //       height: auto;
  //     }

  //     .header-center {
  //       text-align: center;
  //       flex: 1;
  //       padding: 0 20px;
  //     }

  //     .header-title {
  //       font-size: 20px;
  //       font-weight: 700;
  //       margin-bottom: 5px;
  //     }

  //     .header-subtitle {
  //       font-size: 16px;
  //       font-weight: 600;
  //     }

  //     .swachh-logo {
  //       width: 100px;
  //       height: auto;
  //     }

  //     .content {
  //       padding: 20px;
  //     }

  //     .info-section {
  //       display: flex;
  //       justify-content: space-between;
  //       margin-bottom: 20px;
  //       font-size: 14px;
  //     }

  //     .info-left, .info-right {
  //       flex: 1;
  //     }

  //     .info-row {
  //       display: flex;
  //       margin-bottom: 8px;
  //     }

  //     .info-label {
  //       font-weight: 600;
  //       min-width: 100px;
  //     }

  //     .bill-table {
  //       width: 100%;
  //       border-collapse: collapse;
  //       margin-bottom: 15px;
  //       font-size: 13px;
  //     }

  //     .bill-table th,
  //     .bill-table td {
  //       border: 1px solid #000;
  //       padding: 8px;
  //       text-align: center;
  //     }

  //     .bill-table th {
  //       background-color: #f0f0f0;
  //       font-weight: 600;
  //     }

  //     .bill-table .label-cell {
  //       text-align: left;
  //       font-weight: 600;
  //     }

  //     .bill-table .arv-cell {
  //       font-weight: 600;
  //     }

  //     .remarks-cell {
  //       text-align: left !important;
  //       font-size: 11px;
  //       line-height: 1.5;
  //       padding: 10px !important;
  //       vertical-align: top;
  //     }

  //     .remarks-cell ol {
  //       margin: 0;
  //       padding-left: 20px;
  //     }

  //     .remarks-cell li {
  //       margin-bottom: 5px;
  //     }

  //     .total-row {
  //       font-weight: 700;
  //       font-size: 14px;
  //     }

  //     .footer-notes {
  //       font-size: 11px;
  //       line-height: 1.6;
  //       margin-bottom: 20px;
  //     }

  //     .signatures {
  //       display: flex;
  //       justify-content: space-between;
  //       padding-top: 40px;
  //       font-size: 13px;
  //     }

  //     .signature-box {
  //       text-align: center;
  //     }

  //     .signature-line {
  //       border-top: 1px solid #000;
  //       width: 150px;
  //       margin-bottom: 5px;
  //     }

  //     @media print {
  //       body { 
  //         background: white;
  //         padding: 0;
  //       }
  //     }

  //   </style>
  // </head>
  // <body>
  //   <div class="container">
  //     <!-- Header -->
  //     <div class="header">
  //       <img src="https://nagar-nigam.s3.ap-south-1.amazonaws.com/public-images/up-logo.jpg" class="header-logo" alt="UP Logo" />
  //       <div class="header-center">
  //         <div class="header-title">नगर पंचायत ${nagarNigamName} , मैनपुरी</div>
  //         <div class="header-subtitle">बिल गृहकर एवं जलकर</div>
  //       </div>
  //       <img src="https://nagar-nigam.s3.ap-south-1.amazonaws.com/public-images/swadesh-logo.jpg" class="swachh-logo" alt="Swachh Bharat" />
  //     </div>

  //     <!-- Content -->
  //     <div class="content">
  //       <!-- Property Info Section -->
  //       <div class="info-section">
  //         <div class="info-left">
  //           <div class="info-row">
  //             <span class="info-label">फॉर्म नंबर:</span>
  //             <span>${formNumber}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">PTIN:</span>
  //             <span>${property.PTIN || 'N/A'}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">श्री/श्रीमती:</span>
  //             <span>${property.ownerName || 'N/A'}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">पिता/पति:</span>
  //             <span>${property.fatherName || property.guardianName || 'N/A'}</span>
  //           </div>
  //         </div>
  //         <div class="info-right">
  //           <div class="info-row">
  //             <span class="info-label">डिमांड नंबर:</span>
  //             <span> ${demandNumber} </span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">Ward</span>
  //             <span> ${property.wardNumber}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">मोहल्ला:</span>
  //             <span>${property.locality || 'N/A'}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">भवन संख्या:</span>
  //             <span>${property.houseNumber || 'N/A'}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">नई भवन संख्या:</span>
  //             <span>${property.newHouseNumber || 'N/A'}</span>
  //           </div>
  //           <!-- <div class="info-row">
  //             <span class="info-label"></span>
  //             <span>नया भवन संख्या. ${property.houseNumber || 'N/A'}</span>
  //           </div> -->
  //         </div>
  //       </div>

  //       <!-- Tax Table -->
  //       <table class="bill-table">
  //         <thead>
  //           <tr>
  //             <th></th>
  //             <th>विवरण अवधि</th>
  //             <th>गृहकर</th>
  //             <th>जलकर</th>
  //             <th>टिप्पणी</th>
  //             <th></th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           <tr>
  //             <td rowspan="2" class="arv-cell">
  //               वार्षिक मूल्यांकन<br>${arv}
  //             </td>
  //             <td>2025-2026</td>
  //             <td>${houseTax}</td>
  //             <td>${waterTax}</td>
  //             <td rowspan="8" class="remarks-cell">
  //               <ol>
  //                 <li><strong> यह स्वामित्व का प्रमाण नहीं है यह एक प्रोविजनल बिल है</strong></li>
  //                 <li><strong> वर्तमान मांग पर छूट नियमानुसार अनुमन्य होगी । कृपया बिल की प्रतीक्षा न करें।</strong></li>
  //                 <li><strong> वित्तीय वर्ष की संपत्ति के उपरांत बकाये पर 12% का अधिभार देय होगा</strong></li>
  //                 <li><strong> रूपया नगर पालिका के कर विभाग में 10.30 बजे से 2 बजे तक जमा किया जा सकता है।</strong></li>
  //                 <li><strong> इस अवधि के बाद धारा 168 व 169 के अन्तर्गत डिमांड नोटिस व वारण्ट कुर्की भी जारी किया जायेगा।</strong></li>
  //                 <li><strong> यह बिल कंप्यूटर द्वारा निर्मित किया गया है हस्ताक्षर की आवश्यकता नहीं है।</strong></li>
  //               </ol>
  //             </td>
  //             <td rowspan="2">
  //               जारी करने की तिथि<br>${formatDate(tax.createdAt)}
  //             </td>
  //           </tr>
  //           <tr>
  //             <td>बकाया</td>
  //             <td colspan="2">${totalPrevBakaya.toFixed(2)}</td>
  //           </tr>
  //           <tr>
  //             <td rowspan="2">
  //               मूल्यांकन तिथि<br>${formatDate(tax.effectiveFrom)}
  //             </td>
  //             <td>अधिभार</td>
  //             <td colspan="2">${interestAmount.toFixed(2)}</td>
  //             <td rowspan="2">
  //               अंतिम तिथि<br>${formatDate(tax.dueDate)}
  //             </td>
  //           </tr>
  //           <tr>
  //             <td>छूट</td>
  //             <td colspan="2">${discount}</td>
  //           </tr>
  //           <tr>
  //             <td rowspan="2">${property?.propertyClass || 'Mixed'}</td>
  //             <td class="label-cell">भुगतान कर</td>
  //             <td colspan="2">${paidAmount.toFixed(2)}</td>
  //             <td rowspan="2">
  //               कुल देय धनराशि<br><strong>₹${dueAmount.toFixed(2)}</strong>
  //             </td>
  //           </tr>
  //           <tr>
  //             <td class="label-cell">देय धनराशि</td>
  //             <td colspan="2" class="total-row">${totalTaxToPay.toFixed(2)}</td>
  //           </tr>
  //         </tbody>
  //       </table>

  //       <!-- Footer Notes -->
  //       <div class="footer-notes">
  //         <p><strong>1.</strong> यदि संपत्ति के स्वामी/अध्यासी करदाता को इस बिल के संबंध में किसी प्रकार की कोई आपत्ति है तो प्रोविजनल बिल प्राप्ति दिनांक से 15 दिवस के अंदर नगर पंचायत ${nagarNigamName}, मैनपुरी के कर विभाग में लिखित रूप से दर्ज करा सकते है अन्यथा इस बिल को अंतिम मानकर वसूली की जाएगी</p>
  //         <p><strong>2.</strong> नगर पंचायत की आधिकारिक वेबसाइट <a href="https://karhal.npup.in/">www.karhal.npup.in</a> पर गृहकर, जलकर व जलमूल्य का भुगतान ऑनलाइन कर सकते हैं।</p>
  //       </div>

  //       <!-- Signatures -->
  //       <div class="signatures">
  //         <div class="signature-box">
  //           <div class="signature-line"></div>
  //           <div>बिल क्लर्क /दिनांक</div>
  //         </div>
  //         <div class="signature-box">
  //           <div class="signature-line"></div>
  //           <div>चेकिंग क्लर्क /दिनांक</div>
  //         </div>
  //         <div class="signature-box">
  //           <div class="signature-line"></div>
  //           <div>कर अधीक्षक /अधिशासी अधिकारी</div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // </body>
  // </html>
  //   `;



  // ========================= New 2 Reciept Template ==================
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Tax Bill - ${property.PTIN}</title>
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

    @page {
      size: A4;
      margin: 10mm;
    }

    body {
      font-family: 'NotoSansDevanagari', 'NotoSans', sans-serif !important;
      -webkit-font-smoothing: antialiased;
      color: #000;
      padding: 10px;
      background: white;
    }

    .page-wrapper {
      max-width: 210mm;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .container {
      width: 100%;
      border: 2px solid #000;
      padding: 0;
    }

    .partition {
      width: 100%;
      border-top: 2px dashed #000;
      margin: 15px 0;
      position: relative;
    }

    .partition::before {
      content: '✂';
      position: absolute;
      left: 10px;
      top: -12px;
      background: white;
      padding: 0 5px;
      font-size: 16px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 15px;
      border-bottom: 2px solid #000;
    }

    .header-logo {
      width: 50px;
      height: auto;
    }

    .header-center {
      text-align: center;
      flex: 1;
      padding: 0 15px;
    }

    .header-title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 3px;
    }

    .header-subtitle {
      font-size: 12px;
      font-weight: 600;
    }

    .swachh-logo {
      width: 65px;
      height: auto;
    }

    .content {
      padding: 12px;
    }

    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 10px;
    }

    .info-left, .info-right {
      flex: 1;
    }

    .info-row {
      display: flex;
      margin-bottom: 4px;
    }

    .info-label {
      font-weight: 600;
      min-width: 80px;
    }

    .bill-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 9px;
    }

    .bill-table th,
    .bill-table td {
      border: 1px solid #000;
      padding: 4px;
      text-align: center;
    }

    .bill-table th {
      background-color: #f0f0f0;
      font-weight: 600;
    }

    .bill-table .label-cell {
      text-align: left;
      font-weight: 600;
    }

    .bill-table .arv-cell {
      font-weight: 600;
      font-size: 8px;
    }

    .remarks-cell {
      text-align: left !important;
      font-size: 7px;
      line-height: 1.3;
      padding: 5px !important;
      vertical-align: top;
    }

    .remarks-cell ol {
      margin: 0;
      padding-left: 12px;
    }

    .remarks-cell li {
      margin-bottom: 2px;
    }

    .total-row {
      font-weight: 700;
      font-size: 10px;
    }

    .footer-notes {
      font-size: 8px;
      line-height: 1.4;
      margin-bottom: 12px;
    }

    .signatures {
      display: flex;
      justify-content: space-between;
      padding-top: 20px;
      font-size: 9px;
    }

    .signature-box {
      text-align: center;
    }

    .signature-line {
      border-top: 1px solid #000;
      width: 100px;
      margin-bottom: 3px;
    }

    @media print {
      body { 
        background: white;
        padding: 0;
      }
      
      .page-wrapper {
        max-width: 100%;
      }

      .container {
        page-break-inside: avoid;
      }
    }
      
  </style>
</head>
<body>
  <div class="page-wrapper">
    <!-- First Receipt -->
    <div class="container">
      <!-- Header -->
      <div class="header">
        <img src="https://nagar-nigam.s3.ap-south-1.amazonaws.com/public-images/up-logo.jpg" class="header-logo" alt="UP Logo" />
        <div class="header-center">
          <div class="header-title">नगर पंचायत ${nagarNigamName} , मैनपुरी</div>
          <div class="header-subtitle">बिल गृहकर एवं जलकर</div>
        </div>
        <img src="https://nagar-nigam.s3.ap-south-1.amazonaws.com/public-images/swadesh-logo.jpg" class="swachh-logo" alt="Swachh Bharat" />
      </div>

      <!-- Content -->
      <div class="content">
        <!-- Property Info Section -->
        <div class="info-section">
          <div class="info-left">
            <div class="info-row">
              <span class="info-label">फॉर्म नंबर:</span>
              <span>${formNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">PTIN:</span>
              <span>${property.PTIN || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">श्री/श्रीमती:</span>
              <span>${property.ownerName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">पिता/पति:</span>
              <span>${property.fatherName || property.guardianName || 'N/A'}</span>
            </div>
          </div>
          <div class="info-right">
            <div class="info-row">
              <span class="info-label">डिमांड नंबर:</span>
              <span> ${demandNumber} </span>
            </div>
            <div class="info-row">
              <span class="info-label">Ward</span>
              <span> ${property.wardNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">मोहल्ला:</span>
              <span>${property.locality || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">भवन संख्या:</span>
              <span>${property.houseNumber || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">नई भवन संख्या:</span>
              <span>${property.newHouseNumber || 'N/A'}</span>
            </div>
          </div>
        </div>

        <!-- Tax Table -->
        <table class="bill-table">
          <thead>
            <tr>
              <th></th>
              <th>विवरण अवधि</th>
              <th>गृहकर</th>
              <th>जलकर</th>
              <th>टिप्पणी</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowspan="2" class="arv-cell">
                वार्षिक मूल्यांकन<br>${arv}
              </td>
              <td>2025-2026</td>
              <td>${houseTax}</td>
              <td>${waterTax}</td>
              <td rowspan="8" class="remarks-cell">
                <ol>
                  <li><strong> यह स्वामित्व का प्रमाण नहीं है यह एक प्रोविजनल बिल है</strong></li>
                  <li><strong> वर्तमान मांग पर छूट नियमानुसार अनुमन्य होगी । कृपया बिल की प्रतीक्षा न करें।</strong></li>
                  <li><strong> वित्तीय वर्ष की संपत्ति के उपरांत बकाये पर 12% का अधिभार देय होगा</strong></li>
                  <li><strong> रूपया नगर पालिका के कर विभाग में 10.30 बजे से 2 बजे तक जमा किया जा सकता है।</strong></li>
                  <li><strong> इस अवधि के बाद धारा 168 व 169 के अन्तर्गत डिमांड नोटिस व वारण्ट कुर्की भी जारी किया जायेगा।</strong></li>
                  <li><strong> यह बिल कंप्यूटर द्वारा निर्मित किया गया है हस्ताक्षर की आवश्यकता नहीं है।</strong></li>
                </ol>
              </td>
              <td rowspan="2">
                जारी करने की तिथि<br>${formatDate(tax.createdAt)}
              </td>
            </tr>
            <tr>
              <td>बकाया</td>
              <td colspan="2">${totalPrevBakaya.toFixed(2)}</td>
            </tr>
            <tr>
              <td rowspan="2">
                मूल्यांकन तिथि<br>${formatDate(tax.effectiveFrom)}
              </td>
              <td>अधिभार</td>
              <td colspan="2">${interestAmount.toFixed(2)}</td>
              <td rowspan="2">
                अंतिम तिथि<br>${formatDate(tax.dueDate)}
              </td>
            </tr>
            <tr>
              <td>छूट</td>
              <td colspan="2">${discount}</td>
            </tr>
            <tr>
              <td rowspan="2">${property?.propertyClass || 'Mixed'}</td>
              <td class="label-cell">भुगतान कर</td>
              <td colspan="2">${paidAmount.toFixed(2)}</td>
              <td rowspan="2">
                कुल देय धनराशि<br><strong>₹${dueAmount.toFixed(2)}</strong>
              </td>
            </tr>
            <tr>
              <td class="label-cell">देय धनराशि</td>
              <td colspan="2" class="total-row">${totalTaxToPay.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Footer Notes -->
        <div class="footer-notes">
          <p><strong>1.</strong> यदि संपत्ति के स्वामी/अध्यासी करदाता को इस बिल के संबंध में किसी प्रकार की कोई आपत्ति है तो प्रोविजनल बिल प्राप्ति दिनांक से 15 दिवस के अंदर नगर पंचायत ${nagarNigamName}, मैनपुरी के कर विभाग में लिखित रूप से दर्ज करा सकते है अन्यथा इस बिल को अंतिम मानकर वसूली की जाएगी</p>
          <p><strong>2.</strong> नगर पंचायत की आधिकारिक वेबसाइट <a href="https://karhal.npup.in/">www.karhal.npup.in</a> पर गृहकर, जलकर व जलमूल्य का भुगतान ऑनलाइन कर सकते हैं।</p>
        </div>

        <!-- Signatures -->
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>बिल क्लर्क /दिनांक</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>चेकिंग क्लर्क /दिनांक</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>कर अधीक्षक /अधिशासी अधिकारी</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dotted Partition Line -->
    <div class="partition"></div>

    <!-- Second Receipt (Duplicate) -->
    <div class="container">
      <!-- Header -->
      <div class="header">
        <img src="https://nagar-nigam.s3.ap-south-1.amazonaws.com/public-images/up-logo.jpg" class="header-logo" alt="UP Logo" />
        <div class="header-center">
          <div class="header-title">नगर पंचायत ${nagarNigamName} , मैनपुरी</div>
          <div class="header-subtitle">बिल गृहकर एवं जलकर</div>
        </div>
        <img src="https://nagar-nigam.s3.ap-south-1.amazonaws.com/public-images/swadesh-logo.jpg" class="swachh-logo" alt="Swachh Bharat" />
      </div>

      <!-- Content -->
      <div class="content">
        <!-- Property Info Section -->
        <div class="info-section">
          <div class="info-left">
            <div class="info-row">
              <span class="info-label">फॉर्म नंबर:</span>
              <span>${formNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">PTIN:</span>
              <span>${property.PTIN || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">श्री/श्रीमती:</span>
              <span>${property.ownerName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">पिता/पति:</span>
              <span>${property.fatherName || property.guardianName || 'N/A'}</span>
            </div>
          </div>
          <div class="info-right">
            <div class="info-row">
              <span class="info-label">डिमांड नंबर:</span>
              <span> ${demandNumber} </span>
            </div>
            <div class="info-row">
              <span class="info-label">Ward</span>
              <span> ${property.wardNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">मोहल्ला:</span>
              <span>${property.locality || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">भवन संख्या:</span>
              <span>${property.houseNumber || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">नई भवन संख्या:</span>
              <span>${property.newHouseNumber || 'N/A'}</span>
            </div>
          </div>
        </div>

        <!-- Tax Table -->
        <table class="bill-table">
          <thead>
            <tr>
              <th></th>
              <th>विवरण अवधि</th>
              <th>गृहकर</th>
              <th>जलकर</th>
              <th>टिप्पणी</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowspan="2" class="arv-cell">
                वार्षिक मूल्यांकन<br>${arv}
              </td>
              <td>2025-2026</td>
              <td>${houseTax}</td>
              <td>${waterTax}</td>
              <td rowspan="8" class="remarks-cell">
                <ol>
                  <li><strong> यह स्वामित्व का प्रमाण नहीं है यह एक प्रोविजनल बिल है</strong></li>
                  <li><strong> वर्तमान मांग पर छूट नियमानुसार अनुमन्य होगी । कृपया बिल की प्रतीक्षा न करें।</strong></li>
                  <li><strong> वित्तीय वर्ष की संपत्ति के उपरांत बकाये पर 12% का अधिभार देय होगा</strong></li>
                  <li><strong> रूपया नगर पालिका के कर विभाग में 10.30 बजे से 2 बजे तक जमा किया जा सकता है।</strong></li>
                  <li><strong> इस अवधि के बाद धारा 168 व 169 के अन्तर्गत डिमांड नोटिस व वारण्ट कुर्की भी जारी किया जायेगा।</strong></li>
                  <li><strong> यह बिल कंप्यूटर द्वारा निर्मित किया गया है हस्ताक्षर की आवश्यकता नहीं है।</strong></li>
                </ol>
              </td>
              <td rowspan="2">
                जारी करने की तिथि<br>${formatDate(tax.createdAt)}
              </td>
            </tr>
            <tr>
              <td>बकाया</td>
              <td colspan="2">${totalPrevBakaya.toFixed(2)}</td>
            </tr>
            <tr>
              <td rowspan="2">
                मूल्यांकन तिथि<br>${formatDate(tax.effectiveFrom)}
              </td>
              <td>अधिभार</td>
              <td colspan="2">${interestAmount.toFixed(2)}</td>
              <td rowspan="2">
                अंतिम तिथि<br>${formatDate(tax.dueDate)}
              </td>
            </tr>
            <tr>
              <td>छूट</td>
              <td colspan="2">${discount}</td>
            </tr>
            <tr>
              <td rowspan="2">${property?.propertyClass || 'Mixed'}</td>
              <td class="label-cell">भुगतान कर</td>
              <td colspan="2">${paidAmount.toFixed(2)}</td>
              <td rowspan="2">
                कुल देय धनराशि<br><strong>₹${dueAmount.toFixed(2)}</strong>
              </td>
            </tr>
            <tr>
              <td class="label-cell">देय धनराशि</td>
              <td colspan="2" class="total-row">${totalTaxToPay.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Footer Notes -->
        <div class="footer-notes">
          <p><strong>1.</strong> यदि संपत्ति के स्वामी/अध्यासी करदाता को इस बिल के संबंध में किसी प्रकार की कोई आपत्ति है तो प्रोविजनल बिल प्राप्ति दिनांक से 15 दिवस के अंदर नगर पंचायत ${nagarNigamName}, मैनपुरी के कर विभाग में लिखित रूप से दर्ज करा सकते है अन्यथा इस बिल को अंतिम मानकर वसूली की जाएगी</p>
          <p><strong>2.</strong> नगर पंचायत की आधिकारिक वेबसाइट <a href="https://barnal.npup.in/">www.barnal.npup.in</a> पर गृहकर, जलकर व जलमूल्य का भुगतान ऑनलाइन कर सकते हैं।</p>
        </div>

        <!-- Signatures -->
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>बिल क्लर्क /दिनांक</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>चेकिंग क्लर्क /दिनांक</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>कर अधीक्षक /अधिशासी अधिकारी</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`



  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=medium', '--enable-font-antialiasing']
  });

  const page = await browser.newPage();
  await page.setContent(htmlTemplate, { waitUntil: 'networkidle0', timeout: 60000 });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    tagged: true,
    displayHeaderFooter: false,
    margin: { top: '10px', right: '10px', bottom: '10px', left: '10px' }
  });

  await browser.close();
  return pdfBuffer;
};