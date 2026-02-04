import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, "../../../");

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(BASE_DIR, 'logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Log file paths
const RAG_LOG_FILE = path.join(LOGS_DIR, 'rag-results.log');

/**
 * Write content to a log file
 * @param {string} filePath - Path to the log file
 * @param {string} content - Content to write
 */
const writeToLogFile = (filePath, content) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${content}\n`;

  fs.appendFile(filePath, logEntry, (err) => {
    if (err) {
      console.error(`Failed to write to log file ${filePath}:`, err);
    }
  });
};

export const logger = {

  info: (...args) => {
    console.error('[GRAPHITEMCP][INFO]', ...args);
  },

  error: (...args) => {
    console.error('[GRAPHITEMCP][ERROR]', ...args);
  },

  warn: (...args) => {
    console.warn('[GRAPHITEMCP][WARN]', ...args);
  },

  debug: (...args) => {
    if (process.env.DEBUG === 'true') {
      console.error('[GRAPHITEMCP][DEBUG]', ...args);
    }
  },

  /**
   * Log RAG search results to a dedicated file
   * @param {Object} data - RAG search data including query and results
   */
  ragResults: (data) => {
    const { query, indexes, results } = data;

    // Log to console
    console.error('[GRAPHITEMCP][RAG]', `Query: "${query}" on indexes: [${indexes.join(', ')}]`);

    // Format the data for the log file
    const formattedData = JSON.stringify({
      timestamp: new Date().toISOString(),
      query,
      indexes,
      results
    }, null, 2);

    // Write to log file
    writeToLogFile(RAG_LOG_FILE, formattedData);
  }
};