// Handlers for Graphite-specific tools
import { exec } from "node:child_process";
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";
import { searchMaximoObjects, getSchema, maximoFetch } from "../../maximo.js";
import { validateIndexes, getAllRagIndexes } from "../../utils/rag-utils.js";
import { logger } from "../../utils/logger.js";
import { getArgv } from "../../utils/cli-args.js";
import {
  listComponents,
  searchComponents,
  getComponentProperties,
  getComponentSamples,
  getMultipleComponentProperties,
  getComponentEnumValues,
  searchGraphiteColors,
  searchGraphiteIcons
} from "../../utils/graphiteLib.js";
import {
  processSchema,
  formatSchemaOutput
} from "../../utils/schema-utils.js";
import { dbcToolHandlers } from "../dbc/tool-handlers.js";

//types without typescript (workaround)
/** @typedef {import('../types.d.ts').LIST_INDEX_OUTPUT_SCHEMA} LIST_INDEX_OUTPUT_SCHEMA */



// Path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//mimic the exact location as original
const BASE_DIR = path.resolve(__dirname, "../../../");


/**
 * Handler for graphite-list-components tool
 * Searches and lists Graphite components with optional filtering
 * @param {Object} params - Search parameters
 * @param {string} [params.query="*"] - Search query
 * @param {string} [params.category] - Category filter
 * @param {number} [params.limit=20] - Result limit
 * @param {boolean} [params.includeFullList=false] - Return all components
 */
export async function handleGraphiteListComponents(params = {}) {
  try {
    // If no parameters provided, default to listing all components (backward compatibility)
    if (!params || Object.keys(params).length === 0) {
      const componentList = listComponents();
      return {
        content: [{ type: "text", text: componentList }],
      };
    }

    // Use search functionality with provided parameters
    const { query = "*", category, limit = 20, includeFullList = false } = params;
    const results = searchComponents({ query, category, limit, includeFullList });

    return {
      content: [{ type: "text", text: results }],
    };
  } catch (error) {
    throw new Error(`Failed to list/search components: ${error.message}`);
  }
}

/**
 * Handler for graphite-show-component-samples tool
 * Gets samples for a specific Graphite component
 */
export async function handleGraphiteShowComponentSamples({ componentName }) {
  try {
    const result = getComponentSamples(componentName);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      content: [{ type: "text", text: result.text }],
    };
  } catch (error) {
    throw new Error(`Failed to get component samples: ${error.message}`);
  }
}

/**
 * Handler for graphite-show-component-properties tool
 * Gets the valid properties for a specific Graphite component
 * Supports optional search parameter to filter properties
 */
export async function handleGraphiteShowComponentProperties({ componentName, search }) {
  try {
    const result = getComponentProperties(componentName, search);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      content: [{ type: "text", text: result.text }],
    };
  } catch (error) {
    throw new Error(`Failed to get component properties: ${error.message}`);
  }
}

/**
 * Handler for graphite-show-multiple-component-properties tool
 * Gets properties for multiple components at once
 */
export async function handleGraphiteShowMultipleComponentProperties({ componentNames }) {
  try {
    if (!Array.isArray(componentNames) || componentNames.length === 0) {
      throw new Error('componentNames must be a non-empty array');
    }

    const result = getMultipleComponentProperties(componentNames);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      content: [{ type: "text", text: result.text }],
    };
  } catch (error) {
    throw new Error(`Failed to get multiple component properties: ${error.message}`);
  }
}

/**
 * Handler for graphite-get-component-enum-values tool
 * Gets enum values for specific properties of a component with optional search
 */
export async function handleGraphiteGetComponentEnumValues({ componentName, propertyNames, search }) {
  try {
    if (!propertyNames || (Array.isArray(propertyNames) && propertyNames.length === 0)) {
      throw new Error('propertyNames is required and must be a non-empty string or array');
    }

    const result = getComponentEnumValues(componentName, propertyNames, search);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      content: [{ type: "text", text: result.text }],
    };
  } catch (error) {
    throw new Error(`Failed to get component enum values: ${error.message}`);
  }
}

/**
 * Handler for graphite-search-colors tool
 * Search for Graphite color tokens with optional filtering
 */
