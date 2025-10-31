import { themeReducer, ValidationError } from "adminjs";
import { Payment } from "../models/payment.js";
import { Property } from "../models/property.js";
import { User } from "../models/user.js";
import { errorLogger, validatonError } from "../utils/errorLogger.js"
import { calculateTax, calculateTaxes } from "./adminFunctions/calculateTax.js";
// import { buildFloorsData } from "./adminFunctions/helper.js";
import { changeHistoryAction } from "./adminFunctions/changeHistoryAction.js";
import { attachFullS3Link, buildFloorsData, createSurveyorDoc, mapClassifiedProperty } from "./adminFunctions/helper.js";
import { logAuditAction } from "./adminFunctions/logAuditAction.js";
import { createTaxModel } from "./adminFunctions/taxRegister.js";
import { paymentDone } from "./adminFunctions/paymentDone.js";
import { generateReciept } from "./adminFunctions/generateReciept.js";
import mongoose from "mongoose";
import Surveyor from "../models/surveyor.js";
import { NagarNigamProperty } from "../models/nagarNigamProperty.js";
import { Tax } from "../models/tax.js";


const isSubmitClickedOnEdit = (doc) => {
	return doc?._id
}


// =================================== USER HOOK START ============================


// ====================== NEW HOOK =============================
export const before_createNewUser = async (request, context) => {
	try {

		console.log("NEW->BEFORE [CREATING USER]")

		const userDoc = { ...request.payload } // making shallow copy so that we don't mutate the original request.payload

		// encrypting the plain text password
		if (userDoc.password) {
			// here we have to encrypt the password;
			const tempUserDoc = new User({ password: userDoc.password });
			await tempUserDoc.encryptPassword();

			userDoc.password = tempUserDoc.password;

			// now modifying the request.payload;
			request.payload.password = userDoc.password
		}


		return request;

	} catch (err) {
		errorLogger(err, "before createNewPropert")
	}
}

export const after_createNewUser = async (response, request, context) => {
	try {

		console.log("NEW->AFTER [CREATING NEW USER]");

		const userDoc = response.record.params;
		const currentUser = context.currentAdmin;

		// here audit the log for creating new user
		await logAuditAction(null, currentUser?._id, "Creating New User", "User", userDoc?._id)

		// now we have to check and create surveyor model if the this user's role is surveyor
		createSurveyorDoc(userDoc);

		return response;
	} catch (err) {
		errorLogger(err, "after createNewPropert")
	}
}


// ====================== EDIT HOOK ==============================
export const before_editUser = async (request, context) => {
	try {
		if (!isSubmitClickedOnEdit(request.payload)) return request

		console.log("EDIT->BEFORE [USER HOOK]")

		const userDoc = { ...request.payload };

		// here user can edit the password also , so we have to modify the password and encrypt that password also
		if (userDoc.password) {
			const tempUser = new User({ password: userDoc.password });
			await tempUser.encryptPassword();
			userDoc.password = tempUser.password;

			// updating the final doc
			request.payload.password = userDoc.password;
		}

		// for our custom diffing algorithm we have to fetch the old doc and store that in context
		const oldDoc = await User.findById(userDoc?._id).lean();
		context.oldDoc = oldDoc

		return request;
	} catch (err) {
		errorLogger(err, "before_editUser");
	}
}

