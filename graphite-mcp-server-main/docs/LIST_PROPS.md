
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

