# Maximo API Interaction & AI Workflow Guide

**Author:** Markus van Kempen  
**Email:** mvankempen@ca.ibm.com | markus.van.kempen@gmail.com  
**Date:** 5 Feb 2026

---

## Introduction

This document is a comprehensive guide for developers, integrators, and Maximo administrators who want to leverage **AI-assisted development** to interact with the Maximo REST API. It covers:
*   Locating and understanding API documentation
*   Generating code (API calls, scripts, SQL) from natural language
*   Testing, simulating, and refining code through conversational AI
*   Building custom UI applications

**Target Audience**: Maximo Developers, Integration Specialists, and anyone working with the Maximo OSLC REST API.

---

## 1. Prerequisites

Before using this guide, ensure you have:
*   **Maximo Instance Access**: A running Maximo instance with the REST API enabled.
*   **API Key**: A valid Maximo API Key with appropriate permissions. Create this via *Security > API Keys* in Maximo.
*   **Node.js** (v18+): Required for running the local proxy server.
*   **AI IDE** (Optional but Recommended): Cursor, Windsurf, Antigravity, or VS Code with Copilot.

---

## 2. Documentation & Resources

To effectively interact with Maximo, we use the following key resources:

### A. Swagger/OpenAPI Documentation
The Swagger UI provides interactive API documentation.

*   **URL Pattern**: `https://[YOUR_MAXIMO_HOST]/maximo/oslc/oas/api.html`
*   **Usage**: Browse Object Structures, try out queries, and view response schemas.

### B. Schema Retrieval Commands
Automate retrieval of the full OpenAPI definition for offline analysis or AI context.

```bash
curl -X GET "https://[YOUR_MAXIMO_HOST]/maximo/api/oas/api.json" \
     -H "apikey: [YOUR_API_KEY]" \
     -H "Content-Type: application/json" \
     -o maximo_openapi.json
```

### C. API Request Examples
Standard template for authenticated API requests.

```bash
curl -X GET "https://[YOUR_MAXIMO_HOST]/maximo/api/os/mxwo?oslc.pageSize=10&lean=1" \
     -H "apikey: [YOUR_API_KEY]" \
     -H "Content-Type: application/json"
```

