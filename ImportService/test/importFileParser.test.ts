import { handler } from '../Handlers/importFileParser';
import { S3Event } from 'aws-lambda';
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  GetObjectCommand: jest.fn() as unknown as jest.Mock,
  CopyObjectCommand: jest.fn() as unknown as jest.Mock,
  DeleteObjectCommand: jest.fn() as unknown as jest.Mock,
}));

const mockS3Event: S3Event = {
  Records: [
    {
      eventVersion: '2.1',
      eventSource: 'aws:s3',
      awsRegion: 'us-east-1',
      eventTime: new Date().toISOString(),
      eventName: 'ObjectCreated:Put',
      userIdentity: {
        principalId: 'EXAMPLE',
      },
      requestParameters: {
        sourceIPAddress: '127.0.0.1',
      },
      responseElements: {
        'x-amz-request-id': 'EXAMPLE123456789',
        'x-amz-id-2':
          'EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH',
      },
      s3: {
        s3SchemaVersion: '1.0',
        configurationId: 'testConfigRule',
        bucket: {
          name: 'mock-bucket',
          ownerIdentity: {
            principalId: 'mock-principalId',
          },
          arn: 'mock-arn',
        },
        object: {
          key: 'mock-key',
          size: 1,
          eTag: 'mock-eTag',
          sequencer: 'mock-sequence',
        },
      },
    },
  ],
};

describe('handler', () => {
  it('should process S3 event and move object', async () => {
    const mockSend = jest.fn();
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));
    (GetObjectCommand as unknown as jest.Mock).mockImplementation(
      () => ({} as any)
    );
    (CopyObjectCommand as unknown as jest.Mock).mockImplementation(
      () => ({} as any)
    );
    (DeleteObjectCommand as unknown as jest.Mock).mockImplementation(
      () => ({} as any)
    );

    await handler(mockS3Event);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: 'mock-bucket',
      Key: 'mock-key',
    });
    expect(CopyObjectCommand).toHaveBeenCalledWith({
      Bucket: 'mock-bucket',
      CopySource: '/mock-bucket/mock-key',
      Key: 'parsed/mock-key',
    });
    expect(DeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: 'mock-bucket',
      Key: 'mock-key',
    });
  });

  it('should handle case when there is nothing to parse', async () => {
    const mockSend = jest.fn();
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));
    (GetObjectCommand as unknown as jest.Mock).mockImplementation(
      () => ({} as any)
    );

    (GetObjectCommand as unknown as jest.Mock).mockImplementation(() => ({
      Body: null,
    }));

    await handler(mockS3Event);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(DeleteObjectCommand).not.toHaveBeenCalled();
  });
});