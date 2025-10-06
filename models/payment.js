import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
	propertyId : {type : mongoose.Schema.Types.ObjectId , ref : 'Property'},
	paymentDate : {type : Date , required : true},
	amountPaid : {type : Number , required : true},
	method : {type : String , enum : ["cash" , "online" , "bank"] , required : true},
	// paymentId : {type : String},
	message : {type : String , required : true },
	receiptProofUrl : {type : String},
	receiptProofS3Url : {type : String}
} , {timestamps : true})

export const Payment = mongoose.model('Payment' , paymentSchema)