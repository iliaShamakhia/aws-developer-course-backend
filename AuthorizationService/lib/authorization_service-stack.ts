import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dotenv from 'dotenv';

dotenv.config();

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const nodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        AUTH_TOKEN: process.env.AUTH_TOKEN! 
      }
    };

    const basicAuthorizer = new lambda_nodejs.NodejsFunction(this, 'AuthorizerFunction', {
      entry: './Handlers/authorizer.ts',
      handler: 'handler',
      ...nodejsFunctionProps
    });

    new cdk.CfnOutput(this, 'AuthorizerArn', {
      value: basicAuthorizer.functionArn,
      exportName: 'AuthorizerLambdaArn',
    });
  }
}
