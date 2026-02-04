// Graphite-specific prompt definitions for MCP server
import { z } from "zod";
import {getArgv} from '../../utils/cli-args.js'

export const SCAFFOLD_APP_CONTROLLER_PROMPT = {
  name: "scaffold_app_controller",
  title: "Scaffold a Graphite Application controller",
  description:
    "Generate an Application controller class following the file-based guide",
  argsSchema: {
    Name: z.string().describe("PascalCase name, e.g., Application"),
    owner: z.enum(["application"]).describe("Controller owner type"),
    intent: z.string().optional().describe("Short description of behavior"),
    outDir: z
      .string()
      .optional()
      .describe("Target dir (default src/controllers)"),
  },
};

export const SCAFFOLD_PAGE_CONTROLLER_PROMPT = {
  name: "scaffold_page_controller",
  title: "Scaffold a Graphite Page controller",
  description:
    "Generate a Page controller class following the file-based guide",
  argsSchema: {
    Name: z.string().describe("PascalCase name, e.g., Page"),
    owner: z.enum(["page"]).describe("Controller owner type"),
    intent: z.string().optional().describe("Short description of behavior"),
    outDir: z
      .string()
      .optional()
      .describe("Target dir (default src/controllers)"),
  },
};

export const SCAFFOLD_DATA_CONTROLLER_PROMPT = {
  name: "scaffold_data_controller",
  title: "Scaffold a Graphite Datasource controller",
  description:
    "Generate a Datasource controller class following the file-based guide",
  argsSchema: {
    Name: z.string().describe("PascalCase name, e.g., Page"),
    owner: z.enum(["datasource"]).describe("Controller owner type"),
    intent: z.string().optional().describe("Short description of behavior"),
    outDir: z
      .string()
      .optional()
      .describe("Target dir (default src/controllers)"),
  },
};

export const USE_TOOLS_BEFORE_XML_PROMPT = {
  name: "use-tools-before-xml",
  title: "Use Graphite tools before writing XML",
  description:
    "For any XML task, first enumerate components, then props, then samples.",
  argsSchema: {
    task: z.string().describe("The XML task to complete")
  },
};

export const QUERY_RAG_PROMPT = {
  name: "query_rag_indices_policy",
  title: "Query RAG for specific examples and documentation",
  description: `Specifies when to query RAG`
};

export const getPrompts = () => {
  return [
    USE_TOOLS_BEFORE_XML_PROMPT,
    SCAFFOLD_APP_CONTROLLER_PROMPT,
    SCAFFOLD_PAGE_CONTROLLER_PROMPT,
    SCAFFOLD_DATA_CONTROLLER_PROMPT,
    getArgv().rag && QUERY_RAG_PROMPT
  ].filter(Boolean);
}

