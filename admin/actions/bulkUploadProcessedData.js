import XLSX from "xlsx"
import { errorLogger } from "../../utils/errorLogger.js"
import { calculateTax } from "../adminFunctions/calculateTax.js";
import { Property } from "../../models/property.js";
import { createTaxModel } from "../adminFunctions/taxRegister.js";
import { generateReciept } from "../adminFunctions/generateReciept.js";
import {spawn} from "child_process"
import { fileURLToPath } from "url";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const processEachProperty = async(property)=>{
	try{

		const {floorsData , roadWidthType , constructionType , propertyType} = property;

		if(!roadWidthType || roadWidthType || constructionType){
			return {success : false , message : "Missing Fields"};
		}

		// ======= STEP 1 : Calculate Tax =======
		const taxDetails = await calculateTax(floorsData , propertyType , constructionType , propertyType );

		// ======= STEP 2 : Creating Tax Model For this calculated Tax =========
		const latestTax = await createTaxModel(taxDetails , property)


		// ======= Step 3 : Generating the Reciept PDF and Storing that on S3 =======
		try{
			await generateReciept(property , latestTax)
		}catch(err){
			errorLogger(err , "");
		}

		// ======= Step 4 : Categorizing and attaching the proprtyGroup =======
		property.propertyGroup = mapClassifiedProperty(property.propertyType)
		await Property.findByIdAndUpdate(property._id, { propertyGroup: property.propertyGroup });

		return {success : true , message : "Property Inserted"}

	}catch(err){
		errorLogger(err.message , "processEachProperty")
	}
}

// ================== This function is responsible for processing the data in bulk from DB and calculating and generating the tax for each unprocessed property =============
export const uploadBulkData = async()=>{
	try{

		const properties = await Property.find({processed : false}).lean();

		await Promise.all(properties.map(async(property)=>{
			await processEachProperty(property)
		}))


	}catch(err){
		errorLogger(err,"uploadBulkData");
	}
}

// ================ This is the python script handler function which runs and pass the parameters inside the python script =================
export function runPythonScript(scriptPath, excelFilePath) {
  return new Promise((resolve, reject) => {

	console.log("🐍 Starting the Python Script")

	const venvPythonPath = path.resolve("scripts/.venv/bin/python")
    const python = spawn( venvPythonPath , [scriptPath,  excelFilePath , process.env.MONGO_URI , 'nagar_niam_latest']);
    
    let stdout = '';
    let stderr = '';
    let stats = {
      insertedCount: 0,
      duplicatesSkipped: 0,
      totalProcessed: 0
    };

    python.stdout.on('data', (data) => {
      const output = data.toString();
	  console.log("Python Script "  , output)
      stdout += output;

      const insertMatch = output.match(/Successfully inserted (\d+) documents/);
      const dupMatch = output.match(/Duplicates skipped: (\d+)/);
      const processedMatch = output.match(/Successfully processed (\d+)\/(\d+)/);

      if (insertMatch) stats.insertedCount = parseInt(insertMatch[1]);
      if (dupMatch) stats.duplicatesSkipped = parseInt(dupMatch[1]);
      if (processedMatch) stats.totalProcessed = parseInt(processedMatch[1]);
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
	console.log("Script closed")
      if (code !== 0) {
        reject(new Error(`Script failed: ${stderr}`));
      } else {
        resolve({
          message: `Imported ${stats.insertedCount} properties (${stats.duplicatesSkipped} duplicates)`,
          ...stats
        });
      }
    });

    python.on('error', (error) => {
      reject(new Error(`Python error: ${error.message}`));
    });
  });
}
