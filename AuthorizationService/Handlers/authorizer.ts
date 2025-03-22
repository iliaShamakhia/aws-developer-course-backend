import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent, BaseStatement, Statement } from 'aws-lambda';

export const handler = async (event: any) => {

    const token = event.headers.Authorization || "";

    const tokenValue = token && token.split(' ')[1];

    const decodedString = Buffer.from(tokenValue, 'base64').toString('utf-8');

    const isPresentAndValid = token && (decodedString === process.env.AUTH_TOKEN);
    
    return {
        principalId: 'user',
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                Action: 'execute-api:Invoke',
                Effect: isPresentAndValid ? 'Allow' : 'Deny',
                Resource: event.methodArn,
                },
            ],
        },
    };
}