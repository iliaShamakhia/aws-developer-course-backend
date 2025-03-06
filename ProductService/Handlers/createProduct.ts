import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamodb = new DynamoDB.DocumentClient();

export const handler = async (event: any) => {
    const headers = {
      "Access-Control-Allow-Origin": '*'
    }

    if(!event.body){
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid input' }),
      };
    }
    const { title, description, price, count } = JSON.parse(event.body);

    console.log("Request object: ", event);

    if (!title || !description || !price || !count || isNaN(count) || count < 0 || isNaN(price) || price < 0) {
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