### D. External References
*   [IBM Maximo Manage REST API](https://developer.ibm.com/apis/catalog/maximo--maximo-manage-rest-api/Introduction) — Official IBM documentation.

---

## 3. OSLC Query Syntax Reference

The Maximo API uses **OSLC (Open Services for Lifecycle Collaboration)** query parameters. Understanding these is critical.

| Parameter | Description | Example |
| :--- | :--- | :--- |
| `oslc.where` | Filter records using a condition | `status="APPR"` |
| `oslc.select` | Specify which fields to return | `wonum,description,status` |
| `oslc.orderBy` | Sort results; `-` prefix for descending | `-reportdate` |
| `oslc.pageSize` | Limit number of records returned | `10` |
| `lean` | Return simplified JSON (no metadata) | `1` |

**Combining Conditions (`oslc.where`):**
*   **AND**: `status="APPR" and siteid="BEDFORD"`
*   **OR**: `status="APPR" or status="INPRG"`
*   **Comparison**: `wopriority<=2` or `reportdate>="2026-01-01"`
*   **LIKE**: `description like "%pump%"` (wildcard search)

---

## 4. Demonstrating Code Generation from Natural Language & AI Interface

This section explains how the **AI Editor demonstrates code generation** from simple text instructions.

### 4.1 The Workflow
The AI bridges business requirements and technical implementation:

1.  **Natural Language Processing**: The Editor interprets high-level instructions (e.g., "Find all pumps that failed last month") and maps them to specific Maximo artifacts.
2.  **Context-Aware Interface**: By referencing the Swagger API Definition, the AI maintains "schema awareness." It knows that a "Work Order" corresponds to `MXWO` and that "Priority 1" maps to `wopriority=1`.
3.  **Benefits**: This eliminates manual lookup of column names and API endpoints.

![AI IDE Interface](Antigravity-Cursor-VSCode.png)

### 4.2 Universal Applicability
While this guide references specific tools, the core workflow is **generic** and platform-agnostic:
*   **AI Assistants**: Antigravity, Cursor, Windsurf, VS Code Copilot, or any LLM-driven coding environment.
*   **Languages**: Python, JavaScript, Java, Go, or any language with HTTP support.

---

## 5. Generating Different Code Types (Scripts, SQL, API) by Business Context

The AI generates various code artifacts depending on the user's context.

### A. OSLC REST API Calls
*   **Context**: Web Apps, Integrations, Testing (Postman/Curl).
*   **AI Process**: Maps business rules to OSLC query parameters.
*   **Example Prompt**: "Get approved work orders from BEDFORD site"
*   **Example Output**:
    ```http
    GET /maximo/api/os/mxwo?oslc.where=status="APPR" and siteid="BEDFORD"&oslc.select=wonum,description&lean=1
    ```

### B. Python/Node.js Scripts
*   **Context**: Backend automation, data migration, batch processing.
*   **AI Process**: Generates full scripts with authentication, error handling, and iteration logic.
*   **Example Prompt**: "Write a script to fetch all priority 1 work orders and print their descriptions"
*   **Example Output**:
    ```python
    import requests

    url = "https://[YOUR_MAXIMO_HOST]/maximo/api/os/mxwo"
    headers = {"apikey": "[YOUR_API_KEY]"}
    params = {"oslc.where": "wopriority=1", "oslc.select": "wonum,description", "lean": 1}

    response = requests.get(url, headers=headers, params=params)
    for wo in response.json().get('member', []):
        print(f"{wo['wonum']}: {wo.get('description', 'N/A')}")
    ```

### C. SQL Queries
*   **Context**: Direct database inspection, BIRT/Cognos reports, performance tuning.
*   **AI Process**: Translates the logical request into ANSI SQL.
*   **Example Prompt**: "Get overdue work orders"
*   **Example Output**:
    ```sql
    SELECT wonum, description, status, targcompdate
    FROM workorder
    WHERE status NOT IN ('COMP', 'CLOSE', 'CAN')
      AND targcompdate < CURRENT_DATE;
    ```

---

## 6. Executing Tests, Simulations, & Refinement via AI Interaction

The workflow extends beyond generation to include validation and refinement.

### 6.1 Execution & Test
*   **Immediate Validation**: The AI can execute "Safe" operations (GET requests, SELECT queries) immediately.
*   **Error Correction**: If an API call fails (e.g., 400 Bad Request), the AI analyzes the error and auto-corrects the query.

### 6.2 UI Simulation
*   **Visual Verification**: Instead of viewing raw JSON, the AI can render the data into a **Carbon Design System** table.
*   **Benefit**: Stakeholders can "see" the result of the API call in a user-friendly format.

### 6.3 Conversational Refinement
Users can refine output with follow-up prompts:

| Turn | User Prompt | AI Action |
| :--- | :--- | :--- |
| 1 | "Get work orders" | Generates basic query |
| 2 | "Add the reported date" | Adds `reportdate` to `oslc.select` |
| 3 | "Sort by newest first" | Adds `oslc.orderBy="-reportdate"` |
| 4 | "Only show priority 1" | Adds `wopriority=1` to `oslc.where` |

---

## 7. Detailed Task Example

### Task: "Show the last 5 work orders with status In Progress"

#### Step 1: User Request
> "Connect to Maximo and show me the last 5 work orders that are currently In Progress."

#### Step 2: Context Analysis (AI)
*   **Target Object**: `MXWO` (Work Order)
*   **Condition**: `status` = 'INPRG'
*   **Sorting**: By `statusdate` descending
*   **Pagination**: Limit to 5 records

#### Step 3: Generated Artifacts

**A. OSLC REST API Call**
```bash
curl -X GET "https://[YOUR_MAXIMO_HOST]/maximo/api/os/mxwo?oslc.where=status=%22INPRG%22&oslc.orderBy=-statusdate&oslc.pageSize=5&lean=1" \
     -H "apikey: [YOUR_API_KEY]" \
     -H "Content-Type: application/json"
```

**B. SQL Query**
```sql
SELECT wonum, description, status, statusdate
FROM workorder 
WHERE status = 'INPRG' 
ORDER BY statusdate DESC 
FETCH FIRST 5 ROWS ONLY;
```

**C. Python Script**
```python
import requests

url = "https://[YOUR_MAXIMO_HOST]/maximo/api/os/mxwo"
headers = {"apikey": "[YOUR_API_KEY]", "Content-Type": "application/json"}
params = {
    "oslc.where": 'status="INPRG"',
    "oslc.orderBy": "-statusdate",
    "oslc.pageSize": "5",
    "lean": "1"
}

response = requests.get(url, headers=headers, params=params)
if response.status_code == 200:
    for wo in response.json().get('member', []):
        print(f"WO: {wo.get('wonum')} - {wo.get('description')}")
else:
    print(f"Error: {response.status_code} - {response.text}")
```

#### Step 4: Execution & Verification
The AI executes the command and can render the JSON result into a visual table.

---

## 8. Common Errors & Troubleshooting

| Error | Cause | Solution |
| :--- | :--- | :--- |
| `400 Bad Request` | Invalid field name or syntax error in `oslc.where` | Verify field names against the schema. Check for unescaped quotes. |
| `401 Unauthorized` | Invalid or missing API Key | Ensure `apikey` header is correct and has appropriate permissions. |
| `403 Forbidden` | API Key lacks permission for the Object Structure | Request access from your Maximo administrator. |
| `404 Not Found` | Incorrect Object Structure name (e.g., `mxwr` instead of `mxwo`) | Verify the Object Structure name in Swagger. |
| `500 Internal Server Error` | Server-side issue | Check Maximo logs; may indicate a timeout or configuration problem. |
| CORS Error (Browser) | Browser blocking cross-origin requests | Use a local proxy server (see Section 10). |

---

## 9. Building a Custom UI Application

We can go beyond scripts by creating full-featured frontend applications.

### Overview
The file `index.html` serves as a template for turning raw JSON API responses into interactive dashboards.

### AI Prompts for UI Generation

**Prompt 1: Basic Structure**
> "Create a single-file HTML application to visualize Maximo Work Order data. Use Tailwind CSS via CDN for styling and Vanilla JavaScript for logic."

**Prompt 2: Advanced Design**
> "Enhance the design using a dark theme with glassmorphism effects. Implement a Master-Detail view where clicking a work order card on the left updates a detailed view panel on the right."

**Prompt 3: Refining Details**
> "Add Lucide Icons for visual indicators. Include a search/filter input and pagination controls."

### Carbon Design System Example
For a native Maximo look and feel, use the IBM Carbon Design System.

![Carbon UI Example](WorkOrderCarbonAPI.png)

---

## 10. Local Proxy Server Implementation

To bypass CORS restrictions when connecting to the Maximo API from a browser, use a Node.js proxy server.

### Application Architecture
*   **`server.js`**: Express.js server that proxies `/maximo/*` to the actual Maximo host.
*   **`index.html`**: Frontend application fetching live data via the local proxy.

### Running the Application
```bash
# Install dependencies
npm install

# Start the server
node server.js
```

Open your browser to: [http://localhost:3002/](http://localhost:3002/)

### Interface Preview
![Localhost Maximo App](MaxUIAPIv1.png)

---

## 11. Security Best Practices

*   **Never hardcode API Keys** in client-side JavaScript. Use environment variables or server-side proxies.
*   **Use Read-Only Keys** for development to prevent accidental data modification.
*   **HTTPS Only**: Always use HTTPS when communicating with the Maximo API.
*   **Limit Scope**: Request API Keys with access only to the Object Structures you need.
*   **Rotate Keys**: Periodically rotate API Keys and revoke unused ones.

---

## 12. Archive & Knowledge Retention

To ensure these workflows are reusable:
1.  **Save Successful Queries**: Store working OSLC query strings in project documentation.
2.  **Update Examples**: Add new use cases to your API Examples library.
3.  **Schema Cache**: Keep a local copy of the OpenAPI definition for faster AI context loading.
