// Graphite library functions for component management
import { mockComponents, mockColors, mockIcons } from './mock-maximo.js';

// Extract the actual components object from the nested default exports
const components = mockComponents.default;
const colorsModule = { default: mockColors.default };
const iconsData = mockIcons;



/**
 * Get a buffer of spaces to help align component names and descriptions
 * @param {string} string - String to align
 * @returns {string} Space buffer
 */
function getSpaceBuffer(string) {
  let buffer = "";
  for (let i = string.length; i < 30; i++) {
    buffer += " ";
  }
  return buffer;
}

/**
 * Search for components matching a query
 * @param {string} query - Search query (use "*" for all)
 * @param {string} [category] - Optional category filter (matches if component has this category)
 * @param {number} [limit=20] - Maximum number of results (default 20, max 50)
 * @returns {Array} Array of matching component objects
 */
function searchComponentsInternal(query, category, limit = 20) {
  if (!components) {
    return [];
  }

  const maxLimit = Math.min(limit || 20, 50);
  const keys = Object.keys(components);
  const results = [];

  // Normalize query for case-insensitive search
  const normalizedQuery = query?.toLowerCase() || "";
  const isWildcard = normalizedQuery === "*" || normalizedQuery === "";

  // Split query into terms for OR matching (space-separated)
  const queryTerms = isWildcard ? [] : normalizedQuery.split(/\s+/).filter(term => term.length > 0);

  for (const key of keys) {
    const component = components[key].default;
    if (!component) continue;

    // Category filter - handle comma-separated categories
    if (category) {
      const componentCategories = (component.category || "uncategorized").split(',').map(c => c.trim());
      const hasCategory = componentCategories.includes(category);

      if (!hasCategory) {
        continue;
      }
    }

    // Query matching - OR logic for multiple terms
    if (!isWildcard && queryTerms.length > 0) {
      const componentName = key.toLowerCase();
      const componentDesc = (component.description || "").toLowerCase();

      // Check if ANY term matches (OR logic)
      const hasMatch = queryTerms.some(term =>
        componentName.includes(term) || componentDesc.includes(term)
      );

      if (!hasMatch) {
        continue;
      }
    }

    results.push({
      name: key,
      description: component.description || "No description",
      category: component.category || "uncategorized"
    });

    // Stop if we've reached the limit
    if (results.length >= maxLimit) {
      break;
    }
  }

  return results;
}

/**
 * Format component results as structured text
 * @param {Array} results - Array of component objects
 * @param {number} totalMatches - Total number of matches
 * @returns {string} Formatted text output
 */
function formatComponentResults(results, totalMatches) {
  if (results.length === 0) {
    return "No components found matching your criteria.";
  }

  let output = "";

  // Add header with match count
  if (totalMatches > results.length) {
    output += `Showing ${results.length} of ${totalMatches} matches:\n\n`;
  } else {
    output += `Found ${results.length} component(s):\n\n`;
  }

  // Format each component
  for (const component of results) {
    const spaceBuffer = getSpaceBuffer(component.name);
    const categoryTag = component.category !== "uncategorized" ? ` [${component.category}]` : "";
    output += `${component.name}${spaceBuffer}[${component.description}]${categoryTag}\n`;
  }

  return output.trim();
}

/**
 * Search for Graphite components with optional filtering
 * @param {Object} options - Search options
 * @param {string} [options.query="*"] - Search query (use "*" for all)
 * @param {string} [options.category] - Optional category filter
 * @param {number} [options.limit=20] - Maximum results (default 20, max 50)
 * @param {boolean} [options.includeFullList=false] - Return all components
 * @returns {string} Formatted search results as structured text
 */
export function searchComponents({ query = "*", category, limit = 20, includeFullList = false } = {}) {
  // If includeFullList is true, return all components
  if (includeFullList) {
    return listComponents();
  }

  const results = searchComponentsInternal(query, category, limit);

  // Get total count without limit for display purposes
  const allResults = searchComponentsInternal(query, category, 1000);
  const totalMatches = allResults.length;

  return formatComponentResults(results, totalMatches);
}

/**
 * Get all unique component categories with component counts
 * Handles comma-separated categories by splitting and counting each individually
 * @returns {Object} Object with categories array and formatted text
 */
