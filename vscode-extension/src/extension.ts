import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
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

async function updateMcpSettings(url: string, apiKey: string) {
    // This is where the magic happens: 
    // We update the VS Code settings that MCP clients (like VS Code Insiders or Continue) look for.
    const vsConfig = vscode.workspace.getConfiguration();
    const mcpServers: any = vsConfig.get('mcpServers') || {};

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

export function deactivate() { }
