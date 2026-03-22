import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Product } from '../../models/interfaces';

const isLocal = process.env.IS_LOCAL === 'true';
const ddbClient = new DynamoDBClient(
  isLocal ? { region: 'eu-west-1', credentials: { accessKeyId: 'x', secretAccessKey: 'x' } } : {}
);
const docClient = DynamoDBDocumentClient.from(ddbClient);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;

function apiResponse(statusCode: number, body: object): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    },
    body: JSON.stringify(body),
  };
}

/**
 * GET /products
 * Restituisce la lista di tutti i prodotti tracciati.
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[getProducts] Inizio richiesta');

  try {
    const userId = event.headers['x-user-id'] || event.headers['X-User-Id'];
    if (!userId) {
      return apiResponse(400, { message: 'L\'header x-user-id è obbligatorio.' });
    }

    const command = new ScanCommand({ 
      TableName: PRODUCTS_TABLE,
      FilterExpression: 'userId = :uid',
      ExpressionAttributeValues: {
        ':uid': userId
      }
    });
    const response = await docClient.send(command);
    const products = (response.Items || []) as Product[];

    // Ordinamento per data di aggiornamento decrescente (opzionale, utile per UI)
    products.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return apiResponse(200, { products });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[getProducts] Errore:', message);
    return apiResponse(500, { message: 'Errore interno nel recupero dei prodotti' });
  }
};
