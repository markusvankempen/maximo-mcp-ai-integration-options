#!/usr/bin/env node
/**
 * Verbose MCP HTTP test client
 * - Initializes a session (POST /mcp)
 * - Verifies mcp-session-id header
 * - Calls the `add` tool (with retry/backoff for session routing)
 * - Closes the session (DELETE /mcp)
 *
 * Usage:
 *   node test-mcp.js --host http://127.0.0.1 --port 6868
 */

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .option("host", { type: "string", default: "http://localhost", describe: "Server host (scheme + host)" })
  .option("port", { type: "number", default: 6868, describe: "Server port" })
  .option("path", { type: "string", default: "/mcp", describe: "MCP endpoint path" })
  .help()
  .parse();

const BASE = `${argv.host.replace(/\/$/, "")}:${argv.port}${argv.path}`;
const PROTOCOL_VERSION = "2024-11-05";
let passed = 0
let failed = 0
function dumpHeaders(headers) {
  const obj = {};
  for (const [k, v] of headers.entries()) obj[k] = v;
  return obj;
}

async function readJsonOrSse(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    return res.json();
  }
  if (!ct.includes("text/event-stream")) {
    const text = await res.text().catch(() => "");
    throw new Error(`Unexpected content-type: ${ct}. Body:\n${text}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      let eventType = "message";
      let dataLines = [];
      for (const line of rawEvent.split(/\r?\n/)) {
        if (!line || line.startsWith(":")) continue;
        const m = /^(\w+):\s?(.*)$/.exec(line);
        if (!m) continue;
        const [, field, val] = m;
        if (field === "event") eventType = val.trim();
        if (field === "data") dataLines.push(val);
      }
      if (eventType === "message" && dataLines.length) {
        const dataStr = dataLines.join("\n");
        try {
          return JSON.parse(dataStr);
        } catch (e) {
          throw new Error(`Failed to parse SSE JSON: ${e.message}\nData:\n${dataStr}`);
        }
      }
    }
  }
  throw new Error("SSE stream ended before a 'message' event was received.");
}

async function postJsonOrSse(path, body, headers = {}) {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  return res;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

console.log(`🔧 Target: ${BASE}`);

console.log("\n🔹 Initializing session...");
const initReq = {
  jsonrpc: "2.0",
  id: "1",
  method: "initialize",
  params: {
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" },
    protocolVersion: PROTOCOL_VERSION,
  },
};

let initRes;
try {
  initRes = await postJsonOrSse(BASE, initReq);
} catch (e) {
  console.error(`❌ Failed to reach server at ${BASE}`);
  console.error(e);
  process.exit(1);
}

console.log(`HTTP ${initRes.status}`);
const initHeaders = dumpHeaders(initRes.headers);
console.log("↩︎ Headers:", initHeaders);

if (!initRes.ok) {
  const body = await initRes.text();
  console.error("❌ Init failed. Body:\n", body);
  process.exit(1);
}

const sessionId = initRes.headers.get("mcp-session-id");
if (!sessionId) {
  console.error("❌ No 'mcp-session-id' header returned by server.");
  process.exit(1);
}

const initBody = await readJsonOrSse(initRes);
if (initBody?.jsonrpc !== "2.0" || (!initBody.result && !initBody.error)) {
  console.error("❌ Not a valid JSON-RPC 2.0 response:", initBody);
  process.exit(1);
}

console.log("✅ Session created:", sessionId);
console.log("Initialize response OK.");

// ---- Call a tool (with retry/backoff) ---------------------------------------
console.log("\n🔹 Calling tool 'add'...");
const toolReq = {
  jsonrpc: "2.0",
  id: "2",
  method: "tools/call",
  params: { name: "add", arguments: { a: 5, b: 7 } },
};

let attempt = 0;
let toolRes, toolBody;
while (true) {
  attempt++;
  toolRes = await postJsonOrSse(BASE, toolReq, { "mcp-session-id": sessionId });
  console.log(`HTTP ${toolRes.status} (attempt ${attempt})`);
  const toolHeaders = dumpHeaders(toolRes.headers);
  console.log("↩︎ Headers:", toolHeaders);

  if (toolRes.ok) {
    toolBody = await readJsonOrSse(toolRes);
    break;
  }

  const text = await toolRes.text().catch(() => "");
  if (toolRes.status === 400 && /No valid session ID provided/i.test(text) && attempt < 8) {
    const delay = Math.min(50 * 2 ** (attempt - 1), 500);
    console.log(`⏳ Waiting ${delay} ms for session to become routable, then retrying...`);
    await sleep(delay);
    continue;
  }

  console.error("❌ tools/call failed. Body:\n", text);
  process.exit(1);
}

console.log("✅ Tool response JSON:", JSON.stringify(toolBody, null, 2));

// ---- Call graphite-show-component-samples tool ------------------------------
console.log("\n🔹 Calling tool 'graphite-show-component-samples'...");
const graphiteToolReq = {
  jsonrpc: "2.0",
  id: "2a",
  method: "tools/call",
  params: { name: "graphite-show-component-samples", arguments: { componentName: "page" } },
};

let graphiteToolRes, graphiteToolBody;
graphiteToolRes = await postJsonOrSse(BASE, graphiteToolReq, { "mcp-session-id": sessionId });
console.log(`HTTP ${graphiteToolRes.status}`);
const graphiteToolHeaders = dumpHeaders(graphiteToolRes.headers);
console.log("↩︎ Headers:", graphiteToolHeaders);

if (graphiteToolRes.ok) {
  graphiteToolBody = await readJsonOrSse(graphiteToolRes);
  const hasContent = graphiteToolBody?.result?.content?.length > 0;
  if (hasContent) {
    passed++;
    console.log("✅ Graphite tool response received. hasContent:", hasContent);
  } else {
    failed++;
    console.log("❌ Graphite tool response not received. hasContent:", hasContent);
  }
  // console.log("Response:", JSON.stringify(graphiteToolBody, null, 2));
} else {
  failed++
  const text = await graphiteToolRes.text().catch(() => "");
  console.error("❌ graphite-show-component-samples call failed. Body:\n", text);
}

// ---- Call tools/list to get available tools and count them -----------------
console.log("\n🔹 Calling tools/list...");
const toolsListReq = {
  jsonrpc: "2.0",
  id: "3",
  method: "tools/list",
  params: {},
};

let toolsListRes, toolsListBody;
toolsListRes = await postJsonOrSse(BASE, toolsListReq, { "mcp-session-id": sessionId });
console.log(`HTTP ${toolsListRes.status}`);
const toolsListHeaders = dumpHeaders(toolsListRes.headers);
console.log("↩︎ Headers:", toolsListHeaders);

if (toolsListRes.ok) {
  toolsListBody = await readJsonOrSse(toolsListRes);
  const toolsCount = toolsListBody?.result?.tools?.length || 0;
  if (toolsCount > 0) {
    passed++
    console.log(`✅ Tools list response received. Found ${toolsCount} tools.`);
  } else {
    failed++
    console.log("❌ Tools list response received. No tools found.");
  }
  // console.log("Tools list response:", JSON.stringify(toolsListBody, null, 2));
} else {
  failed++
  const text = await toolsListRes.text().catch(() => "");
  console.error("❌ tools/list failed. Body:\n", text);
}

// ---- Call resources/list to get available resources and count them ---------
console.log("\n🔹 Calling resources/list...");
const resourcesListReq = {
  jsonrpc: "2.0",
  id: "4",
  method: "resources/list",
  params: {},
};

let resourcesListRes, resourcesListBody;
resourcesListRes = await postJsonOrSse(BASE, resourcesListReq, { "mcp-session-id": sessionId });
console.log(`HTTP ${resourcesListRes.status}`);
const resourcesListHeaders = dumpHeaders(resourcesListRes.headers);
console.log("↩︎ Headers:", resourcesListHeaders);

if (resourcesListRes.ok) {
  resourcesListBody = await readJsonOrSse(resourcesListRes);
  const resourcesCount = resourcesListBody?.result?.resources?.length || 0;
  if (resourcesCount > 0) {
    passed++;
    console.log(`✅ Resources list response received. Found ${resourcesCount} resources.`);
} else {
  failed++;
    console.log("❌ No resources found in resources/list response.");
  }
  // console.log("Resources list response:", JSON.stringify(resourcesListBody, null, 2));
} else {
  failed++
  const text = await resourcesListRes.text().catch(() => "");
  console.error("❌ resources/list failed. Body:\n", text);
}

// ---- Call a specific resource (controllers-guide) --------------------------
console.log("\n🔹 Calling resource 'controllers-guide'...");
const resourceReq = {
  jsonrpc: "2.0",
  id: "5",
  method: "resources/read",
  params: { uri: "graphite://guides/controllers" },
};

let resourceRes, resourceBody;
resourceRes = await postJsonOrSse(BASE, resourceReq, { "mcp-session-id": sessionId });
console.log(`HTTP ${resourceRes.status}`);
const resourceHeaders = dumpHeaders(resourceRes.headers);
console.log("↩︎ Headers:", resourceHeaders);

if (resourceRes.ok) {
  resourceBody = await readJsonOrSse(resourceRes);
  const hasContent = resourceBody?.result?.contents?.length > 0;
  if(hasContent) {
    passed++
    console.log(`✅ Resource response received. Has content: ${hasContent}`);
  } else {
    failed++
    console.log(`❌ Resource response received. Has content: ${hasContent}`);
  }
    // console.log("Resource response:", JSON.stringify(resourceBody, null, 2));
} else {
  failed++;
  const text = await resourceRes.text().catch(() => "");
  console.error("❌ resources/get failed. Body:\n", text);
}

// ---- Call prompts/list to get available prompts and count them ------------
console.log("\n🔹 Calling prompts/list...");
const promptsListReq = {
  jsonrpc: "2.0",
  id: "6",
  method: "prompts/list",
  params: {},
};

let promptsListRes, promptsListBody;
promptsListRes = await postJsonOrSse(BASE, promptsListReq, { "mcp-session-id": sessionId });
console.log(`HTTP ${promptsListRes.status}`);
const promptsListHeaders = dumpHeaders(promptsListRes.headers);
console.log("↩︎ Headers:", promptsListHeaders);

if (promptsListRes.ok) {
  promptsListBody = await readJsonOrSse(promptsListRes);
  const promptsCount = promptsListBody?.result?.prompts?.length || 0;
  if(promptsCount > 0) {
    passed++
    console.log(`✅ Prompts list response received. Found ${promptsCount} prompts.`);
  } else {
    failed++
    console.log("❌ No prompts found.");
  }
  // console.log("Prompts list response:", JSON.stringify(promptsListBody, null, 2));
} else {
  failed++
  const text = await promptsListRes.text().catch(() => "");
  console.error("❌ prompts/list failed. Body:\n", text);
}

// ---- Call a specific prompt (use-tools-before-xml) --------------------------
console.log("\n🔹 Calling prompt 'use-tools-before-xml'...");
const promptReq = {
  jsonrpc: "2.0",
  id: "7",
  method: "prompts/get",
  params: {
    name: "use-tools-before-xml",
    arguments: {
      task: "Create a form with a text input and a submit button"
    }
  },
};

let promptRes, promptBody;
promptRes = await postJsonOrSse(BASE, promptReq, { "mcp-session-id": sessionId });
console.log(`HTTP ${promptRes.status}`);
const promptHeaders = dumpHeaders(promptRes.headers);
console.log("↩︎ Headers:", promptHeaders);

if (promptRes.ok) {
  promptBody = await readJsonOrSse(promptRes);
  const hasMessages = promptBody?.result?.messages?.length > 0;
  if (hasMessages) {
    passed++;
    console.log(`✅ Prompt response received. Has messages: ${hasMessages}`);
  } else {
    failed++;
    console.log("❌ Prompt response received. No messages");
  }
} else {
  failed++;
  const text = await promptRes.text().catch(() => "");
  console.error("❌ prompts/call for 'use-tools-before-xml' failed. Body:\n", text);
}
  // console.log("Prompt response:", JSON.stringify(promptBody, null, 2));

// ---- Test graphite-rag-search tool -----------------------------------------
console.log("\n🔹 Testing graphite-rag-search tool...");

// First test - Basic graphite query with all indexes
const ragToolReq1 = {
  jsonrpc: "2.0",
  id: "rag-test-1",
  method: "tools/call",
  params: {
    name: "retrieve-specific-examples-and-documentation",
    arguments: {
      query: "How do I use graphite components in my application?",
      xmlContext: '',
      indexes: ['all']
    }
  },
};

let ragToolRes1, ragToolBody1;
ragToolRes1 = await postJsonOrSse(BASE, ragToolReq1, { "mcp-session-id": sessionId });
console.log(`HTTP ${ragToolRes1.status}`);
const ragToolHeaders1 = dumpHeaders(ragToolRes1.headers);
console.log("↩︎ Headers:", ragToolHeaders1);

if (ragToolRes1.ok) {
  ragToolBody1 = await readJsonOrSse(ragToolRes1);
  console.log(ragToolBody1)
  const hasResults = ragToolBody1?.result?.content && ragToolBody1.result.content.length > 0;
  
  if (hasResults) {
    passed++;
    console.log(`✅ RAG search returned ${ragToolBody1.result.content.length} results for basic query`);
  } else {
    failed++;
    console.log("❌ RAG search returned no results for basic query");
  }
} else {
  failed++;
  const text = await ragToolRes1.text().catch(() => "");
  console.error("❌ graphite-rag-search call failed for basic query. Body:\n", text);
}

// Second test - Mobile-related query with specific index
console.log("\n🔹 Testing graphite-rag-search with specific index...");
const ragToolReq2 = {
  jsonrpc: "2.0",
  id: "rag-test-2",
  method: "tools/call",
  params: {
    name: "retrieve-specific-examples-and-documentation",
    arguments: {
      query: "What are best practices for mobile app development with graphite?",
      xmlContext: '',
      indexes: ['technician-app-xml']
    }
  },
};

let ragToolRes2, ragToolBody2;
ragToolRes2 = await postJsonOrSse(BASE, ragToolReq2, { "mcp-session-id": sessionId });
console.log(`HTTP ${ragToolRes2.status}`);
const ragToolHeaders2 = dumpHeaders(ragToolRes2.headers);
console.log("↩︎ Headers:", ragToolHeaders2);

if (ragToolRes2.ok) {
  ragToolBody2 = await readJsonOrSse(ragToolRes2);
  const hasResults = ragToolBody2?.result?.content && ragToolBody2.result.content.length > 0;
  
  if (hasResults) {
    passed++;
    console.log(`✅ RAG search returned ${ragToolBody2.result.content.length} results for mobile query`);
  } else {
    failed++;
    console.log("❌ RAG search returned no results for mobile query");
  }
} else {
  failed++;
  const text = await ragToolRes2.text().catch(() => "");
  console.error("❌ graphite-rag-search call failed for mobile query. Body:\n", text);
}

// ---- Optional: close the session -------------------------------------------
console.log("\n🔹 Closing session...");
const delRes = await fetch(BASE, {
  method: "DELETE",
  headers: {
    "mcp-session-id": sessionId,
    "Accept": "application/json, text/event-stream",
  },
});

console.log(`HTTP ${delRes.status}`);
if (!delRes.ok) {
  const body = await delRes.text();
  console.warn("⚠️ Session close returned non-OK:", body);
} else {
  console.log("🛑 Session closed.");
}

console.log(`All tests complete. Passed: ${passed}, Failed: ${failed}`);
process.exit(0);