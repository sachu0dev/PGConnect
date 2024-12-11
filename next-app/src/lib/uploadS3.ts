import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToS3(file: File, userId: string): Promise<string> {
  const fileExtension = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: `pg-images/${fileName}`,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
  });

  await s3Client.send(command);
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/pg-images/${fileName}`;
}

export async function uploadAadhaarToS3(
  file: File,
  userId: string
): Promise<string> {
  const fileExtension = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: `Aadhaar-images/${fileName}`,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
  });

  await s3Client.send(command);
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/pg-images/${fileName}`;
}
export async function deleteFromS3(imageUrl: string): Promise<void> {
  const bucketName = process.env.AWS_BUCKET_NAME!;
  const region = process.env.AWS_REGION!;

  const objectKey = imageUrl.split(
    `${bucketName}.s3.${region}.amazonaws.com/`
  )[1];
  if (!objectKey) {
    throw new Error("Invalid image URL. Unable to extract object key.");
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  await s3Client.send(command);
}