export function getComponentCategories() {
  if (!components) {
    return { categories: [], text: "No components found" };
  }

  const categoryMap = new Map();
  const keys = Object.keys(components);

  // Count components per category (split comma-separated categories)
  for (const key of keys) {
    const component = components[key].default;
    if (!component) continue;

    const categoryString = component.category || "uncategorized";
    const categories = categoryString.split(',').map(c => c.trim());

    for (const category of categories) {
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { name: category, count: 0, components: [] });
      }

      const catData = categoryMap.get(category);
      catData.count++;
      catData.components.push(key);
    }
  }

  // Sort categories alphabetically
  const categories = Array.from(categoryMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Format as structured text
  let output = "Graphite Component Categories:\n\n";
  output += "Note: Components can belong to multiple categories.\n";
  output += "When filtering by category, components with that category in their list will be returned.\n\n";
  output += `Total Unique Categories: ${categories.length}\n`;
  output += `Total Components: ${keys.length}\n\n`;

  for (const cat of categories) {
    const spaceBuffer = getSpaceBuffer(cat.name);
    output += `${cat.name}${spaceBuffer}(${cat.count} components)\n`;
  }

  return {
    categories: categories.map(c => ({ name: c.name, count: c.count })),
    text: output.trim()
  };
}

/**
 * List all available Graphite components with their descriptions
 * @returns {string} Formatted list of components
 */
export function listComponents() {
  if (!components) {
    return "No components found";
  }

  let output = "";
  const keys = Object.keys(components);

  for (const key of keys) {
    const spaceBuffer = getSpaceBuffer(key);
    const description = components[key].default?.description || "No description";
    output += `${key}${spaceBuffer}[${description}]\n`;
  }

  return output.trim();
}

/**
 * Format property type information
 * @param {*} type - Property type definition
 * @returns {string} Formatted type string
 */
function formatPropertyType(type, includeEnumDetails = false, maxEnumValues = 10) {
  if (typeof type === 'string') {
    return type;
  }

  if (type && type.oneOf) {
    const enumCount = type.oneOf.length;

    // If includeEnumDetails is true and enum count is small, show details
    if (includeEnumDetails && enumCount <= maxEnumValues) {
      return {
        summary: `One of ${enumCount} values`,
        hasDetails: true,
        values: type.oneOf
      };
    }

    // Otherwise just show the values inline (old behavior)
    const values = type.oneOf.map(opt => `"${opt.value}"`).join(', ');
    return `One of: ${values}`;
  }

  if (type && type.json) {
    return 'JSON object';
  }

  return 'unknown';
}

/**
 * Get detailed properties for a specific component with enhanced formatting
 * @param {string} componentName - Name of the component
 * @param {string} [searchTerm] - Optional search term to filter properties
 * @returns {Object} Object with properties data and formatted text
 */
