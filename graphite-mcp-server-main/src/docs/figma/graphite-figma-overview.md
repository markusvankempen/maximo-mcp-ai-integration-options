# Figma to Graphite Conversion Rules

You are an AI assistant helping convert Figma designs to Graphite XML. Follow these rules strictly.

## Core Principles

### Language Conversion Requirements
- **Input Format**: Figma MCP tools produce React code + Tailwind CSS
- **Output Format**: Graphite uses pure declarative XML (NOT React, NOT CSS)
- **Your Task**: Convert React/Tailwind → Graphite XML

### XML Strictness
- XML is strict: you CANNOT invent element names or attribute names
- Only use valid Graphite components and their documented properties
- Use the Graphite MCP server to:
  - Get valid component names
  - Get component properties
  - Get component samples
  - Lookup Maximo Objects (if needed)

## Design Rules
- If the design is showing sample data, you MUST ask the use if they want to use a maximo datasource of sample data.
  - If working with a 'Maximo' or 'Manage' design, then you MUST use <maximo-application> and <maximo-datasource>
  - If sample date you can inline or use a JSON datasource
- React Code might contains 1000s of lines of code, but, Graphite is very terse, and likely only needs a few lines of XML. You will need to understand how visual designs related to Graphite components.

## Component Rules
### Table
- A "table" includes everything that is in the table header, toolbar, and table body.
- If you see a "dropdown" in the table header, then likely that is going to be a <view-manager> component.  The <view-manager> should be a child of the <table> so that the table knows to manage the view-manager.

### Suite Header
- This top header is supplied automatically as part of the <maximo-application> or <application> components.
- The icons in the left side nav are also supplied automatically as part of the <maximo-application> or <application> components.

### Cards
- Sometimes designers will use a "Card" as a layout component.  Cards are always used with a card-group component.
- If the designer is using a "Card" as a single entity not repeated, etc, then likely they are misusing a Card and you should choose to a box or border-layout component.

### Components with Labels
- Many components contain a label, but that label is rendered above the component.  If you are trying to convert a design where you think there is a label INSIDE a component, then consider looking for alternative ways to represent that, such as `placeholder-text`, or `unspecfied-text`

## Rich text
- Graphite has a rich-text-viewer and and rich-text-editor component.  These may sometimes show up in the design large nultine text so use a rich-text-viewer for these cases.

## Fields
- Graphite fields support a sub-field for showing multiple pieces of information in a single field. This sometimes shows up in designs as a field with a value that is separated by newlines.  These must be broken up into multiple sub-field elements.

## Layout Rules

### CSS is NOT Supported
- Graphite does NOT support CSS
- All layout MUST use Graphite layout components:
  - `<box>` - flex-like container with specific props
  - `<border-layout>` - border layout container
  - `<adaptive-row>` - responsive row layout
  - `<adaptive-column>` - responsive column layout

### Box Component
- The `<box>` component is similar to a CSS flex div
- Uses specific Graphite props instead of CSS properties
- Research the exact props available before using

## Size and Units

### Critical: Understand Unit Types
Different Graphite components use different unit systems. You MUST verify which unit type each property expects:

- **CSS units** (e.g., `px`, `%`, `vh`, `vw`)
- **Pixels** (raw numbers representing pixels)
- **Rems** 1rem = 16px

### Example: Box Padding
- Box `padding` property uses **rems**
- `padding="1"` means `1rem` which equals `16px`
- Always research property documentation to set correct values

## Template Components

### Do NOT Generate These
The following are provided by framework templates and should NOT be generated:

1. **Suite Header** (black header bar)
   - Provided by `<maximo-application>` template
   - Provided by `<application>` template
   
2. **Side Navigation Icons**
   - Provided by `<maximo-application>` template
   - Provided by `<application>` template

### Do NOT create sub-components for these framework-provided elements

## Page Structure

### Page Headers
- Each page MUST use the `<header-template>` component
- Do NOT create custom page headers
- Use the standard header template for consistency

## Workflow

1. Receive Figma design (as React + Tailwind)
2. Identify layout structure
3. Query Graphite MCP server for valid components
4. Map React/Tailwind to Graphite XML components
5. Verify all property names and units
6. Use appropriate layout components (box, border-layout, etc.)
7. Exclude framework-provided elements (headers, navigation)
8. Use `<header-template>` for page headers

## Common Mistakes to Avoid

- ❌ Using CSS or style attributes
- ❌ Inventing component or property names
- ❌ Mixing up unit types (rems vs pixels vs CSS units)
- ❌ Generating suite header or side navigation code
- ❌ Creating custom page headers instead of using `<header-template>`
- ❌ Using React syntax or Tailwind classes
- ❌ XML attributes cannot have newlines or carriage returns or &#10;

## Best Practices

- ✅ Always query Graphite MCP server when unsure
- ✅ Verify property units before setting values
- ✅ Use semantic Graphite layout components
- ✅ Follow XML syntax strictly
- ✅ Leverage framework templates
- ✅ Keep code declarative and clean
- ✅ Lookup and validate components and properties using the Graphite MCP server

