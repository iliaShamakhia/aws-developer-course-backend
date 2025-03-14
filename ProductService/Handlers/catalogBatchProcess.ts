import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = async (event: any) => {
    
    const records = event.Records.map((record: any) => JSON.parse(record.body));

    const transactParams = {
        TransactItems: records.flatMap((record: any) => {
            return [
                {
                    Put: {
                        TableName: process.env.PRODUCTS_TABLE!,
                        Item: {
                        id: record.id,
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
                        product_id: record.id,
                        count: +(record.count),
                        },
                    },
                }
            ];
        })
    };

    try {
        await dynamoDb.transactWrite(transactParams).promise();
    } catch (error) {
        console.log("Error saving product data", error);
    }
}