export function getComponentProperties(componentName, searchTerm = null) {
  if (!components || !components[componentName]) {
    return {
      error: `Component "${componentName}" not found`,
      text: `Component "${componentName}" not found`
    };
  }

  const component = components[componentName].default;
  if (!component) {
    return {
      error: `Component "${componentName}" has no registry data`,
      text: `Component "${componentName}" has no registry data`
    };
  }

  const props = component.props || {};
  const propKeys = Object.keys(props);

  // Filter properties if search term provided
  let filteredProps = propKeys;
  if (searchTerm) {
    const normalizedSearch = searchTerm.toLowerCase();
    // Split search term into multiple terms for OR matching
    const searchTerms = normalizedSearch.split(/\s+/).filter(term => term.length > 0);

    filteredProps = propKeys.filter(key => {
      const keyLower = key.toLowerCase();
      const descLower = props[key].description?.toLowerCase() || '';

      // Check if ANY search term matches (OR logic)
      return searchTerms.some(term =>
        keyLower.includes(term) || descLower.includes(term)
      );
    });
  }

  if (filteredProps.length === 0) {
    return {
      properties: [],
      text: searchTerm
        ? `No properties found matching "${searchTerm}" for component "${componentName}"`
        : `Component "${componentName}" has no properties defined`
    };
  }

  // Build formatted output
  let output = `Component: ${componentName}\n`;
  output += `Description: ${component.description || 'No description'}\n`;
  output += `Category: ${component.category || 'uncategorized'}\n\n`;

  if (searchTerm) {
    output += `Showing ${filteredProps.length} of ${propKeys.length} properties matching "${searchTerm}":\n\n`;
  } else {
    output += `Properties (${filteredProps.length}):\n\n`;
  }

  const propertiesData = [];

  const ENUM_THRESHOLD = 10; // Show enum details if <= 10 values

  for (const propName of filteredProps) {
    const prop = props[propName];

    // Check if property has enum values and format accordingly
    const typeInfo = formatPropertyType(prop.type, true, ENUM_THRESHOLD);
    const hasEnumDetails = typeof typeInfo === 'object' && typeInfo.hasDetails;

    const propData = {
      name: propName,
      type: hasEnumDetails ? typeInfo.summary : typeInfo,
      description: prop.description || 'No description',
      required: prop.required || false,
      default: prop.default,
      deprecated: prop.deprecated,
      localizable: prop.localizable,
      advanced: prop.advanced,
      requires: prop.requires,
      notWith: prop.notWith,
      requiredUnless: prop.requiredUnless,
      'mobile-supported': prop['mobile-supported'],
      enumValues: hasEnumDetails ? typeInfo.values : null
    };

    propertiesData.push(propData);

    // Format output
    output += `  ${propName}\n`;
    output += `    Type: ${propData.type}\n`;
    output += `    Description: ${propData.description}\n`;

    if (propData.required) {
      output += `    Required: Yes\n`;
    }

    if (propData.default !== undefined) {
      output += `    Default: ${JSON.stringify(propData.default)}\n`;
    }

    // Show enum values with descriptions if available
    if (hasEnumDetails && typeInfo.values) {
      output += `    Valid values:\n`;
      typeInfo.values.forEach((enumVal, idx) => {
        output += `      ${idx + 1}. "${enumVal.value}"`;
        if (enumVal.description) {
          output += ` - ${enumVal.description}`;
        }
        output += '\n';
      });
    }

    // If enum has more than threshold, suggest using dedicated tool
    if (prop.type && prop.type.oneOf && prop.type.oneOf.length > ENUM_THRESHOLD) {
      output += `    Note: This property has ${prop.type.oneOf.length} valid values. Use graphite-get-component-enum-values for full list with descriptions.\n`;
    }

    if (propData.requires) {
      const requiresList = Array.isArray(propData.requires)
        ? propData.requires.join(', ')
        : propData.requires;
      output += `    Requires: ${requiresList}\n`;
    }

    if (propData.notWith) {
      const notWithList = Array.isArray(propData.notWith)
        ? propData.notWith.join(', ')
        : propData.notWith;
      output += `    Not with: ${notWithList}\n`;
    }

    if (propData.requiredUnless) {
      const unlessList = Array.isArray(propData.requiredUnless)
        ? propData.requiredUnless.join(', ')
        : propData.requiredUnless;
      output += `    Required unless: ${unlessList}\n`;
    }

    if (propData.localizable) {
      output += `    Localizable: Yes\n`;
    }

    if (propData.advanced) {
      output += `    Advanced: Yes\n`;
    }

    if (propData.deprecated) {
      output += `    DEPRECATED (v${propData.deprecated.version}): ${propData.deprecated.message}\n`;
    }

    if (propData['mobile-supported'] === false) {
      output += `    Mobile: Not supported\n`;
    }

    output += '\n';
  }

  // Add additional component info
  if (component.slots && Object.keys(component.slots).length > 0) {
    output += `\nSlots (${Object.keys(component.slots).length}):\n`;
    for (const [slotName, slotDef] of Object.entries(component.slots)) {
      output += `  ${slotName}: ${slotDef.description || 'No description'}`;
      if (slotDef.required) output += ' (required)';
      output += '\n';
    }
  }

  if (component.children && component.children.length > 0) {
    output += `\nAllowed Children: ${component.children.join(', ')}\n`;
  }

  if (component.parent && component.parent.length > 0) {
    output += `\nAllowed Parents: ${component.parent.join(', ')}\n`;
  }

  return {
    componentName,
    description: component.description,
    category: component.category,
    properties: propertiesData,
    slots: component.slots,
    children: component.children,
    parent: component.parent,
    text: output.trim()
  };
}

/**
 * Get samples for a specific component
 * @param {string} componentName - Name of the component
 * @returns {Object} Object with samples data and formatted text
 */
export function getComponentSamples(componentName) {
  if (!components || !components[componentName]) {
    return {
      error: `Component "${componentName}" not found`,
      text: `Component "${componentName}" not found`
    };
  }

  const component = components[componentName].default;
  if (!component) {
    return {
      error: `Component "${componentName}" has no registry data`,
      text: `Component "${componentName}" has no registry data`
    };
  }

  const samples = component.samples || [];

  if (samples.length === 0) {
    return {
      samples: [],
      text: `Component "${componentName}" has no samples defined`
    };
  }

  let output = `Component: ${componentName}\n`;
  output += `Description: ${component.description || 'No description'}\n\n`;
  output += `Samples (${samples.length}):\n\n`;

  const samplesData = [];

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    samplesData.push({
      name: sample.name,
      description: sample.description,
      canRender: sample.canRender,
      source: sample.source
    });

    output += `Sample ${i + 1}: ${sample.name}\n`;
    if (sample.description) {
      output += `Description: ${sample.description}\n`;
    }
    if (sample.canRender !== undefined) {
      output += `Can Render: ${sample.canRender}\n`;
    }
    output += `\nSource:\n${sample.source}\n\n`;
    output += '---\n\n';
  }

  return {
    componentName,
    samples: samplesData,
    text: output.trim()
  };
}

