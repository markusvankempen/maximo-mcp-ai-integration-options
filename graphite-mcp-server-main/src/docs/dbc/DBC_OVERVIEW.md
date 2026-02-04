# DBC (Database Configuration) Overview

## What is DBC?

DBC is an XML-based format used by IBM Maximo to make changes to the database structure and configuration. DBC scripts are the **only supported way** to modify the Maximo database schema in a controlled, repeatable manner.

## When to Use DBC Tools

**USE DBC tools when:**
- Working with DBC XML files (*.dbc files)
- Creating database configuration scripts
- Modifying Maximo database structure
- Adding/modifying tables, attributes, indexes
- Creating domains, relationships, views
- Configuring applications, modules, menus
- Setting up security options
- Managing system properties

**DO NOT use DBC tools when:**
- Building Graphite UI applications (use Graphite tools instead)
- Writing JavaScript controllers
- Working with React components
- Styling with CSS
- Fetching data from Maximo (use Maximo object structure tools)
- Creating mobile applications

## DBC vs Graphite

| Aspect | DBC | Graphite |
|--------|-----|----------|
| Purpose | Database configuration | UI framework |
| Format | XML (DTD-based) | XML (component-based) |
| Use Case | Schema changes | User interfaces |
| Tools | dbc-* tools | graphite-* tools |
| Validation | DTD schema | Component properties |

## DBC File Structure

A typical DBC file has this structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE script SYSTEM "script.dtd">
<script author="YourName" scriptname="ScriptName">
  <description>What this script does</description>
  
  <statements>
    <!-- Database operations go here -->
    <define_table object="MYTABLE" ...>
      <attrdef attribute="MYFIELD" .../>
    </define_table>
  </statements>
</script>
```

## Available DBC Tools

1. **dbc-list-elements** - List all valid DBC elements
2. **dbc-search-elements** - Search for elements (supports OR: "table index")
3. **dbc-get-element-info** - Get detailed element information
4. **dbc-get-element-attributes** - Get attribute details
5. **dbc-get-element-children** - Get allowed child elements
6. **dbc-validate-structure** - Validate before generating XML

## Workflow for Creating DBC Scripts

1. **Understand the requirement**: What database change is needed?
2. **Search for elements**: Use `dbc-search-elements` to find relevant operations
3. **Get element details**: Use `dbc-get-element-info` for the specific element
4. **Check attributes**: Use `dbc-get-element-attributes` to see required/optional attributes
5. **Check children**: Use `dbc-get-element-children` to understand nesting
6. **Validate**: Use `dbc-validate-structure` before generating XML
7. **Generate**: Create the DBC XML with proper structure

## Common DBC Operations

### Creating a Table
```xml
<define_table object="MYTABLE" description="My Table" 
              service="MYSERVICE" classname="com.example.MyTable"
              type="site" persistent="true">
  <attrdef attribute="MYID" maxtype="INTEGER" length="10" 
           required="true" title="ID" remarks="Primary key"/>
</define_table>
```

### Adding Attributes
```xml
<add_attributes object="EXISTINGTABLE">
  <attrdef attribute="NEWFIELD" maxtype="ALN" length="50"
           title="New Field" remarks="Description"/>
</add_attributes>
```

### Creating an Index
```xml
<specify_index object="MYTABLE" name="MYTABLE_IDX1" unique="true">
  <indexkey column="MYFIELD" ascending="true"/>
</specify_index>
```

### Creating a Domain
```xml
<specify_synonym_domain domainid="MYSTATUS" description="My Status"
                        maxtype="UPPER" length="20">
  <synonymvalueinfo value="ACTIVE" maxvalue="ACTIVE" 
                    defaults="true" description="Active"/>
  <synonymvalueinfo value="INACTIVE" maxvalue="INACTIVE" 
                    defaults="false" description="Inactive"/>
</specify_synonym_domain>
```

## Important Rules

1. **DTD is the source of truth**: The script.dtd file defines all valid elements and attributes
2. **Required attributes must be provided**: Check element info for required attributes
3. **Enum values must be exact**: Use the exact values from the DTD
4. **Child elements must be allowed**: Check allowed children before nesting
5. **Always include check queries**: Prevent re-running scripts unnecessarily

## Key Concepts

- **Elements**: XML tags that represent database operations (e.g., define_table, add_attributes)
- **Attributes**: XML properties on elements (e.g., object="MYTABLE", type="site")
- **Content Model**: What can be inside an element (children, text, or empty)
- **Required vs Optional**: Some attributes must be provided, others have defaults
- **Enum Types**: Some attributes only accept specific values (e.g., type="site|system|org")

## Error Prevention

Before generating DBC XML:
1. Verify element exists with `dbc-list-elements` or `dbc-search-elements`
2. Check all required attributes with `dbc-get-element-attributes`
3. Validate enum values match exactly
4. Confirm child elements are allowed with `dbc-get-element-children`
5. Use `dbc-validate-structure` to catch issues early

## Resources

- Full documentation: See src/docs/dbc/DBC_TOOLS.md
- DTD reference: src/docs/dbc/script.dtd
- JSON registry: src/docs/dbc/script_registry.json

## Remember

**DBC tools are ONLY for database configuration scripts, not for UI development.**
For Graphite UI work, use the graphite-* tools instead.

## Do’s & Don’ts (summary)
- ✅ Always replace the author's name with your real name.
- ❌ No not use use UPPERCASE table and column name when you are creating direct sql, such as where clause and relationships.
