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