/**
 * Get properties for multiple components at once
 * @param {string[]} componentNames - Array of component names
 * @returns {Object} Object with combined properties data
 */
export function getMultipleComponentProperties(componentNames) {
  if (!Array.isArray(componentNames) || componentNames.length === 0) {
    return {
      error: 'No component names provided',
      text: 'No component names provided'
    };
  }

  const results = [];
  let output = `Properties for ${componentNames.length} component(s):\n\n`;

  for (const componentName of componentNames) {
    const result = getComponentProperties(componentName);
    results.push(result);

    if (result.error) {
      output += `${componentName}: ${result.error}\n\n`;
    } else {
      output += `${'='.repeat(60)}\n`;
      output += result.text;
      output += `\n${'='.repeat(60)}\n\n`;
    }
  }

  return {
    components: results,
    text: output.trim()
  };
}

/**
 * Get enum values for specific properties of a component
 * @param {string} componentName - Name of the component
 * @param {string|string[]} propertyNames - Property name or array of property names
 * @param {string} [searchTerm] - Optional search term to filter enum values
 * @returns {Object} Object with enum values data and formatted text
 */
export function getComponentEnumValues(componentName, propertyNames, searchTerm = null) {
  if (!components || !components[componentName]) {
    return {
      error: `Component "${componentName}" not found`,
      text: `Component "${componentName}" not found`
    };
  }

  const component = components[componentName].default;
  if (!component || !component.props) {
    return {
      error: `Component "${componentName}" has no properties`,
      text: `Component "${componentName}" has no properties`
    };
  }

  // Normalize propertyNames to array
  const propNames = Array.isArray(propertyNames) ? propertyNames : [propertyNames];

  let output = `Component: ${componentName}\n`;
  output += `Description: ${component.description || 'No description'}\n\n`;

  const enumData = [];
  let totalEnumValues = 0;
  let filteredEnumValues = 0;

  for (const propName of propNames) {
    const prop = component.props[propName];

    if (!prop) {
      output += `Property "${propName}": Not found\n\n`;
      enumData.push({
        property: propName,
        error: 'Property not found'
      });
      continue;
    }

    // Check if property has enum values (oneOf)
    if (!prop.type || !prop.type.oneOf) {
      output += `Property "${propName}": No enum values (type: ${formatPropertyType(prop.type)})\n\n`;
      enumData.push({
        property: propName,
        type: formatPropertyType(prop.type),
        hasEnumValues: false
      });
      continue;
    }

    const enumValues = prop.type.oneOf;
    totalEnumValues += enumValues.length;

    // Filter enum values if search term provided
    let filteredValues = enumValues;
    if (searchTerm) {
      const normalizedSearch = searchTerm.toLowerCase();
      // Split search term into multiple terms for OR matching
      const searchTerms = normalizedSearch.split(/\s+/).filter(term => term.length > 0);

      filteredValues = enumValues.filter(enumVal => {
        const valueLower = enumVal.value.toLowerCase();
        const descLower = enumVal.description?.toLowerCase() || '';

        // Check if ANY search term matches (OR logic)
        return searchTerms.some(term =>
          valueLower.includes(term) || descLower.includes(term)
        );
      });
    }

    filteredEnumValues += filteredValues.length;

    // Build output
    output += `Property: ${propName}\n`;
    output += `  Type: ${prop.type.oneOfType || 'string'}\n`;
    output += `  Description: ${prop.description || 'No description'}\n`;

    if (prop.default !== undefined) {
      output += `  Default: ${JSON.stringify(prop.default)}\n`;
    }

    if (searchTerm && filteredValues.length < enumValues.length) {
      output += `  Enum Values: Showing ${filteredValues.length} of ${enumValues.length} matching "${searchTerm}"\n\n`;
    } else {
      output += `  Enum Values: ${filteredValues.length} total\n\n`;
    }

    // List enum values with descriptions
    filteredValues.forEach((enumVal, index) => {
      output += `    ${index + 1}. "${enumVal.value}"`;
      if (enumVal.description) {
        output += ` - ${enumVal.description}`;
      }
      output += '\n';
    });

    output += '\n';

    enumData.push({
      property: propName,
      type: prop.type.oneOfType || 'string',
      description: prop.description,
      default: prop.default,
      totalValues: enumValues.length,
      filteredValues: filteredValues.length,
      values: filteredValues.map(v => ({
        value: v.value,
        description: v.description
      }))
    });
  }

  // Add summary if multiple properties or search applied
  if (propNames.length > 1 || searchTerm) {
    output += `\nSummary:\n`;
    output += `  Properties queried: ${propNames.length}\n`;
    output += `  Total enum values: ${totalEnumValues}\n`;
    if (searchTerm) {
      output += `  Filtered values: ${filteredEnumValues}\n`;
    }
  }

  return {
    componentName,
    properties: enumData,
    totalEnumValues,
    filteredEnumValues: searchTerm ? filteredEnumValues : totalEnumValues,
    text: output.trim()
  };
}

