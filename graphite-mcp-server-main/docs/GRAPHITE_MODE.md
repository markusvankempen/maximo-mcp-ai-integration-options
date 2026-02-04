# Graphite Mode for IBM Bob

This repository contains a shareable custom mode configuration for IBM Bob that enables specialized support for the Graphite framework, including Graphite UI components and DBC (Database Configuration) files.

## What is the Graphite Mode?

The Graphite mode transforms Bob into a specialized coding assistant for the Graphite framework. It provides:

- **Strict Component Validation**: Prevents hallucination by requiring validation against canonical component lists
- **DBC Support**: Specialized tools for working with Maximo database configuration files
- **Graphite UI Workflow**: Guided workflow for discovering, validating, composing, and verifying Graphite components
- **MCP Integration**: Leverages Model Context Protocol tools for accessing Graphite documentation and component definitions

## Features

### Graphite UI Development
- Component discovery and validation using MCP tools
- Layout composition without CSS (using Graphite layout components)
- Datasource integration (json-datasource, maximo-datasource)
- State management with the `state` component
- Vanilla JavaScript controllers (no React)
- Build validation with `yarn build`

### DBC (Database Configuration) Support
- DBC file structure validation
- Element and attribute discovery
- DTD-compliant XML generation
- Search and navigation tools

## Installation

### Method 1: Import via Bob UI (Recommended)

1. Download the [graphite-mode.yaml](./graphite-mode.yaml) file from this repository
2. Open IBM Bob
3. Go to Settings → Custom Modes
4. Click "Import Mode" or "Add Custom Mode"
5. Select the `graphite-mode.yaml` file
6. The Graphite mode will be added to your available modes

## Prerequisites

To use the Graphite mode effectively, you need:

1. **Graphite MCP Server**: The mode relies on MCP tools for accessing Graphite documentation
   - Ensure the Graphite MCP server is configured in your Bob MCP settings
   - The server should provide tools like:
     - `graphite-list-components`
     - `graphite-show-component-properties`
     - `graphite-show-component-samples`
     - `dbc-list-elements`
     - `dbc-get-element-info`
     - And other Graphite/DBC tools

2. **Graphite Project**: A Graphite framework project with:
   - `yarn` or `npm` installed
   - Build scripts configured
   - Proper project structure

## Usage

### Activating the Mode

1. Open a Graphite project in Bob
2. Click the mode selector (usually shows "💻 Code" by default)
3. Select "Graphite" from the list of available modes
4. Bob will now follow Graphite-specific workflows and rules

### Example Workflows

#### Creating a Graphite Component

```
User: "Create a new page with a data table showing work orders"

Bob will:
1. Read graphite://guides/overview for context
2. Use graphite-list-components to find available components
3. Use graphite-show-component-properties for table and datasource details
4. Compose the XML using only validated components
5. Run yarn build to verify the implementation
```

#### Working with DBC Files

```
User: "Add a new index to the WORKORDER table"

Bob will:
1. Read dbc://guides/overview for DBC structure
2. Use dbc-list-elements to understand available elements
3. Use dbc-get-element-info for table and index details
4. Use dbc-validate-structure before generating XML
5. Create the DBC XML following DTD rules
```

## Mode Behavior

The Graphite mode enforces strict rules:

- **No Component Hallucination**: Must validate all components against `graphite-list-components`
- **No Property Invention**: Must validate all properties via `graphite-show-component-properties`
- **No CSS for Layout**: Must use Graphite layout components (box, border-layout, etc.)
- **Datasource Required**: All data must come from datasource components
- **Build Validation**: Must run `yarn build` after changes
- **Vanilla JavaScript Only**: Controllers must be vanilla JS, no React

## Troubleshooting

### Mode Not Appearing

- Verify the YAML syntax is correct (no tabs, proper indentation)
- Restart Bob after adding the mode
- Check Bob's logs for import errors

### MCP Tools Not Available

- Ensure the Graphite MCP server is running
- Check MCP settings in Bob
- Verify the server provides the required tools

### Build Errors

The mode will:
1. Re-check components against canonical lists
2. Correct XML based on tool outputs
3. Rebuild until clean
4. Fix lint errors from changes

## Customization

You can customize the mode by editing `graphite-mode.yaml`:

- **slug**: Change the mode identifier (must be unique)
- **name**: Change the display name in Bob's UI
- **description**: Update the mode description
- **roleDefinition**: Modify the assistant's behavior and rules
- **whenToUse**: Update when the Orchestrator should suggest this mode
- **groups**: Add or remove tool group permissions (read, edit, browser, command, mcp)

After customization, re-import the mode or restart Bob.

## Sharing

To share this mode with others:

1. Provide them with the `graphite-mode.yaml` file
2. Share this README for installation instructions
3. Ensure they have the Graphite MCP server configured
4. Optionally, share your MCP server configuration

## Version History

- **v1.0.0**: Initial release with Graphite UI and DBC support

## Support

For issues or questions:
- Check the Graphite framework documentation
- Review the MCP server logs
- Verify component names against `graphite-list-components`
- Ensure build tools are properly configured

## License

This mode configuration is provided as-is for use with IBM Bob and the Graphite framework.