// Graphite-specific tool definitions for MCP server
import { z } from "zod";
import {getArgv} from '../../utils/cli-args.js'
import { getDBCTools } from '../dbc/tools.js';

export const GRAPHITE_LIST_COMPONENTS_TOOL = {
  name: "graphite-list-components",
  title: "Search and List Graphite Components",
  description:
    "Search and list Graphite components with optional filtering. Supports keyword search with OR logic (space-separated terms), category filtering, and result limiting for efficient token usage. Use query='*' or includeFullList=true to get all components. Returns structured text format optimized for LLM processing. To see all available categories, access the 'graphite://reference/component-categories' resource.",
  inputSchema: {
    query: z.string().optional().describe("Search query to filter components by name or description. Multiple space-separated terms are treated as OR (e.g., 'image placeholder' finds components containing 'image' OR 'placeholder'). Use '*' for all components. Default: '*'"),
    category: z.string().optional().describe("Filter by component category (e.g., 'layout', 'form', 'data-display'). See graphite://reference/component-categories resource for all available categories."),
    limit: z.number().optional().describe("Maximum number of results to return (default: 20, max: 50). Use higher values for broader searches."),
    includeFullList: z.boolean().optional().describe("Set to true to return all components regardless of query/limit. Default: false")
  },
};

export const GRAPHITE_SHOW_COMPONENT_SAMPLES_TOOL = {
  name: "graphite-show-component-samples",
  title: "Get Graphite Component Samples",
  description:
    "Get samples for a specific Graphite component. Graphite samples can show how use a given component in the XML declaration. Assistants should request component sample when trying to use a component to better understand the structure of the declarative language.",
  inputSchema:  {
    componentName: z.string().describe("Samples of component usage")},
};

export const GRAPHITE_SHOW_COMPONENT_PROPERTIES_TOOL = {
  name: "graphite-show-component-properties",
  title: "Get Graphite Component Properties",
  description:
    "Get the valid properties for a specific Graphite component with optional search filtering. Graphite components (xml elements) can only use valid properties. This returns the valid properties, their types, descriptions, requirements, defaults, and relationships. Supports searching within properties to quickly find specific attributes. Also shows slots, allowed children, and parent components.",
  inputSchema: {
    componentName: z.string().describe("Name of the Graphite component to get properties for"),
    search: z.string().optional().describe("Optional search term to filter properties by name or description. Useful for finding specific properties quickly (e.g., 'datasource', 'click', 'color').")
  },
};

export const GRAPHITE_SHOW_MULTIPLE_COMPONENT_PROPERTIES_TOOL = {
  name: "graphite-show-multiple-component-properties",
  title: "Get Properties for Multiple Graphite Components",
  description:
    "Get the valid properties for multiple Graphite components at once. This is more efficient than making separate calls when you need properties for several related components (e.g., when building a table with datasource, view-manager, and table-column). Returns comprehensive property information for all requested components in a single response.",
  inputSchema: {
    componentNames: z.array(z.string()).describe("Array of Graphite component names to get properties for (e.g., ['maximo-datasource', 'table', 'table-column'])")
  },
};

export const GRAPHITE_GET_COMPONENT_ENUM_VALUES_TOOL = {
  name: "graphite-get-component-enum-values",
  title: "Get Enum Values for Component Properties",
  description:
    "Get the valid enum values (oneOf) for specific properties of a Graphite component. This is useful for properties with large lists of valid values like colors (35 values), icons (100+ values), or other enumerations. Supports optional search to filter values. Much more efficient than getting all component properties when you only need enum values for specific properties.",
  inputSchema: {
    componentName: z.string().describe("Name of the Graphite component"),
    propertyNames: z.union([z.string(), z.array(z.string())]).describe("Property name or array of property names to get enum values for (e.g., 'background-color' or ['background-color', 'text-color'])"),
    search: z.string().optional().describe("Optional search term to filter enum values by value or description (e.g., 'blue' to find all blue color variants)")
  },
};

export const GRAPHITE_SEARCH_COLORS_TOOL = {
  name: "graphite-search-colors",
  title: "Search Graphite Color Tokens",
  description:
    "Search and list all valid Graphite color tokens (29 total). Color tokens are used for properties like background-color, text-color, border-color, etc. Supports optional search to filter colors by name or token value. Returns both the JavaScript key and the CSS token value for each color.",
  inputSchema: {
    search: z.string().optional().describe("Optional search term to filter colors by key or token value (e.g., 'blue', 'interactive', 'text')")
  },
};

export const GRAPHITE_SEARCH_ICONS_TOOL = {
  name: "graphite-search-icons",
  title: "Search Graphite Icons",
  description:
    "Search and list valid Graphite icons (395 total Carbon icons). Icons are used with the 'icon' property on components like button, icon-button, etc. Supports search to filter icons by name. Returns icon names in the format 'carbon:icon-name'. Use search to find specific icons (e.g., 'arrow', 'add', 'edit').",
  inputSchema: {
    search: z.string().optional().describe("Optional search term to filter icons by name (e.g., 'arrow', 'add', 'edit', 'delete')"),
    limit: z.number().optional().describe("Maximum number of results to return (default: 50, max: 100)")
  },
};

export const GRAPHITE_FIND_MAXIMO_OBJECT_STRUCTURE_TOOL = {
  name: "graphite-find-maximo-object-structure",
  title: "Finds a maximo objectstructure based on the user provided query",
  description:
    "Find one or more object structures that could be used based on what the user is aksing for.",
  inputSchema: {
    queryText: z.string().describe("Query text to search for Maximo object structures")
  },
};

