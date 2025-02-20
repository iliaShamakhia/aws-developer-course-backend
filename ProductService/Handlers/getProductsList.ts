import { products } from '../dataStore/fakeData';

export const handler = async (_: any) => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://dt6en1jr28atn.cloudfront.net"
    },
    body: JSON.stringify(products),
  };
};