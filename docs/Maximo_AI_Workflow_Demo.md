# Maximo API & AI-Assisted Development Demonstration

## Objective
To demonstrate the end-to-end workflow of connecting to Maximo, leveraging Schema/API documentation for context, and using the AI Editor to generate, execute, and refine enterprise code artifacts.

## 1. API Connection & Schema Integration
**Foundation**: The Editor utilizes the basic Model Context Protocol (MCP) to connect directly to the Maximo instance.

- **Schema Discovery**: 
  - The Editor queries the Maximo `OSLC` API to retrieve Object Structures (`MXWO`, `MXASSET`, etc.).
  - *Example Action*: `mcp_maximo_get_schema_details(objectStructure="mxwo")`
  - **Benefit**: This provides the AI with ground-truth definitions (field names, data types, relationships), eliminating hallucinations about the data model.

## 2. Code Generation from Natural Language
**Capability**: The Editor generates syntax-perfect code (Scripts, SQL, API calls) from simple business descriptions.

### Workflow:
1.  **User Request**: "Show me high-priority work orders for the Bedford site."
2.  **Context Analysis**: The AI Maps "high priority" to `wopriority < 2` and "Bedford" to `siteid='BEDFORD'` using the schema cached in Step 1.
3.  **Artifact Generation**:
    - **OSLC Query**: `spi:siteid="BEDFORD" and spi:wopriority < 2`
    - **Python/JS Script**: Generates a script using `fetch` or `requests` to call the Maximo API.
    - **SQL (if applicable)**: Generates the equivalent `SELECT * FROM WORKORDER WHERE...` statement.

## 3. Execution, Test, & Simulation
**Capability**: Immediate validation of generated code within the application context.

- **Live Querying**: The Editor can execute the generated OSLC query immediately to seeing real data.
  - *Tool*: `mcp_maximo_query_maximo`
- **UI Simulation**: 
  - The Editor can render the returned data into a **Carbon Components** table to visualize how it would look in a production application.
  - *Tool*: `mcp_maximo_render_carbon_table`
- **Feedback Loop**: Errors in execution (e.g., "Invalid binding") are caught immediately, allowing the AI to self-correct.

## 4. Refinement & Code Review
**Capability**: Conversational iteration to polish the solution.

- **Iterative Editing**: 
  - *User*: "Add a column for the reported date and sort by newest first."
  - *AI*: Modifies the existing artifact to include `reportdate` in the selection and adds `orderBy="-reportdate"`.
- **Review**: The AI explains the changes ("Added `dcterms:date` field to projection...") and verifying compliance with best practices.

## Summary of Value
This workflow moves beyond simple auto-complete by integrating **Live Schema Awareness** and **Execution capabilities**, effectively turning the Editor into a connected Maximo development console.
