const XLSX = require('xlsx');

// In your AdminJS resource configuration:
export const uploadNagarNigamData = {
  resource: NagarNigamProperty,
  options: {
    actions: {
      uploadNagarNigamData: {
        actionType: 'resource',
        label: 'Upload Nagar Nigam Data',
        icon: 'Upload',
        component: AdminCustomComponents.NagarNigamPropertyUpload,

        handler: async (request, response, context) => {
          console.log("inside the handler function");
          
          try {
            const { file, filename } = request.payload;
            
            if (!file) {
              return {
                notice: {
                  message: "No file uploaded",
                  type: "error"
                }
              };
            }

            // Decode base64 file
            const base64Data = file.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Parse Excel file
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length === 0) {
              return {
                notice: {
                  message: "Excel file is empty",
                  type: "error"
                }
              };
            }

            // Map Excel columns to your schema
            // Adjust column names based on your Excel file
            const records = jsonData.map(row => ({
              houseNumber: row['House Number'] || row['houseNumber'] || row['house_number'] || '',
              ownerName: row['Owner Name'] || row['ownerName'] || row['Name'] || row['name'] || '',
              fatherName: row["Father's Name"] || row['fatherName'] || row['father_name'] || '',
              prevTax: parseFloat(row['Bakaya'] || row['prevTax'] || row['Previous Tax'] || 0) || 0
            }));

            // Filter out empty records
            const validRecords = records.filter(record => 
              record.houseNumber && record.houseNumber.trim() !== ''
            );

            if (validRecords.length === 0) {
              return {
                notice: {
                  message: "No valid records found in Excel file",
                  type: "error"
                }
              };
            }

            // Bulk insert with upsert to avoid duplicates
            const bulkOps = validRecords.map(record => ({
              updateOne: {
                filter: { houseNumber: record.houseNumber },
                update: { $set: record },
                upsert: true
              }
            }));

            const result = await context.resource.Model.bulkWrite(bulkOps);

            return {
              notice: {
                message: `Successfully uploaded ${validRecords.length} records. (${result.upsertedCount} new, ${result.modifiedCount} updated)`,
                type: "success"
              }
            };

          } catch (error) {
            console.error("Upload error:", error);
            return {
              notice: {
                message: `Upload failed: ${error.message}`,
                type: "error"
              }
            };
          }
        }
      }
    }
  }
}