export async function handleGraphiteSearchColors({ search }) {
  try {
    const result = searchGraphiteColors(search);

    return {
      content: [{ type: "text", text: result.text }],
    };
  } catch (error) {
    throw new Error(`Failed to search colors: ${error.message}`);
  }
}

/**
 * Handler for graphite-search-icons tool
 * Search for Graphite icons with optional filtering
 */
export async function handleGraphiteSearchIcons({ search, limit }) {
  try {
    const result = searchGraphiteIcons(search, limit);

    return {
      content: [{ type: "text", text: result.text }],
    };
  } catch (error) {
    throw new Error(`Failed to search icons: ${error.message}`);
  }
}

/**
 * Handler for graphite-find-maximo-object-structure tool
 * Finds a maximo objectstructure based on the user provided query
 */
export async function handleGraphiteFindMaximoObjectStructure({ queryText }) {
  return new Promise(async (resolve, reject) => {
    try {
      let results = await searchMaximoObjects(queryText);

      // Handle case where searchMaximoObjects returns undefined or empty
      if (!results || (Array.isArray(results) && results.length === 0)) {
        resolve({
          content: [{
            type: "text", text: JSON.stringify({
              error: "No results found. This could be due to:",
              reasons: [
                "Maximo authentication issue (check MAXIMO_MCP_USER and MAXIMO_MCP_PASSWORD)",
                "Maximo server returned HTML instead of JSON (check server URL and authentication)",
                "No matching object structures found for query: " + queryText
              ]
            })
          }],
        });
        return;
      }

      resolve({
        content: [{ type: "text", text: JSON.stringify(results) }],
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function handleFetchDataFromMaximo({ objectstructure, select, where, orderby, pageSize }) {
  return new Promise(async (resolve, reject) => {
    try {
      let results = await maximoFetch(
        objectstructure,
        select || [],
        where || {},
        orderby || '',
        pageSize || 10
      );
      resolve({
        content: [{ type: "text", text: JSON.stringify(results) }],
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Handler for graphite-get-json-schema-for-object-structure tool
 * Gets the JSON schema for a given maximo object structure with filtering options
 */
export async function handleGraphiteGetJsonSchemaForObjectStructure({
  objectStructure,
  selection,
  mode = 'standard',
  search,
  limit
}) {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch the schema from Maximo
      let rawSchema = await getSchema(objectStructure, selection || "*");

      // Check for errors
      if (rawSchema['oslc:Error']) {
        reject(new Error(rawSchema['oslc:Error']['oslc:message'] || 'Error fetching schema'));
        return;
      }

      // Process the schema with filters
      const { schema: processedSchema, metadata } = processSchema(rawSchema, {
        mode,
        search,
        limit
      });

      // Format the output
      const formattedOutput = formatSchemaOutput(processedSchema, {
        mode,
        originalSize: metadata.originalSize,
        filteredSize: metadata.filteredSize
      });

      resolve({
        content: [{ type: "text", text: formattedOutput }],
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Handler for graphite-list-rag-indexes tool
 * Lists all available RAG indexes with descriptions
 * @returns {LIST_INDEX_OUTPUT_SCHEMA} Object containing array of index objects with index_name, description, and domain
 */
export async function handleGraphiteListRagIndexes() {
  return new Promise(async (resolve, reject) => {
    try {
      // Get all indexes in the format defined by LIST_INDEX_OUTPUT_SCHEMA
      const indexData = getAllRagIndexes();

      // Return the object directly as per the schema definition
      resolve({
        content: [{ type: "text", text: JSON.stringify(indexData) }],
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Handler for graphite-rag-search tool
 * Searches Elasticsearch for relevant documentation based on query
 */
export async function handleGraphiteRagSearch({ query, xmlContext, indexes }) {
  return new Promise(async (resolve, reject) => {
    try {
      // Determine which indexes to search
      let searchIndexes;

      if (!indexes || !Array.isArray(indexes) || indexes.length === 0) {
        // No indexes specified - search all indexes (default behavior)
        let { indices } = getAllRagIndexes();
        searchIndexes = indices.map(item => item.index_name).filter(item => item !== 'all');
      } else if (indexes.includes('all')) {
        // Explicit 'all' keyword - search all indexes
        let { indices } = getAllRagIndexes();
        searchIndexes = indices.map(item => item.index_name).filter(item => item !== 'all');
      } else {
        // Specific indexes provided - use them directly
        searchIndexes = indexes;
      }

      // Get command line arguments for stdio mode
      const argv = getArgv();
      const isStdioMode = argv.stdio;

      // Configuration for search service
      // In stdio mode: always use HTTPS through nginx with --rag-host and --rag-token
      // In HTTP mode: use environment variables
      const config = {
        host: isStdioMode ? argv['rag-host'] : (process.env.ES_HOST || 'nginx'),
        port: isStdioMode ? 443 : (parseInt(process.env.ES_PORT) || 443),
        path: '/search/api/vector-search',
        authToken: isStdioMode ? argv['rag-token'] : (process.env.RAG_AUTH_TOKEN || ''),
        // Accept self-signed certificates in stdio mode
        rejectUnauthorized: false
      };

      console.error(`Connecting to RAG service at https://${config.host}:${config.port}${config.path}`);

      // Prepare the search data
      const searchData = JSON.stringify({
        query: query,
        xmlContext: xmlContext || "",
        k: 5,
        indexes: searchIndexes
      });

      // Create options for the HTTPS request
      const options = {
        hostname: config.host,
        port: config.port,
        path: config.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': searchData.length
        },
        rejectUnauthorized: config.rejectUnauthorized
      };

      // Add authorization header (required for nginx authentication)
      if (config.authToken) {
        options.headers['Authorization'] = `Bearer ${config.authToken}`;
      }

      // Make the request to Elasticsearch with mTLS
      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const { results } = JSON.parse(data);
            // results.content = 
            // results.score = 
            // Log the RAG results to file
            logger.ragResults({
              query,
              indexes: searchIndexes,
              results: results || []
            });

            if (results && results.length > 0) {
              //Build return value with backward compatibility
              let returnObj = {
                content: results.map(item => ({
                  type: "text",
                  text: JSON.stringify({ searchData: item.content, score: item.score })
                }))
              }

              // Return the results directly in the expected schema format
              resolve(returnObj);
            } else {
              resolve({
                results: []
              });
            }
          } catch (error) {
            logger.error(`Error parsing RAG search results:`, error);
            reject(new Error(`Error parsing search results: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Error connecting to Elasticsearch: ${error.message}`));
      });

      req.write(searchData);
      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Handler for use-tools-before-xml prompt
 * Instructs the model to use Graphite tools before generating XML
 */
export function handleUseToolsBeforeXml({ task }) {
  return {
    messages: [
      {
        role: "system",
        content: {
          type: "text",
          text: `You MUST follow this workflow before producing any Graphite XML:
1) Call "graphite-list-components" to enumerate valid components.
2) Call "graphite-show-component-properties" to fetch valid properties for chosen components.
3) Call "graphite-show-component-samples" to review usage examples.
Only then assemble XML. If information is missing, call tools again.

Output:
- A brief plan of called tools + rationale
- The final XML
- A checklist of validations performed`,
        },
      },
      { role: "user", content: { type: "text", text: `Task: ${task}` } },
    ],
  };
}

// Export all handlers as a map for easier registration
export const graphiteToolHandlers = {
  ...dbcToolHandlers,
  "graphite-list-components": handleGraphiteListComponents,
  "graphite-show-component-samples": handleGraphiteShowComponentSamples,
  "graphite-show-component-properties": handleGraphiteShowComponentProperties,
  "graphite-show-multiple-component-properties": handleGraphiteShowMultipleComponentProperties,
  "graphite-get-component-enum-values": handleGraphiteGetComponentEnumValues,
  "graphite-search-colors": handleGraphiteSearchColors,
  "graphite-search-icons": handleGraphiteSearchIcons,
  "graphite-find-maximo-object-structure": handleGraphiteFindMaximoObjectStructure,
  "graphite-fetch-data-from-manage": handleFetchDataFromMaximo,
  "graphite-get-json-schema-for-object-structure": handleGraphiteGetJsonSchemaForObjectStructure,
  "retrieve-specific-examples-and-documentation": handleGraphiteRagSearch,
  "list-rag-indexes": handleGraphiteListRagIndexes,
};
