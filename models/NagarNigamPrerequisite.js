import mongoose from "mongoose";


const nagarNigamPrerequisiteSchema = new mongoose.Schema({
	interestRateOnBakaya : {type : Number},
	formNumber : {type : Number},
	nagarNigamName : {type : String},
})

export const NagarNigamPrerequisite = mongoose.model('NagarNigamPrerequisite' , nagarNigamPrerequisiteSchema);