// DBC (Database Configuration) utilities for parsing DTD and JSON registry
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, "../../");

// Cache for parsed DBC schema
let dbcSchemaCache = null;
let cacheTimestamp = null;

/**
 * Parse DTD file to extract element definitions and attributes
 * @param {string} dtdContent - Content of the DTD file
 * @returns {Object} Parsed DTD structure
 */
function parseDTD(dtdContent) {
  const elements = {};
  
  // Match ELEMENT definitions: <!ELEMENT name (content)>
  const elementRegex = /<!ELEMENT\s+(\w+)\s+([^>]+)>/g;
  let match;
  
  while ((match = elementRegex.exec(dtdContent)) !== null) {
    const [, elementName, contentModel] = match;
    
    // Parse content model to extract children
    const children = [];
    if (contentModel.includes('(') && !contentModel.includes('#PCDATA') && !contentModel.includes('EMPTY')) {
      // Extract child elements from content model
      const childMatches = contentModel.match(/(\w+)/g);
      if (childMatches) {
        children.push(...childMatches.filter(c => 
          !['EMPTY', 'PCDATA', 'true', 'false'].includes(c)
        ));
      }
    }
    
    elements[elementName] = {
      name: elementName,
      contentModel: contentModel.trim(),
      attributes: {},
      children: [...new Set(children)], // Remove duplicates
      hasTextContent: contentModel.includes('#PCDATA')
    };
  }
  
  // Match ATTLIST definitions: <!ATTLIST element attr type default>
  const attlistRegex = /<!ATTLIST\s+(\w+)\s+([\s\S]*?)>/g;
  
  while ((match = attlistRegex.exec(dtdContent)) !== null) {
    const [, elementName, attrsBlock] = match;
    
    if (!elements[elementName]) {
      elements[elementName] = {
        name: elementName,
        contentModel: 'UNKNOWN',
        attributes: {},
        children: [],
        hasTextContent: false
      };
    }
    
    // Parse individual attributes
    const attrRegex = /(\w+)\s+(CDATA|NMTOKEN|\([^)]+\))\s+(#REQUIRED|#IMPLIED|"[^"]*")/g;
    let attrMatch;
    
    while ((attrMatch = attrRegex.exec(attrsBlock)) !== null) {
      const [, attrName, attrType, attrDefault] = attrMatch;
      
      // Parse enumerated values if present
      let enumValues = null;
      if (attrType.startsWith('(')) {
        enumValues = attrType
          .slice(1, -1)
          .split('|')
          .map(v => v.trim());
      }
      
      elements[elementName].attributes[attrName] = {
        name: attrName,
        type: enumValues ? 'enum' : attrType,
        enumValues: enumValues,
        required: attrDefault === '#REQUIRED',
        default: attrDefault.startsWith('"') ? attrDefault.slice(1, -1) : null
      };
    }
  }
  
  return elements;
}

/**
 * Merge DTD data with JSON registry data
 * @param {Object} dtdElements - Parsed DTD elements
 * @param {Object} jsonRegistry - JSON registry data
 * @returns {Object} Merged schema
 */
function mergeSchemaData(dtdElements, jsonRegistry) {
  const merged = {};
  
  // Start with DTD as source of truth
  for (const [elementName, dtdData] of Object.entries(dtdElements)) {
    merged[elementName] = {
      ...dtdData,
      description: null,
      samples: [],
      attributeDescriptions: {}
    };
    
    // Merge JSON registry data if available
    if (jsonRegistry[elementName]) {
      const jsonData = jsonRegistry[elementName];
      
      merged[elementName].description = jsonData.description || null;
      merged[elementName].samples = jsonData.samples || [];
      
      // Merge attribute descriptions
      if (jsonData.props) {
        for (const [attrName, attrInfo] of Object.entries(jsonData.props)) {
          if (merged[elementName].attributes[attrName]) {
            merged[elementName].attributeDescriptions[attrName] = attrInfo.description || null;
            
            // Add enum descriptions if available
            if (attrInfo.type && attrInfo.type.oneOf) {
              merged[elementName].attributes[attrName].enumDescriptions = {};
              for (const enumItem of attrInfo.type.oneOf) {
                if (enumItem.value && enumItem.description) {
                  merged[elementName].attributes[attrName].enumDescriptions[enumItem.value] = enumItem.description;
                }
              }
            }
          }
        }
      }
      
      // Update children from JSON if more complete
      if (jsonData.children && jsonData.children.length > 0) {
        merged[elementName].children = [...new Set([
          ...merged[elementName].children,
          ...jsonData.children
        ])];
      }
    }
  }
  
  return merged;
}

