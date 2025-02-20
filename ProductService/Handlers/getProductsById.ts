import { products } from '../dataStore/fakeData';

export const handler = async (event: any) => {
  const productId = event.pathParameters?.productId;
  const product = products.find(p => p.id === productId);

  if (product) {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://dt6en1jr28atn.cloudfront.net"
      },
      body: JSON.stringify(product),
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Product not found' }),
    };
  }
};