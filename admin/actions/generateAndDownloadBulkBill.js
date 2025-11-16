// import { PDFDocument } from 'pdf-lib';
// import axios from 'axios';
// import { Property } from '../../models/property.js';
// import { errorLogger } from '../../utils/errorLogger.js';

// export const generateAndDownloadBulkBill = async (req, res, context) => {
//   try {
//     const properties = await Property.find({ latestBillUrl: { $exists: true } }).lean();

//     // Download all PDFs from S3
//     const pdfBuffers = await Promise.all(properties.map(async (p) => {
//       const url = p.latestBillUrl;
//       if (!url) return null;
//       const response = await axios.get(url, { responseType: 'arraybuffer' });
//       return response.data;
//     }));

//     const validPDFs = pdfBuffers.filter(Boolean);

//     // Merge PDFs
//     const mergedPdf = await PDFDocument.create();
//     for (const pdfBytes of validPDFs) {
//       const pdf = await PDFDocument.load(pdfBytes);
//       const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
//       copiedPages.forEach((page) => mergedPdf.addPage(page));
//     }

//     const mergedPdfBytes = await mergedPdf.save();

//     // Send merged PDF
//     res.setHeader('Content-Disposition', 'attachment; filename="AllBills.pdf"');
//     res.setHeader('Content-Type', 'application/pdf');
//     res.send(Buffer.from(mergedPdfBytes));


//   } catch (err) {
//     errorLogger(err, "generateAndDownloadBulkBill");
//     res.status(500).send('Error generating merged PDF');
//   }
// };




// import { PDFDocument } from 'pdf-lib';
// import axios from 'axios';
// import { Property } from '../../models/property.js';
// import { errorLogger } from '../../utils/errorLogger.js';
// import { uploadToS3 } from '../../config/s3.js'; // Import your existing S3 helper

// export const generateAndDownloadBulkBill = async (req, res, context) => {
//   try {
//     const properties = await Property.find({ latestBillUrl: { $exists: true } }).lean();

//     // Download all PDFs from S3
//     const pdfBuffers = await Promise.all(properties.map(async (p) => {
//       const url = p.latestBillUrl;
//       if (!url) return null;
//       const response = await axios.get(url, { responseType: 'arraybuffer' });
//       return response.data;
//     }));

//     const validPDFs = pdfBuffers.filter(Boolean);

//     // Merge PDFs
//     const mergedPdf = await PDFDocument.create();
//     for (const pdfBytes of validPDFs) {
//       const pdf = await PDFDocument.load(pdfBytes);
//       const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
//       copiedPages.forEach((page) => mergedPdf.addPage(page));
//     }

//     const mergedPdfBytes = await mergedPdf.save();

//     // Generate unique filename with timestamp
//     const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//     const fileName = `bulk-bills/AllBills_${timestamp}.pdf`;

//     // Upload to S3 using your existing helper function
//     const bucketName = process.env.AWS_BUCKET || 'your-bucket-name';
//     await uploadToS3(
//       bucketName,
//       fileName,
//       Buffer.from(mergedPdfBytes),
//       'application/pdf'
//     );

//     // Generate S3 URL
//     const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

//     // Redirect user to the generated S3 URL
//     return {
//       redirectUrl: "/admin",
//       notice: {
//         message: 'Bulk bill PDF generated successfully!',
//         type: 'success',
//       },
//     };

//   } catch (err) {
//     errorLogger(err, "generateAndDownloadBulkBill");
//     return {
//       notice: {
//         message: 'Error generating merged PDF',
//         type: 'error',
//       },
//     };
//   }
// };

// ============= Admin js handler ===============
import { PDFDocument } from 'pdf-lib';
import axios from 'axios';
import { Property } from '../../models/property.js';
import { errorLogger } from '../../utils/errorLogger.js';
import { uploadToS3 } from '../../config/S3.js';

