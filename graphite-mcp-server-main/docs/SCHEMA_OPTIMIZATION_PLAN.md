# JSON Schema Tool Optimization Plan

## Current State Analysis

### Problem
The `graphite-get-json-schema-for-object-structure` tool returns **100+ KB** of data for a full schema (e.g., mxapiasset has 155 properties). This is inefficient for LLM token usage and often returns more information than needed.

### Current Schema Structure
Each property in the schema contains:
- `title`: Human-readable name
- `type`: Data type (string, number, array, object, etc.)
- `remarks`: Detailed description
- `searchType`: How the field can be searched (EXACT, WILDCARD, etc.)
- `subType`: Additional type info (DATE, UPPER, ALN, etc.)
- `persistent`: Whether field is stored
- `maxLength`: Maximum length for strings
- `hasList`: Whether field has a list of values
- `objectName`: For nested objects/arrays
- `items`: Schema for array items
- And more...

### Current Behavior
- Full schema (`selection='*'`): ~100 KB for 155 properties
- Partial schema (specific fields): ~2 KB for 3 properties
- Selection parameter already helps but requires knowing field names upfront

## Optimization Strategy

### Approach: Enhanced Single Tool with Multiple Modes

Instead of splitting into multiple tools, enhance the existing tool with mode parameters similar to how we optimized component properties. This maintains simplicity while adding flexibility.

### Proposed Tool Enhancement

```javascript
{
  name: "graphite-get-json-schema-for-object-structure",
  inputSchema: {
    objectStructure: z.string().describe("The Maximo object structure name"),
    selection: z.string().optional().describe("Comma-separated field names or '*' for all"),
    mode: z.enum(['brief', 'standard', 'full']).optional().default('standard').describe(
      "Output mode: 'brief' (names+titles only), 'standard' (common fields), 'full' (all details)"
    ),
    search: z.string().optional().describe("Search term to filter properties by name, title, or remarks"),
    limit: z.number().optional().describe("Maximum number of properties to return (default: 50)")
  }
}
```

### Mode Definitions

#### 1. **Brief Mode** (Minimal - ~5-10% of full size)
Returns only essential identification:
- Property name
- Title
- Type
- Required flag

**Use case**: Quick overview, property discovery, field listing

#### 2. **Standard Mode** (Default - ~30-40% of full size)
Returns commonly needed fields:
- Property name
- Title
- Type
- Remarks (description)
- Required flag
- MaxLength (for strings)
- HasList (for lookups)
- SubType (DATE, UPPER, etc.)

**Use case**: Most common development scenarios, form building, validation

#### 3. **Full Mode** (Complete - 100% of current size)
Returns everything:
- All fields from standard mode
- SearchType
- Persistent
- ObjectName (for relationships)
- Items (for arrays)
- All other metadata

**Use case**: Deep integration work, complex queries, debugging

### Additional Features

#### Search Filtering
- Search across property names, titles, and remarks
- Case-insensitive matching
- Returns only matching properties in selected mode

#### Result Limiting
- Prevent overwhelming responses
- Default limit of 50 properties
- Configurable up to full schema

## Implementation Benefits

### Token Efficiency
- **Brief mode**: 90-95% reduction in tokens
- **Standard mode**: 60-70% reduction in tokens
- **Search filtering**: Returns only relevant properties
- **Limit parameter**: Prevents overwhelming responses

### Backward Compatibility
- Default mode='standard' maintains reasonable behavior
- Existing selection parameter still works
- No breaking changes to current usage

### User Experience
- Single tool to learn (not multiple tools)
- Progressive disclosure (start brief, go deeper as needed)
- Search helps discover relevant fields quickly
- Similar pattern to component property tools

## Example Usage Scenarios

### Scenario 1: Discovery
```javascript
// "What fields are available on asset?"
{
  objectStructure: "mxapiasset",
  mode: "brief",
  limit: 20
}
// Returns: 20 properties with just name, title, type
```

### Scenario 2: Targeted Search
```javascript
// "Find date-related fields on asset"
{
  objectStructure: "mxapiasset",
  search: "date",
  mode: "standard"
}
// Returns: All date fields with descriptions and types
```

### Scenario 3: Specific Fields
```javascript
// "Get details for assetnum, description, status"
{
  objectStructure: "mxapiasset",
  selection: "assetnum,description,status",
  mode: "full"
}
// Returns: Complete details for just those 3 fields
```

### Scenario 4: Building a Form
```javascript
// "Get common fields for asset form"
{
  objectStructure: "mxapiasset",
  selection: "assetnum,description,status,location,parent",
  mode: "standard"
}
// Returns: Enough info to build form fields with validation
```

## Implementation Plan

1. **Create utility function** to filter schema by mode
2. **Add search functionality** to filter properties
3. **Update tool definition** with new parameters
4. **Update handler** to process mode and search
5. **Add tests** for each mode and search
6. **Update documentation** with examples

## Comparison with Component Tools

This approach mirrors our successful component property optimization:
- `graphite-show-component-properties` has search parameter
- `graphite-get-component-enum-values` focuses on specific data
- Multiple tools for different granularity levels

For schemas, we use modes instead of separate tools because:
- Schema structure is more uniform
- Modes are more intuitive for this use case
- Reduces tool proliferation
- Easier to maintain single implementation