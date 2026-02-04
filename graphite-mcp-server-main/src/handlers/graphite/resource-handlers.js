// Handlers for Graphite-specific resources
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getComponentCategories } from "../../utils/graphiteLib.js";
import { dbcResourceHandlers } from "../dbc/resource-handlers.js";

// Path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, "../../../");

// Define paths to resource files
const STATE_GUIDE_PATH = path.resolve(BASE_DIR, "src/docs/state-management-guide.md");
const TESTING_GUIDE_PATH = path.resolve(BASE_DIR, "src/docs/unit-testing-guide.md");
const CONTROLLERS_GUIDE_PATH = path.resolve(BASE_DIR, "src/docs/graphite-controller-guide.md");
const DATASOURCE_GUIDE_PATH = path.resolve(BASE_DIR, "src/docs/graphite-datasource-guide.md");
const OVERVIEW_GUIDE_PATH = path.resolve(BASE_DIR, "src/docs/graphite-overview-guide.md");
const MANAGE_PROXY_GUIDE_PATH = path.resolve(BASE_DIR, "src/docs/manage-proxy.md");
const APP_CONTROLLER_TEMPLATE_PATH = path.resolve(BASE_DIR, "src/templates/AppControllerSample.js.tmpl");
const PAGE_CONTROLLER_TEMPLATE_PATH = path.resolve(BASE_DIR, "src/templates/PageControllerSample.js.tmpl");
const DATA_CONTROLLER_TEMPLATE_PATH = path.resolve(BASE_DIR, "src/templates/DataControllerSample.js.tmpl");

// Mobile documentation paths
const MOBILE_QBE_FILTER = path.resolve(BASE_DIR, "src/docs/mobile/mobile-qbe-filter.md");
const MOBILE_README_PATH = path.resolve(BASE_DIR, "src/docs/mobile/README.md");
const MOBILE_DEBUGGING_PATH = path.resolve(BASE_DIR, "src/docs/mobile/debugging.md");
const MOBILE_INDEX_PATH = path.resolve(BASE_DIR, "src/docs/mobile/index.md");
const MOBILE_KEY_CONCEPTS_PATH = path.resolve(BASE_DIR, "src/docs/mobile/key-concepts.md");
const MOBILE_APP_DEVELOPMENT_PATH = path.resolve(BASE_DIR, "src/docs/mobile/mobile-app-development.md");
const MOBILE_NETWORK_MANAGEMENT_PATH = path.resolve(BASE_DIR, "src/docs/mobile/network-management.md");
const MOBILE_SUPPORTING_DATA_PATH = path.resolve(BASE_DIR, "src/docs/mobile/supporting-data.md");
const MOBILE_TRANSACTIONS_PATH = path.resolve(BASE_DIR, "src/docs/mobile/transactions.md");

// Figma documentation paths
const FIGMA_OVERVIEW_PATH = path.resolve(BASE_DIR, "src/docs/figma/graphite-figma-overview.md");

/**
 * Helper function for reading text files
 */
async function safeReadText(filePath, fallback = "") {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return fallback;
  }
}

/**
 * Built-in sample template (used if no template file on disk)
 */
function builtinSampleTemplate(Name) {
  return `// ${Name}Controller.js – sample (vanilla ES class)
export default class ${Name}Controller {
  applicationInitialized(app) {
    this.app=app;
  }

  pageResumed(page, app) {
    this.app=app;
    this.page=page;
  }
}
`;
}

/**
 * Render app controller sample from file or use builtin
 */
async function renderAppControllerSampleFromFile(Name) {
  const raw = await safeReadText(APP_CONTROLLER_TEMPLATE_PATH, "");
  if (!raw) return builtinSampleTemplate(Name);
  // Simple placeholder strategy: __NAME__ for class/file naming
  return raw.replaceAll("__NAME__", Name);
}

/**
 * Render page controller sample from file or use builtin
 */
async function renderPageControllerSampleFromFile(Name) {
  const raw = await safeReadText(PAGE_CONTROLLER_TEMPLATE_PATH, "");
  if (!raw) return builtinSampleTemplate(Name);
  // Simple placeholder strategy: __NAME__ for class/file naming
  return raw.replaceAll("__NAME__", Name);
}

/**
 * Render data controller sample from file or use builtin
 */
async function renderDataControllerSampleFromFile(Name) {
  const raw = await safeReadText(DATA_CONTROLLER_TEMPLATE_PATH, "");
  if (!raw) return builtinSampleTemplate(Name);
  // Simple placeholder strategy: __NAME__ for class/file naming
  return raw.replaceAll("__NAME__", Name);
}

/**
 * Handler for controllers guide resource
 */
