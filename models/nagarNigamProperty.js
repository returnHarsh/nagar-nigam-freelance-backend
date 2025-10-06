import mongoose from "mongoose";
import { errorLogger } from "../utils/errorLogger.js";
import { customAlphabet } from "nanoid";


const nagarNigamSchema = new mongoose.Schema({
	houseNumber : {type : String},
	ownerName : {type : String},
	fatherName : {type : String},
	prevHouseTax : {type : Number},
	prevWaterTax : {type : Number},
	prevTax : {type : Number},
	propertyId : {type : mongoose.Schema.Types.ObjectId , ref : 'Property'},
	PTIN : {type : String}
} , {timestamps : true})

// to generate unique number
const generateNumericId = customAlphabet('0123456789', 6);

// nagarNigamSchema.pre('updateOne', function(next) {
//   try {
//     const update = this.getUpdate();
//     if (!update.PTIN) {
//       // generate PTIN from districtCode
//       const districtCode = update.districtCode || update.$set?.districtCode;
//       if (districtCode) {
//         const generateNumericId = customAlphabet('0123456789', 6);
//         const newPTIN = `${districtCode}-${generateNumericId()}`;
//         // set PTIN in the update
//         this.setUpdate({
//           ...update,
//           PTIN: newPTIN
//         });
//       }
//     }
//     next();
//   } catch (err) {
//     errorLogger(err.message, "nagarNigam pre updateOne");
//     next(err);
//   }
// });

export const NagarNigamProperty = mongoose.model("NagarNigamProperty" , nagarNigamSchema)