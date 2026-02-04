# DBC Tools Documentation

## Overview

The DBC (Database Configuration) tools provide MCP (Model Context Protocol) access to the Maximo DBC XML schema. These tools help assistants understand and generate valid DBC scripts for making database changes in Maximo.

## What is DBC?

DBC is an XML format used by Maximo to make changes to the database structure. DBC scripts can:
- Create, modify, or drop tables
- Add, modify, or drop attributes (columns)
- Define indexes
- Create domains (synonym, ALN, numeric, crossover, table)
- Manage relationships
- Configure applications, modules, and menus
- Set up security options
- Manage properties and services
- Insert data

## Architecture

### Components

1. **DTD Parser** (`src/utils/dbc-utils.js`)
   - Parses `src/docs/dbc/script.dtd` to extract element definitions and attributes
   - The DTD is the **single source of truth** for valid elements and attributes

2. **JSON Registry** (`src/docs/dbc/script_registry.json`)
   - Provides descriptions for elements and attributes
   - Contains usage samples
   - Supplements DTD data but never contradicts it

3. **Schema Cache**
   - Merged DTD + JSON data cached in memory
   - Auto-refreshes every 5 minutes
   - Can be manually cleared with `clearDBCCache()`

4. **MCP Tools** (`src/constants/dbc/tools.js`)
   - Six tools for querying DBC schema
   - Integrated into the MCP server

5. **Tool Handlers** (`src/handlers/dbc/tool-handlers.js`)
   - Implementation of each tool
   - Formats output for LLM consumption

## Available Tools

### 1. `dbc-list-elements`

Lists all available DBC elements organized by category.

**Parameters:** None

**Example Output:**
```
DBC Elements (87 total)

Elements by Category:

Table Operations:
  • define_table - Creates a new table/object in Maximo
  • modify_table - Modifies an existing table
  • drop_table - Drops a table

Attribute Operations:
  • add_attributes - Adds new attributes to an existing object
  • attrdef - Defines an attribute
  • modify_attribute - Modifies an existing attribute
  ...
```

### 2. `dbc-search-elements`

Search for DBC elements by name or description. Supports space-separated OR queries.

**Parameters:**
- `query` (required): Search term(s). Multiple space-separated terms are treated as OR (e.g., "table index" finds elements matching "table" OR "index")
- `limit` (optional): Max results (default: 20)
- `includeAttributes` (optional): Include attribute names in search (default: false)

**Examples:**
```javascript
// Single term search
{
  "query": "table",
  "limit": 5
}

// OR search with multiple terms
{
  "query": "table index domain",
  "limit": 10
}
```

**Output shows matched terms:**
```
Element: define_table (relevance: 50) [matched: table]
Element: specify_index (relevance: 50) [matched: index]
Element: specify_table_domain (relevance: 50) [matched: table, domain]
```

### 3. `dbc-get-element-info`

Get detailed information about a specific DBC element.

**Parameters:**
- `elementName` (required): Name of the element
- `includeDetails` (optional): Include full attribute details (default: true)

**Example:**
```javascript
{
  "elementName": "define_table",
  "includeDetails": true
}
```

**Output includes:**
- Element description
- Content model
- Allowed children
- All attributes with types, requirements, defaults
- Enum values for enumerated attributes
- Attribute descriptions

### 4. `dbc-get-element-attributes`

Get detailed attribute information for a specific element.

**Parameters:**
- `elementName` (required): Name of the element
- `search` (optional): Filter attributes by name/description

**Example:**
```javascript
{
  "elementName": "define_table",
  "search": "type"
}
```

### 5. `dbc-get-element-children`

Get information about allowed child elements.

**Parameters:**
- `elementName` (required): Name of the element

**Example:**
```javascript
{
  "elementName": "add_attributes"
}
```

### 6. `dbc-validate-structure`

Validate a proposed DBC element structure before generating XML.

**Parameters:**
- `elementName` (required): Name of the element
- `attributes` (optional): Object with attribute names/values
- `children` (optional): Array of child element names