export const GRAPHITE_GET_JSON_SCHEMA_FOR_OBJECT_STRUCTURE_TOOL = {
  name: "graphite-get-json-schema-for-object-structure",
  title: "Gets the JSON schema for a given maximo object structure.",
  description:
    "Returns the JSON schema for a Maximo object structure with flexible output modes and filtering. Supports 'brief' mode (names+titles only, ~90% smaller), 'standard' mode (common fields, ~60% smaller), or 'full' mode (all details). Use search to filter properties by name/title/description. Use limit to control result size. The schema contains information about fields, structure, types, and validation rules.",
  inputSchema: {
    objectStructure: z.string().describe("The Maximo object structure to get schema for (e.g., 'mxapiasset', 'mxapiwodetail')"),
    selection: z.string().optional().describe("Optional comma-separated list of field names to include, or '*' for all fields. When specified, only these fields are returned."),
    mode: z.enum(['brief', 'standard', 'full']).optional().describe("Output detail level: 'brief' (name, title, type only - fastest), 'standard' (common fields including descriptions - default), 'full' (all metadata). Default: 'standard'"),
    search: z.string().optional().describe("Search term to filter properties by name, title, or description (case-insensitive). Returns only matching properties."),
    limit: z.number().optional().describe("Maximum number of properties to return. Useful for large schemas. Default: no limit. Recommended: 50 for exploration.")
  },
};

export const GRAPHITE_FETCH_DATA_FROM_MANAGE = {
  name: "graphite-fetch-data-from-manage",
  title: "Fetch data from Maximo Manage",
  description:
    "Fetches records from Maximo Manage based on object structure and optional filtering criteria",
  inputSchema: {
    objectstructure: z.string().describe("Object structure name (e.g., 'mxapiasset')"),
    select: z.array(z.string()).optional().describe("Array of field names to select"),
    where: z.record(z.string(), z.any()).optional().describe("Object with field-value pairs for filtering"),
    orderby: z.string().optional().describe("String for ordering results (e.g., '+field1,-field2')"),
    pageSize: z.number().optional().describe("Number of records to return per page (default: 10)")
  }
};

export const USE_TOOLS_BEFORE_XML_PROMPT = {
  name: "use-tools-before-xml",
  title: "Use Graphite tools before writing XML",
  description:
    `For any XML task, first enumerate components, then props, then samples. ${getArgv().rag ? "Also query rag to grab specific applied examples and documentation":''}`,
  argsSchema: {
    task: z.string().describe("The XML task to complete")
  },
};

export const LIST_RAG_INDICES_TOOL = {
  name: "list-rag-indexes",
  title: "List Available RAG Indices",
  description:
    "Lists all available RAG (Retrieval Augmented Generation) indexes with their descriptions. Use this to determine which indexes to search with the rag-search tool.",
  inputSchema: {},
  //disable output schema, mcp sdk can't handle it well or docs is delulu
  // outputSchema: z.object({
  //   indices: z.array(
  //     z.object({
  //       index_name: z.string().describe("The index name"),
  //       description: z.string().describe("The index description"),
  //       domain: z.string().describe("The index domain")
  //     })
  //   )
  // })
};

export const RAG_SEARCH_TOOL = {
  name: "retrieve-specific-examples-and-documentation",
  title: "Retrieve specific code examples and relevant documentation",
  description:
    "Search for graphite and mobile based app implementations, documentation and apis using RAG (Retrieval Augmented Generation). You can specify which indexes to search (using list-rag-indexes) or use 'all' to search all docs and exampples. Use the list-rag-indexes tool first to see available indexes.",
  inputSchema: {
    query: z.string().describe("The search query text"),
    xmlContext: z.string().optional().describe("Optional XML context from previous interactions"),
    indexes: z.array(z.string()).describe("Optional array of index names to search. Use ['all'] to search all indexes.")
  },
  //disable output schema, mcp sdk can't handle it well or docs is delulu
  // outputSchema: z.object({
  //   results: z.array(
  //     z.object({
  //       content: z.string().describe("The search result content"),
  //       score: z.number(),
  //       uri: z.string().optional(),
  //       index: z.string().optional()
  //     }).describe("Result object from rag")
  //   ).describe("Array of search results")
  // })
};

export const getTools = () => {
  return [
    GRAPHITE_LIST_COMPONENTS_TOOL,
    GRAPHITE_SHOW_COMPONENT_SAMPLES_TOOL,
    GRAPHITE_SHOW_COMPONENT_PROPERTIES_TOOL,
    GRAPHITE_SHOW_MULTIPLE_COMPONENT_PROPERTIES_TOOL,
    GRAPHITE_GET_COMPONENT_ENUM_VALUES_TOOL,
    GRAPHITE_SEARCH_COLORS_TOOL,
    GRAPHITE_SEARCH_ICONS_TOOL,
    GRAPHITE_FIND_MAXIMO_OBJECT_STRUCTURE_TOOL,
    GRAPHITE_GET_JSON_SCHEMA_FOR_OBJECT_STRUCTURE_TOOL,
    GRAPHITE_FETCH_DATA_FROM_MANAGE,
    getArgv().rag && LIST_RAG_INDICES_TOOL,
    getArgv().rag && RAG_SEARCH_TOOL,
    ...getDBCTools()
  ].filter(Boolean)
}