export const generateAndDownloadBulkBillOld = async (request, response, context) => {
  try {
    // 1. Fetch properties with bills
    const properties = await Property.find({ latestBillUrl: { $exists: true } }).lean();

    if (!properties || properties.length === 0) {
      return response.json({
        success: false,
        message: 'No properties with bills found',
      });
    }

    console.log(`Found ${properties.length} properties with bills`);

    // 2. Download PDFs from S3
    const pdfBuffers = await Promise.all(properties.map(async (p) => {
      if (!p.latestBillUrl) return null;
      try {
        const res = await axios.get(p.latestBillUrl, { 
          responseType: 'arraybuffer',
          timeout: 30000
        });
        return res.data;
      } catch (err) {
        console.error(`Failed to download PDF for property ${p._id}:`, err.message);
        return null;
      }
    }));

    const validPDFs = pdfBuffers.filter(Boolean);

    if (validPDFs.length === 0) {
      return response.json({
        success: false,
        message: 'No valid PDFs could be downloaded',
      });
    }

    console.log(`Successfully downloaded ${validPDFs.length} PDFs`);

    // 3. Merge PDFs
    const mergedPdf = await PDFDocument.create();
    for (const pdfBytes of validPDFs) {
      try {
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      } catch (err) {
        console.error('Failed to merge a PDF:', err.message);
      }
    }

    const mergedPdfBytes = await mergedPdf.save();
    console.log('PDFs merged successfully');

    // 4. Upload merged PDF to S3
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `bulk-bills/AllBills_${timestamp}.pdf`;
    const bucketName = process.env.AWS_BUCKET;

    await uploadToS3(bucketName, fileName, Buffer.from(mergedPdfBytes), 'application/pdf');
    console.log('✅ Bulk PDF uploaded to S3');

    // 5. Generate public S3 URL
    const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    console.log(`✅ Generated download URL for ${validPDFs.length} bills`);

    // 6. Return S3 URL to frontend
    return response.json({
      success: true,
      message: `Successfully generated bulk bill with ${validPDFs.length} properties`,
      downloadUrl: s3Url,
      count: validPDFs.length,
    });

  } catch (err) {
    errorLogger(err, "generateAndDownloadBulkBill");
    console.error('Error in generateAndDownloadBulkBill:', err);
    
    return response.json({
      success: false,
      message: 'Error generating merged PDF. Please try again.',
      error: err.message,
    });
  }
};


export const generateAndDownloadBulkBill = async (request, response, context) => {
  try {
    // 1. Fetch properties with bills
    // const properties = await Property.find({ latestBillUrl: { $exists: true } }).lean();
     const {wardNumber} = request?.query || {}
    console.log("wardNumber is : " , wardNumber);
    // 1. Fetch properties with bills
    const properties = await Property.find({ latestBillUrl: { $exists: true } , wardNumber }).lean();

    if (!properties || properties.length === 0) {
      return {
        success: false,
        message: 'No properties with bills found',
      };
    }

    console.log(`Found ${properties.length} properties with bills`);

    // 2. Download PDFs from S3
    const pdfBuffers = await Promise.all(properties.map(async (p) => {
      if (!p.latestBillUrl) return null;
      try {
        const res = await axios.get(p.latestBillUrl, { 
          responseType: 'arraybuffer',
          timeout: 30000
        });
        return res.data;
      } catch (err) {
        console.error(`Failed to download PDF for property ${p._id}:`, err.message);
        return null;
      }
    }));

    const validPDFs = pdfBuffers.filter(Boolean);

    if (validPDFs.length === 0) {
      return {
        success: false,
        message: 'No valid PDFs could be downloaded',
      };
    }

    console.log(`Successfully downloaded ${validPDFs.length} PDFs`);

    // 3. Merge PDFs
    const mergedPdf = await PDFDocument.create();
    for (const pdfBytes of validPDFs) {
      try {
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      } catch (err) {
        console.error('Failed to merge a PDF:', err.message);
      }
    }

    const mergedPdfBytes = await mergedPdf.save();
    console.log('PDFs merged successfully');

    // 4. Upload merged PDF to S3
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `bulk-bills/AllBills_${timestamp}.pdf`;
    const bucketName = process.env.AWS_BUCKET;

    await uploadToS3(bucketName, fileName, Buffer.from(mergedPdfBytes), 'application/pdf');
    console.log('✅ Bulk PDF uploaded to S3');

    // 5. Generate public S3 URL
    const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    console.log(`✅ Generated download URL for ${validPDFs.length} bills`);

    // 6. IMPORTANT: Return plain object, not response.json()
    // AdminJS will handle the JSON serialization
    return {
      success: true,
      message: `Successfully generated bulk bill with ${validPDFs.length} properties`,
      downloadUrl: s3Url,
      count: validPDFs.length,
    };

  } catch (err) {
    errorLogger(err, "generateAndDownloadBulkBill");
    console.error('Error in generateAndDownloadBulkBill:', err);
    
    // Return error object, don't use response.json()
    return {
      success: false,
      message: 'Error generating merged PDF. Please try again.',
      error: err.message,
    };
  }
};

