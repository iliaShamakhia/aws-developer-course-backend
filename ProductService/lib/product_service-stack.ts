import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RestApi, LambdaIntegration, AuthorizationType, Cors } from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoDBAccessRole = iam.Role.fromRoleName(this, "DynamoDBAccessRole", "DynamoDbLambdaAccessRole");

    const logPolicyStatement = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      resources: ['*'],
    });

    const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
      fifo: true,
      visibilityTimeout: cdk.Duration.seconds(100),
      contentBasedDeduplication: true
    });

    new cdk.CfnOutput(this, 'QueueArn', {
      value: catalogItemsQueue.queueArn,
      exportName: 'CatalogItemsQueueArn',
    });

    const nodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(100),
      tracing: lambda.Tracing.ACTIVE,
      role: dynamoDBAccessRole,
      environment: {
        PRODUCTS_TABLE: 'aws_products',
        STOCKS_TABLE: 'aws_stocks'
      }
    };

    const getProductsListLambda = new lambda_nodejs.NodejsFunction(this, 'GetProductsListHandler', {
      entry: './Handlers/getProductsList.ts',
      handler: 'handler',
      ...nodejsFunctionProps
    });

    const getProductsByIdLambda = new lambda_nodejs.NodejsFunction(this, 'GetProductsByIdHandler', {
      entry: './Handlers/getProductsById.ts',
      handler: 'handler',
      ...nodejsFunctionProps
    });

    const createProductLambda = new lambda_nodejs.NodejsFunction(this, 'CreateProductHandler', {
      entry: './Handlers/createProduct.ts',
      handler: 'handler',
      ...nodejsFunctionProps
    });

    const catalogBatchProcessLambda = new lambda_nodejs.NodejsFunction(this, 'CatalogBatchProcessHandler', {
      entry: './Handlers/catalogBatchProcess.ts',
      handler: 'handler',
      ...nodejsFunctionProps
    });

    catalogBatchProcessLambda.role?.attachInlinePolicy(
      new iam.Policy(this, 'LogPolicy', {
        statements: [logPolicyStatement],
      })
    );

    catalogBatchProcessLambda.addEventSource(
      new SqsEventSource(catalogItemsQueue, { batchSize: 5 })
    );

    catalogItemsQueue.grantConsumeMessages(catalogBatchProcessLambda);

    const api = new RestApi(this, 'productsApi', {
      restApiName: 'Products Service',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS
      }
    });

    const getProductsListIntegration = new LambdaIntegration(getProductsListLambda);

    const getProductsByIdIntegration = new LambdaIntegration(getProductsByIdLambda);

    const createProductIntegration = new LambdaIntegration(createProductLambda);

    const products = api.root.addResource('products');
    products.addMethod('GET', getProductsListIntegration, {
      authorizationType: AuthorizationType.NONE,
      methodResponses: [{ statusCode: '200' }, { statusCode: '404' }, { statusCode: '500' }],
    });

    products.addMethod('POST', createProductIntegration, {
      authorizationType: AuthorizationType.NONE,
      methodResponses: [{ statusCode: '201' }, { statusCode: '400' }, { statusCode: '500' }],
    });

    const product = products.addResource('{productId}');
    product.addMethod('GET', getProductsByIdIntegration, {
      authorizationType: AuthorizationType.NONE,
      methodResponses: [{ statusCode: '200' }, { statusCode: '404' }, { statusCode: '500' }],
    });
  }
}
