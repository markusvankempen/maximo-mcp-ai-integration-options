// Graphite-specific resource definitions for MCP server

import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import {getArgv} from '../../utils/cli-args.js'
import { getDBCResources } from '../dbc/resources.js';

// Guide resources
export const CONTROLLERS_GUIDE_RESOURCE = {
  id: "controllers-guide",
  uri: "graphite://guides/controllers",
  metadata: {
    title: "Graphite Controller Guide",
    description: "House rules for controllers, events, and lifecycles when working with controllers",
    mimeType: "text/markdown",
  }
};

export const DATASOURCE_GUIDE_RESOURCE = {
  id: "datasource-guide",
  uri: "graphite://guides/datasource",
  metadata: {
    title: "Graphite Datasource Guide",
    description: "House rules for using datasources in graphite application",
    mimeType: "text/markdown",
  }
};

export const OVERVIEW_GUIDE_RESOURCE = {
  id: "overview-guide",
  uri: "graphite://guides/overview",
  metadata: {
    title: "Graphite Overview Guide",
    description: "READ THIS FIRST. House rules for working with graphite and how graphite works in general.",
    mimeType: "text/markdown",
  }
};

export const STATE_GUIDE_RESOURCE = {
  id: "state-guide",
  uri: "graphite://guides/state",
  metadata: {
    title: "Graphite State Management Guide",
    description: "House rules for using state in graphite application",
    mimeType: "text/markdown",
  }
};

export const UNIT_TESTING_GUIDE_RESOURCE = {
  id: "unit-testing-guide",
  uri: "graphite://guides/unit-testing",
  metadata: {
    title: "Graphite Unit Testing Guide",
    description: "House rules for unit testing graphite controllers",
    mimeType: "text/markdown",
  }
};

export const MANAGE_PROXY_GUIDE_RESOURCE = {
  id: "manage-proxy-guide",
  uri: "graphite://guides/manage-proxy",
  metadata: {
    title: "Manage Proxy Guide",
    description: "Instructions on how to connect the application to a Maximo Manage server using a Proxy",
    mimeType: "text/markdown",
  }
};

// Mobile guide resources
export const MOBILE_QBE_FILTER_GUIDE_RESOURCE = {
  id: "mobile-qbe-filter-guide",
  uri: "graphite://guides/mobile-qbe-filter",
  metadata: {
    title: "Maximo mobile mobile-qbe-filter Overview Guide",
    description: "House rules for working with maximo mobile mobile-qbe-filter. Contains examples and usage of mobile-qbe-filter to filter data storaged local database.",
    mimeType: "text/markdown",
  }
};

export const MOBILE_README_RESOURCE = {
  id: "mobile-readme",
  uri: "graphite://guides/mobile/readme",
  metadata: {
    title: "Maximo Mobile Documentation",
    description: "Overview of Maximo Mobile documentation and structure",
    mimeType: "text/markdown",
  }
};

export const MOBILE_DEBUGGING_RESOURCE = {
  id: "mobile-debugging",
  uri: "graphite://guides/mobile/debugging",
  metadata: {
    title: "Debugging Maximo Mobile Applications",
    description: "Guide for debugging Maximo Mobile applications",
    mimeType: "text/markdown",
  }
};

export const MOBILE_INDEX_RESOURCE = {
  id: "mobile-index",
  uri: "graphite://guides/mobile/index",
  metadata: {
    title: "Maximo Mobile Knowledge Base",
    description: "Main entry point for Maximo Mobile documentation",
    mimeType: "text/markdown",
  }
};

export const MOBILE_KEY_CONCEPTS_RESOURCE = {
  id: "mobile-key-concepts",
  uri: "graphite://guides/mobile/key-concepts",
  metadata: {
    title: "Maximo Mobile Key Concepts",
    description: "Core concepts and architecture of Maximo Mobile",
    mimeType: "text/markdown",
  }
};

export const MOBILE_APP_DEVELOPMENT_RESOURCE = {
  id: "mobile-app-development",
  uri: "graphite://guides/mobile/app-development",
  metadata: {
    title: "Mobile App Development Information",
    description: "Information for developing Maximo Mobile applications",
    mimeType: "text/markdown",
  }
};

export const MOBILE_NETWORK_MANAGEMENT_RESOURCE = {
  id: "mobile-network-management",
  uri: "graphite://guides/mobile/network-management",
  metadata: {
    title: "Network Management in Maximo Mobile",
    description: "Guide for network state management in Maximo Mobile",
    mimeType: "text/markdown",
  }
};

export const MOBILE_SUPPORTING_DATA_RESOURCE = {
  id: "mobile-supporting-data",
  uri: "graphite://guides/mobile/supporting-data",
  metadata: {
    title: "Supporting Data (Lookup Data)",
    description: "Information about supporting data in Maximo Mobile",
    mimeType: "text/markdown",
  }
};

