import slowDown from "express-slow-down";

import { logger } from "../utils/logger.js";

export function rateLimitMiddleware(windowMs = 60_000, maxRequests = 100) {
  const speedLimiter = slowDown({
    windowMs,
    delayAfter: Math.max(1, maxRequests),
    delayMs: (hits) => {
      const factor = Math.max(0, hits - maxRequests);
      return Math.min(factor * 100, 2000);
    }
  });

  return (req, res, next) => {
    speedLimiter(req, res, () => {
      const currentHits = req.slowDown?.current ?? 0;
      if (currentHits > maxRequests) {
        logger.warn("Rate limit exceeded", { ip: req.ip, currentHits });
        res.status(429).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Too many requests",
            data: {
              retryAfterSeconds: Math.ceil(windowMs / 1000),
            },
          },
          id: null,
        });
        return;
      }
      next();
    });
  };
}

export function requestSizeLimit(maxBytes = 10 * 1024 * 1024) {
  return (req, res, next) => {
    const headerValue = req.header("content-length");
    if (!headerValue) {
      next();
      return;
    }

    const contentLength = Number.parseInt(headerValue, 10);
    if (Number.isNaN(contentLength) || contentLength <= maxBytes) {
      next();
      return;
    }

    logger.warn("MCP request rejected: payload exceeds limit", { contentLength, maxBytes });

    res.setHeader("mcp-error", "payload_too_large");
    res.status(413).json({
      jsonrpc: "2.0",
      error: {
        code: -32600,
        message: "Request payload exceeds allowed size",
        data: {
          reason: "payload_too_large",
          maxBytes,
          receivedBytes: contentLength,
        },
      },
      id: null,
    });

    return;
  };
}