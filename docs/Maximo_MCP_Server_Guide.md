# Maximo MCP Comprehensive Guide: AI-Driven Development

**Author:** Markus van Kempen  
**Date:** 3 Feb 2026

---

## 1. Introduction

This comprehensive guide details how to leverage the **Maximo Model Context Protocol (MCP) Server** to transform Maximo development. Unlike traditional methods that rely on static documentation, the MCP server empowers AI Assistants to actively interact with your Maximo environment, enabling schema introspection, live data querying, and intelligent code generation.

### 1.1 What is the Model Context Protocol (MCP)?
MCP is an open standard that allows AI models to communicate with external systems via a defined set of "tools." In this context, the `maximo-mcp-server.js` acts as a bridge, exposing Maximo capabilities to any MCP-compatible AI IDE.

### 1.2 Key Benefits
*   **Automated Schema Knowledge**: The AI no longer relies on generic training data. It **introspects** your specific Maximo configuration to understand available Object Structures and their fields.
*   **Live Data Validation**: Queries can be executed immediately to verify correctness, eliminating the "code-deploy-debug" cycle.
*   **Multi-Format Code Generation**: Generate OSLC API calls, Python scripts, or SQL queries from the same natural language request.

### 1.3 Why Use an MCP Server vs. Direct Approach?

You might wonder: "Why not just paste the Swagger documentation into the chat, or provide API examples directly?" Here's why the MCP approach is superior:

| Aspect | Direct Approach (Manual Context) | MCP Server Approach |
| :--- | :--- | :--- |
| **Context Size** | Limited by token window; large schemas get truncated | Schema loaded server-side; AI queries specific parts on demand |
| **Data Freshness** | Static; copy-pasted docs become stale | **Dynamic**; always reflects current Maximo configuration |
| **Validation** | AI guesses; errors found at runtime | AI can **test queries live** and auto-correct before you see them |
| **Security** | API keys may be pasted into chat (risky) | Keys stored in local config; **never sent to LLM provider** |
| **Effort** | Manual copy/paste for every session | **Zero effort** after initial setup; context is automatic |
| **Consistency** | Varies by what you remember to include | Standardized tool interface; same capabilities every time |

**Example: Finding the right field name**

*   **Direct Approach**: You paste a 500-line schema excerpt and ask "What's the field for work order priority?" The AI scans the text and *hopes* it's complete.
*   **MCP Approach**: The AI calls `get_schema_details(objectStructure: "MXWO")`, receives the authoritative field list directly from the OpenAPI spec, and responds with `wopriority` — guaranteed correct.

**Bottom Line**: The MCP server transforms the AI from a "smart guesser" into a "connected assistant" with direct access to your Maximo environment.

---

## 2. Prerequisites & Installation

### 2.1 Prerequisites
Before configuring the MCP server, ensure the following are in place:
*   **Node.js**: Version 18 or higher installed locally (`node --version`).
*   **Maximo API Key**: A valid API key with at least read-only access to the desired Object Structures (e.g., `MXWO`, `MXASSET`).
*   **OpenAPI Schema (Recommended)**: A local `maximo_openapi.json` file for faster schema lookups.

### 2.2 Installing Dependencies

Navigate to the project directory and install the required Node.js packages:

```bash
cd /path/to/Maximo-MCP-EDF

# Install dependencies
npm install
```

The `maximo-mcp-server.js` requires the following packages (defined in `package.json`):
*   `@modelcontextprotocol/sdk` — The MCP SDK for Node.js
*   `zod` — Schema validation library

---

## 3. Configuring the MCP Server in Your IDE

### 2.3 The OpenAPI Schema File (`maximo_openapi.json`)

The **OpenAPI schema file** is a critical component that enables the MCP server to understand your Maximo environment's data structures without making live API calls for every request.

#### What is it?

The `maximo_openapi.json` file is an **OpenAPI 3.0 specification** that describes all available Object Structures, their fields, data types, and relationships in your Maximo instance. This file:

- Contains **definitions for 1000+ Object Structures** (MXWO, MXASSET, MXSR, etc.)
- Includes **field-level details**: names, types, max lengths, descriptions
- Enables **offline schema lookups** for faster AI responses
- Is specific to **your Maximo configuration** (including custom fields)

#### Why is it important?

| Without OpenAPI File | With OpenAPI File |
|---------------------|-------------------|
| AI makes live API calls for every schema lookup | Schema lookups are instant (local file read) |
| Slower response times | Sub-second schema queries |
| Requires network connectivity for schema info | Works offline for schema introspection |
| Higher load on Maximo server | Zero server load for schema queries |

#### How to Obtain the OpenAPI Schema

You can download the OpenAPI specification directly from your Maximo instance:

