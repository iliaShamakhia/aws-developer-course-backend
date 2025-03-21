import { DynamoDB } from "aws-sdk";
import { v4 as uuidv4 } from 'uuid';
import { SNS } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();
const sns = new SNS();

const snsParams = {
    TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN!,
    Message: 'Batch processing of products completed successfully.',
    Subject: 'Batch Process Complete',
    MessageAttributes: {}
};

export const handler = async (event: any) => {
    
    const records = event.Records.map((record: any) => JSON.parse(record.body));

    const productIsIphone = records.some((record: any) => record.title == 'Iphone');

    if(productIsIphone){
        snsParams.Message = 'Iphone found in list of products';
        snsParams.MessageAttributes = {
            productTitle: {
                DataType: 'String',
                StringValue: 'Iphone',
            },
        }
    }

    const transactParams = {
        TransactItems: records.flatMap((record: any) => {

            let productId = uuidv4();

            return [
                {
                    Put: {
                        TableName: process.env.PRODUCTS_TABLE!,
                        Item: {
                        id: record.id ?? productId,
                        title: record.title,
                        description: record.description,
                        price: +(record.price),
                        },
                    },
                },
                {
                    Put: {
                        TableName: process.env.STOCKS_TABLE!,
                        Item: {
                        product_id: record.id ?? productId,
                        count: +(record.count),
                        },
                    },
                }
            ];
        })
    };

    try {
        await dynamoDb.transactWrite(transactParams).promise();
        await sns.publish(snsParams).promise();
    } catch (error) {
        console.log("Error saving product data", error);
    }
}