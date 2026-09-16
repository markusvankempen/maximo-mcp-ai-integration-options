#!/usr/bin/env node

/**
 * Maximo MCP Server
 * 
 * Author: Markus van Kempen
 * Date: 3 Feb 2026
 * 
 * This server exposes tools to interact with an IBM Maximo instance via the Model Context Protocol.
 * Capabilities:
 * 1. Introspect Schema: Read the local OpenApi definition to understand available Object Structures.
 * 2. Query Data: Fetch data from Maximo using OSLC/REST APIs.
 */

// Load environment variables from .env file
// IMPORTANT: quiet:true prevents dotenv from outputting to stdout, which would corrupt MCP stdio
require('dotenv').config({ quiet: true });

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { z } = require("zod");
const fs = require('fs');
const path = require('path');

// --- Configuration (loaded from environment variables) ---
const RAW_MAXIMO_URL = (process.env.MAXIMO_URL || '').replace(/\/+$/, ''); // strip trailing slashes
const API_KEY = process.env.MAXIMO_API_KEY;
const OPENAPI_FILE = process.env.MAXIMO_OPENAPI_PATH || path.join(__dirname, 'maximo_openapi.json');

// Normalize MAXIMO_URL: ensure it ends with /api so queries hit /api/os/{OS}
function normalizeMaximoUrl(raw) {
    if (!raw) return '';
    // Already ends with /api
    if (raw.endsWith('/api')) return raw;
    // Ends with /oslc — replace with /api
    if (raw.endsWith('/oslc')) return raw.replace(/\/oslc$/, '/api');
    // Bare Maximo URL like https://host/maximo
    if (raw.match(/\/maximo$/i)) return raw + '/api';
    // Something else — append /api as best guess
    return raw + '/api';
}

const MAXIMO_URL = normalizeMaximoUrl(RAW_MAXIMO_URL);

// Validate required environment variables
if (!RAW_MAXIMO_URL || !API_KEY) {
    console.error("ERROR: Missing required environment variables.");
    console.error("Please set MAXIMO_URL and MAXIMO_API_KEY in your .env file or MCP config.");
    console.error("  MAXIMO_URL  — e.g. https://your-host/maximo/api  (or https://your-host/maximo)");
    console.error("  MAXIMO_API_KEY — your Maximo API key");
    console.error("See .env.example for reference.");
}

if (RAW_MAXIMO_URL && RAW_MAXIMO_URL !== MAXIMO_URL) {
    console.error(`URL normalized: ${RAW_MAXIMO_URL} → ${MAXIMO_URL}`);
}

// --- State ---
let openApiSpec = null;
let schemaLoaded = false;

// --- Load Schema (local file first, then live fetch) ---
function loadLocalSchema() {
    try {
        if (fs.existsSync(OPENAPI_FILE)) {
            console.error(`Loading OpenAPI spec from ${OPENAPI_FILE}...`);
            const raw = fs.readFileSync(OPENAPI_FILE, 'utf-8');
            openApiSpec = JSON.parse(raw);
            schemaLoaded = true;
            console.error(`Loaded OpenAPI spec. Components: ${Object.keys(openApiSpec.components?.schemas || {}).length}`);
            return true;
        }
    } catch (e) {
        console.error("Error loading local OpenAPI spec:", e.message);
    }
    return false;
}

async function fetchLiveSchema() {
    if (!MAXIMO_URL || !API_KEY) return false;
    // Maximo exposes its OpenAPI spec at /oas/api.json (relative to /api base)
    // e.g. https://host/maximo/api  →  /oas/api.json  →  https://host/maximo/oas/api.json
    // Or the OSLC variant:  https://host/maximo/oslc/oas/api
    const baseForOas = MAXIMO_URL.replace(/\/api$/, '');
    const oasUrls = [
        `${baseForOas}/oslc/oas/api`,      // primary: /oslc/oas/api
        `${MAXIMO_URL}/oas/api.json`,       // variant: /api/oas/api.json
    ];

    for (const oasUrl of oasUrls) {
        try {
            console.error(`Fetching OpenAPI spec from ${oasUrl}...`);
            const res = await fetch(oasUrl, {
                headers: {
                    'apikey': API_KEY,
                    'Accept': 'application/json'
                }
            });
            if (res.ok) {
                openApiSpec = await res.json();
                schemaLoaded = true;
                const count = Object.keys(openApiSpec.components?.schemas || {}).length;
                console.error(`Loaded live OpenAPI spec from ${oasUrl}. Schemas: ${count}`);
                return true;
            } else {
                console.error(`  → ${res.status} ${res.statusText}`);
            }
        } catch (e) {
            console.error(`  → Failed: ${e.message}`);
        }
    }
    return false;
}

