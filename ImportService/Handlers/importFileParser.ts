import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
const csv = require('csv-parser');

const s3Client = new S3Client();

export const handler = async (event: any) => {
    
    try {
        const record = event.Records[0].s3;
        const bucketName = record.bucket.name;
        const objectKey = record.object.key;
    
        if (!objectKey.startsWith("uploaded/")) {
          console.log("File is not in the uploaded folder.");
          return;
        }
    
        const getObjectCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        });
    
        const response = await s3Client.send(getObjectCommand);
        const stream = response.Body as Readable;
    
        await new Promise((resolve, reject) => {
          stream
            .pipe(csv())
            .on("data", (data: any) => {
              console.log("Parsed record:", data);
            })
            .on("end", async () => {
              console.log("CSV file processing completed.");
    
              const newObjectKey = objectKey.replace("uploaded/", "parsed/");
              const copyObjectCommand = new CopyObjectCommand({
                Bucket: bucketName,
                CopySource: `${bucketName}/${objectKey}`,
                Key: newObjectKey,
              });
    
              await s3Client.send(copyObjectCommand);
              console.log(`File copied to: ${newObjectKey}`);
    
              const deleteObjectCommand = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: objectKey,
              });
    
              await s3Client.send(deleteObjectCommand);
              console.log(`File deleted from: ${objectKey}`);
    
              resolve(undefined);
            })
            .on("error", (error: any) => {
              console.error("Error parsing CSV:", error);
              reject(error);
            });
        });
    } catch (error) {
        console.error("Error processing S3 event:", error);
    }
}