/**
 * Load and parse DBC schema from DTD and JSON files
 * @param {boolean} forceReload - Force reload even if cached
 * @returns {Promise<Object>} Parsed and merged DBC schema
 */
export async function loadDBCSchema(forceReload = false) {
  // Check if we need to reload
  if (!forceReload && dbcSchemaCache) {
    const now = Date.now();
    // Cache for 5 minutes
    if (cacheTimestamp && (now - cacheTimestamp) < 5 * 60 * 1000) {
      logger.debug("Using cached DBC schema");
      return dbcSchemaCache;
    }
  }
  
  try {
    logger.info("Loading DBC schema from DTD and JSON registry...");
    
    // Load DTD file
    const dtdPath = path.join(BASE_DIR, "src/docs/dbc/script.dtd");
    const dtdContent = await fs.readFile(dtdPath, "utf-8");
    
    // Load JSON registry
    const jsonPath = path.join(BASE_DIR, "src/docs/dbc/script_registry.json");
    const jsonContent = await fs.readFile(jsonPath, "utf-8");
    const jsonRegistry = JSON.parse(jsonContent);
    
    // Parse DTD
    const dtdElements = parseDTD(dtdContent);
    
    // Merge with JSON registry
    const mergedSchema = mergeSchemaData(dtdElements, jsonRegistry);
    
    // Cache the result
    dbcSchemaCache = mergedSchema;
    cacheTimestamp = Date.now();
    
    logger.info(`DBC schema loaded: ${Object.keys(mergedSchema).length} elements`);
    
    return mergedSchema;
  } catch (error) {
    logger.error("Error loading DBC schema:", error);
    throw new Error(`Failed to load DBC schema: ${error.message}`);
  }
}

/**
 * Get information about a specific DBC element
 * @param {string} elementName - Name of the element
 * @returns {Promise<Object|null>} Element information or null if not found
 */
export async function getDBCElement(elementName) {
  const schema = await loadDBCSchema();
  return schema[elementName] || null;
}

/**
 * Search DBC elements by name or description
 * Supports space-separated OR queries (e.g., "table index" finds elements matching "table" OR "index")
 * @param {string} query - Search query (space-separated terms treated as OR)
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Matching elements
 */
export async function searchDBCElements(query, options = {}) {
  const schema = await loadDBCSchema();
  const { limit = 20, includeAttributes = false } = options;
  
  // Split query into terms for OR search
  const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
  const results = [];
  
  for (const [elementName, elementData] of Object.entries(schema)) {
    let maxScore = 0;
    const matchedTerms = new Set();
    
    // Check each search term
    for (const searchTerm of searchTerms) {
      let termScore = 0;
      
      // Exact match gets highest score
      if (elementName.toLowerCase() === searchTerm) {
        termScore = 100;
      }
      // Name contains query
      else if (elementName.toLowerCase().includes(searchTerm)) {
        termScore = 50;
      }
      // Description contains query
      else if (elementData.description && elementData.description.toLowerCase().includes(searchTerm)) {
        termScore = 25;
      }
      // Attribute names contain query
      else if (includeAttributes) {
        for (const attrName of Object.keys(elementData.attributes)) {
          if (attrName.toLowerCase().includes(searchTerm)) {
            termScore = 10;
            break;
          }
        }
      }
      
      if (termScore > 0) {
        matchedTerms.add(searchTerm);
        maxScore = Math.max(maxScore, termScore);
      }
    }
    
    // If any term matched, add to results
    if (maxScore > 0) {
      results.push({
        element: elementName,
        score: maxScore,
        matchedTerms: Array.from(matchedTerms),
        data: elementData
      });
    }
  }
  
  // Sort by score descending, then by number of matched terms
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.matchedTerms.length - a.matchedTerms.length;
  });
  
  return results.slice(0, limit);
}

