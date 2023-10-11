// Copyright (c) Fensak, LLC.
// SPDX-License-Identifier: MPL-2.0

import { crypto, oak, winston } from "../deps.ts";

const requestId: oak.Middleware = async (ctx: oak.Context, next: oak.Next) => {
  let requestId = ctx.request.headers.get("X-Response-Id");
  if (!requestId) {
    /** if request id not being set, set unique request id */
    requestId = crypto.randomUUID();
    if (requestId == null) {
      throw new Error("Could not generate unique ID");
    }
  }
  ctx.state.requestId = requestId.toString();

  await next();

  /** add request id in response header */
  ctx.response.headers.set("X-Response-Id", requestId.toString());
};

const timing: oak.Middleware = async (ctx: oak.Context, next: oak.Next) => {
  const start = Date.now();

  await next();

  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
};

const unsupportedRoute: oak.Middleware = async (
  ctx: oak.Context,
  next: oak.Next,
) => {
  await next();

  const status = ctx.response.status;

  // NOTE
  // It seems counter intuitive that we have to reset the status in the switch statement, but this is necessary because
  // `ctx.response` uses magic methods for accessing and setting the status. That is, `status` could return `NotFound`
  // even if it is not explicitly set to `NotFound`. So we need to set it explicitly to ensure it gets set to the right
  // value.
  switch (status) {
    case oak.Status.NotFound:
      ctx.response.status = status;
      ctx.response.body = { status, msg: "not found" };
      break;
    case oak.Status.MethodNotAllowed:
      ctx.response.status = status;
      ctx.response.body = { status, msg: "method not allowed" };
      break;
  }
};

export function newErrorMiddleware(
  projectLogger: winston.Logger,
): oak.Middleware {
  return async (ctx: oak.Context, next: oak.Next) => {
    try {
      await next();
    } catch (err) {
      const status = err.status || err.statusCode ||
        oak.Status.InternalServerError;

      projectLogger.error(err.message);

      ctx.response.status = status;
      ctx.response.body = { status, msg: "internal server error" };
    }
  };
}

export function newLoggerMiddleware(
  projectLogger: winston.Logger,
): oak.Middleware {
  return async (ctx: oak.Context, next: oak.Next) => {
    await next();

    const reqID = ctx.response.headers.get("X-Response-Id");
    const respTime = ctx.response.headers.get("X-Response-Time");
    const status = ctx.response.status;
    projectLogger.log({
      level: "info",
      message: "serviced request",
      requestID: reqID,
      url: ctx.request.url,
      method: ctx.request.method,
      responseStatus: status,
      responseTime: respTime,
    });
  };
}

export { requestId, timing, unsupportedRoute };
