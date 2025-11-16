import { BaseProvider } from '@adminjs/upload';
import { uploadToS3, deleteS3File } from './S3.js';

export class StreamingS3Provider extends BaseProvider {
  async upload(file, key) {
    await uploadToS3(process.env.AWS_BUCKET, key, file.stream, file.mime);
    return { key, bucket: process.env.AWS_BUCKET };
  }

  async delete(key, bucket = process.env.AWS_BUCKET) {
    await deleteS3File(bucket, key);
  }

  /**
   * ✅ Required method by BaseProvider
   * Used by AdminJS to display or download uploaded files.
   */
  path(key, bucket = process.env.AWS_BUCKET) {
    // Return a public or signed URL for the file
    return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }
}