**Method 1: Via Browser (Swagger UI)**

1. Navigate to your Maximo Swagger UI:
   ```
   https://[YOUR_MAXIMO_HOST]/maximo/oslc/oas/api.html
   ```

2. Click the **Download** or **Export** button (usually shows OpenAPI JSON)

3. Save the file as `maximo_openapi.json` in your project directory

**Method 2: Via cURL Command**

```bash
curl -X GET "https://[YOUR_MAXIMO_HOST]/maximo/oslc/oas/api" \
     -H "apikey:[YOUR_API_KEY]" \
     -H "Accept: application/json" \
     -o maximo_openapi.json
```

**Method 3: Via Authenticated URL**

Open this URL in your browser while authenticated to Maximo:
```
https://[YOUR_MAXIMO_HOST]/maximo/oslc/oas/api
```

Right-click and "Save As" → `maximo_openapi.json`

#### File Size Note

The OpenAPI file is typically **10-15 MB** due to the comprehensive schema definitions. This is normal and expected. The file is read once when the MCP server starts and cached in memory.

#### Keeping the Schema Updated

If you add custom fields or Object Structures to Maximo, re-download the OpenAPI file to ensure the AI has access to the latest schema information.

```bash
# Example: Update schema weekly via cron
0 0 * * 0 curl -X GET "https://your-host/maximo/oslc/oas/api" \
    -H "apikey:$MAXIMO_API_KEY" -o /path/to/maximo_openapi.json
```

---

### 3.1 Configuration for Antigravity (Google)

Antigravity uses a settings file located in your project's `.gemini` directory.

**Step 1: Create the settings file**
```bash
mkdir -p .gemini
touch .gemini/settings.json
```

**Step 2: Add the MCP configuration**

Edit `.gemini/settings.json` and add:

```json
{
  "mcpServers": {
    "maximo": {
      "command": "node",
      "args": [
        "/Users/markusvankempen/projects/Maximo-MCP-EDF/maximo-mcp-server.js"
      ],
      "env": {
        "MAXIMO_URL": "https://[YOUR_MAXIMO_HOST]/maximo/api",
        "MAXIMO_API_KEY": "[YOUR_API_KEY]",
        "MAXIMO_OPENAPI_PATH": "/Users/markusvankempen/projects/Maximo-MCP-EDF/maximo_openapi.json"
      }
    }
  }
}
```

**Step 3: Restart Antigravity**

Close and reopen your Antigravity session. The MCP server will be available as "maximo" in your tools list.

---

### 3.2 Configuration for Cursor

Cursor uses a global MCP configuration file.

**Step 1: Locate the settings file**
*   **macOS**: `~/.cursor/mcp.json`
*   **Windows**: `%USERPROFILE%\.cursor\mcp.json`
*   **Linux**: `~/.cursor/mcp.json`

**Step 2: Create or edit the file**

```bash
# macOS/Linux
mkdir -p ~/.cursor
nano ~/.cursor/mcp.json
```

**Step 3: Add the MCP configuration**

```json
{
  "mcpServers": {
    "maximo": {
      "command": "node",
      "args": [
        "/Users/markusvankempen/projects/Maximo-MCP-EDF/maximo-mcp-server.js"
      ],
      "env": {
        "MAXIMO_URL": "https://[YOUR_MAXIMO_HOST]/maximo/api",
        "MAXIMO_API_KEY": "[YOUR_API_KEY]",
        "MAXIMO_OPENAPI_PATH": "/Users/markusvankempen/projects/Maximo-MCP-EDF/maximo_openapi.json"
      }
    }
  }
}
```

**Step 4: Restart Cursor**

Restart Cursor for the changes to take effect.

---

### 3.3 Configuration for VS Code (with Copilot/Continue)

For VS Code with MCP-compatible extensions like **Continue**, use the extension's settings.

**Step 1: Open VS Code Settings**

Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux) and search for "Continue: Open Settings".

**Step 2: Add MCP Server Configuration**

In the Continue configuration file (`~/.continue/config.json`), add:

```json
{
  "mcpServers": [
    {
      "name": "maximo",
      "command": "node",
      "args": ["/Users/markusvankempen/projects/Maximo-MCP-EDF/maximo-mcp-server.js"],
      "env": {
        "MAXIMO_URL": "https://[YOUR_MAXIMO_HOST]/maximo/api",
        "MAXIMO_API_KEY": "[YOUR_API_KEY]",
        "MAXIMO_OPENAPI_PATH": "/Users/markusvankempen/projects/Maximo-MCP-EDF/maximo_openapi.json"
      }
    }
  ]
}
```

---

### 3.4 Environment Variables Reference

The `maximo-mcp-server.js` reads the following environment variables:

