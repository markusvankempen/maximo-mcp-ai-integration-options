# Schema Tool Output Format Comparison

## Overview

The optimized schema tool now returns **structured text** instead of raw JSON, matching the pattern used by other Graphite tools (component properties, colors, icons).

## Why Structured Text?

1. **More readable** for LLMs and humans
2. **Consistent** with other Graphite tools
3. **Better token efficiency** - no JSON syntax overhead
4. **Easier to parse** key information
5. **Clearer hierarchy** with indentation

## Format Examples

### Brief Mode (99.3% reduction)

```
=== ASSET Schema ===
Object Structure: MXAPIASSET
Description: Maximo API for Asset
Primary Key: siteid, assetnum
Unique ID: assetuid

Properties: 10
Detail Level: brief
Token Efficiency: 99.3% reduction (100.39 KB → 0.68 KB)

Property List:

  expectedlifedate (Expected EOL)
    Type: string

  parent (Parent)
    Type: string

  installdate (Installation Date)
    Type: string

  status (Status)
    Type: string
```

**Use case**: Quick property discovery, field listing

### Standard Mode (74.7% reduction)

```
=== ASSET Schema ===
Object Structure: MXAPIASSET
Description: Maximo API for Asset
Primary Key: siteid, assetnum
Unique ID: assetuid

Properties: 155
Detail Level: standard
Token Efficiency: 74.7% reduction (100.39 KB → 25.39 KB)

Properties:

  expectedlifedate
    Title: Expected EOL
    Type: string (DATE)
    Description: The date that the asset reaches the expected useful life date...
    Search Type: EXACT

  parent
    Title: Parent
    Type: string (UPPER)
    Description: Parent Asset Number
    Max Length: 25
    Has List: Yes
    Search Type: WILDCARD

  installdate
    Title: Installation Date
    Type: string (DATE)
    Description: Installation Date
    Search Type: EXACT
```

**Use case**: Most development tasks, form building, validation

### Search Results (99.4% reduction)

```
=== ASSET Schema ===
Object Structure: MXAPIASSET
Description: Maximo API for Asset
Primary Key: siteid, assetnum
Unique ID: assetuid

Properties: 5 (filtered from 155)
Detail Level: brief
Token Efficiency: 99.4% reduction (100.39 KB → 0.55 KB)

Property List:

  rolltoallchildren (Roll New Status to All Child Assets)
    Type: boolean

  status (Status)
    Type: string

  statusdate (Last Changed Date)
    Type: string

  status_description
    Type: string

  changepmstatus (Change the Status of All Associated PMs to Inactive)
    Type: boolean
```

**Use case**: Finding specific properties quickly

## Comparison with Component Properties Tool

### Component Properties Output
```
Component: button
Description: A clickable button component
Category: form

Properties (15):

  label
    Type: string
    Description: The button label text
    Required: Yes

  icon
    Type: One of 395 values
    Description: Carbon icon name
```

### Schema Properties Output (Similar Pattern)
```
Object Structure: MXAPIASSET
Description: Maximo API for Asset
Primary Key: siteid, assetnum

Properties: 155

Properties:

  assetnum
    Title: Asset
    Type: string (UPPER)
    Description: Identifies the asset
    Max Length: 25
    Search Type: WILDCARD
```

## Benefits of Structured Text

### 1. Readability
- Clear section headers with `===`
- Consistent indentation (2 spaces per level)
- Property names stand out
- Metadata clearly separated

### 2. Scannability
- Easy to find specific properties
- Type information immediately visible
- Descriptions are clearly labeled
- Related information grouped together

### 3. Token Efficiency
- No JSON syntax overhead (`{}`, `[]`, `""`, `,`)
- No repeated keys in every property
- Cleaner, more compact representation
- Better compression in LLM context

### 4. Consistency
- Matches component properties format
- Matches color/icon search format
- Familiar pattern for users
- Predictable structure

### 5. Extensibility
- Easy to add new fields
- Clear where to add information
- Doesn't break parsing
- Human-friendly modifications

## Size Comparison

### Raw JSON (Old Format)
```json
{
  "resource": "MXAPIASSET",
  "description": "Maximo API for Asset",
  "pk": ["siteid", "assetnum"],
  "properties": {
    "assetnum": {
      "title": "Asset",
      "type": "string",
      "subType": "UPPER",
      "maxLength": 25,
      "searchType": "WILDCARD",
      "remarks": "Identifies the asset"
    }
  }
}
```
**Size**: ~200 characters for one property

### Structured Text (New Format)
```
  assetnum
    Title: Asset
    Type: string (UPPER)
    Description: Identifies the asset
    Max Length: 25
    Search Type: WILDCARD
```
**Size**: ~120 characters for same property (40% reduction)

## Migration Impact

### Before (Raw JSON)
```javascript
// Tool returned raw JSON string
{
  "content": [{
    "type": "text",
    "text": "{\"resource\":\"MXAPIASSET\",\"properties\":{...}}"
  }]
}
```

### After (Structured Text)
```javascript
// Tool returns formatted text
{
  "content": [{
    "type": "text",
    "text": "=== ASSET Schema ===\nObject Structure: MXAPIASSET\n..."
  }]
}
```

**Impact**: 
- ✅ More readable for LLMs
- ✅ Better token efficiency
- ✅ Consistent with other tools
- ✅ Easier to understand
- ✅ No breaking changes (still returns text)

## Summary

The structured text format provides:
- **Better readability** for both LLMs and humans
- **Improved token efficiency** beyond just filtering
- **Consistency** with other Graphite tools
- **Easier parsing** of key information
- **Professional presentation** of data

This matches the successful pattern used in component properties, colors, and icons tools, providing a unified experience across all Graphite MCP tools.