import fetch from "node-fetch";

const log = (msg, ...args) =>       console.error('[DEBUG]: ', msg, ...args);
const showError = (msg, ...args) => console.error('[ERROR]:', msg, ...args);


const getSetting = (setting) => {
  return process.env[setting.toUpperCase()];
};

const getMaximoServerUrl = () => {
  return getSetting("maximo_mcp_URL") || 'http://localhost:9080';
};

const getMaximoAUTH = () => {
  let user = getSetting("maximo_mcp_User");
  let pass = getSetting("maximo_mcp_Password") ?? user;
  if (!user || !pass) {
    showError(
      "You need to set the maximo_mcp_url, maximo_mcp_user, and maximo_mcp_password in the MCP server env."
    );
    return "";
  }
  return Buffer.from(`${user}:${pass}`).toString("base64");
};

/**
 * Returns the url to fetch the JSON schema information.
 *
 * @param {string} os - Object structure name
 * @param {string} select - oslc.select information
 */
const getSchemaUrl = (os, select) => {
  let url = "";
  if (url.includes("/jsonschemas/")) {
    url = getMaximoServerUrl() + "/maximo/" + os.toLowerCase();
  } else {
    url = getMaximoServerUrl() + "/maximo/oslc/jsonschemas/" + os.toLowerCase();
  }
  if (select) {
    url += `?oslc.select=${select}&relativeuri=1`;
  }
  return url;
};

/**
 * Performs the actual fetch for the schema information
 *
 * @private
 * @param {string} url - URL
 * @param {*} options - Request options
 */
// istanbul ignore next - can't test network
const _fetch = async (url, options = {}) => {
  log(`Fetching: ${url}`);
  let json = {};
  try {
    if (!options.headers) {
      options.headers = {};
    }
    options.headers.MAXAUTH = getMaximoAUTH();
    let resp = await fetch(url, options);
    if (!resp.ok) throw new Error(`${resp.status}: ${resp.statusText}`);
    json = await resp.json();
  } catch (e) {
    log(`ERROR: ${e}`);
    showError(`${e}`);
    json = {
      "oslc:Error": {
        "oslc:message": e.message,
      },
    };
  }
  return json;
};

const searchMaximoObjects = async (text) => {
  let basePath = "/maximo/oslc/os/mxintobject";
  let query = {
    "oslc.select":
      "description,authapp,intobjectname,usewith,maxintobjdetail.objectname",
    "oslc.pageSize": "20",
    "oslc.where": 'usewith="INTEGRATION"',
    searchAttributes: "intobjectname,description,maxintobjdetail.objectname",
    "oslc.searchTerms": text,
    "collectioncount:": 0,
    ignorecollectionref: 1,
    relativeuri: 1,
    lean: 1,
    internalvalues: 1,
  };
  const params = new URLSearchParams();
  Object.keys(query).forEach((k) => {
    params.set(k, query[k]);
  });
  let url = `${getMaximoServerUrl()}${basePath}?${params.toString()}`;
  let resp = await _fetch(url);
  if (isError(resp)) {
    showError(JSON.stringify(resp));
    return;
  }
  if (resp.member) {
    return resp.member;
  }
};

/**
 * Test if the err object is a json error object.
 *
 * @param {object} err - Error JSON Object
 */
const isError = (err) => {
  return err && err["oslc:Error"];
};

/**
 * Returns the JSON schema for the given object structure
 *
 * @param {string} os - Object structure name
 * @param {string} select - oslc.select information
 */
const getSchema = (os, select) => {
  return _fetch(getSchemaUrl(os, select), {});
};

const isMaximoConfigured = () => {
  return Boolean(getMaximoAUTH());
}

/**
 * Generic function to fetch Maximo records based on object structure and search criteria
 *
 * @param {string} objectstructure - Object structure name (e.g., 'mxapiasset')
 * @param {string[]} select - Array of field names to select
 * @param {object} where - Object with field-value pairs for filtering
 * @param {string} orderby - String for ordering results (e.g., '+field1,-field2')
 * @param {number} pageSize - Number of records to return per page (default: 10)
 * @returns {Promise<object>} - Promise resolving to the response data
 *
 * @example
 * // Fetch assets with specific fields
 * const assets = await maximoFetch(
 *   'mxapiasset',
 *   ['assetnum', 'description', 'status'],
 *   { status: 'OPERATING' },
 *   '+assetnum',
 *   20
 * );
 */
const maximoFetch = async (objectstructure, select = [], where = {}, orderby = '', pageSize = 10) => {
  // Construct the base path
  let basePath = `/maximo/oslc/os/${objectstructure}`;
  
  // Build query parameters
  let query = {
    "oslc.pageSize": pageSize.toString(),
    "lean": 1,
    "relativeuri": 1
  };
  
  // Add select fields if provided
  if (select && select.length > 0) {
    query["oslc.select"] = select.join(',');
  }
  
  // Build where clause if provided
  if (where && Object.keys(where).length > 0) {
    const whereConditions = [];
    for (const [field, value] of Object.entries(where)) {
      if (value === null) {
        whereConditions.push(`${field} is null`);
      } else if (value === undefined) {
        // Skip undefined values
        continue;
      } else {
        // Quote string values
        const formattedValue = typeof value === 'string' ? `"${value}"` : value;
        whereConditions.push(`${field}=${formattedValue}`);
      }
    }
    
    if (whereConditions.length > 0) {
      query["oslc.where"] = whereConditions.join(' and ');
    }
  }
  
  // Add order by if provided
  if (orderby) {
    query["oslc.orderBy"] = orderby;
  }
  
  // Convert query object to URL parameters
  const params = new URLSearchParams();
  Object.keys(query).forEach((k) => {
    params.set(k, query[k]);
  });
  
  // Construct the full URL
  let url = `${getMaximoServerUrl()}${basePath}?${params.toString()}`;
  
  // Make the request
  let resp = await _fetch(url);
  
  // Check for errors
  if (isError(resp)) {
    showError(JSON.stringify(resp));
    return resp;
  }
  
  return resp;
};

export {
  getSchema,
  getSchemaUrl,
  getMaximoServerUrl,
  isError,
  searchMaximoObjects,
  maximoFetch,
  isMaximoConfigured
};
