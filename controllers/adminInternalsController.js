import XLSX from "xlsx"
import { Property } from "../models/property.js"
import { uploadToS3 } from "../config/S3.js"
import { randomUUID } from "crypto";

import { flattenObject } from "../utils/flattenObject.js"

// export const downloadProperyExcel = async (req, res) => {
//   try {
//     const { wardNumber } = req.params

//     console.log("ward number is:", wardNumber)

//     if (!wardNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "wardNumber is required",
//       })
//     }

//     const properties = await Property.find({ wardNumber }).lean()

//     if (!properties || properties.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No properties found",
//       })
//     }

//     console.log(`Found ${properties.length} properties`)

//     // 1️⃣ Convert JSON → worksheet
//     const worksheet = XLSX.utils.json_to_sheet(properties)

//     // 2️⃣ Create workbook
//     const workbook = XLSX.utils.book_new()
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Properties")

//     // 3️⃣ Generate buffer
//     const buffer = XLSX.write(workbook, {
//       bookType: "xlsx",
//       type: "buffer", // 🔥 IMPORTANT
//     })

//     // 4️⃣ Set headers
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     )

//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=properties_ward_${wardNumber}.xlsx`
//     )

//     // 5️⃣ Send file
//     return res.send(buffer)
//   } catch (err) {
//     console.error("[ERROR] in downloadProperyExcel:", err)

//     return res.status(500).json({
//       success: false,
//       message: "Failed to generate Excel file",
//     })
//   }
// }

export const downloadProperyExcel = async (req, res) => {
  try {
    const { wardNumber } = req.params

    console.log("ward number is:", wardNumber)

    if (!wardNumber) {
      return res.status(400).json({
        success: false,
        message: "wardNumber is required",
      })
    }

    // finding all the properties , but here the properties are in nested form , so we need to flatten the nested structure
    const properties = await Property.find({ wardNumber })
      .select('-_id -surveyor -tax -isProcessed -isSuccessSubmit -latestBillUrl -lastBillGeneratedAt')
      .lean();



    if (!properties || properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No properties found",
      })
    }

    // Flatten all properties
    const flattenedProperties = properties.map(property => flattenObject(property));

    console.log(`Found ${flattenedProperties.length} properties`)

    // 1️⃣ Convert JSON → worksheet
    const worksheet = XLSX.utils.json_to_sheet(flattenedProperties)

    // 2️⃣ Create workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Properties")

    // 3️⃣ Generate buffer
    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer", // 🔥 IMPORTANT
    })

    // 4️⃣ Set headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=properties_ward_${wardNumber}.xlsx`
    )

    // 5️⃣ Send file
    return res.send(buffer)
  } catch (err) {
    console.error("[ERROR] in downloadProperyExcel:", err)

    return res.status(500).json({
      success: false,
      message: "Failed to generate Excel file",
    })
  }
}

export const uploadFileToS3 = async (req, res) => {
  try {
    const { fileName, fileType, fileData, field } = req.body;
    console.log("inside the s3 handler function");

    if (!fileData) {
      return res.status(400).json({
        success: false,
        message: "No file data provided"
      });
    }

    // Decode the base64 file
    const buffer = Buffer.from(fileData.split(",")[1], "base64");
    const key = `property/uploads/${field}/${Date.now()}-${randomUUID()}-${fileName}`;
    console.log("key is:", key);

    await uploadToS3(process.env.AWS_BUCKET, key, buffer, fileType);

    const fileUrl = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return res.status(200).json({
      success: true,
      message: "✅ File uploaded successfully",
      data: { fileUrl }
    });
  } catch (err) {
    console.error("[ERROR] Upload Action:", err);
    return res.status(500).json({
      success: false,
      message: `Upload failed: ${err.message}`
    });
  }
};

