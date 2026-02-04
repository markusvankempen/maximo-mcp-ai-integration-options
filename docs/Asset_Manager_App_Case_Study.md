# Case Study: Building a Maximo Asset Manager with AI and MCP

**Author:** Markus van Kempen  
**Date:** 3 February 2026  
**Application:** Maximo Asset Manager  
**Technology:** Maximo MCP Server + AI-Assisted Development

---

## Executive Summary

This document provides a detailed walkthrough of how we built a **complete web application** to display Maximo Assets using **AI-driven development** powered by the **Maximo MCP Server**. The entire application—from schema discovery to production-ready UI—was created through natural language prompts, with the MCP server providing real-time access to Maximo data and schema information.

**Key Outcomes:**
- 50 assets loaded and displayed
- 3 sites with filter functionality
- Complete search, filter, and detail view capabilities
- Premium dark-themed UI with glassmorphism effects
- Total development time: ~5 minutes

---

## 1. Introduction: The MCP-Powered Workflow

### 1.1 What is the Maximo MCP Server?

The **Model Context Protocol (MCP) Server** acts as a bridge between AI assistants and your Maximo environment. Instead of manually providing API documentation or schema files, the AI can:

1. **Discover APIs** — Find available Object Structures (e.g., `MXASSET`, `MXWO`)
2. **Inspect Schemas** — Retrieve field definitions, types, and descriptions
3. **Query Live Data** — Execute OSLC REST queries and receive real results
4. **Validate Instantly** — Test queries before generating final code

### 1.2 Development Flow Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Prompt   │ ──► │   AI + MCP      │ ──► │  Generated App  │
│  (Natural Lang) │     │  Server Tools   │     │  (HTML/JS/CSS)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Maximo REST API    │
                    │  (Live Data Access) │
                    └─────────────────────┘
```

---

## 2. Step-by-Step Development Process

### Step 1: User Request

**Prompt Given:**
> "I need a screen recording using the @mcp:maximo server to create an app/new HTML website to display assets"

This single prompt initiated the entire development workflow.

---

### Step 2: API Discovery

**MCP Tool Called:** `list_object_structures`

The AI first needed to identify which Maximo API to use for assets.

**Tool Invocation:**
```json
{
  "tool": "mcp_maximo_list_object_structures",
  "parameters": {
    "filter": "asset"
  }
}
```

**Response (Abbreviated):**
```json
[
  { "name": "MXASSET", "title": "ASSET", "description": "ASSET" },
  { "name": "MXAPIASSET", "title": "ASSET", "description": "ASSET" },
  { "name": "PLUSGASSET", "title": "ASSET", "description": "ASSET" },
  // ... 27 more asset-related Object Structures
]
```

**AI Decision:** Selected `MXASSET` as the primary Object Structure for querying assets.

---

### Step 3: Schema Introspection

**MCP Tool Called:** `get_schema_details`

To generate accurate code, the AI needed to know the exact field names and types.

**Tool Invocation:**
```json
{
  "tool": "mcp_maximo_get_schema_details",
  "parameters": {
    "objectStructure": "MXASSET"
  }
}
```

**Response (Key Fields Extracted):**
```json
{
  "name": "MXASSET",
  "description": "ASSET",
  "properties": [
    { "name": "assetnum", "type": "string", "title": "Asset", "maxLength": 25 },
    { "name": "description", "type": "string", "title": "Description", "maxLength": 100 },
    { "name": "status", "type": "string", "title": "Status", "maxLength": 20 },
    { "name": "location", "type": "string", "title": "Location", "maxLength": 12 },
    { "name": "siteid", "type": "string", "title": "Site", "maxLength": 8 },
    { "name": "isrunning", "type": "boolean", "title": "Asset Up" },
    { "name": "assettype", "type": "string", "title": "Asset Type" },
    { "name": "installdate", "type": "string", "title": "Installation Date" },
    { "name": "failurecode", "type": "string", "title": "Failure Class" }
    // ... 150+ additional fields available
  ]
}
```

**AI Decision:** Selected these fields for the UI:
- `assetnum` — Primary identifier
- `description` — Asset name/details
- `status` — Operating status (OPERATING, NOT READY, etc.)
- `location` — Physical location code
- `siteid` — Site identifier (BEDFORD, FLEET, LAREDO)
- `isrunning` — Boolean running indicator

---

### Step 4: Live Data Query

**MCP Tool Called:** `query_maximo`

The AI queried Maximo to retrieve actual asset data for the application.

**Tool Invocation:**
```json
{
  "tool": "mcp_maximo_query_maximo",
  "parameters": {
    "objectStructure": "mxasset",
    "select": "assetnum,description,status,assettype,location,siteid,isrunning",
    "pageSize": 50,
    "formatted": false
  }
}
```

**Response Summary:**
```json
{
  "count": 50,
  "records": [
    {
      "assetnum": "A6002",
      "description": "Highway Tractor, Class 8 Truck, Cummins M11, Spic",
      "status": "NOT READY",
      "location": "DALTERM",
      "siteid": "FLEET",
      "isrunning": true
    },
    {
      "assetnum": "1001",
      "description": "Centrifugal Pump- 100GPM/50PSI",
      "status": "OPERATING",
      "location": "BR300",
      "siteid": "BEDFORD",
      "isrunning": true
    },
    // ... 48 more assets
  ]
}
```

**Data Analysis Performed by AI:**
- **Total Assets:** 50
- **Running Assets:** 46
- **Not Ready Assets:** 9
- **Unique Sites:** 3 (BEDFORD, FLEET, LAREDO)

---

### Step 5: Application Generation

With schema knowledge and sample data, the AI generated a complete HTML application.

**Generated File:** `assets.html`

**Key Components Created:**

#### A. Statistics Dashboard
```html
<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <!-- Total Assets Card -->
    <div class="glass-card rounded-2xl p-6">
        <p class="text-slate-400 text-sm">Total Assets</p>
        <p id="totalAssets" class="text-3xl font-bold text-white">50</p>
    </div>
    <!-- Running, Not Ready, Sites cards... -->
