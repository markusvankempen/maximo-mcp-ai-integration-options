import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Import types
/** @typedef {import('../types.d.ts').LIST_INDEX_OUTPUT_SCHEMA} LIST_INDEX_OUTPUT_SCHEMA */

// Path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to RAG_CATALOG.json
const RAG_CATALOG_PATH = path.resolve(__dirname, '../constants/RAG_CATALOG.json');

/**
 * Load RAG indexes from the catalog file
 * @returns {Object} The RAG indexes
 */
function loadRagIndexes() {
  try {
    const catalogData = fs.readFileSync(RAG_CATALOG_PATH, 'utf8');
    return JSON.parse(catalogData);
  } catch (error) {
    console.error(`Error loading RAG catalog: ${error.message}`);
    // Return an empty object as fallback
    return {};
  }
}

// Load the RAG indexes from the catalog file
const RAG_INDEXES = loadRagIndexes();

/**
 * Get all available RAG indexes as an array
 * @returns {LIST_INDEX_OUTPUT_SCHEMA} Object containing array of index objects with index_name, description, and domain
 */
export function getAllRagIndexes() {
  // Reload the indexes to ensure we have the latest data
  const indexes = loadRagIndexes();
  
  const indexArray = Object.entries(indexes).map(([key, value]) => ({
    index_name: key,
    description: value.description,
    domain: value.domain
  }));
  
  return { indices: indexArray };
}

/**
 * Get a specific RAG index by key
 * @param {string} key - The index key
 * @returns {Object|null} The index object or null if not found
 */
export function getRagIndexByKey(key) {
  // Reload the indexes to ensure we have the latest data
  const indexes = loadRagIndexes();
  
  return indexes[key] || null;
}

/**
 * Validate if the provided indexes are valid
 * @param {Array<string>} indexes - Array of index keys to validate
 * @returns {Array<string>} Array of valid index keys
 */
export function validateIndexes(indexes) {
  // Reload the indexes to ensure we have the latest data
  const ragIndexes = loadRagIndexes();
  
  if (!indexes || !Array.isArray(indexes)) {
    return ['all'];
  }
  
  // If 'all' is included, just return that
  if (indexes.includes('all')) {
    return ['all'];
  }
  
  // Filter to only valid indexes
  const validIndexes = indexes.filter(index => ragIndexes[index]);
  
  // If no valid indexes, default to 'all'
  return validIndexes.length > 0 ? validIndexes : ['all'];
}