| Variable | Required | Description | Default |
| :--- | :--- | :--- | :--- |
| `MAXIMO_URL` | Yes | Base URL for the Maximo REST API | (none - must be set) |
| `MAXIMO_API_KEY` | Yes | API Key for authentication | (none - must be set) |
| `MAXIMO_OPENAPI_PATH` | No | Path to local OpenAPI schema file | `./maximo_openapi.json` |

---

### 3.5 Verifying the Setup

After configuration, verify the MCP server is working:

**Method 1: Ask the AI**
> "Is the Maximo MCP server connected?"

The AI should respond by calling `get_instance_details` and confirming connectivity.

**Method 2: Run Manually**

Test the server directly from the command line:

```bash
node /path/to/Maximo-MCP-EDF/maximo-mcp-server.js
```

You should see output like:
```
Loading OpenAPI spec from /path/to/maximo_openapi.json...
Loaded OpenAPI spec. Components: 1247
Maximo MCP Server running on stdio
```

![MCP Configuration](MCPConfig.png)

> **Key Benefit**: Once configured, the MCP setup automatically handles **Schema Knowledge** and **API Connectivity**. You do not need to manually feed the AI Swagger files or API documentation; the MCP server proactively retrieves this context for every request.

---

## 4. Available MCP Tools

The Maximo MCP Server exposes the following tools to the AI agent:

| Tool Name | Description | Example Use Case |
| :--- | :--- | :--- |
| `list_object_structures` | Searches the available Maximo APIs by name or description. | "What APIs are available for Assets?" |
| `get_schema_details` | Retrieves detailed field definitions (type, length, title) for a specific Object Structure. | "What fields are on the MXWO object?" |
| `query_maximo` | Executes a live OSLC REST query against the Maximo instance. | "Get the last 5 approved work orders." |
| `get_instance_details` | Checks server connectivity and retrieves meta-information like latest work order date. | "Is the Maximo server reachable?" |
| `render_carbon_table` | Generates an interactive HTML table (Carbon Design System) from query results. | "Show me a table of open work orders." |
| `render_carbon_details` | Generates a detailed HTML view for a single record. | "Show me the details for work order 1001." |

---

## 5. Code Generation from Natural Language

The MCP server acts as the "eyes and ears" of the AI, allowing it to translate vague natural language into precise technical operations by inspecting the actual Maximo configuration.

### 4.1 The Workflow
1.  **User Request**: "Find all pumps that failed last month."
2.  **Schema Discovery**: The AI calls `list_object_structures` to find relevant APIs (e.g., `MXASSET`, `MXWO`).
3.  **Field Mapping**: It calls `get_schema_details` to understand the data structure (e.g., confirming `assetnum`, `description`, `failurecode`).
4.  **Code Generation**: It generates the correct query or code block.

### 4.2 The AI-Assisted Interface
The AI doesn't just guess; it **verifies**. By having access to the live schema, the AI Interface can:
*   **Autocomplete** field names based on the actual object structure.
*   **Validate** that a specific relationship exists before suggesting it.
*   **Contextualize** answers, distinguishing between a "Work Order" (`MXWO`) and a "Service Request" (`MXSR`).

![AI IDE Interface](Antigravity-Cursor-VSCode.png)

---

## 6. Generating Multi-Format Code (Scripts, SQL, API)

One of the most powerful features of the MCP integration is the ability to generate **context-aware code** in multiple formats, ensuring alignment with the Target Data Structure.

### A. OSLC REST API Calls
*   **Context**: Web Apps, Integrations (Postman/Curl).
*   **Process**: The AI checks `get_schema_details` to identify the correct OSLC query parameters.
*   **Example Prompt**: "Get approved work orders with their asset numbers."
*   **Example Output**:
    ```http
    GET /maximo/api/os/mxwo?oslc.where=status="APPR"&oslc.select=wonum,description,assetnum,reportdate&lean=1
    ```

### B. Python/Node.js Scripts
*   **Context**: Automation, Data Migration, Batch Processing.
*   **Process**: The AI constructs robust scripts using libraries like `requests` or `axios`, injecting the correct field names and error handling logic derived from the schema.
*   **Example Prompt**: "Write a Python script to fetch all work orders from this year and export them to CSV."
*   **Example Output** (Python):
    ```python
    import requests
    import csv

    MAXIMO_URL = "https://your-host/maximo/api/os/mxwo"
    headers = {"apikey": "YOUR_API_KEY"}

    # AI knows 'reportdate' is the correct field from schema introspection
    params = {
        'oslc.where': 'reportdate>="2026-01-01"',
        'oslc.select': 'wonum,description,status,reportdate',
        'lean': 1
    }

    response = requests.get(MAXIMO_URL, params=params, headers=headers)
    data = response.json().get('member', [])

    with open('work_orders.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['wonum', 'description', 'status', 'reportdate'])
        writer.writeheader()
        writer.writerows(data)
    
    print(f"Exported {len(data)} work orders.")
    ```