export const after_editUser = async (response, request, context) => {
	try {
		// console.log("response : " , Object.keys(response.record));
		// console.log("request : " , Object.keys(request));
		// console.log("context : " , context);

		// first we have to check if the user clicks on edit button or not
		if (!isSubmitClickedOnEdit(request.payload)) return response;

		console.log("EDIT->AFTER [USER HOOK]")
		const userDoc = response.record.params;
		const currentUser = context.currentAdmin;


		// meta data of current loggedin user who performed the action
		const req = context._adminRequest;
		const ip = req ? req.ip : null;
		const userAgent = req ? req.headers['user-agent'] : null;
		const timestamp = new Date();

		const metaData = {
			ip, userAgent, timestamp
		}



		// now there is an update so we have to append this in changeHistory log
		const oldDoc = context.oldDoc;
		const newDoc = userDoc
		const changeDoc = await changeHistoryAction(oldDoc, newDoc, "User", userDoc?._id, currentUser?._id, metaData)

		// here we have to create a log action
		await logAuditAction(changeDoc?._id || null, currentUser?._id, "Edit User Document", "User", userDoc?._id, metaData)
		await createSurveyorDoc(userDoc)

		return response;

	} catch (err) {
		errorLogger(err, "after_editUser");
	}
}


// =================================== USER HOOK END ============================




// =============================== PROPERTY HOOK START =================================


// ============================ NEW HOOK ==========================================
export const before_createNewProperty = async (request, context) => {
	try {

		// if(!isSubmitClickedOnEdit(request.payload)) return request

		console.log("NEW->BEFORE PROPERTY")

		console.log("BEFORE PROPERTY DATA IS : " , request.payload)
		// ********************************** here we are creating new property ********************************

		const propertyDoc = request.payload;
		const floorsData = buildFloorsData(propertyDoc);
		console.log("floors data is : ", floorsData);
		// if (!floorsData.numberOfFloors || !floorsData.floors?.length) validatonError("floorsData", "please fill the floors Data")
		// if (!propertyDoc.surveyor) validatonError("surveyor", "Please fill who is taking this survey")
		// if (!propertyDoc.propertyType) validatonError("propertyType", "Please fill the propertyType")
		// if (!propertyDoc.constructionType) validatonError("constructionType", "Please fill the construction type")
		// if (!propertyDoc.roadWidthType) validatonError("roadWidthType", "Please fill the roadWidthType")



		return request;
	} catch (err) {
		errorLogger(err, "before createNewPropert")
	}
}

export const after_createNewProperty = async (response, request, context) => {

	// ============== starting the session to perform all opetation autonomically ====================
	// const session = await mongoose.startSession();
	// session.startTransaction();

	try {
		// if(!isSubmitClickedOnEdit(request.payload)) return response;
		console.log("NEW->AFTER PROPERTY")


		const propertyDoc = response.record.params;
		const currentUser = context.currentAdmin;

		console.log("new property doc is : " , propertyDoc)



		// ====== build floor data in plain js object format =========
		const floorsData = buildFloorsData(propertyDoc);


		// ========== STEP 1 : Compute Tax (pure computation , no DB writes)
		const taxDetails = await calculateTax(floorsData, propertyDoc?.roadWidthType, propertyDoc?.constructionType, propertyDoc?.propertyType)

		// ========== STEP 2 : Creating Tax Model (DB operation )
		const latestTax = await createTaxModel(taxDetails, propertyDoc);


		// =========== Step 3 : Generating the Reciept PDF and Storing that on S3 =============
		try {
			await generateReciept(propertyDoc, latestTax)
		} catch (err) {
			errorLogger(err, "")
		}

		// =========== Step 4 : Creating and Saving the Log ====================
		await logAuditAction(null, currentUser?._id, "Register new Property", "Property", propertyDoc?._id, null)

		if (!propertyDoc.propertyGroup) {
			propertyDoc.propertyGroup = mapClassifiedProperty(propertyDoc.propertyType)
			await Property.findByIdAndUpdate(propertyDoc._id, { propertyGroup: propertyDoc.propertyGroup });
		}

		// ============ updating the surveryor doc =================
		const surveyor = await Surveyor.findById(propertyDoc.surveyor);

		if (surveyor) {
			surveyor.totalSurveys += 1;

			// Recalculate success rate
			surveyor.calculateSuccessRate();
			await surveyor.save();
		}


		// =========== If all the operations executed without any error , then we are good to go for final updation =================
		// await session.commitTransaction();
		// session.endSession();

		return response;
	} catch (err) {

		// ======= aborting all DB writes =============
		// if(session){
		// 	await session.abortTransaction();
		// 	session.endSession();
		// }

		// ========= since the transaction failed , deleting the property ==================
		// console.log("deleting the Property with id : ", response?.record?.params?._id)
		// await Property.findByIdAndDelete(response?.record?.params?._id);

		console.log(`property with id : ${response?.record?.params?._id} failed while saving ` )
		await Property.findByIdAndUpdate(response?.record?.params?._id , {
			$set : {
				isSuccessSubmit : false
			}
		})

		errorLogger(err, "after createNewProperty")
	}
}


