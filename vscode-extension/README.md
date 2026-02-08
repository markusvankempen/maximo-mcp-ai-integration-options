# IBM Maximo MCP for AI

Empower your AI assistant in VS Code with real-time access to your IBM Maximo data. This extension automatically configures the **Model Context Protocol (MCP)** server for Maximo, allowing AI tools like **GitHub Copilot**, **Continue**, and **Cursor** to query work orders, assets, and more.

## 🚀 Key Features

- **Automated Setup**: No more editing `config.json` or `settings.json` manually.
- **Secure Configuration**: Stores your credentials safely in VS Code user settings.
- **Schema Discovery**: Gives AI assistants deep knowledge of your Object Structures.
- **Live Data**: Fetch real-time records directly from your Maximo instance using OSLC.

## 🛠️ Getting Started

1. **Install** the extension.
2. **Open the Command Palette** (`Cmd+Shift+P` or `Ctrl+Shift+P`).
3. Search for **"Maximo: Configure MCP Server"**.
4. Enter your **Maximo URL** and **API Key**.
5. Your AI assistant will now have access to Maximo tools!


## 💡 Example Prompts

Once configured, you can ask your AI assistant tasks like:

- *"List the last 10 work orders where the status is 'APPR'."*
- *"Show me the details for asset #12345."*
- *"Query Maximo for assets in the 'BEDFORD' site."*
- *"What is the schema for the MXWO object structure?"*

## 📦 Tools Provided

The extension enables the following tools for your AI:

- `list_object_structures`: Browse available Maximo APIs.
- `get_schema_details`: Understand the fields and relationships for a specific object.
- `query_maximo`: Execute powerful OSLC queries with filters and sorting.
- `get_instance_details`: Fetch full data for a specific record ID.

## 🔧 Requirements

- **VS Code** v1.90.0 or higher.
- A running **IBM Maximo** instance (7.6.1+ or MAS) with REST API enabled.
- A valid **Maximo API Key**.

## 🤝 Troubleshooting

### AI doesn't see the tools?
- Ensure you have a compatible AI extension installed (e.g., **Continue** or **GitHub Copilot** with MCP enabled).
- Check the **Output** panel in VS Code and select **MCP** or **Continue** from the dropdown to see connection logs.
- Run the `Maximo: Configure MCP Server` command again to verify your credentials.

---

**Developed by**: [Markus van Kempen](https://github.com/markusvankempen)  
**Project Home**: [Maximo-MCP AI Integration Options](https://github.com/markusvankempen/maximo-mcp-ai-integration-options)

