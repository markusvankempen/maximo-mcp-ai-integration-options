# Maximo MCP Usage Examples

This document provides specific examples of how to use your AI assistant with the Maximo MCP server.

## 1. Querying Work Orders

**Prompt:**
> "Find the 5 most recent work orders that are currently in 'WAPPR' status and show me their descriptions and site IDs."

**Expected AI Action:**
The AI will call `query_maximo` with:
- `objectStructure`: `MXWO`
- `where`: `status="WAPPR"`
- `orderBy`: `reportdate desc`
- `pageSize`: `5`
- `select`: `wonum,description,siteid`

---

## 2. Asset Investigation

**Prompt:**
> "Get all the details for asset number 11430. Does it have any open work orders?"

**Expected AI Action:**
1. Call `get_instance_details` for `MXASSET` with the asset key.
2. Call `query_maximo` for `MXWO` with a filter like `assetnum="11430" and status not in ["CLOSE", "CAN", "COMP"]`.

---

## 3. API Discovery (Schema)

**Prompt:**
> "What fields are available in the 'MXASSET' object structure? Specifically, look for fields related to location or site."

**Expected AI Action:**
The AI will call `get_schema_details` for `MXASSET` and then filter the results to show you location/site fields.

---

## 4. Resource Listing

**Prompt:**
> "List all available object structures in Maximo that have 'PERSON' in their name."

**Expected AI Action:**
The AI will call `list_object_structures` with a filter: `PERSON`.
