
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

/**
 * Start an MCP server with stdio transport
 * @param {Function} createServer - Function that creates and returns an MCP server instance
 * @param {boolean} debug - Whether to enable debug logging
 * @returns {Promise<void>}
 */
export async function startStdioServer(createServer, debug = false) {
  const server = createServer();
  const transport = new StdioServerTransport();
  
  if (debug) {
    console.error("[mcp] Starting stdio server");
  }
  
  await server.connect(transport);
  
  if (debug) {
    console.error("[mcp] Stdio server connected");
  }
}