// Discover Object Structures from live OSLC catalog as lightweight fallback
async function discoverObjectStructures() {
    if (!MAXIMO_URL || !API_KEY) return [];
    try {
        const url = `${MAXIMO_URL}/os?lean=1&oslc.pageSize=200`;
        console.error(`Discovering Object Structures from ${url}...`);
        const res = await fetch(url, {
            headers: { 'apikey': API_KEY, 'Accept': 'application/json' }
        });
        if (!res.ok) return [];
        const data = await res.json();
        const members = data.member || [];
        return members.map(m => {
            const name = m['oslc:name'] || m['spi:objectstructure'] || '';
            const href = m['rdf:about'] || m['href'] || '';
            const extracted = name || href.split('/').pop() || '';
            return {
                name: extracted.toUpperCase(),
                title: m['dcterms:title'] || extracted,
                description: m['dcterms:description'] || ''
            };
        }).filter(m => m.name);
    } catch (e) {
        console.error('Object Structure discovery failed:', e.message);
        return [];
    }
}

// Well-known Object Structures as ultimate fallback
const WELL_KNOWN_OS = [
    { name: 'MXWO', title: 'Work Orders', description: 'Work Order management' },
    { name: 'MXSR', title: 'Service Requests', description: 'Service Request management' },
    { name: 'MXASSET', title: 'Assets', description: 'Asset management' },
    { name: 'MXINVENTORY', title: 'Inventory', description: 'Inventory management' },
    { name: 'MXPO', title: 'Purchase Orders', description: 'Purchase Order management' },
    { name: 'MXPR', title: 'Purchase Requisitions', description: 'Purchase Requisition management' },
    { name: 'MXPERSON', title: 'Persons', description: 'Person records' },
    { name: 'MXLOCATION', title: 'Locations', description: 'Location management' },
    { name: 'MXITEM', title: 'Items', description: 'Item master' },
    { name: 'MXDOMAIN', title: 'Domains', description: 'Domain/lookup values' },
];

// Initialize schema (try local file synchronously, schedule live fetch)
loadLocalSchema();

// --- Server Setup ---
const server = new Server(
    {
        name: "maximo-mcp-server",
        version: "1.2.1",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// --- Tools Implementation ---

/**
 * Tool: list_object_structures
 * Lists available object structures from the loaded OpenAPI spec.
 */
async function listObjectStructures({ filter }) {
    // Try loading schema on first use if not yet loaded
    if (!schemaLoaded) {
        await fetchLiveSchema();
    }

    let results;

    if (openApiSpec && openApiSpec.components && openApiSpec.components.schemas) {
        // Use OpenAPI spec if available
        const schemas = openApiSpec.components.schemas;
        results = Object.keys(schemas)
            .filter(key => key.startsWith('RESOURCE_'))
            .map(key => {
                const def = schemas[key];
                return {
                    name: key.replace('RESOURCE_', ''),
                    title: def.title || key,
                    description: def.description || ''
                };
            });
    } else {
        // Fallback: discover from live OSLC catalog
        results = await discoverObjectStructures();
        if (results.length === 0) {
            // Ultimate fallback: well-known list
            results = WELL_KNOWN_OS;
            console.error('Using well-known Object Structures as fallback');
        }
    }

    results = results
        .filter(item => !filter || item.name.toLowerCase().includes(filter.toLowerCase()) || (item.description || '').toLowerCase().includes(filter.toLowerCase()))
        .slice(0, 50);

    return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
    };
}

/**
 * Tool: get_schema_details
 * Gets the property definition for a specific Object Structure
 */
async function getSchemaDetails({ objectStructure }) {
    // Try loading schema on first use if not yet loaded
    if (!schemaLoaded) {
        await fetchLiveSchema();
    }

    const osName = objectStructure.toUpperCase();
    const schemaName = `RESOURCE_${osName}`;
    const schema = openApiSpec?.components?.schemas?.[schemaName];

    if (schema) {
        // Simplify the schema for LLM consumption
        const simpleSchema = {
            name: objectStructure,
            description: schema.description,
            properties: Object.entries(schema.properties || {}).map(([propName, propDef]) => ({
                name: propName,
                type: propDef.type,
                title: propDef.title,
                description: propDef.description,
                maxLength: propDef.maxLength
            }))
        };
        return {
            content: [{ type: "text", text: JSON.stringify(simpleSchema, null, 2) }]
        };
    }

    // Fallback: infer schema from a live record
    console.error(`Schema RESOURCE_${osName} not found in OpenAPI spec, inferring from live data...`);
    try {
        const url = `${MAXIMO_URL}/os/${osName}?lean=1&oslc.pageSize=1`;
        const res = await fetch(url, {
            headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
            return { content: [{ type: "text", text: `Could not load schema for ${objectStructure}. OpenAPI spec not available and live query returned ${res.status}.` }] };
        }
        const data = await res.json();
        const sample = (data.member || [])[0];
        if (!sample) {
            return { content: [{ type: "text", text: `No records found in ${objectStructure} to infer schema from.` }] };
        }
        const inferred = {
            name: objectStructure,
            description: `Schema inferred from live ${osName} record (OpenAPI spec not available)`,
            properties: Object.entries(sample)
                .filter(([k]) => !k.startsWith('_') && k !== 'href')
                .map(([propName, propVal]) => ({
                    name: propName,
                    type: typeof propVal === 'number' ? 'number' : typeof propVal === 'boolean' ? 'boolean' : Array.isArray(propVal) ? 'array' : 'string',
                    title: propName,
                    description: '',
                    sample: typeof propVal === 'object' ? undefined : propVal
                }))
        };
        return {
            content: [{ type: "text", text: JSON.stringify(inferred, null, 2) }]
        };
    } catch (e) {
        return { content: [{ type: "text", text: `Schema for ${objectStructure} not found. OpenAPI spec not loaded and live inference failed: ${e.message}` }] };
    }
}

/**
 * Tool: query_maximo
 * Executes a GET request to the Maximo OSLC API
 */
async function queryMaximo({ objectStructure, where, select, orderBy, pageSize = 10, formatted = true }) {
    const params = new URLSearchParams({
        "lean": "1",
        "oslc.pageSize": pageSize.toString()
    });

    if (where) params.append("oslc.where", where);
    if (select) params.append("oslc.select", select);
    if (orderBy) params.append("oslc.orderBy", orderBy);

    const url = `${MAXIMO_URL}/os/${objectStructure}?${params.toString()}`;

    console.error(`Fetching: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                "apikey": API_KEY,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            let hint = '';
            if (response.status === 404) {
                hint = `\n\nHint: 404 usually means the URL is wrong. Current base: ${MAXIMO_URL}\nFull request URL: ${url}\nEnsure MAXIMO_URL points to the Maximo API base (e.g. https://your-host/maximo/api).`;
            } else if (response.status === 401 || response.status === 403) {
                hint = '\n\nHint: Check that MAXIMO_API_KEY is valid and has the required permissions.';
            }
            return {
                content: [{ type: "text", text: `Error ${response.status}: ${response.statusText}${hint}` }],
                isError: true
            };
        }

        const data = await response.json();

        // Extract relevant member data
        const members = data.member || [];
        const warnings = SmartValidator.validateQuery({ objectStructure, where, select }, openApiSpec);

        const result = {
            totalCount: data.responseInfo?.totalCount,
            nextPage: data.responseInfo?.nextPage?.href,
            count: members.length,
            warnings: warnings.length > 0 ? warnings : undefined,
            records: members
        };

        if (formatted) {
            return await renderCarbonTable({
                objectStructure,
                where,
                select,
                orderBy,
                pageSize,
                title: `${objectStructure} Query Results`
            });
        }

        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };

    } catch (error) {
        return {
            content: [{ type: "text", text: `Network Error: ${error.message}` }],
            isError: true
        };
    }
}

