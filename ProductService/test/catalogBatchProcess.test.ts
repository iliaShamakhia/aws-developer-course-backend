import { handler } from '../Handlers/catalogBatchProcess';
import { DynamoDB } from 'aws-sdk';
import { SNS } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

jest.mock('aws-sdk', () => {
    const mockDocumentClient = {
        transactWrite: jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({ }),
        }),
    };
    const mockSNS = {
        publish: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
        }),
    };
    return {
      DynamoDB: {
        DocumentClient: jest.fn(() => mockDocumentClient),
      },
      SNS: jest.fn(() => mockSNS),
    };
});

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mocked-uuid'),
}));

const dynamoDb = new DynamoDB.DocumentClient();
const sns = new SNS();

describe('Lambda Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should process records and save to DynamoDB', async () => {
        const event = {
            Records: [
                { body: JSON.stringify({ title: 'Product1', description: 'Description1', price: '100', count: '10' }) },
                { body: JSON.stringify({ title: 'Product2', description: 'Description2', price: '200', count: '20' }) }
            ]
        };

        await handler(event);

        expect(dynamoDb.transactWrite).toHaveBeenCalledWith({
            TransactItems:[
                {
                    Put: {
                        TableName: process.env.PRODUCTS_TABLE,
                        Item: {
                            id: 'mocked-uuid',
                            title: 'Product1',
                            description: 'Description1',
                            price: 100
                        }
                    }
                },
                {
                    Put: {
                        TableName: process.env.STOCKS_TABLE,
                        Item: {
                            product_id: 'mocked-uuid',
                            count: 10
                        }
                    }
                },
                {
                    Put: {
                        TableName: process.env.PRODUCTS_TABLE,
                        Item: {
                            id: 'mocked-uuid',
                            title: 'Product2',
                            description: 'Description2',
                            price: 200
                        }
                    }
                },
                {
                    Put: {
                        TableName: process.env.STOCKS_TABLE,
                        Item: {
                            product_id: 'mocked-uuid',
                            count: 20
                        }
                    }
                }
            ]
        });

        expect(sns.publish).toHaveBeenCalledWith(expect.objectContaining({
            TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
            Message: 'Batch processing of products completed successfully.',
            Subject: 'Batch Process Complete',
            MessageAttributes: {}
        }));
    });

    it('should update SNS message if Iphone is found', async () => {
        const event = {
            Records: [
                { body: JSON.stringify({ title: 'Iphone', description: 'Description1', price: '1000', count: '5' }) }
            ]
        };

        await handler(event);

        expect(sns.publish).toHaveBeenCalledWith(expect.objectContaining({
            TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
            Message: 'Iphone found in list of products',
            Subject: 'Batch Process Complete',
            MessageAttributes: {
                productTitle: {
                    DataType: 'String',
                    StringValue: 'Iphone'
                }
            }
        }));
    });

    it('should log error if DynamoDB transaction fails', async () => {
        dynamoDb.transactWrite = jest.fn().mockReturnValue({
            promise: jest.fn().mockRejectedValue(new Error('Mocked failure')),
        });
        
        const event = {
            Records: [
                { body: JSON.stringify({ title: 'Product1', description: 'Description1', price: '100', count: '10' }) }
            ]
        };

        console.log = jest.fn();

        await handler(event);

        expect(console.log).toHaveBeenCalledWith('Error saving product data', expect.any(Error));
    });
});