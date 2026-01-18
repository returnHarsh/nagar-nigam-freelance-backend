import XLSX from "xlsx"
import { Property } from "../models/property.js"

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

    const properties = await Property.find({ wardNumber }).lean()

    if (!properties || properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No properties found",
      })
    }

    console.log(`Found ${properties.length} properties`)

    // 1️⃣ Convert JSON → worksheet
    const worksheet = XLSX.utils.json_to_sheet(properties)

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
