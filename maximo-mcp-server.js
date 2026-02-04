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
require('dotenv').config();

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
const MAXIMO_URL = process.env.MAXIMO_URL;
const API_KEY = process.env.MAXIMO_API_KEY;
const OPENAPI_FILE = process.env.MAXIMO_OPENAPI_PATH || path.join(__dirname, 'maximo_openapi.json');

// Validate required environment variables
if (!MAXIMO_URL || !API_KEY) {
    console.error("ERROR: Missing required environment variables.");
    console.error("Please set MAXIMO_URL and MAXIMO_API_KEY in your .env file or MCP config.");
    console.error("See .env.example for reference.");
}


// --- State ---
let openApiSpec = null;

// --- Load Schema ---
try {
    if (fs.existsSync(OPENAPI_FILE)) {
        console.error(`Loading OpenAPI spec from ${OPENAPI_FILE}...`);
        const raw = fs.readFileSync(OPENAPI_FILE, 'utf-8');
        openApiSpec = JSON.parse(raw);
        console.error(`Loaded OpenAPI spec. Components: ${Object.keys(openApiSpec.components?.schemas || {}).length}`);
    } else {
        console.error("Warning: maximo_openapi.json not found. Schema introspection will be limited.");
    }
} catch (e) {
    console.error("Error loading OpenAPI spec:", e);
}

// --- Server Setup ---
const server = new Server(
    {
        name: "maximo-mcp-server",
        version: "1.0.0",
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
    if (!openApiSpec || !openApiSpec.components || !openApiSpec.components.schemas) {
        return { content: [{ type: "text", text: "OpenAPI spec not loaded or invalid." }] };
    }

    const schemas = openApiSpec.components.schemas;
    const results = Object.keys(schemas)
        .filter(key => key.startsWith('RESOURCE_')) // Filter for Resources usually maps to OS
        .map(key => {
            const def = schemas[key];
            return {
                name: key.replace('RESOURCE_', ''),
                title: def.title || key,
                description: def.description || ''
            };
        })
        .filter(item => !filter || item.name.toLowerCase().includes(filter.toLowerCase()) || item.description.toLowerCase().includes(filter.toLowerCase()))
        .slice(0, 50); // Limit results

    return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
    };
}

/**
 * Tool: get_schema_details
 * Gets the property definition for a specific Object Structure
 */
async function getSchemaDetails({ objectStructure }) {
    if (!openApiSpec) {
        return { content: [{ type: "text", text: "OpenAPI spec not loaded." }] };
    }

    // Maximo OpenAPI often names resource schemas as RESOURCE_{NAME}
    const schemaName = `RESOURCE_${objectStructure.toUpperCase()}`;
    const schema = openApiSpec.components?.schemas?.[schemaName];

    if (!schema) {
        return { content: [{ type: "text", text: `Schema for ${objectStructure} not found.` }] };
    }

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
            return {
                content: [{ type: "text", text: `Error ${response.status}: ${response.statusText}` }],
                isError: true
            };
        }

        const data = await response.json();

        // Extract relevant member data
        const members = data.member || [];
        const result = {
            totalCount: data.responseInfo?.totalCount,
            nextPage: data.responseInfo?.nextPage?.href,
            count: members.length,
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
