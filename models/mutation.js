import mongoose from "mongoose";


const modifiedField = new mongoose.Schema({
	fieldName : {type : String},
	oldValue : {type : String},
	newValue : {type : String}
})

const mutationSchema = new mongoose.Schema({
	PTIN : {type : String},
	propertyId : {type : mongoose.Schema.Types.ObjectId , ref : 'Property'},
	modifiedFields : [modifiedField],
	doneBy : {type : mongoose.Schema.Types.ObjectId , ref : 'User'},
	remarks : {type : String}
},{timestamps : true})

export const Mutation = mongoose.model('Mutation' , mutationSchema)

