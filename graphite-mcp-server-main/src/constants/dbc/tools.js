// DBC (Database Configuration) tool definitions for MCP server
import { z } from "zod";

export const DBC_LIST_ELEMENTS_TOOL = {
  name: "dbc-list-elements",
  title: "List DBC Elements",
  description:
    "List all available DBC (Database Configuration) XML elements. DBC files are used to make changes to the Maximo database structure. This tool returns all valid element names that can be used in DBC scripts. Use this to discover what operations are available (e.g., define_table, add_attributes, create_relationship, etc.). IMPORTANT: After using this tool, consult the 'dbc_examples' RAG index using the retrieve-specific-examples-and-documentation tool to find real-world examples of DBC scripts.",
  inputSchema: {},
};

export const DBC_SEARCH_ELEMENTS_TOOL = {
  name: "dbc-search-elements",
  title: "Search DBC Elements",
  description:
    "Search for DBC elements by name or description. Supports space-separated OR queries (e.g., 'table index' finds elements matching 'table' OR 'index'). Useful for finding specific database operations like table creation, attribute modification, domain specification, etc. Returns matching elements with their descriptions and basic information. IMPORTANT: After finding relevant elements, consult the 'dbc_examples' RAG index using the retrieve-specific-examples-and-documentation tool to see practical examples of how these elements are used in real DBC scripts.",
  inputSchema: {
    query: z.string().describe("Search query to find DBC elements. Multiple space-separated terms are treated as OR (e.g., 'table index' finds elements containing 'table' OR 'index'). Examples: 'table', 'attribute domain', 'relationship view'"),
    limit: z.number().optional().describe("Maximum number of results to return (default: 20)"),
    includeAttributes: z.boolean().optional().describe("Include attribute names in search (default: false)")
  },
};

export const DBC_GET_ELEMENT_INFO_TOOL = {
  name: "dbc-get-element-info",
  title: "Get DBC Element Information",
  description:
    "Get detailed information about a specific DBC element including its description, attributes, allowed children, content model, and usage. This is the primary tool for understanding how to use a specific DBC element when creating database configuration scripts. The DTD is the single source of truth for valid elements and attributes. IMPORTANT: After reviewing element information, always consult the 'dbc_examples' RAG index using the retrieve-specific-examples-and-documentation tool to find real-world examples showing how this element is used in actual DBC scripts.",
  inputSchema: {
    elementName: z.string().describe("Name of the DBC element to get information for (e.g., 'define_table', 'add_attributes', 'specify_index')"),
    includeDetails: z.boolean().optional().describe("Include full attribute details (default: true)")
  },
};

export const DBC_GET_ELEMENT_ATTRIBUTES_TOOL = {
  name: "dbc-get-element-attributes",
  title: "Get DBC Element Attributes",
  description:
    "Get detailed information about the attributes (XML properties) of a specific DBC element. Shows attribute names, types, whether they're required, default values, valid enum values, and descriptions. Use this when you need to know what attributes are available for a specific element and how to use them. IMPORTANT: After reviewing attributes, consult the 'dbc_examples' RAG index using the retrieve-specific-examples-and-documentation tool to see how these attributes are used in real DBC script examples.",
  inputSchema: {
    elementName: z.string().describe("Name of the DBC element to get attributes for"),
    search: z.string().optional().describe("Optional search term to filter attributes by name or description")
  },
};

export const DBC_GET_ELEMENT_CHILDREN_TOOL = {
  name: "dbc-get-element-children",
  title: "Get DBC Element Children",
  description:
    "Get information about what child elements are allowed within a specific DBC element. This helps understand the structure and nesting rules for DBC XML. For example, 'define_table' can contain 'attrdef' children, 'add_attributes' can contain 'attrdef' children, etc. IMPORTANT: After understanding the structure, consult the 'dbc_examples' RAG index using the retrieve-specific-examples-and-documentation tool to see complete examples of DBC scripts with proper element nesting.",
  inputSchema: {
    elementName: z.string().describe("Name of the DBC element to get allowed children for")
  },
};

export const DBC_VALIDATE_STRUCTURE_TOOL = {
  name: "dbc-validate-structure",
  title: "Validate DBC Element Structure",
  description:
    "Validate if a proposed DBC element structure is valid according to the DTD. Checks if specified attributes are valid, if required attributes are present, if child elements are allowed, etc. Use this before generating DBC XML to ensure correctness. IMPORTANT: Before creating DBC scripts, consult the 'dbc_examples' RAG index using the retrieve-specific-examples-and-documentation tool to review proven examples and best practices from real DBC implementations.",
  inputSchema: {
    elementName: z.string().describe("Name of the DBC element to validate"),
    attributes: z.record(z.string()).optional().describe("Object containing attribute names and values to validate"),
    children: z.array(z.string()).optional().describe("Array of child element names to validate")
  },
};

/**
 * Get all DBC tool definitions
 * @returns {Array} Array of tool definitions
 */
export function getDBCTools() {
  return [
    DBC_LIST_ELEMENTS_TOOL,
    DBC_SEARCH_ELEMENTS_TOOL,
    DBC_GET_ELEMENT_INFO_TOOL,
    DBC_GET_ELEMENT_ATTRIBUTES_TOOL,
    DBC_GET_ELEMENT_CHILDREN_TOOL,
    DBC_VALIDATE_STRUCTURE_TOOL,
  ];
}

// Made with Bob
