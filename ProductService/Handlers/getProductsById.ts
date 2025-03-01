import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();

export const handler = async (event: any) => {
  const productId = event.pathParameters?.productId;

  console.log("Request for product with id: ", productId);

  const headers = {
    "Access-Control-Allow-Origin": '*'
  }

  try {
    const productResponse = await dynamodb.query({
        TableName: process.env.PRODUCTS_TABLE!,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
            ':id': productId
        }
    }).promise();

    const product = productResponse.Items ? productResponse.Items[0] : undefined;

    if (!product) {
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Product not found' })
        };
    }

    const quantityResponse = await dynamodb.query({
        TableName: process.env.STOCKS_TABLE!,
        KeyConditionExpression: 'product_id = :product_id',
        ExpressionAttributeValues: {
            ':product_id': productId
        }
    }).promise();

    const quantity = quantityResponse.Items ? quantityResponse.Items[0] : undefined;
    const count = quantity ? quantity.count : 0;

    const combinedProduct = {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        count: count
    };

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(combinedProduct)
    };
  } catch (error) {
      console.error(error);
      return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ message: 'Internal Server Error' })
      };
  }
};