/**
 * Search for Graphite color tokens
 * @param {string} [searchTerm] - Optional search term to filter colors
 * @returns {Object} Object with colors data and formatted text
 */
export function searchGraphiteColors(searchTerm = null) {
  const colors = colorsModule.default;
  const colorEntries = Object.entries(colors);

  let filteredColors = colorEntries;
  if (searchTerm) {
    const normalizedSearch = searchTerm.toLowerCase();
    // Split search term into multiple terms for OR matching
    const searchTerms = normalizedSearch.split(/\s+/).filter(term => term.length > 0);

    filteredColors = colorEntries.filter(([key, value]) => {
      const keyLower = key.toLowerCase();
      const valueLower = value.toLowerCase();

      // Check if ANY search term matches (OR logic)
      return searchTerms.some(term =>
        keyLower.includes(term) || valueLower.includes(term)
      );
    });
  }

  let output = `Graphite Color Tokens\n`;
  output += `Total colors: ${colorEntries.length}\n`;

  if (searchTerm) {
    output += `Matching "${searchTerm}": ${filteredColors.length}\n\n`;
  } else {
    output += '\n';
  }

  if (filteredColors.length === 0) {
    output += `No colors found matching "${searchTerm}"`;
  } else {
    filteredColors.forEach(([key, value]) => {
      output += `  ${value}\n`;
      output += `    Key: ${key}\n`;
      output += `    Token: ${value}\n\n`;
    });
  }

  return {
    totalColors: colorEntries.length,
    matchingColors: filteredColors.length,
    colors: filteredColors.map(([key, value]) => ({
      key,
      token: value
    })),
    text: output.trim()
  };
}

/**
 * Search for Graphite icons
 * @param {string} [searchTerm] - Optional search term to filter icons
 * @param {number} [limit=50] - Maximum number of results (default 50)
 * @returns {Object} Object with icons data and formatted text
 */
export function searchGraphiteIcons(searchTerm = null, limit = 50) {
  const allIcons = Object.entries(iconsData);
  const maxLimit = Math.min(limit || 50, 100);

  let filteredIcons = allIcons;
  if (searchTerm) {
    const normalizedSearch = searchTerm.toLowerCase();
    // Split search term into multiple terms for OR matching
    const searchTerms = normalizedSearch.split(/\s+/).filter(term => term.length > 0);

    filteredIcons = allIcons.filter(([iconName, iconData]) => {
      const nameLower = iconName.toLowerCase();

      // Check if ANY search term matches (OR logic)
      return searchTerms.some(term => nameLower.includes(term));
    });
  }

  // Apply limit
  const limitedIcons = filteredIcons.slice(0, maxLimit);

  let output = `Graphite Icons\n`;
  output += `Total icons: ${allIcons.length}\n`;

  if (searchTerm) {
    output += `Matching "${searchTerm}": ${filteredIcons.length}\n`;
  }

  if (limitedIcons.length < filteredIcons.length) {
    output += `Showing: ${limitedIcons.length} of ${filteredIcons.length}\n`;
  }

  output += '\n';

  if (limitedIcons.length === 0) {
    output += `No icons found matching "${searchTerm}"`;
  } else {
    limitedIcons.forEach(([iconName, iconData], index) => {
      output += `  ${index + 1}. ${iconName}`;
      if (iconData.deprecated) {
        output += ' (deprecated)';
      }
      output += '\n';
    });

    if (limitedIcons.length < filteredIcons.length) {
      output += `\n... and ${filteredIcons.length - limitedIcons.length} more. Refine your search or increase limit.`;
    }
  }

  return {
    totalIcons: allIcons.length,
    matchingIcons: filteredIcons.length,
    showingIcons: limitedIcons.length,
    icons: limitedIcons.map(([name, data]) => ({
      name,
      deprecated: data.deprecated
    })),
    text: output.trim()
  };
}

// Made with Bob
