import mongoose, { mongo, Schema, Types } from "mongoose";



const TaxSchema = new mongoose.Schema({
	propertyId : {type : mongoose.Schema.Types.ObjectId , ref : "Property" , required : true},
	arv : {type : Number , required : true},
	isModifiedARV : {type : Boolean , default : false},
	totalTax : {type : Number , required : true},
	taxStatus : {type : String , enum : ["pending" , "partial" , "paid"] , default : "pending"},
	dueAmount : {type : Number , default : 0},
	paidAmount : {type : Number , required : true , default : 0},
	taxBreakdown : {type : Schema.Types.Mixed},
	effectiveFrom : {type : Date},
	dueDate : {type : Date},
	history : [{ type : mongoose.Schema.Types.ObjectId , ref : 'Payment' , _id : false }],
	prevTaxPointer : {type : mongoose.Schema.Types.ObjectId , ref : "Tax"},
	bakaya : {type : Number},
	interestAmountOnBakaya : {type : Number},
	interestRate : {type : Number},
	taxWithoutBakaya : {type : Number},

} , {timestamps : true})

TaxSchema.pre("save" , function(next){
	const dueAmount = (this.totalTax ) - this.paidAmount;
	// this.dueAmount = (dueAmount > 0) ? dueAmount : 0
	this.dueAmount = dueAmount

	if(this.paidAmount == 0) this.taxStatus = "pending"
	else if(this.paidAmount < this.totalTax) this.taxStatus = "partial";
	else if(this.paidAmount >= this.totalTax) this.taxStatus = "paid";

	next()
})

export const Tax = mongoose.model("Tax" , TaxSchema);