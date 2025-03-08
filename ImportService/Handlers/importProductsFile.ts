import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const headers = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
}

export const handler = async (event: any) => {
    const fileName = event.queryStringParameters?.name;
    const KEY = `uploaded/${fileName}`;

    if (!fileName || !fileName.toLowerCase().endsWith('.csv')) {
        return {
          statusCode: 400,
          headers,
          body: 'Wrong file format or missing query parameter',
        };
    }

    try {
        const client = new S3Client();
        const command = new PutObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: KEY });
        const preSignedtUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({ PreSignedUrl: preSignedtUrl }),
        };
    } catch (err) {
        console.error('Failed to create Signed URL: ', err);
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ message: 'Failed to create Signed URL' }),
        };
    }
}