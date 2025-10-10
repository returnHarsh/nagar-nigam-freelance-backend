import mongoose from "mongoose";


const wardLocalityMapping = new mongoose.Schema({
	propertyId : {type : mongoose.Schema.Types.ObjectId , ref : 'Property'},
	ward : {type: String},
	wardNumber : {type: Number},
	locality : {type : [String]},
})

export const PropertyWardDetail = mongoose.model('PropertyWardDetail' , wardLocalityMapping);