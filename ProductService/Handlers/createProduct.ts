import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamodb = new DynamoDB.DocumentClient();

export const handler = async (event: any) => {
    const { title, description, price, count } = JSON.parse(event.body);

    console.log("Request body: ", { title, description, price, count });

    const headers = {
        "Access-Control-Allow-Origin": '*'
    }

    if (!title || !description || !price || !count) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Invalid input' }),
        };
    }

    const productId = uuidv4();

    const transactParams = {
        TransactItems: [
          {
            Put: {
              TableName: process.env.PRODUCTS_TABLE!,
              Item: {
                id: productId,
                title,
                description,
                price,
              },
            },
          },
          {
            Put: {
              TableName: process.env.STOCKS_TABLE!,
              Item: {
                product_id: productId,
                count,
              },
            },
          },
        ],
    };

    try {
        await dynamodb.transactWrite(transactParams).promise();
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({ message: 'Success', productId }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Internal Server Error', error }),
        };
    }

}