// ===================================== EDIT HOOK ====================================
export const before_editNewProperty = async (request, context) => {
	try {

		if (!isSubmitClickedOnEdit(request.payload)) {
			return request;
		}

		console.log("EDIT->BEFORE PROPERTY")

		const propertyDoc = request.payload;
		const currentAdmin = context.currentAdmin;

		// first we have to check if the editProof field is filled or not , and if that field is fill then only we proceed
		const editProof = propertyDoc['editProof.message'] && propertyDoc['editProof.documentProof'];
		if (!editProof) throw new ValidationError({ editProof: { message: "This Field is required on Edit" } })


		const floorsData = buildFloorsData(propertyDoc)
		propertyDoc.floorsData = floorsData;

		const oldDoc = await Property.findById(propertyDoc._id).lean();
		context.oldDoc = oldDoc;


		return request;
	} catch (err) {
		errorLogger(err, "before_editNewProperty")
	}
}

export const after_editNewProperty = async (response, request, context) => {
	try {
		if (!isSubmitClickedOnEdit(request.payload)) {
			const floorsData = buildFloorsData(response.record.params)
			response.record.params.floorsData = floorsData
			return response;
		}

		console.log("EDIT->AFTER PROPERTY")
		const propertyDoc = response.record.params;
		const currentUser = context.currentAdmin;

		const floorsData = buildFloorsData(propertyDoc);
		propertyDoc.floorsData = floorsData;

		const oldDoc = context.oldDoc;
		const newDoc = await Property.findById(propertyDoc?._id).lean();


		// heres deleting the floors.* dot notation so that it didn't hinder with the diffing function 
		// Object.keys(newDoc).forEach(key=>{
		// 	if(key.includes("floorsData.")) delete newDoc[key];
		// })

		const changeHistory = await changeHistoryAction(oldDoc, newDoc, "Property", propertyDoc?._id, currentUser?._id)
		await logAuditAction(changeHistory?._id, currentUser?._id, "Edit Property", "Property", propertyDoc?._id)

		const isRecalculateTax = changeHistory?.changes?.some(change => {
			const fieldsToLook = ["floorsData", "propertyType", "constructionType", "roadWidthType"]
			return fieldsToLook.includes(change.field)
		})

		// if isRecalculateTax is true , that means some of the fields on which tax is dependent changed... so we have to calculate the tax again
		const taxDetails = isRecalculateTax ? await calculateTax(newDoc.floorsData, newDoc.roadWidthType, newDoc.constructionType, newDoc.propertyType) : null;

		if (taxDetails) {
			// now tag calculated again so we have to create a new tax document and map that with property and if for the same property 
			const latestTax = await createTaxModel(taxDetails, newDoc)

			// now also generate the new pdf for this newly generated tax
			try {
			await generateReciept(newDoc, latestTax)
		} catch (err) {
			errorLogger(err, "")
		}
		}


		return response;
	} catch (err) {
		errorLogger(err, "after_editNewProperty");
	}
}
// =============================== PROPERTY HOOK END =================================



// ============================== PAYMENT HOOK START ==============================

// ================================== NEW HOOK ====================================
export const before_newPaymentHook = async (request, context) => {
	try {
		console.log("NEW->BEFORE PAYMENT")

		const paymentDoc = request.payload

		return request;
	} catch (err) {
		errorLogger(err, "before_newPaymentHook");
	}
}

