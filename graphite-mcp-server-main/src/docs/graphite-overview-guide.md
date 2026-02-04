# Graphive overview

Graphite is a declarative xml framework that have a basic concepts
- XML is used for UI layout
- Vanilla Javascript is used for controllers
- Application, Page have reactive state where variables can be defined
- XML can bind to that state (eg, `hidden="{page.state.isButtonHidden}"`)
- XML can send events to controlls via named events which are method names on the controller
- Datasources are used to load data into the UI and the UI can react to data changes
- In graphite "less is more" is considered a good practice. ie, we don't add/set attributes unless we need them.
- In graphite if we don't need javascript then we don't create it.  eg, opening a dialog can be as simple as adding dialog="mydialog" on components that support it.

## project overview
- `src/app.xml` is the entry point of the application
- `package.json` contains scripts to build and run the application

## Application types
- Use a maximo-application when working with Maximo

## Binding
- Many attribute can bind to data and state by using `{}` notation in the attribute. eg, `label="{item.name}"`.  `{}` doesn't mean it's a json object, just that it's a binding.
- smart-input is used to bind to datasource values.  provides 2way binding.  Will automatically choose the input type based on the datasource schema
- when passing an inline json object you need to double curly braces `params="{{id: item.id}}"`.  The outer curly braces tell us that this is a binding, the inner curly braces tell us that this is a json object.

## Navigation
- you can navigate pages using `page="someotherpage"` if a component support it, such as button. You can pass parameters to a page using page-params.
- you can open dialogs using `dialog="mydialog"` from a component that supports it, such as button.
- Most components that support user clicking, can also support the common navigation patterns.
- When you click a row, the row will be selected.  So when you use have a link or button in a table row, clicking that link or button set the currently selected datasource item to be that row item.  No need to do anything else. This is handy when you need to pass the context of the row item to the next page or dialog.

## Layout
- Grapite uses box, border-layout, header-template, adaptive-row, and adaptive-column for most layout tasks.
- Most components support sizing and padding properties as well. ALWAYS check how the component expects sizing and padding to be specifid. eg, box padding uses a number but that number is 'rem' unit so a padding of 1 is 1rem (16px).  box sizes are integer values but they are %, of of 33 is 33% of the parent. It's important to understand how these numbers are used by a component in order to set correct values.
- Graphite does not use css units
- In most cases it is not necessary to set padding on components, since components provide their own padding, padding is only ever added is for some reason the layout requires a different padding than the standard OOTB defaults. (less is more)

## Page layout template
- Each page MUST use the `header-template` component to define the layout of the page.
- header-template support title, buttons, and breadcrumbs.

## Datasources
- Graphite supports 2 kinds of datasource json-datasource and maximo-datasource. json-datasource is used to load json data from a url or memory, maximo-datasource is used to load data from maximo.
- schema and attribute is required for all datasources.
- for maximo-datasoruce only the attribute name is required, since the schema details will be fetched from maximo. (less is more)
- json-datasource will need schema/attribute with label, type, subtype, etc, since it is not fetched.
- if you need to share datasources between pages, it should be defined at the application level.

## Data entry
- smart-input MUST be used to bind to datasource values.  provides 2way binding.  Will automatically choose the input type based on the datasource schema.  No need to set labels or types, since that will come from the datasource schema.
- Even though components such as text-input, date-input, exist, we always use the smart-input component.

## Troubleshooting
- If you see the error "Error: Connect/Authentication failed" it means the user needs to setup or configure their maximo proxy connection.  See the `manage-proxy` resource.

# Do’s and Don’ts for Graphite Development
- ✅ Always use the `graphite-list-components` tool when needing to know available components to use.
- ✅ Always use the `graphite-show-component-properties` tool to get a list of valid properties for a component.
- ✅ Always review the component samples using the `graphite-show-component-samples` tool to understand how to use a component.
- ✅ Always the `graphite-show-component-samples` and `graphite-show-component-properties` tools BEFORE using a component in the XML.
- ✅ Keep controller logic short; prefer quick validation/post-processing. Only use javascript if absolutely needed.
- ✅ Use named events + state updates to drive UI.
- ✅ Put app/page/datasource lifecycle logic in the proper hooks.
- ✅ Controller events in .js files always, never inline in the XML.
- ✅ Only use element properties that are valid for any given element.
- ✅ Lookup element properties when you are unsure if a property/attribute would be valid.
- ✅ Use the graphite-mcp server tools when trying to understand element properties and how to use them.
- ✅ use component props for layout and padding.
- ✅ use box and border-layout when laying out components.
- ✅ use the navigation attributes, where possible, for navigating to pages (page=mypage), and opening dialogs (dialog="mydialog")
- ✅ use smart-input when needing to get editable information from a datasource.
- ✅ prefer adaptive-row and adaptive-column when building multi-column layouts.
- ✅ IDs can only be letters and number and always starts with a letter.
- ❌ Long-running work in controllers.
- ❌ React/JSX or component logic inside controllers.
- ❌ Depending on any fixed handler order across controllers at the same level.
- ❌ Inline javascript controller methods in the xml.  the <controller> element is never to be used.
- ❌ Do not use async controller lifecycle methods
- ❌ Never use css styles on components, since components that support layout will have specific layout properties
- ❌ Don’t try to guess component names or props — rely on the tools above.
- ❌ Don't use javascript in the xml, unless there is no other way.
- ❌ Don't assume sizes, padding, etc are using css units.
- ❌ Do not use elements like text-input, date-input, etc, when building editable forms for a datasource.  Use smart-input.
- ❌ Do not create IDs on elements unless the ID is required.

