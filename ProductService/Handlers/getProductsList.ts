import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();

export const handler = async (_: any) => {

  const headers = {
    "Access-Control-Allow-Origin": '*'
  }

  try {
    const productResponse = await dynamodb.scan({ TableName: process.env.PRODUCTS_TABLE || '' }).promise();
    const products = productResponse.Items;

    if (!products) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'No products available' })
      };
    }

    const quantityResponse = await dynamodb.scan({ TableName: process.env.STOCKS_TABLE || '' }).promise();
    const quantities = quantityResponse.Items;

    const quantityDict: { [key: string]: number } = {};
    quantities?.forEach(item => {
        quantityDict[item.product_id] = item.count;
    });

    const combinedData = products.map(product => {
        const productId = product.id;
        const count = quantityDict[productId] || 0;
        return {
            id: productId,
            title: product.title,
            description: product.description,
            price: product.price,
            count: count
        };
    });

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(combinedData)
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