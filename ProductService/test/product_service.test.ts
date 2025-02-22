import { handler as getProductsListHandler } from '../Handlers/getProductsList';
import { handler as getProductsByIdHandler } from '../Handlers/getProductsById';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

describe('getProductsListsHandler', () => {
    it('should return a list of products', async () => {
      const event: APIGatewayProxyEvent = {} as any;
  
      const response = await getProductsListHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });
});

describe('getProductByIdHandler', () => {
    it('should return a product by ID', async () => {
      const testProductId = '1';
      const event: APIGatewayProxyEvent = {
        pathParameters: { productId: testProductId },
      } as any;
  
      const response = await getProductsByIdHandler(event);
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toBeInstanceOf(Object);
      expect(body.title).toBe('Product 1');
    });

    it('should return 404 status for non-existing product', async () => {
        const testProductId = '10';
        const event: APIGatewayProxyEvent = {
          pathParameters: { id: testProductId },
        } as any;
    
        const response = await getProductsByIdHandler(event);
    
        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body).toBeInstanceOf(Object);
        expect(body.message).toBe('Product not found');
    });
});