// ============== Express Admin Controller ==============

// import { PDFDocument } from 'pdf-lib';
// import axios from 'axios';
// import { Property } from '../../models/property.js';
// import { errorLogger } from '../../utils/errorLogger.js';
// import {uploadToS3} from "../../config/S3.js"

// export const generateAndDownloadBulkBill = async (req, res) => {
//   try {
//     // 1. Fetch properties
//     const properties = await Property.find({ latestBillUrl: { $exists: true } }).lean();

//     // 2. Download PDFs from S3
//     const pdfBuffers = await Promise.all(properties.map(async (p) => {
//       if (!p.latestBillUrl) return null;
//       const response = await axios.get(p.latestBillUrl, { responseType: 'arraybuffer' });
//       return response.data;
//     }));
//     const validPDFs = pdfBuffers.filter(Boolean);

//     // 3. Merge PDFs
//     const mergedPdf = await PDFDocument.create();
//     for (const pdfBytes of validPDFs) {
//       const pdf = await PDFDocument.load(pdfBytes);
//       const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
//       copiedPages.forEach(page => mergedPdf.addPage(page));
//     }
//     const mergedPdfBytes = await mergedPdf.save();

//     // 4. Upload merged PDF to S3
//     const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//     const fileName = `bulk-bills/AllBills_${timestamp}.pdf`;
//     const bucketName = process.env.AWS_BUCKET || 'your-bucket-name';

//     await uploadToS3(bucketName, fileName, Buffer.from(mergedPdfBytes), 'application/pdf');

//     // Optional: get S3 URL if you want to save in DB or show link
//     const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

//     // 5. Stream PDF to browser for download
//     res.setHeader('Content-Disposition', `attachment; filename="AllBills_${timestamp}.pdf"`);
//     res.setHeader('Content-Type', 'application/pdf');
//     res.send(Buffer.from(mergedPdfBytes));

//     console.log('Bulk PDF generated and sent to user. S3 URL:', s3Url);

//   } catch (err) {
//     errorLogger(err, "generateAndDownloadBulkBill");
//     res.status(500).send('Error generating merged PDF');
//   }
// };

export const getPropertyId = async (req, res) => {
  try {
    console.log("request body is : " , req.body)
    let { PTIN } = req.body;
    console.log("PTIN number requested:", PTIN);

    if (!PTIN) {
      return res.status(400).json({
        success: false,
        message: "Please enter the required field",
      });
    }

    // first we have to remove the trailing spaces and gaps
    PTIN = PTIN?.toString().trim();

    const property = await Property.findOne({ PTIN }).lean();

    console.log("property is : " , property)

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "No property found for the entered phone number",
      });
    }

     const data =  {
        propertyId: property._id,
        ward: property.ward,
        wardNumber : property?.wardNumber,
        ownerName: property.ownerName,
        fatherName: property.fatherName,
        address: property.aadharNumber
      }
      console.log("data is : " , data)


    // Return propertyId and other info
    return res.status(200).json({
      success: true,
      message: "Found the property record",
      data: {
        propertyId: property._id,
        ward: property.ward,
        wardNumber : property?.wardNumber,
        ownerName: property.ownerName,
        fatherName: property.fatherName,
        aadharNumber: property.aadharNumber,
      },
    });
  } catch (err) {
    console.error("[ERROR] in getPropertyId:", err);

    // Always return a JSON response on error
    return res.status(500).json({
      success: false,
      message: "Server error while fetching property",
      error: err?.message || "Unknown error",
    });
  }
};
