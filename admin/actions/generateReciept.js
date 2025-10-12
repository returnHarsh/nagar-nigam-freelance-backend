// services/pdfGenerator.js
import puppeteer from 'puppeteer';
import fs from "fs"
import { NagarNigamProperty } from '../../models/nagarNigamProperty.js';

export const generateTaxBillPDF = async (property, tax) => {
  // Extract data from models
  const formNo = property.PTIN || property._id.toString().slice(-6);
  const demandNumber = tax._id.toString().slice(-6);
  
  // Calculate tax values from taxBreakdown
  const breakdown = tax.taxBreakdown || {};
  const houseTax = breakdown.houseTax || 0;
  const waterTax = breakdown.waterTax || 0;
  const arv = tax.arv;

  const preNagarNigamData = await NagarNigamProperty.findOne({
    ownerName: property.ownerName,
    fatherName: property.fatherName,
    houseNumber: property.houseNumber
  });
  
  const arrearsTax = preNagarNigamData?.prevHouseTax || 0;
  const arrearsWater = preNagarNigamData?.prevWaterTax || 0;
  const surcharge = 0;
  const surchargeWater = 0;
  const discount = 0;
  const discountWater = 0;
  
  // Get paid amount from tax model
  const paidAmount = tax.paidAmount || 0;
  
  const totalHouseTax = houseTax + arrearsTax + surcharge;
  const totalWaterTax = waterTax + arrearsWater + surchargeWater;
  const afterDiscountHouseTax = totalHouseTax - discount;
  const afterDiscountWaterTax = totalWaterTax - discountWater;
  
  // Get due amount directly from tax model
  const dueAmount = tax.dueAmount || 0;
  
  // Calculate proportional house tax and water tax from due amount
  const totalAfterDiscount = afterDiscountHouseTax + afterDiscountWaterTax;
  const finalHouseTax = totalAfterDiscount > 0 ? (dueAmount * (afterDiscountHouseTax / totalAfterDiscount)) : 0;
  const finalWaterTax = totalAfterDiscount > 0 ? (dueAmount * (afterDiscountWaterTax / totalAfterDiscount)) : 0;
  const grandTotal = dueAmount;
  
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

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Tax Bill - ${property.PTIN}</title>
  <style>

    /* Embed Hindi Font */
      @font-face {
        font-family: 'NotoSansDevanagari';
        src: url(data:font/truetype;charset=utf-8;base64,${devanagariFont}) format('truetype');
        font-weight: 400;
        font-style: normal;
      }
         /* Embed English Font */
      @font-face {
        font-family: 'NotoSans';
        src: url(data:font/truetype;charset=utf-8;base64,${englishFont}) format('truetype');
        font-weight: 400;
        font-style: normal;
      }
        

        body {
        font-family: 'NotoSansDevanagari', 'NotoSans', sans-serif !important;
        -webkit-font-smoothing: antialiased;
        color: #000;
      }



    @media print {
      body { background: white; }
    }
  </style>
</head>
<body>
    <div style="width: 100%; max-width: 768px; margin: 0 auto; background-color: white; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 0.5rem;">
        <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem;">
            
            <!-- Header Section -->
            <div style="text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 0.5rem;">
                    <div style="width: 4.5rem; margin-bottom: 0.75rem; margin-right: 1.25rem;">
                        <img src="https://nagar-nigam.s3.ap-south-1.amazonaws.com/public-images/up-logo.jpg" style="width: 100%; height: auto;" />
                    </div>
                    <div>
                        <h1 style="font-size: 1.125rem; font-weight: 700; color: #000000;">नगर पालिका परिषद, शिकोहाबाद</h1>
                        <h1 style="font-size: 1.120rem; color: #000000;">बिल गृहकर एवं जलकर </h1>
                    </div>
                    <div style="width: 7.5rem; margin-bottom: 0.75rem; margin-left: 1.25rem;">
                        <img src="https://nagar-nigam.s3.ap-south-1.amazonaws.com/public-images/swadesh-logo.jpg" alt="Swacch bharat swasth bharat" style="width: 100%; height: auto;" />
                    </div>
                </div>
            </div>

            <!-- Property Details Section -->
            <div style="display: flex; gap: 2rem; font-size: 0.875rem;">
                <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
                    <div style="display: flex;">
                        <span style="font-weight: 600; width: 6rem;">फॉर्म नo:</span>
                        <span>${formNo}</span>
                    </div>
                    <div style="display: flex;">
                        <span style="font-weight: 600; width: 6rem;">डिमांड नम्बर:</span>
                        <span>${demandNumber}</span>
                    </div>
                    <div style="display: flex;">
                        <span style="font-weight: 600; width: 6rem;">श्री/श्रीमती:</span>
                        <span>${property.ownerName || 'N/A'}</span>
                    </div>
                    <div style="display: flex;">
                        <span style="font-weight: 600; width: 6rem;">पिता / पति:</span>
                        <span>${property.fatherName || property.guardianName || 'N/A'}</span>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
                    <div style="display: flex;">
                        <span style="font-weight: 600; width: 4rem;">Ward:</span>
                        <span>${property.ward || 'N/A'}</span>
                    </div>
                    <div style="display: flex;">
                        <span style="font-weight: 600; width: 4rem;">मोहल्ला:</span>
                        <span>${property.locality || 'N/A'}</span>
                    </div>
                    <div style="display: flex;">
                        <span style="font-weight: 600; width: 4rem;">PTIN:</span>
                        <span>${property.PTIN || 'N/A'}</span>
                    </div>
                    <div style="display: flex;">
                        <span style="font-weight: 600; width: 4rem;">भवन संo:</span>
                        <span>${property.houseNumber || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <!-- Tax Details Table -->
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #9ca3af; font-size: 0.875rem;">
                    <thead>
                        <tr style="background-color: #f3f4f6;">
                            <th style="border: 1px solid #9ca3af; padding: 0.5rem; text-align: center;"></th>
                            <th style="border: 1px solid #9ca3af; padding: 0.5rem; text-align: center; white-space:nowrap;">विवरण अवधि</th>
                            <th style="border: 1px solid #9ca3af; padding: 0.5rem; text-align: center;">गृहकर</th>
                            <th style="border: 1px solid #9ca3af; padding: 0.5rem; text-align: center;">जलकर</th>
                            <th style="border: 1px solid #9ca3af; padding: 0.5rem; text-align: center;">टिप्पणी</th>
                            <th style="border: 1px solid #9ca3af; padding: 0.5rem; text-align: center;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="text-align: center;">
                            <td rowspan="2" style="border: 1px solid #9ca3af; padding: 0.5rem; white-space:nowrap;">
                                वार्षिक मूल्यांकन<br />${arv}
                            </td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">2024-2025</td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">${houseTax}</td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">${waterTax}</td>
                            <td rowspan="8" style="border: 1px solid #9ca3af; padding: 0.5rem; text-align: left; vertical-align: top;">
                                <ol style="margin: 0; padding-left: 1.5rem; font-size: 0.7rem;">
                                    <li>यह स्वामित्व का प्रमाण नहीं है। यह एक प्रोविशनल बिल है।</li>
                                    <li>वर्तमान मांग पर छूट नियमानुसार अनुमन्य होगी। कृपया बिल की प्रतीक्षा न करे।</li>
                                    <li>इस अवधि के बाद धारा 168 व 169 के अन्तर्गत डिमांड नोटिस व वारण्ट कुर्की भी जारी किया जाएगा।</li>
                                    <li>रूपया नगर पालिका के कर विभाग में 10:30 बजे से 2 बजे तक जमा किया जा सकता है।</li>
                                    <li>यह बिल कंप्यूटर द्वारा निर्गत किया गया है हस्ताक्षर की आवशकता नहीं है।</li>
                                </ol>
                            </td>
                            <td rowspan="2" style="border: 1px solid #9ca3af; padding: 0.5rem;">
                                जारी करने की तिथि<br />${formatDate(tax.createdAt)}
                            </td>
                        </tr>
                        <tr style="text-align: center;">
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">बकाया</td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">${arrearsTax}</td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">${arrearsWater}</td>
                        </tr>
                        <tr style="text-align: center;">
                            <td rowspan="2" style="border: 1px solid #9ca3af; padding: 0.5rem;">
                                मूल्यांकन तिथि<br />${formatDate(tax.createdAt)}
                            </td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">अधिभार</td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">${surcharge}</td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">${surchargeWater}</td>
                            <td rowspan="2" style="border: 1px solid #9ca3af; padding: 0.5rem;">
                                अंतिम तिथि<br />${formatDate(tax.dueDate)}
                            </td>
                        </tr>
                        <tr style="text-align: center;">
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">योग</td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">${totalHouseTax}</td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">${totalWaterTax}</td>
                        </tr>
                        <tr style="text-align: center;">
                            <td rowspan="4" style="border: 1px solid #9ca3af; padding: 0.5rem;">
                                ${property?.propertyClass || 'Residential'}
                            </td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">छूट</td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">${discount}</td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">${discountWater}</td>
                            <td rowspan="4" style="border: 1px solid #9ca3af; padding: 0.5rem;">
                                कुल देय धनराशि<br /><strong>₹${grandTotal.toFixed(2)}</strong>
                            </td>
                        </tr>
                        <tr style="text-align: center;">
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">भुगतान कर</td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;" colspan="2"><strong>₹${paidAmount.toFixed(2)}</strong></td>
                        </tr>
                        <tr style="text-align: center;">
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">शेष राशि</td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">${afterDiscountHouseTax.toFixed(2)}</td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">${afterDiscountWaterTax.toFixed(2)}</td>
                        </tr>
                        <tr style="text-align: center;">
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;">देय धनराशि</td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;"><strong>₹${finalHouseTax.toFixed(2)}</strong></td>
                            <td style="border: 1px solid #9ca3af; padding: 0.5rem;"><strong>₹${finalWaterTax.toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Footer Notes -->
            <div style="font-size: 0.75rem; color: #4b5563; display: flex; flex-direction: column; gap: 0.5rem;">
                <p style="margin: 0;">
                    <strong>टिप्पणी:</strong> 1. यदि संपत्ति के स्वाभी / कर दाता को इस बिल के सम्बन्ध में किसी प्रकार की कोई अप्पति है तो प्रोविजनल बिल प्राप्ति दिनांक से 15 दिवस के अंदर नगर पालिका परिषद् शिकोहाबाद के कर विभाग में लिखित रूप सै दर्ज करा सकता है अनयथा इस बिल को अंतिम मान कर वसूली की जाएगी।
                </p>
                <p style="margin: 0;">
                    2. नगर पालिका की अधिकारिक वेबसाइट <strong>www.nppshikohabad.in</strong> पर गृहकर, जलकर व जलमूल्य का भुगतान ऑनलाइन कर सकते है।
                </p>
            </div>

            <!-- Signature Section -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 2rem;">
                <div style="text-align: center;">
                    <div style="border-top: 1px solid #9ca3af; width: 8rem; margin-bottom: 0.5rem;"></div>
                    <p style="font-size: 0.875rem; margin: 0;">बिल क्लर्क</p>
                </div>
                <div style="text-align: center;">
                    <div style="border-top: 1px solid #9ca3af; width: 8rem; margin-bottom: 0.5rem;"></div>
                    <p style="font-size: 0.875rem; margin: 0;">चेकिंग क्लर्क</p>
                </div>
                <div style="text-align: center;">
                    <div style="border-top: 1px solid #9ca3af; width: 12rem; margin-bottom: 0.5rem;"></div>
                    <p style="font-size: 0.875rem; margin: 0;">कर अधीक्षक / अधिशासी अधिकारी</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox' , '--font-render-hinting=medium' ,  '--enable-font-antialiasing' ]
  });

  const page = await browser.newPage();
  await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    tagged: true,
    displayHeaderFooter: false,
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
  });

  await browser.close();
  return pdfBuffer;
};