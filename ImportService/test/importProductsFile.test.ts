import { handler } from "../Handlers/importProductsFile";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Mock = mockClient(S3Client);

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(() => 'https://testSignedUrl'),
}));


describe("importProductsFile", () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it("should return a signed URL for a valid file name", async () => {
    s3Mock.on(PutObjectCommand).resolves({});

    const event = {
      queryStringParameters: { name: "test.csv" },
    } as unknown as APIGatewayProxyEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("https://");
  });

  it("should return 400 if no file name is provided", async () => {
    const event = {
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(response.body).toContain("Wrong file format or missing query parameter");
  });
});