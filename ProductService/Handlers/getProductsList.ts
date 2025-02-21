import { products } from '../dataStore/fakeData';

export const handler = async (_: any) => {

  const headers = {
    "Access-Control-Allow-Origin": '*'
  }

  if (products.length > 0) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(products),
    };
  } else {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'No products available' }),
    };
  }
};