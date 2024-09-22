import dedent from "dedent";
import { stripHtml } from "string-strip-html";

import { getExclusionWithKnownIds } from "./utils/dynamo";

const PartnerTypeName = {
  airlineTravelPartners: "airline",
  hotelTravelPartners: "hotel",
} as const;

type OfferTimeBounds = {
  offerStartDate: string;
  offerStartTime: string;
  offerEndDate: string;
  offerEndTime: string;
};

type Partner = {
  category: "hotels" | "airlines";
  partnerName: string; // this is html
  limitedTimeOfferEnabled: boolean;
  limitedTimeOffer: OfferTimeBounds & {
    offerDetail: string;
    bonusType: string;
    isOfferAvailable: "true" | "false";
    percentOff: string;
    discountType: "%";
  };
  productValidation: {
    itemInternalId: string;
  };
};

type Offer = {
  type: (typeof PartnerTypeName)[keyof typeof PartnerTypeName];
  partnerName: Partner["partnerName"];
  offerDetail: Partner["limitedTimeOffer"]["offerDetail"];
  bonusType: Partner["limitedTimeOffer"]["bonusType"];
  percentOff: Partner["limitedTimeOffer"]["percentOff"];
  discountType: Partner["limitedTimeOffer"]["discountType"];
  end: number;
  id: string;
};

type Partners = {
  travelPartner: Partner[];
};

type Catalog = {
  urPointsTransferCatalog: {
    hotelTravelPartners: Partners;
    airlineTravelPartners: Partners;
  };
};

type CatalogResponse = {
  success: boolean;
  result: Catalog;
};

const isOfferLive = (datetimes: OfferTimeBounds) => {
  const [start, end] = parseTimebounds(datetimes);
  return start <= Date.now() && Date.now() < end;
};

const parseTimebounds = (datetimes: OfferTimeBounds): [number, number] => {
  const { offerStartDate, offerStartTime, offerEndDate, offerEndTime } =
    datetimes;
  const start = `${offerStartDate} ${offerStartTime} UTC`;
  const end = `${offerEndDate} ${offerEndTime} UTC`;
  return [Date.parse(start), Date.parse(end)];
};

const getLiveOffers = async () => {
  const catalogRequest = await fetch(
    "https://static.chasecdn.com/content/site-services/ultimate-rewards/points-transfer/catalogs/en/points-transfer-catalog.json/",
  );
  const catalogResponse = (await catalogRequest.json()) as CatalogResponse;

  if (!catalogResponse.success)
    return Promise.reject(new Error("Request failure"));

  const { airlineTravelPartners, hotelTravelPartners } =
    catalogResponse.result.urPointsTransferCatalog;

  const partners = Object.entries({
    airlineTravelPartners,
    hotelTravelPartners,
  }).flatMap(([partnerTypeLongName, partnersList]) =>
    partnersList.travelPartner.map((partner) => ({
      ...partner,
      typeName:
        PartnerTypeName[partnerTypeLongName as keyof typeof PartnerTypeName],
    })),
  );

  return partners
    .filter((partner) => {
      if (
        !(
          partner.limitedTimeOfferEnabled &&
          partner.limitedTimeOffer.isOfferAvailable === "true"
        )
      ) {
        return false;
      }

      return isOfferLive(partner.limitedTimeOffer);
    })
    .map<Offer>((partner) => ({
      type: partner.typeName,
      partnerName: partner.partnerName,
      offerDetail: partner.limitedTimeOffer.offerDetail,
      bonusType: partner.limitedTimeOffer.bonusType,
      percentOff: partner.limitedTimeOffer.percentOff,
      discountType: partner.limitedTimeOffer.discountType,
      end: parseTimebounds(partner.limitedTimeOffer)[1],
      id: `${partner.productValidation.itemInternalId}-${
        parseTimebounds(partner.limitedTimeOffer)[1]
      }`,
    }));
};

export const getNewOffers = async () => {
  const allOffers = await getLiveOffers();
  const exclusiveIds = await getExclusionWithKnownIds(
    new Set(allOffers.map((offer) => offer.id)),
  );
  return allOffers.filter((offer) => exclusiveIds.has(offer.id));
};

export const formatOffer = (offer: Offer): string => dedent`
  ${
    stripHtml(offer.partnerName).result
  } has a new Chase points transfer offer: ${offer.percentOff}${
    offer.discountType
  } bonus ${offer.type} points until ${new Date(offer.end).toLocaleDateString()}

  Full offer text:

  > ${stripHtml(offer.offerDetail).result}
`;
