// Copyright (c) Fensak, LLC.
// SPDX-License-Identifier: MPL-2.0

import { oak } from "../deps.ts";

/**
 * A constructor for a staticFiles middleware that will route requests to a specific path to a static file.
 * The static file middleware will attempt to serve the file from the static route if the URL route starts with the
 * stateRouteRoot, and if the file exists. For all other cases, it will fallback to the dynamic routes.
 * @param filePathRoot The path to the root directory from where files are served.
 * @param staticRouteRoot The URL route root for serving static files.
 */
export function newStaticMiddleware(
  filePathRoot: string,
  staticRouteRoot: string,
): oak.Middleware {
  return async (ctx: oak.Context, next: oak.Next) => {
    if (!ctx.request.url.pathname.startsWith(staticRouteRoot)) {
      await next();
      return;
    }

    const newPath = ctx.request.url.pathname.slice(staticRouteRoot.length);
    if (!newPath.startsWith("/") && newPath != "") {
      await next();
      return;
    }

    try {
      await oak.send(ctx, newPath, { root: filePathRoot });
    } catch (_) {
      await next();
    }
  };
}