</div>
```

#### B. Search and Filter Controls
```html
<input type="text" id="searchInput" 
       placeholder="Search assets by number or description...">
<select id="siteFilter">
    <option value="">All Sites</option>
    <option value="BEDFORD">BEDFORD</option>
    <option value="FLEET">FLEET</option>
    <option value="LAREDO">LAREDO</option>
</select>
```

#### C. Data Table with Status Badges
```javascript
// Status color mapping based on schema understanding
function getStatusColor(status) {
    const colors = {
        'OPERATING': 'bg-emerald-500/20 text-emerald-400',
        'NOT READY': 'bg-amber-500/20 text-amber-400',
        'BROKEN': 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-slate-500/20';
}
```

#### D. Pre-loaded Data (Fallback)
The AI embedded the 50 queried assets directly in the HTML as a fallback when the API is unavailable:

```javascript
const PRELOADED_ASSETS = [
    { assetnum: "A6002", description: "Highway Tractor...", status: "NOT READY", siteid: "FLEET", isrunning: true },
    { assetnum: "1001", description: "Centrifugal Pump...", status: "OPERATING", siteid: "BEDFORD", isrunning: true },
    // ... 48 more assets from MCP query
];

const PRELOADED_SITES = ["BEDFORD", "FLEET", "LAREDO"];
```

---

### Step 6: User Refinement

**Second Prompt:**
> "I think we need to load the 'Sites' for selection and the first 50 available assets"

**AI Response:**
The AI re-queried the MCP server to ensure complete data was embedded, then updated the HTML to include:
1. Pre-populated site dropdown with BEDFORD, FLEET, LAREDO
2. All 50 assets embedded as fallback data
3. Graceful API fallback logic

---

## 3. MCP Server Tools Summary

| Tool | Purpose | Times Called |
|------|---------|--------------|
| `list_object_structures` | Find asset-related APIs | 1 |
| `get_schema_details` | Retrieve MXASSET field definitions | 1 |
| `query_maximo` | Fetch 50 live assets | 2 |

**Total MCP Interactions:** 4 tool calls

---

## 4. Generated Application Features

### 4.1 User Interface

![Maximo Asset Manager - Full Dashboard](../images/assets_loaded.png)

**Features Visible:**
- Gradient header with glassmorphism effect
- 4 statistics cards with live counts
- Search input with icon
- Site and Status dropdown filters
- Responsive data table with hover effects
- Running status indicators (green dots)
- Status badges with color coding

---

### 4.2 Search Functionality

![Search Results for "pump"](../images/pump_search_results.png)

**Demonstration:**
- User typed "pump" in search field
- Instant filtering reduced 50 assets to 2 matches:
  - `1001` - Centrifugal Pump- 100GPM/50PSI
  - `20100` - Fire Pump- 1500GPM/150PSI
- All other assets hidden in real-time

---

### 4.3 Site Filter

![LAREDO Site Filter Applied](../images/laredo_filtered.png)

**Demonstration:**
- User selected "LAREDO" from Site dropdown
- Table now shows only LAREDO assets:
  - L12510 - STAMPING MACH
  - L11100 - CNC Lathe- 4 Axis
  - L11200 - MASTERCAM LATHE
  - L12100 - Press Brake- 200 Ton
  - ... and more

---

### 4.4 Detail Panel

The application includes a slide-in detail panel that appears when clicking any asset row:

```javascript
function showDetail(asset) {
    const panel = document.getElementById('detailPanel');
    content.innerHTML = `
        <h3>${asset.assetnum}</h3>
        <p>${asset.description}</p>
        <div>Status: ${asset.status}</div>
        <div>Location: ${asset.location}</div>
        <div>Site: ${asset.siteid}</div>
        <div>Running: ${asset.isrunning ? 'Yes' : 'No'}</div>
    `;
    panel.classList.remove('translate-x-full');
}
```

---

## 5. Screen Recording

A complete video demonstration of the application workflow has been captured:

**Recording File:** [`assets_demo_recording.webp`](../images/assets_demo_recording.webp)

**Recording Contents:**
1. Initial page load with 50 assets
2. Scrolling through the asset table
3. Opening the Site dropdown filter
4. Clicking an asset to view details
5. Closing the detail panel
6. Searching for "pump"
7. Filtering by LAREDO site
8. Demonstrating responsive interactions

---

## 6. Technical Implementation Details

### 6.1 File Structure

```
Maximo-MCP-EDF/
├── maximo-mcp-server.js         # MCP Server implementation
├── server.js                    # Local proxy server
├── demos/
│   └── assets.html              # Main application (generated)
├── images/
│   ├── assets_demo_recording.webp   # Screen recording
│   ├── assets_loaded.png        # Screenshot: Full dashboard
│   ├── pump_search_results.png  # Screenshot: Search demo
│   └── laredo_filtered.png      # Screenshot: Filter demo
└── docs/
    └── Asset_Manager_App_Case_Study.md  # This document
```

### 6.2 Technologies Used

| Technology | Purpose |
|------------|---------|
| **Tailwind CSS** | Utility-first styling via CDN |
| **Lucide Icons** | SVG icon library |
| **Inter Font** | Google Fonts typography |
| **Vanilla JavaScript** | No framework dependencies |
| **Maximo OSLC API** | Data source |

### 6.3 OSLC Query Generated

The AI constructed this query based on schema knowledge:

```
GET /maximo/api/os/mxasset
    ?oslc.select=assetnum,description,status,assettype,location,siteid,isrunning
    &oslc.pageSize=50
    &lean=1
```

---

## 7. Benefits of MCP-Driven Development

### 7.1 Traditional Approach vs. MCP Approach

| Aspect | Traditional | MCP-Powered |
|--------|-------------|-------------|
| **Schema Discovery** | Manual Swagger review | Automatic via `list_object_structures` |
| **Field Names** | Copy from documentation | Retrieved via `get_schema_details` |
| **Sample Data** | Create mock data | Live data via `query_maximo` |
| **Validation** | Deploy and test | Instant query execution |
| **Development Time** | Hours | Minutes |

### 7.2 Key Advantages Demonstrated

1. **Zero Documentation Lookup** — The AI knew that `isrunning` was the correct field for running status because MCP provided the schema.

2. **Accurate Data Types** — Status values like "OPERATING" and "NOT READY" came directly from live Maximo data, not guesses.

3. **Real Site Names** — BEDFORD, FLEET, LAREDO were extracted from actual asset records, ensuring the filter works correctly.

4. **Embedded Fallback** — The 50 assets were embedded in the HTML, allowing the demo to work even without API connectivity.

---

## 8. Conclusion

This case study demonstrates the power of **AI-assisted development with MCP integration**. By providing the AI with direct access to Maximo's schema and data through the MCP Server, we achieved:

- **Rapid Development** — Complete application in ~5 minutes
- **Accurate Code** — Field names and data types guaranteed correct
- **Production-Ready UI** — Premium design with glassmorphism, animations, and responsive layout
- **Live Data Integration** — Real assets from Maximo, not mock data

The Maximo MCP Server transforms the AI from a "smart guesser" into a **connected development partner** with direct access to your enterprise data.

---

## Appendix A: Complete MCP Tool Calls Log

### Call 1: list_object_structures
```json
{
  "filter": "asset"
}
// Returned 30 asset-related Object Structures
```

### Call 2: get_schema_details
```json
{
  "objectStructure": "MXASSET"
}
// Returned 150+ field definitions
```

### Call 3: query_maximo (Initial)
```json
{
  "objectStructure": "mxasset",
  "select": "assetnum,description,status,assettype,location,siteid,isrunning",
  "pageSize": 15
}
// Returned 15 sample assets
```

### Call 4: query_maximo (Full Load)
```json
{
  "objectStructure": "mxasset",
  "select": "assetnum,description,status,assettype,location,siteid,isrunning",
  "pageSize": 50
}
// Returned 50 assets for embedding
```

---

## Appendix B: Assets Retrieved

| # | Asset Number | Description | Status | Site |
|---|--------------|-------------|--------|------|
| 1 | A6002 | Highway Tractor, Class 8 Truck | NOT READY | FLEET |
| 2 | L12510 | STAMPING MACH | NOT READY | LAREDO |
| 3 | 1001 | Centrifugal Pump- 100GPM/50PSI | OPERATING | BEDFORD |
| 4 | 1002 | Overhead Crane- Loss #1-5ton | OPERATING | BEDFORD |
| 5 | 11200 | Substation- Loss #1 Primary Feed | OPERATING | BEDFORD |
| ... | ... | ... | ... | ... |
| 50 | L17200 | Forklift- 10000lb Propane | OPERATING | LAREDO |

*Full list of 50 assets embedded in `assets.html`*
