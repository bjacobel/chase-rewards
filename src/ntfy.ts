import { NTFY_SERVER, NTFY_TOPIC, NTFY_USER } from "./constants";
import { getSecret, SECRETS } from "./utils/secrets";

export const sendNotification = async (body: string) => {
  const basicAuth = await getSecret(SECRETS.NTFY_BASIC_AUTH);
  return fetch(`https://${NTFY_SERVER}/${NTFY_TOPIC}`, {
    method: "PUT", // PUT works too
    body,
    headers: {
      Title: "New Chase points offer",
      Tags: "loudspeaker",
      Authorization: `Basic ${btoa(`${NTFY_USER}:${basicAuth}`)}`,
    },
  });
};