### C. SQL Queries
*   **Context**: Analytics, BIRT Reports, Database Administration.
*   **Process**: By understanding the underlying Object Structure capabilities, the AI can infer the database schema and generate ANSI SQL.
*   **Example Prompt**: "Write SQL to find overdue work orders."
*   **Example Output**:
    ```sql
    -- AI infers table names from Object Structure backing tables
    SELECT wonum, description, status, targcompdate
    FROM workorder 
    WHERE status NOT IN ('COMP', 'CLOSE', 'CAN')
      AND targcompdate < CURRENT_DATE;
    ```

---

## 7. Execution, Simulation, & Refinement

The MCP server bridges the gap between *writing* code and *running* it. It allows for an interactive loop of execution, visualization, and refinement.

### 6.1 Execution & Test
*   **Tool**: `query_maximo`
*   **Action**: The AI can execute the generated query immediately to verify it returns results.
*   **Benefit**: "Fail Fast." If the query returns a 400 error (e.g., invalid field), the AI sees the error message and auto-corrects the code *before* showing it to you.

### 6.2 Simulation (UI Generation)
*   **Tool**: `render_carbon_table` / `render_carbon_details`
*   **Action**: Instead of showing raw JSON, the AI renders the data into a **Carbon Design System** HTML table with sorting and filtering.
*   **Benefit**: Stakeholders can visually inspect the data structure and content quality (e.g., "Oh, the description field is empty for these records") without needing a deployed frontend.

![Carbon UI Example](WorkOrderCarbonAPI.png)

### 6.3 Conversational Refinement
Because the AI has context, you can refine the output conversationally:

| Turn | User Prompt | AI Response |
| :--- | :--- | :--- |
| 1 | "Get me the work orders." | Calls `query_maximo` and shows a list. |
| 2 | "It's too messy. Sort by newest first." | Adds `oslc.orderBy="-reportdate"`. Re-runs query. |
| 3 | "Add the site ID column." | Checks schema, finds `siteid`, adds to `oslc.select`. Updates table. |
| 4 | "Filter only for BEDFORD site." | Adds `siteid="BEDFORD"` to `oslc.where`. Re-runs. |

---

## 8. Real-World Walkthrough: Creating a Custom Dashboard

Let's walk through a typical use case from start to finish.

**Goal**: Build a simple HTML dashboard showing the last 10 high-priority work orders.

### Step 1: Discover the API
> **User**: "What's the API for work orders?"

**AI**: Calls `list_object_structures(filter: "work order")` and responds:
> "The primary Object Structure for Work Orders is **MXWO**."

### Step 2: Understand the Schema
> **User**: "What fields are available on MXWO for priority and dates?"

**AI**: Calls `get_schema_details(objectStructure: "MXWO")` and responds:
> "Key fields include: `wopriority` (integer), `reportdate` (datetime), `targstartdate` (datetime), `status` (string)."

### Step 3: Query Live Data
> **User**: "Show me the top 10 priority 1 work orders, sorted by report date."

**AI**: Calls `query_maximo` with the constructed query and displays the results.

### Step 4: Generate the UI
> **User**: "Now build me a dark-themed HTML page to display this data."

**AI**: Generates a complete `index.html` file using Tailwind CSS with dark mode, fetching from the Maximo API via the local proxy server.

---

## 9. Security & Best Practices

*   **Local Execution**: The MCP server runs locally on your machine. Your API Key is stored in your local configuration and is not sent to the LLM provider's servers; only the *results* of the queries are.
*   **Read-Only Access**: For development, it is recommended to use an API Key with limited permissions (e.g., Read-Only) to prevent accidental data modification during AI experimentation.
*   **Schema Caching**: The server uses a local `maximo_openapi.json` to speed up schema lookups and reduce load on the Maximo server.
*   **Environment Variables**: Never hardcode API keys. Use environment variables in the MCP config as shown.

---

## 10. Summary

| Feature | Without MCP | With Maximo MCP |
| :--- | :--- | :--- |
| **Knowledge** | Static (Training Data cut-off) | **Dynamic (Live Schema Access)** |
| **Validation** | Guess & Check | **Introspect & Verify** |
| **Output** | Code Snippets | **Executed Queries & Visual UIs** |
| **Refinement** | Manual debugging | **Conversational Auto-correction** |

This workflow transforms the IDE from a text editor into a **Maximo command center**, reducing development time and errors significantly.
