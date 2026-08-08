import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { errorLogger } from "../utils/errorLogger.js";
import crypto from "crypto";



console.log('AWS_REGION in S3 file :', process.env.AWS_REGION);

export const s3 = () => {
	return new S3Client({
		region: process.env.AWS_REGION,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
		}
	})
}

// function to upload the file in S3
export const uploadToS3 = async (bucket, key, body, contentType) => {
	try {

		// preparing the parameters to upload
		const uploadParams = {
			Bucket: bucket,
			Key: key,
			Body: body,
			ContentType: contentType
		}

		// preparing the upload command
		const command = new PutObjectCommand(uploadParams);

		// executing the command
		const result = await s3().send(command);

		console.log("[UPLOADED] ✅ To S3")

	} catch (err) {
		errorLogger(err, "uploadToS3");
	}
}


export const deleteS3File = async (bucketName, key) => {
	try {
		const command = new DeleteObjectCommand({
			Bucket: bucketName,
			Key: key,
		});

		await s3().send(command);
		console.log(`File deleted (or did not exist): ${key}`);
	} catch (err) {
		console.error("Error deleting S3 file:", err);
	}
}

export const generateUploadUrl = async (filePrefix) => {
	try {
		const bucketName = process.env.AWS_BUCKET
		const key = crypto.randomUUID();
		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: `${filePrefix}/${key}`,
		});

		// Generate a presigned URL that expires in 1 hour (3600 seconds)
		const uploadUrl = await getSignedUrl(s3(), command, { expiresIn: 3600 });

		return { uploadUrl, key };
	} catch (err) {
		console.log("[ERROR] in generateUploadUrl : ", err.message);
		throw err;
	}
}