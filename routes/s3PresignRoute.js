import express from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const router = express.Router();

// Create reusable S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ Generate pre-signed URL for uploads
router.get("/presign", async (req, res) => {
  try {
    const { fileName, fileType } = req.query;

    if (!fileName || !fileType)
      return res.status(400).json({ error: "fileName and fileType required" });

    const key = `property/uploads/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: key,
      ContentType: fileType,
      ACL: "public-read", // So uploaded file is viewable
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 }); // 1 minute expiry

    const fileUrl = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.json({ uploadUrl, fileUrl });
  } catch (err) {
    console.error("[ERROR] generating presigned URL:", err);
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
});

export default router;
