import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { PriceHistory } from '../../models/interfaces';

const isLocal = process.env.IS_LOCAL === 'true';
const ddbClient = new DynamoDBClient(
  isLocal ? { region: 'eu-west-1', credentials: { accessKeyId: 'x', secretAccessKey: 'x' } } : {}
);
const docClient = DynamoDBDocumentClient.from(ddbClient);

const PRICE_HISTORY_TABLE = process.env.PRICE_HISTORY_TABLE!;

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
 * GET /products/{productId}/history
 * Restituisce lo storico prezzi (serie temporale) ordinato dal più vecchio al più recente.
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const productId = event.pathParameters?.productId;
  
  if (!productId) {
    return apiResponse(400, { message: 'Manca il parametro obbligatorio productId' });
  }

  console.log(`[getPriceHistory] Recupero storico per: ${productId}`);

  try {
    const command = new QueryCommand({
      TableName: PRICE_HISTORY_TABLE,
      KeyConditionExpression: 'productId = :pid',
      ExpressionAttributeValues: { ':pid': productId },
      ScanIndexForward: true,
    });
    const response = await docClient.send(command);
    const history = (response.Items || []) as PriceHistory[];

    return apiResponse(200, { productId, history });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[getPriceHistory] Errore: ${message}`);
    return apiResponse(500, { message: 'Errore interno nel recupero dello storico' });
  }
};