export const MOBILE_TRANSACTIONS_RESOURCE = {
  id: "mobile-transactions",
  uri: "graphite://guides/mobile/transactions",
  metadata: {
    title: "Maximo Mobile Transactions",
    description: "Guide for transaction flow and error handling in Maximo Mobile",
    mimeType: "text/markdown",
  }
};

// Figma guide resources
export const FIGMA_OVERVIEW_RESOURCE = {
  id: "figma-overview",
  uri: "graphite://guides/figma/overview",
  metadata: {
    title: "Graphite to Figma Overview",
    description: "Guide for converting Figma designs to Graphite XML. Explains how to work with Figma MCP tools that produce React/Tailwind and convert them to Graphite's declarative XML format.",
    mimeType: "text/markdown",
  }
};

// Component categories resource
export const COMPONENT_CATEGORIES_RESOURCE = {
  id: "component-categories",
  uri: "graphite://reference/component-categories",
  metadata: {
    title: "Graphite Component Categories",
    description: "List of all available component categories with counts. Use this to discover valid category values for filtering components.",
    mimeType: "text/plain",
  }
};

// Controller sample resources
export const APP_CONTROLLER_SAMPLE_RESOURCE = {
  id: "app-controller-sample",
  template: new ResourceTemplate("graphite://samples/app-controller/{Name}", {
    list: undefined,
  }),
  metadata: {
    title: "App Controller Sample Template",
    description: "A parameterized vanilla JS controller sample for use with application and maximo-application",
    mimeType: "application/javascript",
  }
};

export const PAGE_CONTROLLER_SAMPLE_RESOURCE = {
  id: "page-controller-sample",
  template: new ResourceTemplate("graphite://samples/page-controller/{Name}", {
    list: undefined,
  }),
  metadata: {
    title: "Page Controller Sample Template",
    description: "A parameterized vanilla JS controller sample for use with ONLY with a page element",
    mimeType: "application/javascript",
  }
};

export const DATA_CONTROLLER_SAMPLE_RESOURCE = {
  id: "data-controller-sample",
  template: new ResourceTemplate("graphite://samples/data-controller/{Name}", {
    list: undefined,
  }),
  metadata: {
    title: "Datasource Controller Sample Template",
    description: "A parameterized vanilla JS controller sample for use with ONLY with a datasource elements, such as json-datasource or maximo-datasource",
    mimeType: "application/javascript",
  }
};

// Group resources for easier registration
export const GRAPHITE_GUIDE_RESOURCES = [
  CONTROLLERS_GUIDE_RESOURCE,
  DATASOURCE_GUIDE_RESOURCE,
  OVERVIEW_GUIDE_RESOURCE,
  STATE_GUIDE_RESOURCE,
  UNIT_TESTING_GUIDE_RESOURCE,
  MANAGE_PROXY_GUIDE_RESOURCE
];

export const MOBILE_GUIDE_RESOURCES = [
  MOBILE_QBE_FILTER_GUIDE_RESOURCE,
  MOBILE_README_RESOURCE,
  MOBILE_DEBUGGING_RESOURCE,
  MOBILE_INDEX_RESOURCE,
  MOBILE_KEY_CONCEPTS_RESOURCE,
  MOBILE_APP_DEVELOPMENT_RESOURCE,
  MOBILE_NETWORK_MANAGEMENT_RESOURCE,
  MOBILE_SUPPORTING_DATA_RESOURCE,
  MOBILE_TRANSACTIONS_RESOURCE
];

export const FIGMA_GUIDE_RESOURCES = [
  FIGMA_OVERVIEW_RESOURCE
];

export const CONTROLLER_SAMPLE_RESOURCES = [
  APP_CONTROLLER_SAMPLE_RESOURCE,
  PAGE_CONTROLLER_SAMPLE_RESOURCE,
  DATA_CONTROLLER_SAMPLE_RESOURCE
];

export const REFERENCE_RESOURCES = [
  COMPONENT_CATEGORIES_RESOURCE
];

// Export all resources
export const GRAPHITE_RESOURCES = [
  ...GRAPHITE_GUIDE_RESOURCES,
  ...MOBILE_GUIDE_RESOURCES,
  ...FIGMA_GUIDE_RESOURCES,
  ...CONTROLLER_SAMPLE_RESOURCES,
  ...REFERENCE_RESOURCES
];

export const getResources = () => {
  return [
    ...getDBCResources(),
    ...GRAPHITE_GUIDE_RESOURCES,
    ...(getArgv().rag ? [] : MOBILE_GUIDE_RESOURCES),
    ...FIGMA_GUIDE_RESOURCES,
    ...CONTROLLER_SAMPLE_RESOURCES,
    ...REFERENCE_RESOURCES
  ]
}