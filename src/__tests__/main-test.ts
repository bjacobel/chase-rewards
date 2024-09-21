import type { Callback, Context, EventBridgeEvent } from "aws-lambda";

import main from "../main";
import log from "../utils/log";

jest.mock("../utils/log");
jest.mock("../constants", () => ({
  ...jest.requireActual("../constants"),
  IS_PROD: false,
}));

const ev = { id: "1" } as EventBridgeEvent<"Scheduled Event", string>;
const ctx = {} as Context;
const cb: Callback = () => {};

describe("main function handler", () => {
  describe("happy path of boilerplate", () => {
    it("resolves with details from event sent", () => {
      expect(main(ev, ctx, cb)).resolves.toEqual("1");
    });
  });

  describe("error handling", () => {
    it("logs the event with INFO level", () => {
      // @ts-expect-error this should intentionally fail
      return main({}, ctx, cb).catch(() =>
        expect(log.info).toHaveBeenCalledWith(""),
      );
    });

    it("logs the error with ERROR level", async () => {
      // @ts-expect-error this should intentionally fail
      return main({}, ctx, cb).catch(() =>
        expect(log.error).toHaveBeenCalledWith(expect.any(TypeError)),
      );
    });

    it("returns a promise rejection", () => {
      // @ts-expect-error this should intentionally fail
      return main({}, ctx, cb).catch((err: Error) =>
        expect(err).toBeInstanceOf(TypeError),
      );
    });
  });
});
