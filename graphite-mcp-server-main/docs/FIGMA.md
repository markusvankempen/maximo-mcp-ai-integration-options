* add table specific instructions (or instructions around table, datalist, etc, about not recreating innards of those)
* add specific instructions around not creating sample data, but rely on maximo-datasource
* add specific instructions around NOT recreating a package.json, but rather use the instructions in the pacakge.json
* graphite needs to account for newlines encoded like this.  value="3/16/2023, 8:30 AM&#10;3/16/2023, 12:00 PM&#10;6 hours, 30 minutes"
* add a lint warning for newlines in attributes

Bob Recommendations

Current Issue: I had to piece together the structure from multiple component property calls and samples.

Recommendation: Create graphite-get-pattern tool for common UI patterns:

{
  "pattern": "maximo-table-page",
  "options": {
    "objectStructure": "mxapiwodetail",
    "columns": ["wonum", "description", "status"]
  }
}

json


Response: Returns a complete, validated XML template with proper datasource, table, and view-manager setup.

Token Savings: ~70% reduction for common patterns




2. Component Validation Tool
Current Issue: I had to manually check if attributes were valid by calling graphite-show-component-properties after getting build errors. The errors only appeared after writing the file and running yarn build.

Recommendation: Create graphite-validate-component tool that validates XML snippets before writing to file:

{
  "componentName": "maximo-datasource",
  "attributes": {
    "objectstructure": "mxapiwodetail",
    "selection-mode": "multi"
  }
}

json


Response: Returns validation errors with correct attribute names and valid values.

Token Savings: Eliminates multiple write/build/fix cycles (~40% reduction in iteration tokens)



1. Batch Component Properties Tool
Current Issue: I had to make 3 separate calls to graphite-show-component-properties for maximo-datasource, view-manager-item, and table-column.

Recommendation: Create a new tool graphite-show-multiple-component-properties that accepts an array of component names and returns all their properties in one call.

{
  "componentNames": ["maximo-datasource", "view-manager-item", "table-column"]
}

json


Token Savings: ~60% reduction (3 calls → 1 call)


4. Enhanced Component Properties Response
Current Issue: The properties response doesn't show:

Which attributes are mutually exclusive
Common attribute combinations
Default values
Recommendation: Enhance the response format:

PROPS
    object-structure          Name of Maximo object structure to use.
    Type: string
    Required: Yes (when using maximo-datasource)
    Common with: id-attribute, selection-mode
    Example: "mxapiwodetail"
    
    selection-mode           Indicates how many records are selectable.
    Type: One of: multiple, none, single
    Default: "none"
    Note: Use "multiple" (not "multi")

txt


Token Savings: ~30% reduction by preventing common mistakes



7. Schema Generation from Object Structure
Current Issue: I had to manually create the schema attributes for the datasource.

Recommendation: Enhance graphite-get-json-schema-for-object-structure to include a Graphite XML schema snippet:

{
  "objectStructure": "mxapiwodetail",
  "fields": ["wonum", "description", "status"],
  "format": "graphite-xml"
}

json


Response: Returns ready-to-use <schema> XML with proper attributes.

Token Savings: ~25% reduction for datasource setup


Recommendation: Hybrid Approach
The best solution is BOTH, with smart defaults:

Tool: graphite-search-components
{
  "query": string,           // Required: search term
  "category"?: string,       // Optional: filter by category
  "limit"?: number,          // Optional: default 20, max 50
  "include_full_list"?: boolean  // Optional: default false
}

typescript


Why Hybrid?

For Targeted Searches (Most Common):

Query: "table" → Returns 5-10 relevant components
Token savings: 75% (690 vs 3,050)
Faster, more focused results
For Exploratory Work:

Set include_full_list: true → Returns all components
Same as current behavior
Useful when I don't know what I'm looking for
For Category Browsing:

Query: "*", Category: "data-display"
Returns all components in that category
Helps discover related components
Enhanced Search Features
{
  "query": "table",
  "category": "data-display",
  "limit": 10,
  "include_related": true,  // Also return commonly-used-with components
  "sort_by": "relevance"    // or "alphabetical", "usage-frequency"
}

json


Example Response:

{
  "results": [
    {
      "name": "table",
      "description": "...",
      "category": "data-display",
      "commonly_used_with": ["table-column", "datasource", "view-manager"]
    },
    {
      "name": "table-column",
      "description": "...",
      "category": "data-display"
    }
  ],
  "total_matches": 8,
  "showing": 10
}

json


Real-World Usage Scenarios
Scenario 1: "I need a table" (90% of cases)
{"query": "table", "limit": 10}

json


Tokens: 230 vs 3,050 (92% savings)

Scenario 2: "What layout options exist?" (5% of cases)
{"query": "*", "category": "layout", "limit": 20}

json


Tokens: 400 vs 3,050 (87% savings)

Scenario 3: "Show me everything" (5% of cases)
{"query": "*", "include_full_list": true}

json


Tokens: 3,050 (same as current)

Additional Benefits
Semantic Search: Could match "grid" → returns table, adaptive-grid
Typo Tolerance: "tabel" → suggests table
Related Components: Automatically suggests table-column when searching for table
Usage Stats: Show most commonly used components first
Final Recommendation
Implement the search tool with these priorities:

Phase 1 (Essential): Basic keyword search with limit
Phase 2 (Enhanced): Category filtering, related components
Phase 3 (Advanced): Semantic search, usage statistics

