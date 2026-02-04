#!/usr/bin/env node
// MCP server with stdio or HTTP transport.
// Dev-friendly HTTP shims to cope with clients that don't send mcp-session-id:
//   --roo             : allow GET /mcp without session (create temp session)
//   --lax             : relax Accept header checks (no 406)
//   --cookie-session  : set/read mcp_session_id cookie as fallback to header
//   --single-session  : if exactly one session exists, route to it when missing

import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import { z } from "zod";
import { exec } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {serverConfig, serverCapabilities} from "./constants/server/config.js";
import { getArgv, setArgv } from "./utils/cli-args.js";

import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { startStdioServer } from "./stdio-server.js";
import { startHttpServer } from "./server/http-server.js";
import {
  getTools
} from "./constants/graphite/tools.js";
import {
  getPrompts
} from "./constants/graphite/prompts.js";
import {
  graphiteToolHandlers
} from "./handlers/graphite/tool-handlers.js";
import {
  graphitePromptHandlers
} from "./handlers/graphite/prompt-handlers.js";
import {
  getResources
} from "./constants/graphite/resources.js";
import {
  graphiteResourceHandlers
} from "./handlers/graphite/resource-handlers.js";

// -----------------------------
// Path helpers & defaults
// -----------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const argv = yargs(hideBin(process.argv))
  .scriptName("mcp-server")
  .usage(
    "$0 [--stdio] [--http --port 6868] [--debug] [--allowed-host 127.0.0.1] [--roo] [--lax] [--cookie-session] [--single-session]"
  )
  .option("stdio", {
    type: "boolean",
    describe: "Run with stdio transport"
  })
  .option("http", {
    type: "boolean",
    default: process.env.HTTP_ENABLED === "1",
    describe: "Run with Streamable HTTP transport",
  })
  .option("port", {
    type: "number",
    default: parseInt(process.env.PORT) || 6868,
    describe: "HTTP port for --http",
  })
  .option("debug", {
    type: "boolean",
    default: process.env.DEBUG_MCP === "1",
    describe: "Verbose request/transport logging",
  })
  .option("allowed-host", {
    array: true,
    default: process.env.ALLOWED_HOSTS ? process.env.ALLOWED_HOSTS.split(',') : [],
    describe:
      "Optional list of allowed Host header values (DNS-rebinding protection). Example: --allowed-host 127.0.0.1 --allowed-host localhost",
  })
  .option("roo", {
    type: "boolean",
    default: process.env.ROO_SHIM === "1",
    describe:
      "Enable Roo shim: if GET /mcp lacks mcp-session-id, create a temporary session instead of 400",
  })
  .option("lax", {
    type: "boolean",
    default: process.env.LAX_MODE === "1",
    describe:
      "Relax Accept checks (do not 406 if Accept is missing/mis-specified)",
  })
  .option("cookie-session", {
    type: "boolean",
    default: process.env.COOKIE_SESSION === "1",
    describe:
      "Set and accept 'mcp_session_id' cookie as fallback to the header",
  })
  .option("single-session", {
    type: "boolean",
    default: process.env.SINGLE_SESSION === "1",
    describe:
      "If exactly one session exists and the ID is missing, route to it",
  })
  .option("rag", {
    type: "boolean",
    default: process.env.RAG_ENABLED === "1",
    describe:
      "If true, then the server will expose and handle rag based tools and resources",
  })
  .option("rag-host", {
    type: "string",
    default: process.env.ES_HOST || "localhost",
    describe: "RAG service host (for stdio mode)",
  })
  .option("rag-port", {
    type: "number",
    default: parseInt(process.env.ES_PORT) || 3002,
    describe: "RAG service port (for stdio mode)",
  })
  .option("rag-token", {
    type: "string",
    default: process.env.RAG_AUTH_TOKEN || "",
    describe: "RAG service authorization token (for stdio mode)",
  })
  .check((args) => {
    if (!args.stdio && !args.http)
      throw new Error("Choose one: --stdio or --http");
    return true;
  })
  .help()
  .parse();

setArgv(argv);

const DEBUG = !!getArgv().debug;
const ROO_SHIM = !!getArgv().roo;
const LAX = !!getArgv().lax;
const COOKIE_SESS = !!getArgv()['cookie-session'];
const SINGLE_SESSION = !!getArgv()["single-session"];
const ah = getArgv()["allowed-host"]
const ALLOWED_HOSTS = Array.isArray(ah) && ah.length > 0
  ? ah.map(String.toLowerCase)
  : null;

// Make argv available to other modules



// --- Build a server instance factory ----------------------------------------
function createServer() {
  const server = new McpServer(serverConfig, serverCapabilities);

  // ----- Resources (SDK: registerResource) -----
  // Register Graphite resources
  const GRESOURCES = getResources();
  for (const resource of GRESOURCES) {
    if (resource.template) {
      // Handle templated resources
      server.registerResource(
        resource.id,
        resource.template,
        resource.metadata,
        graphiteResourceHandlers[resource.id]
      );
    } else {
      // Handle standard resources
      server.registerResource(
        resource.id,
        resource.uri,
        resource.metadata,
        graphiteResourceHandlers[resource.id]
      );
    }
  }

  // Register Graphite tools
  const GTOOLS = getTools()
  for (const tool of GTOOLS) {
    // Use console.error instead of console.log because in stdio mode, stdout is reserved
    // for MCP protocol JSON messages. Any console.log output would corrupt the protocol stream.
    console.error(`Registering tool: ${tool.name}`);
    let toolMeta = {
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema
    };
    if(tool.outputSchema) {
      toolMeta.outputSchema = tool.outputSchema;
    }

    try {
      server.registerTool(
        tool.name,
        toolMeta,
        graphiteToolHandlers[tool.name]
      );
      // Use console.error for logging (see comment above about stdio mode)
      console.error(`Successfully registered tool: ${tool.name}`);
    } catch (error) {
      console.error(`Error registering tool ${tool.name}:`, error);
    }
  }

   // ----- Prompt (SDK: registerPrompt) -----
  // Register Graphite prompts
  const GPROMPTS = getPrompts()
  for (const prompt of GPROMPTS) {
    server.registerPrompt(
      prompt.name,
      {
        title: prompt.title,
        description: prompt.description,
        schema: prompt.argsSchema,
      },
      graphitePromptHandlers[prompt.name]
    );
  }

  //Mobile doc rag tool. Only available if running in http mode
  // if(argv.rag) {
  //   server.registerTool(
  //     "mobile-search-docs",
  //     {
  //       title: "Find relevat information for the given query for mobile",
  //       description: "Find one or more mobile documents that could be used based on what the user is aksing for.",
  //       inputSchema: { queryText: z.string() },
  //     }
  //   )
  // }

  return server;
}

// --- Main --------------------------------------------------------------------
async function main() {
  if (argv.stdio) {
    await startStdioServer(createServer, DEBUG);
    return;
  }

  if (argv.http) {
    await startHttpServer(createServer, {
      port: argv.port,
      debug: DEBUG,
      allowedHosts: ALLOWED_HOSTS,
      rooShim: ROO_SHIM,
      lax: LAX,
      cookieSession: COOKIE_SESS,
      singleSession: SINGLE_SESSION
    });
  }
}

main().catch((err) => {
  console.error("[mcp] fatal:", err);
  process.exit(1);
});
