// DBC-specific resource definitions for MCP server

export const DBC_OVERVIEW_RESOURCE = {
  id: "dbc-overview",
  uri: "dbc://guides/overview",
  metadata: {
    name: "DBC Overview",
    description: "Introduction to DBC (Database Configuration) and when to use DBC tools",
    mimeType: "text/markdown"
  }
};

/**
 * Get all DBC resource definitions
 * @returns {Array} Array of resource definitions
 */
export function getDBCResources() {
  return [
    DBC_OVERVIEW_RESOURCE
  ];
}

// Made with Bob