**Example:**
```javascript
{
  "elementName": "define_table",
  "attributes": {
    "object": "MYTABLE",
    "description": "My custom table",
    "service": "MYSERVICE",
    "classname": "com.example.MyClass",
    "type": "site"
  },
  "children": ["attrdef"]
}
```

**Validation checks:**
- Invalid attributes
- Missing required attributes
- Invalid enum values
- Invalid child elements

## Usage Workflow

When an assistant needs to create a DBC script:

1. **Discover elements**: Use `dbc-list-elements` or `dbc-search-elements`
2. **Get element details**: Use `dbc-get-element-info` for the specific element
3. **Check attributes**: Use `dbc-get-element-attributes` if needed
4. **Check children**: Use `dbc-get-element-children` to understand nesting
5. **Validate**: Use `dbc-validate-structure` before generating XML
6. **Generate**: Create the DBC XML with confidence

## Example: Creating a New Table

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE script SYSTEM "script.dtd">
<script author="Assistant" scriptname="Create Custom Table">
  <description>Creates a custom table for tracking examples</description>
  
  <check>
    <check_query query="select 1 from maxintobject where intobjectname='CUSTOMTABLE'"/>
  </check>
  
  <statements>
    <define_table 
      object="CUSTOMTABLE"
      description="Custom Example Table"
      service="CUSTOMSERVICE"
      classname="com.example.CustomTable"
      type="site"
      persistent="true"
      mainobject="true"
      internal="false">
      
      <attrdef 
        attribute="CUSTOMID"
        maxtype="INTEGER"
        length="10"
        required="true"
        persistent="true"
        title="Custom ID"
        remarks="Unique identifier"/>
        
      <attrdef 
        attribute="DESCRIPTION"
        maxtype="ALN"
        length="100"
        required="false"
        persistent="true"
        title="Description"
        remarks="Description field"/>
    </define_table>
    
    <specify_index 
      object="CUSTOMTABLE"
      name="CUSTOMTABLE_PK"
      primary="true"
      unique="true">
      <indexkey column="CUSTOMID" ascending="true"/>
    </specify_index>
  </statements>
</script>
```

## Key Concepts

### DTD as Source of Truth

The `script.dtd` file defines:
- Valid element names
- Element content models (what can be inside)
- Valid attributes for each element
- Attribute types (CDATA, NMTOKEN, enums)
- Required vs optional attributes
- Default values

### JSON Registry Supplements

The `script_registry.json` provides:
- Human-readable descriptions
- Usage examples
- Attribute descriptions
- Enum value descriptions

**Important**: If there's a conflict, the DTD wins. The JSON never defines elements/attributes not in the DTD.

### Content Models

Common content model patterns:
- `EMPTY` - No content allowed
- `(#PCDATA)` - Text content only
- `(element+)` - One or more child elements
- `(element*)` - Zero or more child elements
- `(element?)` - Zero or one child element
- `(elem1|elem2)` - Choice between elements

### Attribute Types

- `CDATA` - Character data (strings)
- `NMTOKEN` - Name token (no spaces)
- `(value1|value2|...)` - Enumerated values
- `#REQUIRED` - Must be provided
- `#IMPLIED` - Optional
- `"default"` - Has a default value

## Testing

Run the test suite:
```bash
node test/test-dbc-tools.js
```

Tests verify:
- Schema loading and caching
- Element listing and searching
- Attribute retrieval
- Formatting functions
- Cache performance

## Performance

- Initial load: ~50-100ms (parses DTD + JSON)
- Cached queries: <1ms
- Cache lifetime: 5 minutes
- Memory usage: ~500KB for full schema

## Future Enhancements

Potential additions:
- Sample generation tool
- XML validation tool
- Common pattern templates
- Integration with Maximo object structure tools
- DBC script execution simulation

## Related Documentation

- [Maximo DBC Documentation](../src/docs/dbc/)
- [DTD Reference](../src/docs/dbc/script.dtd)
- [JSON Registry](../src/docs/dbc/script_registry.json)