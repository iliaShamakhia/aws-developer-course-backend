const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

AWS.config.update({
  region: 'eu-north-1',
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const productsTable = process.env.PRODUCTS_TABLE;
const stocksTable = process.env.STOCKS_TABLE;

const products = [
  { title: 'Product 1', description: 'Description 1', price: 100 },
  { title: 'Product 2', description: 'Description 2', price: 200 },
  { title: 'Product 3', description: 'Description 3', price: 300 },
  { title: 'Product 4', description: 'Description 4', price: 400 },
  { title: 'Product 5', description: 'Description 5', price: 500 },
];

const stocks = [
  { count: 2 },
  { count: 4 },
  { count: 6 },
  { count: 8 },
  { count: 10 },
];

async function fillTables() {
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const productId = uuidv4();

    await dynamodb.put({
      TableName: productsTable,
      Item: {
        id: productId,
        title: product.title,
        description: product.description,
        price: product.price
      }
    }).promise();

    await dynamodb.put({
      TableName: stocksTable,
      Item: {
        product_id: productId,
        count: stocks[i].count
      }
    }).promise();
  }

  console.log('Tables filled with test data');
}

fillTables().catch(error => console.error('Error filling tables:', error));