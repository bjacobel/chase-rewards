import { TABLE_NAME } from "../constants";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const dynamo = new DynamoDB();

/**
 * Return all the ids from the given set that are NOT in the database
 */
export const getExclusionWithKnownIds = async (
  ids: Set<string>,
): Promise<Set<string>> => {
  const result = await dynamo.batchGetItem({
    RequestItems: {
      [TABLE_NAME]: {
        Keys: [...ids].map((id) => ({ id: { S: id } })),
      },
    },
  });
  if (!result.Responses) {
    throw new Error("No responses in batch get call");
  }

  const presentIds = new Set(
    result.Responses[TABLE_NAME].map((attributeValue) => attributeValue.id.S!),
  );
  return new Set([...ids].filter((id) => !presentIds.has(id)));
};

export const insertIds = async (ids: Set<string>) => {
  return dynamo.batchWriteItem({
    RequestItems: {
      [TABLE_NAME]: [...ids].map((id) => ({
        PutRequest: { Item: { id: { S: id } } },
      })),
    },
  });
};
