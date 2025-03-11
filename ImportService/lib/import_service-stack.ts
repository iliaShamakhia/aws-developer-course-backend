import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { AuthorizationType, Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'ImportBucket', {
      bucketName: 'ilia-shamakhia-import-service-bucket',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const nodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        BUCKET_NAME: bucket.bucketName,
      }
    };

    const importProductsFile = new lambda_nodejs.NodejsFunction(this, 'ImportProductsFileFunction', {
      entry: './Handlers/importProductsFile.ts',
      handler: 'handler',
      ...nodejsFunctionProps
    });

    const importFileParser = new lambda_nodejs.NodejsFunction(this, 'ImportFileParserFunction', {
      entry: './Handlers/importFileParser.ts',
      handler: 'handler',
      ...nodejsFunctionProps
    });

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParser),
      { prefix: 'uploaded', suffix: '.csv' }
    );

    bucket.grantReadWrite(importProductsFile);
    bucket.grantReadWrite(importFileParser);

    const api = new RestApi(this, 'importsApi', {
      restApiName: 'Imports Service',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS
      }
    });

    const importIntegration = new LambdaIntegration(importProductsFile);
    api.root.addResource('import').addMethod('GET', importIntegration, {
      authorizationType: AuthorizationType.NONE,
      methodResponses: [{ statusCode: '200' }, { statusCode: '400' }, { statusCode: '500' }],
    });
  }
}
