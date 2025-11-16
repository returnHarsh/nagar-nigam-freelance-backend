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





// // ======================= Stream Uploading ==========================

// import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
// import { Upload } from "@aws-sdk/lib-storage";
// import { errorLogger } from "../utils/errorLogger.js";

// console.log("AWS_REGION in S3 file:", process.env.AWS_REGION);

// export const s3 = () => {
//   return new S3Client({
//     region: process.env.AWS_REGION,
//     credentials: {
//       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     },
//   });
// };

// /**
//  * Upload file to S3 (stream-friendly)
//  * @param {string} bucket - S3 bucket name
//  * @param {string} key - Object key/path
//  * @param {ReadableStream|Buffer} body - File content or stream
//  * @param {string} contentType - MIME type of file
//  */
// export const uploadToS3 = async (bucket, key, body, contentType) => {
//   try {
//     const parallelUpload = new Upload({
//       client: s3(),
//       params: {
//         Bucket: bucket,
//         Key: key,
//         Body: body, // can be a readable stream
//         ContentType: contentType,
//       },
//       queueSize: 4, // number of concurrent parts
//       partSize: 10 * 1024 * 1024, // 10 MB per chunk
//       leavePartsOnError: false,
//     });

//     await parallelUpload.done();

//     console.log(`[UPLOADED] ✅ Streamed to S3: ${key}`);
//     return { bucket, key };
//   } catch (err) {
//     errorLogger(err, "uploadToS3");
//     throw err;
//   }
// };

// /**
//  * Delete a file from S3
//  */
// export const deleteS3File = async (bucketName, key) => {
//   try {
//     const command = new DeleteObjectCommand({
//       Bucket: bucketName,
//       Key: key,
//     });

//     await s3().send(command);
//     console.log(`File deleted (or did not exist): ${key}`);
//   } catch (err) {
//     console.error("Error deleting S3 file:", err);
//   }
// };



// /**
//  * ✅ Exported provider for AdminJS Upload Feature
//  */
// export const streamingUploadProvider = {
//   upload: async (file, key) => {
//     await uploadToS3(process.env.AWS_BUCKET, key, file.stream, file.mime);
//     return { key, bucket: process.env.AWS_BUCKET };
//   },
//   delete: async (key) => {
//     await deleteS3File(process.env.AWS_BUCKET, key);
//   },
// };