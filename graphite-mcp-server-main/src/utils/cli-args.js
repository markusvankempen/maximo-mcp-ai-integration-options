/**
 * Command line arguments module
 * Exports the parsed argv object from mcp-server.js for use in other modules
 */

// Initialize with default values
let argv = {
  stdio: false,
  http: false,
  port: 6868,
  debug: false,
  roo: false,
  lax: false,
  "cookie-session": false,
  "single-session": false,
  rag: false,
  "rag-host": "localhost",
  "rag-port": 3002,
  "rag-token": ""
};

/**
 * Set the argv object with values from mcp-server.js
 * @param {Object} args - The parsed command line arguments
 */
export function setArgv(args) {
  argv = { ...args };
}

/**
 * Get the current argv object
 * @returns {Object} The command line arguments
 */
export function getArgv() {
  return argv;
}

/**
 * Check if a specific command line flag is enabled
 * @param {string} flag - The flag name to check
 * @returns {boolean} True if the flag is enabled
 */
export function hasFlag(flag) {
  return !!argv[flag];
}

/**
 * Get a specific command line argument value
 * @param {string} name - The argument name
 * @param {any} defaultValue - Default value if argument is not set
 * @returns {any} The argument value or default
 */
export function getArg(name, defaultValue = undefined) {
  return argv[name] !== undefined ? argv[name] : defaultValue;
}

// Export the functions and a default object
export default {
  setArgv,
  getArgv,
  hasFlag,
  getArg
};

// Made with Bob
