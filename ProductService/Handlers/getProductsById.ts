import { products } from '../dataStore/fakeData';

export const handler = async (event: any) => {
  const productId = event.pathParameters?.productId;
  const product = products.find(p => p.id === productId);

  const headers = {
    "Access-Control-Allow-Origin": '*'
  }

  if (product) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(product),
    };
  } else {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Product not found' }),
    };
  }
};