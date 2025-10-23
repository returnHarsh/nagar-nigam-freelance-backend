import mongoose from "mongoose";


const nagarNigamPrerequisiteSchema = new mongoose.Schema({
	interateRateOnBakaya : {type : Number},
})

export const NagarNigamPrerequisite = mongoose.model('NagarNigamPrerequisite' , nagarNigamPrerequisiteSchema);