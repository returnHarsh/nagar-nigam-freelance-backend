import { ValidationError } from "adminjs";
import { errorLogger } from "../../utils/errorLogger.js"
import { generateTaxBillPDF } from "../actions/generateReciept.js";
import { Property } from "../../models/property.js";
import { deleteS3File, uploadToS3 } from "../../config/S3.js";

export const generateReciept = async(propertyDoc , latestTax)=>{

	let s3Key

	try{
		// const latestTax = await Tax.findOne({propertyId : propertyDoc?._id}).sort({createdAt : -1}).lean();
		if(!latestTax) throw new ValidationError({} , {message : "Tax is not present for this document"})

		// generate PDF
		const pdfBuffer = await generateTaxBillPDF(propertyDoc, latestTax);

		// upload to S3
		const pdfFilename = `tax-bill-${propertyDoc.PTIN}-${Date.now()}.pdf`;
		s3Key = `bills/${pdfFilename}`;

		await uploadToS3(process.env.AWS_BUCKET , s3Key , pdfBuffer , 'application/pdf')
		const pdfUrl = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

		await Property.findByIdAndUpdate(propertyDoc?._id, {
			latestBillUrl: pdfUrl,
			lastBillGeneratedAt: new Date()
		});

		console.log("pdf generated with url : " , pdfUrl)

		return {key : s3Key , bucketName : process.env.AWS_BUCKET}

	}catch(err){
		// ============ Deleting the S3 file , if stored on S3 ===============
		deleteS3File(process.env.AWS_BUCKET , s3Key)
		errorLogger(err , "generateReciept")
	}
}