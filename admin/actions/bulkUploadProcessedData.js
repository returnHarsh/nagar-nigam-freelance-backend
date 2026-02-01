import XLSX from "xlsx"
import { errorLogger } from "../../utils/errorLogger.js"
import { calculateTax } from "../adminFunctions/calculateTax.js";
import { Property } from "../../models/property.js";
import { createTaxModel } from "../adminFunctions/taxRegister.js";
import { generateReciept } from "../adminFunctions/generateReciept.js";
import {mapClassifiedProperty} from "../adminFunctions/helper.js"
import {spawn} from "child_process"
import { fileURLToPath } from "url";
import path from "path";
import { Tax } from "../../models/tax.js";
import { flagPropertyForReceiptGen } from "../../utils/flagProperty.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const processEachProperty = async(property)=>{
  let isProcessed = true
	try{
    console.log("running for property with Id : " , property)
		const {floorsData , roadWidthType , constructionType , propertyType} = property;

		if(!roadWidthType || !propertyType || !constructionType){
      console.log("⚠️ roadWidthType or propertyType or  constructionType is missing : " , `roadWidthType : ${roadWidthType} , constructionType : ${constructionType} , propertyType : ${propertyType}`)
			return {success : false , message : "Missing Fields"};
		}

		// ======= STEP 1 : Calculate Tax =======
		const taxDetails = await calculateTax(floorsData , roadWidthType , constructionType , propertyType );
    console.log("tax details is : " , taxDetails)

		// ======= STEP 2 : Creating Tax Model For this calculated Tax =========
		const latestTax = await createTaxModel(taxDetails , property)
    console.log("latest tax is : " , latestTax)


		// ======= Step 3 : Generating the Reciept PDF and Storing that on S3 =======
		try{
			await generateReciept(property , latestTax)
      console.log("reciept generated")
		}catch(err){
      isProcessed = false;
      flagPropertyForReceiptGen(property)
			// errorLogger(err , "");
		}

		// ======= Step 4 : Categorizing and attaching the proprtyGroup =======
		property.propertyGroup = mapClassifiedProperty(property.propertyType)
		await Property.findByIdAndUpdate(property._id, { propertyGroup: property.propertyGroup , isProcessed});

    console.log("🎉 🎉 Done processing the property")

		return {success : true , message : "Property Inserted"}

	}catch(err){
    console.log("error is : " , err.message)
		errorLogger(err.message , "processEachProperty")
	}
}

// ================== This function is responsible for processing the data in bulk from DB and calculating and generating the tax for each unprocessed property =============
export const uploadBulkData = async()=>{
	try{

		const properties = await Property.find({isProcessed : false}).lean();

		await Promise.all(properties.map(async(property)=>{
			await processEachProperty(property)
      return "done"
		}))

    

    // for(const property of properties){
    //   await processEachProperty(property)
    // }
    
    console.log("✅ Done Processing the Whole Property Record")




	}catch(err){
		errorLogger(err,"uploadBulkData");
	}
}


// ================= This function is to process the individual property data ======================
export const processSingleProperty = async(PTIN)=>{
  try{
    const property = await Property.findOne({PTIN : PTIN});
    if(!property) return;

    await processEachProperty(property)

  }catch(err){
    console.log("error in processSingleProperty function : " , err.message);
    errorLogger(err , "processSingleProperty")
  }
}

// ================ This is the python script handler function which runs and pass the parameters inside the python script =================
export function runPythonScript(scriptPath, excelFilePath) {
  return new Promise((resolve, reject) => {

	console.log("🐍 Starting the Python Script")

	const venvPythonPath = path.resolve("scripts/.venv/bin/python")
    // const python = spawn( venvPythonPath , [scriptPath,  excelFilePath , process.env.MONGO_URI , 'barnal']);
    const python = spawn( venvPythonPath , [scriptPath,  excelFilePath , process.env.MONGO_URI , 'ghiror']);
    
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


        // calling the function to calculate and print the tax
        uploadBulkData()

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


// ================= This is the function to find out and generate the pdf bill for the property whose bill is not generated yet ===================
export const generateBulkFaultyPDF = async()=>{
  try{

    const properties = await Property.find({latestBillUrl : {$exists : false}}).lean();

    // ================== processing the property one by one =========================
    // for(const property of properties){

    //   const latestTax = await Tax.findById(property?.tax)
    //   if(!latestTax){
    //     console.log("Latest Tax for this property is not found.. with _id : " , property?._id)
    //     continue;
    //   }

    //   await generateReciept(property , latestTax);
    // }

    // console.log(`🎉 🎉 Successfully Generated PDFs for ${properties?.length} properties`)

    // return properties?.length



    // =============== processing property in parallel =======================
    await Promise.all(properties.map(async(property)=>{

      const latestTax = await Tax.findById(property?.tax)
      if(!latestTax){
        console.log("Latest Tax for this property is not found.. with _id : " , property?._id)
        return undefined;
      }

      try{
        await generateReciept(property , latestTax);
      }catch(err){
        flagPropertyForReceiptGen(property)
      }

    }))

    console.log(`🎉 🎉 Successfully Generated PDFs for ${properties?.length} properties`)
    return properties?.length

    
    



  }catch(err){
    console.log("[ERROR] while generating the generateBulkFaultyPDF")
  }
}