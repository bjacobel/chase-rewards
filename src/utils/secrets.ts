import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export const SECRETS = {
  NTFY_BASIC_AUTH: "NTFY_BASIC_AUTH",
} as const;

export const getSecret = async (secretName: keyof typeof SECRETS) => {
  const client = new SecretsManagerClient();
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: `chase-rewards-secrets`,
    }),
  );

  try {
    if (response.ARN && response.SecretString) {
      return JSON.parse(response.SecretString)[secretName];
    } else {
      throw new Error(`Secret ${secretName} not found in SecretsManager`);
    }
  } catch (e) {
    throw e;
  }
};
