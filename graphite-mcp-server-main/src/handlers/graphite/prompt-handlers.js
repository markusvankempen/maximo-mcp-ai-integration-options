//Handle prompts for graphite
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getArgv } from "../../utils/cli-args.js";

// Path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, "../../../");

// Define paths to resource files
const CONTROLLERS_GUIDE_PATH = path.resolve(BASE_DIR, "src/docs/graphite-controller-guide.md");
const APP_CONTROLLER_TEMPLATE_PATH = path.resolve(BASE_DIR, "src/templates/AppControllerSample.js.tmpl");
const PAGE_CONTROLLER_TEMPLATE_PATH = path.resolve(BASE_DIR, "src/templates/PageControllerSample.js.tmpl");
const DATA_CONTROLLER_TEMPLATE_PATH = path.resolve(BASE_DIR, "src/templates/DataControllerSample.js.tmpl");

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
 * Handler for scaffold_app_controller prompt
 */
export async function handleScaffoldAppController({ Name, owner, intent }) {
  // Read the latest guide text so the prompt always reflects the file on disk
  const guide = await safeReadText(
    CONTROLLERS_GUIDE_PATH,
    "(Guide file not found)"
  );
  const sample = await renderAppControllerSampleFromFile(Name || "Sample");

  return {
    messages: [
      {
        role: "assistant",
        content: {
          type: "text",
          text:
            "You generate vanilla ES application controller classes for Graphite. " +
            "Follow the attached guide exactly. No React/JSX. No inheritance. " +
            "Keep logic short and event/state driven."+
            "Send query and context to rag search tool along with appropriate indices.",
        },
      },
      {
        role: "user",
        content: {
          type: "text",
          text: `# GUIDE (from file)
${guide}

# SAMPLE (${Name || "Sample"})
\`\`\`js
${sample}
\`\`\`

# TASK
Scaffold ${owner} controller: ${Name}.
Intent: ${intent ?? "Handle a button click and navigate."}
Output a single file named ${Name}AppController.js with proper methods for events and lifecycles per the guide.`,
        },
      },
    ],
  };
}

/**
 * Handler for scaffold_page_controller prompt
 */
export async function handleScaffoldPageController({ Name, owner, intent }) {
  // Read the latest guide text so the prompt always reflects the file on disk
  const guide = await safeReadText(
    CONTROLLERS_GUIDE_PATH,
    "(Guide file not found)"
  );
  const sample = await renderPageControllerSampleFromFile(Name || "Sample");

  return {
    messages: [
      {
        role: "assistant",
        content: {
          type: "text",
          text:
            "You generate vanilla ES page controller classes for Graphite. " +
            "Follow the attached guide exactly. No React/JSX. No inheritance. " +
            "Keep logic short and event/state driven.",
        },
      },
      {
        role: "user",
        content: {
          type: "text",
          text: `# GUIDE (from file)
${guide}

# SAMPLE (${Name || "Sample"})
\`\`\`js
${sample}
\`\`\`

# TASK
Scaffold ${owner} controller: ${Name}.
Intent: ${intent ?? "Handle a button click and navigate."}
Output a single file named ${Name}PageController.js with proper methods for events and lifecycles per the guide.`,
        },
      },
    ],
  };
}

/**
 * Handler for scaffold_data_controller prompt
 */
export async function handleScaffoldDataController({ Name, owner, intent }) {
  // Read the latest guide text so the prompt always reflects the file on disk
  const guide = await safeReadText(
    CONTROLLERS_GUIDE_PATH,
    "(Guide file not found)"
  );
  const sample = await renderDataControllerSampleFromFile(Name || "Sample");

  return {
    messages: [
      {
        role: "system",
        content: {
          type: "text",
          text:
            "You generate vanilla ES datasource controller classes for Graphite. " +
            "Follow the attached guide exactly. No React/JSX. No inheritance. " +
            "Keep logic short and event/state driven.",
        },
      },
      {
        role: "user",
        content: {
          type: "text",
          text: `# GUIDE (from file)
${guide}

# SAMPLE (${Name || "Sample"})
\`\`\`js
${sample}
\`\`\`

# TASK
Scaffold ${owner} controller: ${Name}.
Intent: ${intent ?? "Handle a button click and navigate."}
Output a single file named ${Name}PageController.js with proper methods for events and lifecycles per the guide.`,
        },
      },
    ],
  };
}

/**
 * Handler for use-tools-before-xml prompt
 * Instructs the model to use Graphite tools before generating XML
 */
export function handleUseToolsBeforeXml({ task }) {
  return {
    messages: [
      {
        role: "assistant",
        content: {
          type: "text",
          text: `You MUST follow this workflow before producing any Graphite XML:
1) Call "graphite-list-components" to enumerate valid components.
2) Call "graphite-show-component-properties" to fetch valid properties for chosen components.
3) Call "graphite-show-component-samples" to review usage examples.
${getArgv().rag?'4) Use RAG search tool to grab specific examples and related documetation':''}
Only then assemble XML. If information is missing, call tools again.

Output:
- A brief plan of called tools + rationale
- The final XML
- A checklist of validations performed`,
        },
      },
      { role: "user", content: { type: "text", text: `Task: ${task}` } },
    ],
  };
}

export function handleQueryRAGPrompt({ task }) {
  return {
    messages: [
      {
        role: "assistant",
        content: {
          type: "text",
          text: `Use RAG search tool to grab specific examples and related documetation, follow this policy strictly:
    1. Always list out all indices available for RAG using the LIST_RAG_INDICES_TOOL.
    2. Decide indices to include based on the description of each index in the list and the context gathered so far.`,
        },
      },
      { role: "user", content: { type: "text", text: `Task: ${task}` } },
    ],
  };
}

// Export all handlers as a map for easier registration
export const graphitePromptHandlers = {
  "use-tools-before-xml": handleUseToolsBeforeXml,
  "scaffold_app_controller": handleScaffoldAppController,
  "scaffold_page_controller": handleScaffoldPageController,
  "scaffold_data_controller": handleScaffoldDataController,
  "query_rag_indices_policy": handleQueryRAGPrompt
};
