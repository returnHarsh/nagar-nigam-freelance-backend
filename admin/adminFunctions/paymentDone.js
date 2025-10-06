import { ValidationError } from "adminjs"
import { errorLogger } from "../../utils/errorLogger.js"
import { Tax } from "../../models/tax.js";

const checkPaymentAmount = (paymentDoc , propertyTax)=>{
	if(paymentDoc.amountPaid > propertyTax.dueAmount) throw new ValidationError({amountPaid : {message : "Can't Pay more than the due amount"}})
}

export const paymentDone = async(paymentDoc)=>{
	try{

		const {propertyId} = paymentDoc
		
		if(!propertyId) throw new ValidationError({propertyId : {message : "Property Id is Required"}});

		const propertyTax = await Tax.findOne({propertyId}).sort({createdAt : -1}).lean();
		if(!propertyTax) throw new ValidationError({} , {message : "Tax is Not found for this Property"}) // for throwing the error for whole document , not field specific


		checkPaymentAmount(paymentDoc , propertyTax);


		const isWholeTaxPaid = (propertyTax.dueAmount - paymentDoc.amountPaid) == 0

		// ========== now we have found the tax associated with this property , now we have to update the tax ============
		const newUpdatedTax = await Tax.create({
			propertyId : propertyTax?.propertyId,
			arv : propertyTax.arv,
			totalTax : propertyTax.totalTax,
			taxStatus : isWholeTaxPaid ? "paid" : "partial",
			paidAmount : (propertyTax.paidAmount + paymentDoc.amountPaid),
			taxBreakdown : propertyTax.taxBreakdown,
			effectiveFrom : propertyTax.effectiveFrom,
			dueDate : propertyTax.dueDate,
			history : [...propertyTax.history , paymentDoc._id],
			prevTaxPointer : propertyId?._id,
		})

		return newUpdatedTax

	}catch(err){
		errorLogger(err , "paymentDone")
	}
}