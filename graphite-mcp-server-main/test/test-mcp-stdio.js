#!/usr/bin/env node
// Test for mcp-server.js with --stdio argument

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

// Protocol version
const PROTOCOL_VERSION = "2024-11-05";

// Path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MCP_SERVER_PATH = path.join(__dirname, 'src', 'mcp-server.js');

// Test function
async function runTests() {
  console.log("Starting MCP Server stdio tests...");
  
  try {
    // Test case: Initialize MCP server with --stdio argument
    console.log("Test: Initialize MCP server with --stdio argument");
    
    // Spawn the MCP server process with --stdio argument
    const mcpProcess = spawn('node', [MCP_SERVER_PATH, '--stdio'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Set up error handling
    mcpProcess.on('error', (error) => {
      console.error('Failed to start MCP server process:', error);
      process.exit(1);
    });
    
    // Collect stderr output for debugging
    let stderrData = '';
    mcpProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });
    
    // Set up a promise to handle the response
    const responsePromise = new Promise((resolve, reject) => {
      let responseData = '';
      
      mcpProcess.stdout.on('data', (data) => {
        responseData += data.toString();
        
        // Check if we've received a complete JSON-RPC response
        try {
          const jsonEnd = responseData.indexOf('\n');
          if (jsonEnd !== -1) {
            const jsonStr = responseData.substring(0, jsonEnd);
            const response = JSON.parse(jsonStr);
            resolve(response);
          }
        } catch (error) {
          // Not a complete JSON response yet, continue collecting
        }
      });
      
      // Set a timeout in case we don't get a response
      setTimeout(() => {
        reject(new Error(`Timeout waiting for response. stderr: ${stderrData}`));
      }, 5000);
    });
    
    // Send an initialize request to the MCP server
    const initializeRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
        protocolVersion: PROTOCOL_VERSION
      }
    };
    
    console.log("Sending initialize request to MCP server");
    mcpProcess.stdin.write(JSON.stringify(initializeRequest) + '\n');
    
    // Wait for the response
    const response = await responsePromise;
    
    // Verify the response
    console.log("Received response:", JSON.stringify(response, null, 2));
    assert.strictEqual(response.jsonrpc, "2.0", "Response should use JSON-RPC 2.0");
    assert.strictEqual(response.id, 1, "Response ID should match request ID");
    assert.ok(response.result, "Response should have a result");
    assert.ok(response.result.capabilities, "Response should include server capabilities");
    
    console.log("✅ Test passed: MCP server initialized successfully with --stdio argument");
    
    // Clean up: terminate the MCP server process
    mcpProcess.stdin.end();
    mcpProcess.kill();
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
  
  console.log("All tests completed!");
}

// Run the tests
runTests();
