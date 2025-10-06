import mongoose from "mongoose";


const arvModification = new mongoose.Schema({
	propertyId : {type : mongoose.Schema.Types.ObjectId , ref : 'Property'},
	newArv : {type : Number},
	message : {type : String},
	modificationProof : {type : String},
})

export const ARVModification = mongoose.model('ARV' , arvModification);

