import express from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { rateLimitMiddleware, requestSizeLimit } from "./request-guards.js";
import { logger } from "../utils/logger.js";


/**
 * Tiny cookie parser (avoid extra deps)
 * @param {string} header - Cookie header
 * @returns {Object} Parsed cookies
 */
function parseCookie(header) {
  const out = {};
  if (!header) return out;
  header.split(/;\s*/).forEach((kv) => {
    const idx = kv.indexOf("=");
    if (idx > 0) out[kv.slice(0, idx)] = decodeURIComponent(kv.slice(idx + 1));
  });
  return out;
}

/**
 * Start an MCP server with HTTP transport
 * @param {Function} createServer - Function that creates and returns an MCP server instance
 * @param {Object} options - Server options
 * @param {number} options.port - HTTP port to listen on
 * @param {boolean} options.debug - Whether to enable debug logging
 * @param {string[]} options.allowedHosts - Optional list of allowed Host header values
 * @param {boolean} options.rooShim - Enable Roo shim for GET /mcp without session ID
 * @param {boolean} options.lax - Relax Accept header checks
 * @param {boolean} options.cookieSession - Use cookies for session fallback
 * @param {boolean} options.singleSession - Route to single session if ID is missing
 * @returns {Promise<void>}
 */
export async function startHttpServer(createServer, options) {
  const {
    port = 6868,
    debug = false,
    allowedHosts = null,
    rooShim = false,
    lax = false,
    cookieSession = false,
    singleSession = false
  } = options || {};


  const app = express();

  // Basic request logger
  app.use((req, res, next) => {
    const { method, url, headers, socket } = req;
    const client = `${socket.remoteAddress}:${socket.remotePort}`;
    logger.info(`${method} ${url} <- ${client}`);
    logger.info("  host:", headers.host, "| ua:", headers["user-agent"]);
    logger.info("  accept:", headers.accept);
    logger.info("  mcp-session-id:", headers["mcp-session-id"]);
    next();
  });

  // Optional Host allowlist (DNS rebinding protection)
  if (allowedHosts && allowedHosts.length > 0) {
    app.use((req, res, next) => {
      const host = (req.headers.host || "").toLowerCase();
      
      // Allow all hosts if '*' is in the allowedHosts list
      if (allowedHosts.includes('*')) {
        return next();
      }
      
      // Check if host is in the allowed hosts list
      if (allowedHosts.includes(host)) {
        return next();
      }
      
      logger.warn("Blocked by allowed-hosts:", host, "Allowed hosts:", allowedHosts);
      return res.status(403).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: `Forbidden host: ${host}` },
        id: null,
      });
    });
  }

  // Apply request guard middlewares
  app.use(express.json());
  app.use(rateLimitMiddleware(60_000, 100)); // Rate limiting: 100 requests per minute
  app.use(requestSizeLimit(5 * 1024 * 1024)); // Request size limit: 5MB

  // Session map
  const transports = {};

  function ensureStored(transport) {
    if (transport.sessionId && !transports[transport.sessionId]) {
      transports[transport.sessionId] = transport;
      logger.info("session became routable:", transport.sessionId);
    }
  }

  function resolveSessionId(req) {
    const h = req.headers["mcp-session-id"];
    if (h) return String(h);
    if (cookieSession) {
      const cookies = parseCookie(req.headers["cookie"]);
      if (cookies.mcp_session_id) return cookies.mcp_session_id;
    }
    if (singleSession) {
      const ids = Object.keys(transports);
      if (ids.length === 1) {
        logger.warn("single-session fallback in effect:", ids[0]);
        return ids[0];
      }
    }
    return undefined;
  }

  function setSessionCookie(res, sid) {
    if (!cookieSession || !sid) return;
    // Keep it simple; Path=/mcp so only our endpoint sees it
    res.setHeader(
      "Set-Cookie",
      `mcp_session_id=${encodeURIComponent(
        sid
      )}; Path=/mcp; HttpOnly; SameSite=Lax`
    );
  }

  // POST /mcp : initialize + requests
  app.post("/mcp", async (req, res) => {
    try {
      const accept = req.headers["accept"] || "";
      const acceptOk =
        /application\/json/i.test(accept) &&
        /text\/event-stream/i.test(accept);
      if (!lax && !acceptOk) {
        logger.warn("POST /mcp missing Accept requirements:", accept);
        return res.status(406).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message:
              "Not Acceptable: Client must accept both application/json and text/event-stream",
          },
          id: null,
        });
      }

      const sidHeader = resolveSessionId(req);
      let transport;

      if (sidHeader && transports[sidHeader]) {
        transport = transports[sidHeader];
        logger.info("POST /mcp routed to existing session:", sidHeader);
      } else if (!sidHeader && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
        });

        transport.onsessioninitialized = (sid) => {
          transports[sid] = transport;
          logger.info("session initialized + routable:", sid);
        };

        transport.onclose = () => {
          if (transport.sessionId && transports[transport.sessionId]) {
            delete transports[transport.sessionId];
            logger.info("session closed:", transport.sessionId);
          }
        };

        const server = createServer();
        await server.connect(transport);
        logger.info("server connected to transport (new session will be created)");
      } else {
        logger.warn(
          "POST /mcp no valid session (missing or unknown), and body was not initialize"
        );
        logger.warn("Request body:", JSON.stringify(req.body));
        return res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided",
          },
          id: null,
        });
      }

      // Let transport write headers/body; we can add cookie after it sets session
      await transport.handleRequest(req, res, req.body);
      ensureStored(transport);
      setSessionCookie(res, transport.sessionId);
    } catch (err) {
      logger.warn("POST /mcp exception:", err?.stack || String(err));
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Internal Server Error" },
        id: null,
      });
    }
  });

  // GET /mcp : SSE notifications (with optional Roo shim & fallbacks)
  app.get("/mcp", async (req, res) => {
    try {
      const accept = req.headers["accept"] || "";
      if (!lax && !/text\/event-stream/i.test(accept)) {
        logger.warn("GET /mcp missing Accept: text/event-stream:", accept);
        return res
          .status(406)
          .send("Not Acceptable: Accept must include text/event-stream");
      }

      let sid = resolveSessionId(req);
      let transport = sid && transports[sid];

      if (!transport && rooShim) {
        logger.warn(
          "Roo shim: creating temp session for GET /mcp without session id"
        );
        transport = new BaseStreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
        });
        const server = createServer();
        await server.connect(transport);
        sid = transport.sessionId;
        if (sid) {
          transports[sid] = transport;
          setSessionCookie(res, sid);
          logger.info("Roo shim created session:", sid);
        }
      }

      if (!transport) {
        logger.warn("GET /mcp invalid/missing session id (no shim):", sid);
        return res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: Invalid or missing session ID",
          },
          id: null,
        });
      }

      logger.info("GET /mcp SSE for session:", sid);
      await transport.handleRequest(req, res);
    } catch (err) {
      logger.warn("GET /mcp exception:", err?.stack || String(err));
      res.status(500).send("Internal Server Error");
    }
  });

  // DELETE /mcp : end session
  app.delete("/mcp", async (req, res) => {
    try {
      const sid = resolveSessionId(req);
      const transport = sid && transports[sid];
      if (!transport) {
        logger.warn("DELETE /mcp invalid/missing session id:", sid);
        return res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: Invalid or missing session ID",
          },
          id: null,
        });
      }
      logger.info("DELETE /mcp for session:", sid);
      await transport.handleRequest(req, res);
    } catch (err) {
      logger.warn("DELETE /mcp exception:", err?.stack || String(err));
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Internal Server Error" },
        id: null,
      });
    }
  });

  return new Promise((resolve) => {
    app.listen(port, () => {
      logger.info(`Streamable HTTP server listening on :${port}`);
      if (allowedHosts && allowedHosts.length)
        logger.info(`Allowed hosts: ${allowedHosts.join(", ")}`);
      if (rooShim)
        logger.warn("Roo shim ENABLED — allowing GET /mcp without session id");
      if (cookieSession)
        logger.info(
          "Cookie sessions ENABLED — using 'mcp_session_id' cookie as fallback"
        );
      if (singleSession)
        logger.warn(
          "Single-session routing ENABLED — will route missing IDs if exactly one session exists"
        );
      if (lax) logger.warn("LAX mode ENABLED — Accept header checks relaxed");
      if (debug) logger.info("Debug logging is ENABLED");
      
      resolve();
    });
  });
}
