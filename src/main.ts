import type { EventBridgeEvent, Handler } from "aws-lambda";

import log from "./utils/log";
import { formatOffer, getNewOffers } from "./chase";
import { sendNotification } from "./ntfy";
import { insertIds } from "./utils/dynamo";

const handler: Handler<EventBridgeEvent<"Scheduled Event", string>> = async (
  event,
) => {
  try {
    const offers = await getNewOffers();
    if (!offers.length) return Promise.resolve();

    await insertIds(new Set(offers.map((o) => o.id)));
    await Promise.all(
      offers.map((offer) => sendNotification(formatOffer(offer))),
    );
  } catch (e) {
    log.info(JSON.stringify(event, null, 2));
    log.error(e);
    return Promise.reject(e);
  }
};

export default handler;