/**
 * Get all DBC elements (for listing)
 * @returns {Promise<Array>} All element names
 */
export async function listDBCElements() {
  const schema = await loadDBCSchema();
  return Object.keys(schema).sort();
}

/**
 * Get attributes for a specific DBC element
 * @param {string} elementName - Name of the element
 * @param {string} searchTerm - Optional search term to filter attributes
 * @returns {Promise<Object|null>} Attributes information or null if element not found
 */
export async function getDBCElementAttributes(elementName, searchTerm = null) {
  const element = await getDBCElement(elementName);
  
  if (!element) {
    return null;
  }
  
  let attributes = element.attributes;
  
  // Filter by search term if provided
  if (searchTerm) {
    const search = searchTerm.toLowerCase();
    attributes = Object.fromEntries(
      Object.entries(attributes).filter(([attrName, attrData]) => {
        return attrName.toLowerCase().includes(search) ||
               (element.attributeDescriptions[attrName] && 
                element.attributeDescriptions[attrName].toLowerCase().includes(search));
      })
    );
  }
  
  return {
    element: elementName,
    description: element.description,
    attributes,
    attributeDescriptions: element.attributeDescriptions
  };
}

/**
 * Format DBC element information for display
 * @param {Object} elementData - Element data
 * @param {boolean} includeDetails - Include full details
 * @returns {string} Formatted text
 */
export function formatDBCElement(elementData, includeDetails = true) {
  const lines = [];
  
  lines.push(`Element: ${elementData.name}`);
  
  if (elementData.description) {
    lines.push(`Description: ${elementData.description}`);
  }
  
  lines.push(`Content Model: ${elementData.contentModel}`);
  
  if (elementData.hasTextContent) {
    lines.push(`Has Text Content: Yes`);
  }
  
  if (elementData.children && elementData.children.length > 0) {
    lines.push(`\nAllowed Children (${elementData.children.length}):`);
    lines.push(elementData.children.map(c => `  - ${c}`).join('\n'));
  }
  
  if (includeDetails && Object.keys(elementData.attributes).length > 0) {
    lines.push(`\nAttributes (${Object.keys(elementData.attributes).length}):`);
    
    for (const [attrName, attrData] of Object.entries(elementData.attributes)) {
      const required = attrData.required ? ' [REQUIRED]' : '';
      const defaultVal = attrData.default ? ` (default: "${attrData.default}")` : '';
      
      lines.push(`  ${attrName}${required}${defaultVal}`);
      
      if (elementData.attributeDescriptions[attrName]) {
        lines.push(`    Description: ${elementData.attributeDescriptions[attrName]}`);
      }
      
      if (attrData.enumValues) {
        lines.push(`    Type: enum`);
        lines.push(`    Valid values: ${attrData.enumValues.join(', ')}`);
        
        // Show enum descriptions if available
        if (attrData.enumDescriptions) {
          for (const [enumVal, enumDesc] of Object.entries(attrData.enumDescriptions)) {
            if (enumDesc) {
              lines.push(`      - ${enumVal}: ${enumDesc}`);
            }
          }
        }
      } else {
        lines.push(`    Type: ${attrData.type}`);
      }
    }
  }
  
  if (elementData.samples && elementData.samples.length > 0) {
    lines.push(`\nSamples Available: ${elementData.samples.length}`);
  }
  
  return lines.join('\n');
}

/**
 * Clear the DBC schema cache
 */
export function clearDBCCache() {
  dbcSchemaCache = null;
  cacheTimestamp = null;
  logger.info("DBC schema cache cleared");
}

// Made with Bob