export const after_newPaymentHook = async (response, request, context) => {
	try {
		console.log("NEW->AFTER PAYMENT")

		const paymentDoc = response.record.params
		const currentUser = context.currentAdmin;
		const propertyDoc = await Property.findById(paymentDoc?.propertyId);

		// here after saving the document in DB we are constructing the full S# url and saving it in new field......
		// if(paymentDoc.receiptProofUrl){
		// 	const payment = await Payment.findById(paymentDoc?._id)
		// 	const fullUrl = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${paymentDoc?.receiptProofUrl}`;
		// 	payment.receiptProofS3Url = fullUrl
		// 	await payment.save();
		// }

		await attachFullS3Link(paymentDoc, Payment, "receiptProofUrl", "receiptProofS3Url")

		const latestTax = await paymentDone(paymentDoc)

		// =========== Step 3 : Generating the Reciept PDF and Storing that on S3 =============
		try {
			await generateReciept(propertyDoc, latestTax)
		} catch (err) {
			errorLogger(err, "")
		}

		// audit the log of payment modification
		await logAuditAction(null, currentUser?._id, "", latestTax?.taxStatus == "paid" ? "Whole Payment Done" : "Payment Registered", paymentDoc?._id)

		return response;
	} catch (err) {
		errorLogger(err, "before_newPaymentHook");
	}
}

// ============================= PAYMENT HOOK END =================================



// ============================= ARV MODIFICATION HOOK START =======================

// ================ NEW HOOK =================
export const before_newARVModificationHook = async(request , context)=>{
	try{

		return request;
	}catch(err){
		errorLogger(err , "before_newARVModificationHook");
	}
}


export const after_newARVModificationHook = async(response , request , context)=>{
	try{

		const changedARVDoc = response.record.params;
		const currentUser = context.currentAdmin;
		const {propertyId} = changedARVDoc;
		const propertyDoc = await Property.findById(propertyId);

		// ================= Step 1 : Fetching Old Tax Model ======================
		const prevTax = await Tax.findOne({propertyId}).sort({createdAt : -1}).lean();
		console.log("Prev tax is : " , prevTax)

		// ================= Step 2 : Fetching Bakaya ======================
		const preNagarNigamData = await NagarNigamProperty.findOne({propertyId});
		let bakaya = preNagarNigamData?.prevTax || 0;   // if the previous document is not present from nagar nigam , so on that case we assume the bakaya as 0

		// ================= Step 3 : get newARV and calculate newTotalTax = (tax + bakaya) ============
		const newARV = changedARVDoc?.newArv;
		const newTotalTax = calculateTaxes(newARV)?.totalTax + bakaya;
		console.log("Bakaya is : " , bakaya)

		// ================= Step 4 : creating a new tax document =======================
		const tax = await Tax.create({
			propertyId,
			arv : newARV,
			isModifiedARV : true,
			bakaya,
			totalTax : newTotalTax,
			paidAmount : prevTax?.paidAmount,
			taxBreakdown : prevTax?.taxBreakdown,
			effectiveFrom : prevTax?.effectiveFrom,
			dueDate : prevTax?.dueDate,
			history : prevTax?.history,
			prevTaxPointer : prevTax?._id,
			taxWithoutBakaya : prevTax?.taxWithoutBakaya
		})

		const changeHistoryDoc = await changeHistoryAction(prevTax , tax.toObject() , "ARV" , changedARVDoc?._id  , currentUser?._id)

		// =========== Step 5 : Generating the Reciept PDF and Storing that on S3 =============
		try {
			await generateReciept(propertyDoc, tax)
		} catch (err) {
			errorLogger(err, "")
		}

		await logAuditAction(changeHistoryDoc?._id , currentUser?._id , "ARV MODIFICATION" , "ARV" , changedARVDoc?._id)


		return response;

	}catch(err){
		errorLogger(err , "after_newARVModificationHook");
	}
}