"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    console.log('Maximo MCP Extension is now active');
    let configureCommand = vscode.commands.registerCommand('maximoMcp.configure', async () => {
        const config = vscode.workspace.getConfiguration('maximoMcp');
        const url = await vscode.window.showInputBox({
            prompt: 'Enter Maximo API URL',
            value: config.get('url') || ''
        });
        if (url !== undefined) {
            await config.update('url', url, vscode.ConfigurationTarget.Global);
            const apiKey = await vscode.window.showInputBox({
                prompt: 'Enter Maximo API Key',
                password: true,
                value: config.get('apiKey') || ''
            });
            if (apiKey !== undefined) {
                await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage('Maximo MCP configured successfully!');
                // Here we would ideally trigger a settings update for Continue or VS Code's native MCP
                updateMcpSettings(url, apiKey);
            }
        }
    });
    context.subscriptions.push(configureCommand);
}
async function updateMcpSettings(url, apiKey) {
    // This is where the magic happens: 
    // We update the VS Code settings that MCP clients (like VS Code Insiders or Continue) look for.
    const vsConfig = vscode.workspace.getConfiguration();
    const mcpServers = vsConfig.get('mcpServers') || {};
    mcpServers['maximo-local'] = {
        command: "npx",
        args: ["-y", "maximo-mcp-server"],
        env: {
            "MAXIMO_URL": url,
            "MAXIMO_API_KEY": apiKey
        }
    };
    await vsConfig.update('mcpServers', mcpServers, vscode.ConfigurationTarget.Global);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map