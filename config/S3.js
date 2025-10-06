import {S3Client , PutObjectCommand, DeleteObjectCommand }  from "@aws-sdk/client-s3"
import { errorLogger } from "../utils/errorLogger.js";



console.log('AWS_REGION in S3 file :', process.env.AWS_REGION);

export const s3 = ()=>{
	return new S3Client({
	region : process.env.AWS_REGION,
	credentials : {
		accessKeyId : process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey : process.env.AWS_SECRET_ACCESS_KEY
	}
})
}

// function to upload the file in S3
export const uploadToS3 = async(bucket , key , body , contentType)=>{
	try{

		// preparing the parameters to upload
		const uploadParams = {
			Bucket : bucket,
			Key : key,
			Body : body,
			ContentType : contentType
		}

		// preparing the upload command
		const command = new PutObjectCommand(uploadParams);

		// executing the command
        const result = await s3().send(command);

		console.log("[UPLOADED] ✅ To S3")
		
	}catch(err){
		errorLogger(err , "uploadToS3");
	}
}


export const deleteS3File = async(bucketName, key) => {
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
