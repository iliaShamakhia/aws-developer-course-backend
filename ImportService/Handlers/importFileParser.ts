import CSVFileValidator from 'csv-file-validator';
import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3 } from 'aws-sdk';
import { Readable } from 'stream';
const csv = require('csv-parser');

const headers = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
}

const validatorConfig = {
    headers: [
      { name: 'title', inputName: 'title' },
      { name: 'description', inputName: 'description' },
      { name: 'price', inputName: 'price' },
      { name: 'count', inputName: 'count' }
    ],
    isHeaderNameOptional: true,
    isColumnIndexAlphabetic: false,
};

export const handler = async (event: any) => {
    const S3client = new S3Client();

    try {
        for (const record of event.Records) {

            const bucket = record.s3.bucket.name;
            const key = record.s3.object.key;

            const getObjectCommand = new GetObjectCommand({
                Bucket: bucket,
                Key: key
            });

            const getObjectCommandOutput = await S3client.send(getObjectCommand);

            if (!getObjectCommandOutput) {
                throw new Error("Nothing to parse, no object");
            }

            const objectAsString = await getObjectCommandOutput.Body?.transformToString();

            if (objectAsString) {
                
                const validatioinResult = await CSVFileValidator(
                    objectAsString,
                    validatorConfig
                );

                if (validatioinResult.inValidData.length > 0) {
                    console.error('Invalid file. Provide valid CSV file');
                    return {
                        statusCode: 400,
                        headers: headers,
                        body: JSON.stringify({ message: `File ${key} is not CSV file. Provide a valid CSV file.` }),
                    };
                }

                const s3Stream = stringToStream(objectAsString);

                const results: any = [];

                s3Stream.pipe(csv())
                    .on('data', (data: any) => {
                        results.push(data);
                        console.log('CSV Record:', data);
                    })
                    .on('end', async () => {

                        console.log('CSV parsing finished.', results);
                        const parsedKey = key.replace('uploaded/', 'parsed/');

                        await S3client.send(
                            new CopyObjectCommand({
                              Bucket: bucket,
                              CopySource: `/${bucket}/${key}`,
                              Key: parsedKey,
                            })
                        );

                        await S3client.send(
                            new DeleteObjectCommand({
                              Bucket: bucket,
                              Key: key
                            })
                        );
                    });
            } else {
                throw new Error('Nothing to parse, no such file OR file is empty')
            }
        }

        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({ message: `File parse success`}),
        };
    } catch (error) {
        console.error('error parsing file:', error);
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ message: `Error parsing file` }),
        };
    }
}

function stringToStream(csvString: string): Readable {
    const stream = new Readable();
    stream._read = () => {};
  
    stream.push(csvString);
    stream.push(null);
  
    return stream;
}