export async function handleControllersGuideResource(uri) {
  const content = await safeReadText(
    CONTROLLERS_GUIDE_PATH,
    `# Missing guide\n\nExpected controller guide at: ${CONTROLLERS_GUIDE_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for datasource guide resource
 */
export async function handleDatasourceGuideResource(uri) {
  const content = await safeReadText(
    DATASOURCE_GUIDE_PATH,
    `# Missing guide\n\nExpected datasource guide at: ${DATASOURCE_GUIDE_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for overview guide resource
 */
export async function handleOverviewGuideResource(uri) {
  const content = await safeReadText(
    OVERVIEW_GUIDE_PATH,
    `# Missing guide\n\nExpected overview guide at: ${OVERVIEW_GUIDE_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for state guide resource
 */
export async function handleStateGuideResource(uri) {
  const content = await safeReadText(
    STATE_GUIDE_PATH,
    `# Missing guide\n\nExpected state guide at: ${STATE_GUIDE_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for unit testing guide resource
 */
export async function handleUnitTestingGuideResource(uri) {
  const content = await safeReadText(
    TESTING_GUIDE_PATH,
    `# Missing guide\n\nExpected unit test guide at: ${TESTING_GUIDE_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for manage proxy guide resource
 */
export async function handleManageProxyGuideResource(uri) {
  const content = await safeReadText(
    MANAGE_PROXY_GUIDE_PATH,
    `# Missing guide\n\nExpected manage proxy guide at: ${MANAGE_PROXY_GUIDE_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for mobile QBE filter guide resource
 */
export async function handleMobileQbeFilterGuideResource(uri) {
  const content = await safeReadText(
    MOBILE_QBE_FILTER,
    `# Missing guide\n\nExpected overview guide at: ${MOBILE_QBE_FILTER}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for mobile readme resource
 */
export async function handleMobileReadmeResource(uri) {
  const content = await safeReadText(
    MOBILE_README_PATH,
    `# Missing guide\n\nExpected mobile readme at: ${MOBILE_README_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for mobile debugging resource
 */
export async function handleMobileDebuggingResource(uri) {
  const content = await safeReadText(
    MOBILE_DEBUGGING_PATH,
    `# Missing guide\n\nExpected mobile debugging guide at: ${MOBILE_DEBUGGING_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for mobile index resource
 */
export async function handleMobileIndexResource(uri) {
  const content = await safeReadText(
    MOBILE_INDEX_PATH,
    `# Missing guide\n\nExpected mobile index at: ${MOBILE_INDEX_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for mobile key concepts resource
 */
export async function handleMobileKeyConceptsResource(uri) {
  const content = await safeReadText(
    MOBILE_KEY_CONCEPTS_PATH,
    `# Missing guide\n\nExpected mobile key concepts guide at: ${MOBILE_KEY_CONCEPTS_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for mobile app development resource
 */
export async function handleMobileAppDevelopmentResource(uri) {
  const content = await safeReadText(
    MOBILE_APP_DEVELOPMENT_PATH,
    `# Missing guide\n\nExpected mobile app development guide at: ${MOBILE_APP_DEVELOPMENT_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for mobile network management resource
 */
export async function handleMobileNetworkManagementResource(uri) {
  const content = await safeReadText(
    MOBILE_NETWORK_MANAGEMENT_PATH,
    `# Missing guide\n\nExpected mobile network management guide at: ${MOBILE_NETWORK_MANAGEMENT_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for mobile supporting data resource
 */
export async function handleMobileSupportingDataResource(uri) {
  const content = await safeReadText(
    MOBILE_SUPPORTING_DATA_PATH,
    `# Missing guide\n\nExpected mobile supporting data guide at: ${MOBILE_SUPPORTING_DATA_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for mobile transactions resource
 */
export async function handleMobileTransactionsResource(uri) {
  const content = await safeReadText(
    MOBILE_TRANSACTIONS_PATH,
    `# Missing guide\n\nExpected mobile transactions guide at: ${MOBILE_TRANSACTIONS_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for Figma overview resource
 */
export async function handleFigmaOverviewResource(uri) {
  const content = await safeReadText(
    FIGMA_OVERVIEW_PATH,
    `# Missing guide\n\nExpected Figma overview guide at: ${FIGMA_OVERVIEW_PATH}\n`
  );
  return {
    contents: [{ uri: uri.href, text: content }],
  };
}

/**
 * Handler for app controller sample resource
 */
export async function handleAppControllerSampleResource(uri, { Name }) {
  const text = await renderAppControllerSampleFromFile(Name);
  return { contents: [{ uri: uri.href, text }] };
}

/**
 * Handler for page controller sample resource
 */
export async function handlePageControllerSampleResource(uri, { Name }) {
  const text = await renderPageControllerSampleFromFile(Name);
  return { contents: [{ uri: uri.href, text }] };
}

/**
 * Handler for data controller sample resource
 */
export async function handleDataControllerSampleResource(uri, { Name }) {
  const text = await renderDataControllerSampleFromFile(Name);
  return { contents: [{ uri: uri.href, text }] };
}

/**
 * Handler for component categories resource
 */
export async function handleComponentCategoriesResource(uri) {
  const { text } = getComponentCategories();
  return {
    contents: [{ uri: uri.href, text }],
  };
}

// Export all handlers as a map for easier registration
export const graphiteResourceHandlers = {
  ...dbcResourceHandlers,
  "controllers-guide": handleControllersGuideResource,
  "datasource-guide": handleDatasourceGuideResource,
  "overview-guide": handleOverviewGuideResource,
  "state-guide": handleStateGuideResource,
  "unit-testing-guide": handleUnitTestingGuideResource,
  "manage-proxy-guide": handleManageProxyGuideResource,
  "mobile-qbe-filter-guide": handleMobileQbeFilterGuideResource,
  "mobile-readme": handleMobileReadmeResource,
  "mobile-debugging": handleMobileDebuggingResource,
  "mobile-index": handleMobileIndexResource,
  "mobile-key-concepts": handleMobileKeyConceptsResource,
  "mobile-app-development": handleMobileAppDevelopmentResource,
  "mobile-network-management": handleMobileNetworkManagementResource,
  "mobile-supporting-data": handleMobileSupportingDataResource,
  "mobile-transactions": handleMobileTransactionsResource,
  "figma-overview": handleFigmaOverviewResource,
  "app-controller-sample": handleAppControllerSampleResource,
  "page-controller-sample": handlePageControllerSampleResource,
  "data-controller-sample": handleDataControllerSampleResource,
  "component-categories": handleComponentCategoriesResource,
};