/**
 * Tool: get_instance_details
 * Introspects the system to find key details
 */
async function getInstanceDetails() {
    // 1. Check for latest Work Order to determine "Current Data Date"
    const latestWoResult = await queryMaximo({
        objectStructure: "MXWO",
        select: "reportdate,wonum",
        orderBy: "-reportdate",
        pageSize: 1
    });

    let latestDate = "Unknown";
    try {
        const resultJson = JSON.parse(latestWoResult.content[0].text);
        if (resultJson.records && resultJson.records.length > 0) {
            latestDate = resultJson.records[0].reportdate;
        }
    } catch (e) {
        // Ignore parsing error
    }

    const details = {
        latestWorkOrderDate: latestDate,
        instanceUrl: MAXIMO_URL,
        timestamp: new Date().toISOString()
    };

    return {
        content: [{ type: "text", text: JSON.stringify(details, null, 2) }]
    };
}

/**
 * Tool: render_carbon_table
 * Generates a Carbon-styled HTML table for Maximo data
 */
async function renderCarbonTable({ objectStructure, where, select, orderBy, pageSize = 10, title = "Maximo Data" }) {
    // Avoid recursion if called from queryMaximo
    const queryResult = await (async () => {
        const params = new URLSearchParams({
            "lean": "1",
            "oslc.pageSize": pageSize.toString()
        });
        if (where) params.append("oslc.where", where);
        if (select) params.append("oslc.select", select);
        if (orderBy) params.append("oslc.orderBy", orderBy);
        const url = `${MAXIMO_URL}/os/${objectStructure}?${params.toString()}`;
        try {
            const res = await fetch(url, { headers: { "apikey": API_KEY, "Content-Type": "application/json" } });
            if (!res.ok) return { isError: true, content: [{ type: "text", text: `Error ${res.status}` }] };
            const data = await res.json();
            return { content: [{ text: JSON.stringify({ records: data.member, totalCount: data.responseInfo?.totalCount }) }] };
        } catch (e) { return { isError: true, content: [{ type: "text", text: e.message }] }; }
    })();

    if (queryResult.isError) return queryResult;

    const data = JSON.parse(queryResult.content[0].text);
    const records = data.records || [];

    if (records.length === 0) {
        return { content: [{ type: "text", text: `<div class="bx--inline-notification bx--inline-notification--info"><div class="bx--inline-notification__details">No records found for ${objectStructure}</div></div>` }] };
    }

    const columns = select ? select.split(',') : Object.keys(records[0]).filter(k => !k.startsWith('_') && k !== 'href');

    let html = `
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://unpkg.com/carbon-components/css/carbon-components.min.css">
    <style>
        body { padding: 1rem; background: #f4f4f4; }
        .container { background: white; padding: 2rem; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        .bx--search { margin-bottom: 2rem; }
        .bx--table-sort { cursor: pointer; }
    </style>
</head>
<body class="bx--body">
    <div class="container">
        <div class="bx--data-table-container">
            <div class="bx--data-table-header">
                <h4 class="bx--data-table-header__title">${title}</h4>
                <p class="bx--data-table-header__description">Object Structure: ${objectStructure} | Total: ${data.totalCount || records.length}</p>
            </div>
            
            <div class="bx--toolbar">
                <div class="bx--toolbar-content">
                    <div class="bx--search bx--search--sm" role="search" data-search>
                        <label id="search-label-1" class="bx--label" for="search-input-1">Search</label>
                        <input class="bx--search-input" type="text" id="table-search" role="searchbox" placeholder="Filter records..." aria-labelledby="search-label-1">
                        <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bx--search-magnifier" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M15,14.3L10.7,10c1.9-2.3,1.7-5.8-0.5-7.9C9,1,7.4,0.5,5.8,0.5S2.7,1,1.5,2.1C-0.7,4.3-0.7,7.7,1.5,9.9 c1.1,1.1,2.6,1.6,4.2,1.6c1.2,0,2.5-0.4,3.5-1.1l4.3,4.3L15,14.3z M2,9.2C0.3,7.5,0.3,4.7,2.1,3C2.9,2.1,4.2,1.6,5.5,1.6 s2.5,0.5,3.4,1.4c1.7,1.7,1.7,4.5,0,6.2c-0.9,0.9-2.1,1.4-3.4,1.4S3,10.1,2,9.2z"></path></svg>
                    </div>
                </div>
            </div>

            <table class="bx--data-table bx--data-table--zebra bx--data-table--compact" id="main-table">
                <thead>
                    <tr>
                        ${columns.map((col, idx) => `
                        <th class="bx--table-sort" onclick="sortTable(${idx})">
                            <span class="bx--table-header-label">${col.trim().toUpperCase()}</span>
                            <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bx--table-sort__icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M12.3 9.3L8.5 13.1 8.5 1 7.5 1 7.5 13.1 3.7 9.3 3 10 8 15 13 10z"></path></svg>
                        </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody id="table-body">
                    ${records.map(rec => `
                    <tr>
                        ${columns.map(col => {
        let val = rec[col.trim()] !== undefined ? rec[col.trim()] : '--';
        if (val === null) val = '--';
        if (typeof val === 'object') val = JSON.stringify(val);
        return `<td>${val}</td>`;
    }).join('')}
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        // Filter logic
        document.getElementById('table-search').addEventListener('input', function(e) {
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#table-body tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });

        // Sorting logic
        let sortDir = 1;
        function sortTable(n) {
            const table = document.getElementById("main-table");
            const tbody = document.getElementById("table-body");
            const rows = Array.from(tbody.querySelectorAll("tr"));
            
            sortDir *= -1;
            
            const sortedRows = rows.sort((a, b) => {
                const x = a.getElementsByTagName("td")[n].textContent.toLowerCase();
                const y = b.getElementsByTagName("td")[n].textContent.toLowerCase();
                return x.localeCompare(y, undefined, {numeric: true}) * sortDir;
            });
            
            while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
            tbody.append(...sortedRows);
        }
    </script>
</body>
</html>`;

    return {
        content: [{ type: "text", text: html }]
    };
}

/**
 * Tool: render_carbon_details
 * Generates a Carbon-styled Detail view for a single Maximo record
 */
async function renderCarbonDetails({ objectStructure, where }) {
    const params = new URLSearchParams({ "lean": "1", "oslc.pageSize": "1" });
    if (where) params.append("oslc.where", where);
    const url = `${MAXIMO_URL}/os/${objectStructure}?${params.toString()}`;

    let rec;
    try {
        const res = await fetch(url, { headers: { "apikey": API_KEY, "Content-Type": "application/json" } });
        if (!res.ok) return { isError: true, content: [{ type: "text", text: `Error ${res.status}` }] };
        const data = await res.json();
        if (!data.member || data.member.length === 0) return { content: [{ type: "text", text: "Record not found" }] };
        rec = data.member[0];
    } catch (e) { return { isError: true, content: [{ type: "text", text: e.message }] }; }

    const fields = Object.entries(rec).filter(([k]) => !k.startsWith('_') && k !== 'href');

    let html = `
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://unpkg.com/carbon-components/css/carbon-components.min.css">
    <style>
        body { padding: 2rem; background: #f4f4f4; }
        .bx--tile { background: white; max-width: 800px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .field-row { display: flex; border-bottom: 1px solid #e0e0e0; padding: 0.75rem 1rem; }
        .field-label { font-weight: bold; width: 250px; color: #525252; text-transform: uppercase; font-size: 0.75rem; }
        .field-value { flex: 1; color: #161616; }
        .header { background: #161616; color: white; padding: 1rem; margin: -1rem -1rem 1rem -1rem; }
    </style>
</head>
<body class="bx--body">
    <div class="bx--tile">
       <div style="padding:1rem">
        <h3 class="bx--type-productive-heading-03" style="margin-bottom: 1.5rem;">${objectStructure} Record Details</h3>
        <div class="bx--grid bx--grid--no-gutter">
            ${fields.map(([k, v]) => `
            <div class="field-row">
                <div class="field-label">${k}</div>
                <div class="field-value">${typeof v === 'object' ? JSON.stringify(v) : (v !== null ? v : '--')}</div>
            </div>
            `).join('')}
        </div>
       </div>
    </div>
</body>
</html>`;

    return {
        content: [{ type: "text", text: html }]
    };
}

// --- Smart Validation Warnings Engine ---

/**
 * Smart Validation Warnings Engine
 * Provides pre-flight syntax checks, fuzzy field matching, site requirement validation,
 * worktype checks, and status transition sequence validation for Maximo OSLC REST API.
 */
class SmartValidator {
    /**
     * Pre-flight validation for OSLC queries
     */
    static validateQuery({ objectStructure, where, select }, openApiSpec) {
        const warnings = [];

        if (where) {
            // 1. Check for unquoted string values in where clause (e.g. status=APPR -> status="APPR")
            const unquotedMatch = where.match(/(\b[a-zA-Z0-9_\.]+\b)\s*=\s*([a-zA-Z][a-zA-Z0-9_]*)\b(?!\s*\(|\s*\")/);
            if (unquotedMatch && !['true', 'false', 'null', 'and', 'or', 'not', 'in'].includes(unquotedMatch[2].toLowerCase())) {
                warnings.push(`OSLC syntax warning: String value '${unquotedMatch[2]}' in where clause should be double-quoted (e.g. ${unquotedMatch[1]}="${unquotedMatch[2]}").`);
            }

            // 2. Check for JS/SQL logical operators
            if (/\&\&/.test(where)) {
                warnings.push(`OSLC syntax warning: Use 'and' instead of '&&' in OSLC where clauses.`);
            }
            if (/\|\|/.test(where)) {
                warnings.push(`OSLC syntax warning: Use 'or' instead of '||' in OSLC where clauses.`);
            }
            if (/==/.test(where)) {
                warnings.push(`OSLC syntax warning: Use '=' instead of '==' in OSLC where clauses.`);
            }
        }

        if (openApiSpec && objectStructure) {
            const osName = objectStructure.toUpperCase();
            const schemaName = `RESOURCE_${osName}`;
            const schema = openApiSpec?.components?.schemas?.[schemaName];
            if (schema && schema.properties) {
                const knownProps = Object.keys(schema.properties);
                const knownLower = knownProps.map(p => p.toLowerCase());

                if (select) {
                    const requestedFields = select.split(',').map(f => f.trim()).filter(Boolean);
                    for (const field of requestedFields) {
                        if (!knownLower.includes(field.toLowerCase())) {
                            const match = this.findClosestMatch(field, knownProps);
                            warnings.push(`Unknown field '${field}' in select for ${osName}.${match ? ` Did you mean '${match}'?` : ''}`);
                        }
                    }
                }
            }
        }

        return warnings;
    }

    /**
     * Pre-flight validation for record creation
     */
    static validateCreate({ objectStructure, recordData }) {
        const warnings = [];
        const os = (objectStructure || '').toUpperCase();
        const payload = typeof recordData === 'string' ? JSON.parse(recordData || '{}') : (recordData || {});

        // 1. Missing siteid warning (preventing #1 site error)
        if (['MXWO', 'MXASSET', 'MXSR', 'MXPO', 'MXPR', 'MXINVENTORY', 'MXLOCATION'].includes(os)) {
            if (!payload.siteid && !payload.SITEID) {
                warnings.push(`Pre-flight warning: 'siteid' is missing in recordData. If your Maximo user profile lacks a Default Insert Site, creation will fail with HTTP 400.`);
            }
        }

        // 2. Worktype validation
        const worktype = payload.worktype || payload.WORKTYPE;
        if (worktype) {
            const validTypes = ['CM', 'PM', 'EM', 'CP', 'AM', 'BD'];
            if (!validTypes.includes(String(worktype).toUpperCase())) {
                warnings.push(`Unrecognized worktype '${worktype}'. Standard Maximo work types: CM (Corrective), PM (Preventive), EM (Emergency), CP (Capital Project).`);
            }
        }

        // 3. Mandatory description recommendation
        if (['MXWO', 'MXSR'].includes(os) && !payload.description && !payload.DESCRIPTION) {
            warnings.push(`Recommendation: Adding a 'description' field improves record searchability.`);
        }

        return warnings;
    }

    /**
     * Validation for actions / status changes
     */
    static validateAction({ objectStructure, recordId, action, actionData }) {
        const warnings = [];
        const os = (objectStructure || '').toUpperCase();
        const act = (action || '').toLowerCase();
        const payload = typeof actionData === 'string' ? JSON.parse(actionData || '{}') : (actionData || {});

        if (act === 'changestatus' || act === 'status') {
            const targetStatus = (payload.status || payload.STATUS || '').toUpperCase();
            if (os === 'MXWO' && targetStatus) {
                warnings.push(`Work Order status transition note: Target status '${targetStatus}'. Standard WO sequence: WAPPR → APPR → INPRG → COMP → CLOSE.`);
            }
        }

        return warnings;
    }

    static findClosestMatch(target, candidates) {
        const t = target.toLowerCase();
        for (const candidate of candidates) {
            const c = candidate.toLowerCase();
            if (c.includes(t) || t.includes(c)) return candidate;
        }
        let bestCandidate = null;
        let minDistance = 3;
        for (const candidate of candidates) {
            const dist = this.levenshtein(t, candidate.toLowerCase());
            if (dist < minDistance) {
                minDistance = dist;
                bestCandidate = candidate;
            }
        }
        return bestCandidate;
    }

    static levenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
}

// --- CRUD Tool Implementations ---

/**
 * Tool: create_record
 * Creates a new record in a Maximo Object Structure via REST POST.
 * The AI must supply the required fields for the target Object Structure.
 */
async function createRecord({ objectStructure, recordData }) {
    if (!MAXIMO_URL || !API_KEY) {
        return { content: [{ type: "text", text: "Error: MAXIMO_URL and MAXIMO_API_KEY must be set." }], isError: true };
    }

    const osName = objectStructure.toUpperCase();
    const url = `${MAXIMO_URL}/os/${osName}?lean=1`;

    let payload;
    try {
        payload = typeof recordData === 'string' ? JSON.parse(recordData) : recordData;
    } catch (e) {
        return { content: [{ type: "text", text: `Error: recordData must be valid JSON. ${e.message}` }], isError: true };
    }

    const warnings = SmartValidator.validateCreate({ objectStructure: osName, recordData: payload });

    console.error(`Creating record in ${osName}: ${JSON.stringify(payload)}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json',
                'x-method-override': 'BULK',
                'Properties': '*'
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let responseData;
        try { responseData = JSON.parse(responseText); } catch { responseData = responseText; }

        if (!response.ok) {
            let errorMsg = `Error ${response.status}: ${response.statusText}`;
            if (typeof responseData === 'object' && responseData?.Error?.message) {
                errorMsg += `\nMaximo Error: ${responseData.Error.message}`;
            } else if (typeof responseData === 'string' && responseData.length < 500) {
                errorMsg += `\nDetails: ${responseData}`;
            }
            if (response.status === 400) errorMsg += '\n\nHint: Ensure required fields are included and your Maximo user profile has a Default Insert Site set (avatar → Profile).';
            if (response.status === 401 || response.status === 403) errorMsg += '\n\nHint: API key may lack write permissions. Ensure the key has "Create" access on the target Object Structure.';
            return { content: [{ type: "text", text: errorMsg }], isError: true };
        }

        const result = {
            status: 'success',
            httpStatus: response.status,
            objectStructure: osName,
            warnings: warnings.length > 0 ? warnings : undefined,
            record: responseData
        };
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };

    } catch (error) {
        return { content: [{ type: "text", text: `Network Error: ${error.message}` }], isError: true };
    }
}

/**
 * Tool: update_record
 * Updates an existing record in Maximo via PATCH (using x-method-override header).
 * Requires the record href or a where clause to identify the record.
 */
async function updateRecord({ objectStructure, recordId, recordData }) {
    if (!MAXIMO_URL || !API_KEY) {
        return { content: [{ type: "text", text: "Error: MAXIMO_URL and MAXIMO_API_KEY must be set." }], isError: true };
    }

    const osName = objectStructure.toUpperCase();
    const url = `${MAXIMO_URL}/os/${osName}/${encodeURIComponent(recordId)}?lean=1`;

    let payload;
    try {
        payload = typeof recordData === 'string' ? JSON.parse(recordData) : recordData;
    } catch (e) {
        return { content: [{ type: "text", text: `Error: recordData must be valid JSON. ${e.message}` }], isError: true };
    }

    console.error(`Updating ${osName} record ${recordId}: ${JSON.stringify(payload)}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json',
                'x-method-override': 'PATCH',
                'Properties': '*'
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let responseData;
        try { responseData = JSON.parse(responseText); } catch { responseData = responseText; }

        if (!response.ok) {
            let errorMsg = `Error ${response.status}: ${response.statusText}`;
            if (typeof responseData === 'object' && responseData?.Error?.message) {
                errorMsg += `\nMaximo Error: ${responseData.Error.message}`;
            }
            if (response.status === 404) errorMsg += `\n\nHint: Record ID "${recordId}" not found in ${osName}. Verify the record exists using query_maximo first.`;
            return { content: [{ type: "text", text: errorMsg }], isError: true };
        }

        const result = {
            status: 'success',
            httpStatus: response.status,
            objectStructure: osName,
            recordId,
            updatedRecord: responseData
        };
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };

    } catch (error) {
        return { content: [{ type: "text", text: `Network Error: ${error.message}` }], isError: true };
    }
}

/**
 * Tool: run_action
 * Executes a Maximo action (e.g., status change) on an existing record.
 * Actions trigger Maximo business rules (e.g., changeStatus, approve).
 */
async function runAction({ objectStructure, recordId, action, actionData }) {
    if (!MAXIMO_URL || !API_KEY) {
        return { content: [{ type: "text", text: "Error: MAXIMO_URL and MAXIMO_API_KEY must be set." }], isError: true };
    }

    const osName = objectStructure.toUpperCase();
    const url = `${MAXIMO_URL}/os/${osName}/${encodeURIComponent(recordId)}?action=${encodeURIComponent(action)}&lean=1`;

    let payload = {};
    if (actionData) {
        try {
            payload = typeof actionData === 'string' ? JSON.parse(actionData) : actionData;
        } catch (e) {
            return { content: [{ type: "text", text: `Error: actionData must be valid JSON. ${e.message}` }], isError: true };
        }
    }

    const warnings = SmartValidator.validateAction({ objectStructure: osName, recordId, action, actionData: payload });

    console.error(`Running action ${action} on ${osName}/${recordId}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let responseData;
        try { responseData = JSON.parse(responseText); } catch { responseData = responseText; }

        if (!response.ok) {
            let errorMsg = `Error ${response.status}: ${response.statusText}`;
            if (typeof responseData === 'object' && responseData?.Error?.message) {
                errorMsg += `\nMaximo Error: ${responseData.Error.message}`;
            }
            if (response.status === 400) errorMsg += `\n\nHint: The action "${action}" may not be valid for record "${recordId}" in its current status. Common actions: changeStatus, initiate, approve, reject.`;
            return { content: [{ type: "text", text: errorMsg }], isError: true };
        }

        const result = {
            status: 'success',
            httpStatus: response.status,
            objectStructure: osName,
            recordId,
            action,
            warnings: warnings.length > 0 ? warnings : undefined,
            response: responseData || 'Action completed successfully'
        };
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };

    } catch (error) {
        return { content: [{ type: "text", text: `Network Error: ${error.message}` }], isError: true };
    }
}

// --- Protocol Handling ---

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_object_structures",
                description: "List available Maximo Object Structures (APIs) from the schema, with optional filtering.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filter: {
                            type: "string",
                            description: "Search term to filter Object Structures by name or description"
                        }
                    }
                }
            },
            {
                name: "get_schema_details",
                description: "Get the detailed field definitions (properties, types) for a specific Maximo Object Structure.",
                inputSchema: {
                    type: "object",
                    properties: {
                        objectStructure: {
                            type: "string",
                            description: "The name of the Object Structure (e.g., MXWO, MXASSET)"
                        }
                    },
                    required: ["objectStructure"]
                }
            },
            {
                name: "query_maximo",
                description: "Query data from Maximo using the OSLC REST API.",
                inputSchema: {
                    type: "object",
                    properties: {
                        objectStructure: {
                            type: "string",
                            description: "The Object Structure to query (e.g., mxwo, mxasset)"
                        },
                        where: {
                            type: "string",
                            description: "OSLC where clause (e.g., status=\"APPR\" and siteid=\"BEDFORD\")"
                        },
                        select: {
                            type: "string",
                            description: "Comma-separated list of fields to select (e.g., wonum,description,status)"
                        },
                        pageSize: {
                            type: "number",
                            description: "Number of records to return (default 10)",
                            default: 10
                        },
                        orderBy: {
                            type: "string",
                            description: "OSLC orderBy clause (e.g., -reportdate)"
                        },
                        formatted: {
                            type: "boolean",
                            description: "If true, returns a Carbon-styled HTML table instead of JSON (default: true)"
                        }
                    },
                    required: ["objectStructure"]
                }
            },
            {
                name: "render_carbon_table",
                description: "Generates a beautiful Carbon Design System HTML table from Maximo data.",
                inputSchema: {
                    type: "object",
                    properties: {
                        objectStructure: {
                            type: "string",
                            description: "The Object Structure to query (e.g., mxwo, mxasset)"
                        },
                        where: {
                            type: "string",
                            description: "OSLC where clause"
                        },
                        select: {
                            type: "string",
                            description: "Comma-separated list of fields (e.g., wonum,description)"
                        },
                        orderBy: {
                            type: "string",
                            description: "Sorting criteria"
                        },
                        pageSize: {
                            type: "number",
                            description: "Number of records (default 10)"
                        },
                        title: {
                            type: "string",
                            description: "Title for the table"
                        }
                    },
                    required: ["objectStructure"]
                }
            },
            {
                name: "render_carbon_details",
                description: "Generates a beautiful Carbon Design System detail view for a specific Maximo record.",
                inputSchema: {
                    type: "object",
                    properties: {
                        objectStructure: {
                            type: "string",
                            description: "The Object Structure (e.g., mxwo)"
                        },
                        where: {
                            type: "string",
                            description: "OSLC where clause to find the unique record (e.g., wonum=\"1001\")"
                        }
                    },
                    required: ["objectStructure", "where"]
                }
            },
            {
                name: "get_instance_details",
                description: "Introspect the Maximo instance to get context data (e.g., latest data dates, version).",
                inputSchema: {
                    type: "object",
                    properties: {},
                }
            },
            {
                name: "create_record",
                description: "Create a new record in a Maximo Object Structure (e.g., create a Work Order, Asset, or Service Request). Use get_schema_details first to know required fields. IMPORTANT: Your Maximo user profile must have a Default Insert Site set.",
                inputSchema: {
                    type: "object",
                    properties: {
                        objectStructure: {
                            type: "string",
                            description: "The Object Structure to create a record in (e.g., MXWO, MXASSET, MXSR)"
                        },
                        recordData: {
                            type: "object",
                            description: "JSON object containing the fields and values for the new record. Use get_schema_details to discover available fields. Example for MXWO: {\"description\": \"Pump inspection\", \"siteid\": \"BEDFORD\", \"worktype\": \"CM\"}"
                        }
                    },
                    required: ["objectStructure", "recordData"]
                }
            },
            {
                name: "update_record",
                description: "Update fields on an existing Maximo record using its unique ID. Use query_maximo first to find the record ID. Only the fields you provide will be changed (partial update).",
                inputSchema: {
                    type: "object",
                    properties: {
                        objectStructure: {
                            type: "string",
                            description: "The Object Structure of the record to update (e.g., MXWO, MXASSET)"
                        },
                        recordId: {
                            type: "string",
                            description: "The unique identifier of the record (e.g., the work order number like '1001', or the asset number)"
                        },
                        recordData: {
                            type: "object",
                            description: "JSON object with fields to update. Only fields listed here will be modified. Example: {\"description\": \"Updated description\", \"priority\": 1}"
                        }
                    },
                    required: ["objectStructure", "recordId", "recordData"]
                }
            },
            {
                name: "run_action",
                description: "Execute a Maximo business action on a record (e.g., change status, approve, reject). Actions trigger Maximo workflow rules. Common actions: changeStatus, initiate, approve, reject.",
                inputSchema: {
                    type: "object",
                    properties: {
                        objectStructure: {
                            type: "string",
                            description: "The Object Structure of the record (e.g., MXWO, MXASSET)"
                        },
                        recordId: {
                            type: "string",
                            description: "The unique identifier of the record to act on"
                        },
                        action: {
                            type: "string",
                            description: "The Maximo action name to execute (e.g., 'changeStatus', 'wsmethod:approve'). Check the Maximo documentation for available actions per Object Structure."
                        },
                        actionData: {
                            type: "object",
                            description: "Optional JSON payload for the action (e.g., for changeStatus: {\"status\": \"APPR\", \"memo\": \"Approved via AI\"})"
                        }
                    },
                    required: ["objectStructure", "recordId", "action"]
                }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;

        switch (name) {
            case "list_object_structures":
                return await listObjectStructures(args);
            case "get_schema_details":
                return await getSchemaDetails(args);
            case "query_maximo":
                return await queryMaximo(args);
            case "render_carbon_table":
                return await renderCarbonTable(args);
            case "render_carbon_details":
                return await renderCarbonDetails(args);
            case "get_instance_details":
                return await getInstanceDetails();
            case "create_record":
                return await createRecord(args);
            case "update_record":
                return await updateRecord(args);
            case "run_action":
                return await runAction(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            content: [{ type: "text", text: `Error: ${error.message} ` }],
            isError: true
        };
    }
});

// Start the server
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Maximo MCP Server running on stdio");
}

run().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});

// --- Smithery Sandbox Server Export ---
// This allows Smithery to scan server capabilities without real credentials
function createSandboxServer() {
    return server;
}

module.exports = { createSandboxServer };
