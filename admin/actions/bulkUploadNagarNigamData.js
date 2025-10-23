import XLSX from "xlsx"
import { NagarNigamProperty } from "../../models/nagarNigamProperty.js";

export const bulkUploadNagarNigamData = async (request, response, context) => {
  try {
    const { file, fileName } = request.payload;

    if (!file) {
      return {
        record: {},
        notice: {
          message: "No File Uploaded Or Something is wrong with the file",
          type: "error"
        }
      };
    }

    // Decode base64 file
    const base64Data = file.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Parse Excel File
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheets = workbook.SheetNames;

    let totalRecordCounts = 0;
    let totalInserted = 0;
    let totalUpdated = 0;

    // 🟢 Use for...of so we can await inside the loop
    for (const sheet of sheets) {
      const workSheet = workbook.Sheets[sheet];
      const jsonData = XLSX.utils.sheet_to_json(workSheet);

      console.log(`📄 Processing Sheet: ${sheet} | Rows: ${jsonData.length}`);

      // const records = jsonData.map(row => ({
      //   ward: [sheet],
      //   houseNumber: String(row['House Number'] || row['houseNumber'] || row['house_number'] || '').trim(),
      //   ownerName: String(row['Owner Name'] || row['ownerName'] || row['Name'] || row['name'] || '').trim(),
      //   fatherName: String(row["Father's Name"] || row['fatherName'] || row['father_name'] || '').trim(),
      //   prevHouseTax: parseFloat(row['prevHouseTax'] ?? row['prev house tax'] ?? row['prev houseTax'] ?? 0) || 0,
      //   prevWaterTax: parseFloat(row['prevWaterTax'] ?? row["prev water tax"] ?? row['prevWaterTax'] ?? 0) || 0,
      //   prevTax:
      //     (parseFloat(row['prevHouseTax'] ?? row['prev house tax'] ?? row['prev houseTax'] ?? 0) || 0) +
      //     (parseFloat(row['prevWaterTax'] ?? row["prev water tax"] ?? row['prevWaterTax'] ?? 0) || 0) + 
      //     (parseFloat(row['prevTax'] ?? 0 ) || 0)
          
      // }));

       const records = jsonData.map(row => {

        console.log("row is : " , row)

        return {
          ward: [sheet],
        houseNumber: String(row['House Number'] || row['houseNumber'] || row['house_number'] || '').trim(),
        ownerName: String(row['Owner Name'] || row['ownerName'] || row['Name'] || row['name'] || '').trim(),
        fatherName: String(row["Father's Name"] || row['fatherName'] || row['father_name'] || '').trim(),
        prevHouseTax: parseFloat(row['prevHouseTax'] ?? row['prev house tax'] ?? row['prev houseTax'] ?? 0) || 0,
        prevWaterTax: parseFloat(row['prevWaterTax'] ?? row["prev water tax"] ?? row['prevWaterTax'] ?? 0) || 0,
        prevTax:
          (parseFloat(row['prevHouseTax'] ?? row['prev house tax'] ?? row['prev houseTax'] ?? 0) || 0) +
          (parseFloat(row['prevWaterTax'] ?? row["prev water tax"] ?? row['prevWaterTax'] ?? 0) || 0) + 
          (parseFloat(row['prevTax'] ?? 0 ) || 0)
        }
          
      });

      const validRecords = records.filter(record =>
        {
          // console.log("record is : " , record)
        return record.houseNumber && record.ownerName && record.fatherName}
      );

      if (validRecords.length === 0) {
        console.log(`⚠️ Skipping empty sheet: ${sheet}`);
        continue;
      }

      totalRecordCounts += validRecords.length;

      const bulkOps = validRecords.map(record => ({
        updateOne: {
          filter: {
            ownerName: record.ownerName,
            houseNumber: record.houseNumber,
            fatherName: record.fatherName
          },
          update: { $set: record },
          upsert: true
        }
      }));

      const result = await NagarNigamProperty.bulkWrite(bulkOps);
      totalInserted += result.upsertedCount || 0;
      totalUpdated += result.modifiedCount || 0;

      console.log(
        `✅ Sheet "${sheet}": Inserted ${result.upsertedCount}, Updated ${result.modifiedCount}`
      );
    }

    return {
      record: {},
      notice: {
        message: `✅ Successfully uploaded ${totalRecordCounts} records (${totalInserted} new, ${totalUpdated} updated) across ${sheets.length} sheets.`,
        type: "success"
      }
    };

  } catch (err) {
    console.error("[ERROR] in bulkUploadNagarNigamData:", err);
    return {
      record: {},
      notice: {
        message: `Upload failed: ${err.message}`,
        type: "error"
      }
    };
  }
};
