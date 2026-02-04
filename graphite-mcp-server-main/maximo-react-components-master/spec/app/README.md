Maximo App Components are components that have tight integration to the Maximo JS Library and the Maximo Server.  These depend on the maximo UI components and the layout components.

Components in this repository might include things like...

* Application Scaffolds
* Configurable components (components that are dynamic based on information from the maximo server)
* Specific Application components like a default work order card, etc.
* Datasource Components, that are bound to maximo datasources
* Login component
* Routing components

But again, if a component can be created without a specific dependency on the Maximo Framework, then we should do that, and then move the component the maximo UI component library.
