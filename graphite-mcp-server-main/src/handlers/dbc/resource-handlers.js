// Handlers for DBC-specific resources
import { logger } from "../../utils/logger.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Handler for dbc://guides/overview resource
 * Provides an overview of DBC and when to use DBC tools
 */
export async function handleDBCOverview() {
  logger.info("Serving DBC overview resource");
  
  const overviewPath = join(__dirname, "../../docs/dbc/DBC_OVERVIEW.md");
  const content = readFileSync(overviewPath, "utf-8");

  return {
    contents: [
      {
        uri: "dbc://guides/overview",
        mimeType: "text/markdown",
        text: content
      }
    ]
  };
}

/**
 * Export all DBC resource handlers
 */
export const dbcResourceHandlers = {
  "dbc-overview": handleDBCOverview
};

// Made with Bob
