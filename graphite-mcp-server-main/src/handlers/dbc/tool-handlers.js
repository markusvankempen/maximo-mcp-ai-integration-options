// Handlers for DBC-specific tools
import { logger } from "../../utils/logger.js";
import {
  loadDBCSchema,
  getDBCElement,
  searchDBCElements,
  listDBCElements,
  getDBCElementAttributes,
  formatDBCElement,
} from "../../utils/dbc-utils.js";

/**
 * Handler for dbc-list-elements tool
 * Lists all available DBC elements
 */
export async function handleDBCListElements() {
  try {
    logger.info("Listing all DBC elements");
    
    const elements = await listDBCElements();
    const schema = await loadDBCSchema();
    
    const lines = [
      `DBC Elements (${elements.length} total)`,
      ``,
      `These are all valid XML elements that can be used in DBC (Database Configuration) scripts.`,
      `Use dbc-get-element-info to get detailed information about any element.`,
      ``,
      `Elements by Category:`,
      ``
    ];
    
    // Group elements by common prefixes/categories
    const categories = {
      'Table Operations': elements.filter(e => e.includes('table') && !e.includes('domain')),
      'Attribute Operations': elements.filter(e => e.includes('attr')),
      'Index Operations': elements.filter(e => e.includes('index')),
      'Domain Operations': elements.filter(e => e.includes('domain')),
      'View Operations': elements.filter(e => e.includes('view')),
      'Relationship Operations': elements.filter(e => e.includes('relationship')),
      'Application Operations': elements.filter(e => e.includes('app') || e.includes('module') || e.includes('menu')),
      'Service Operations': elements.filter(e => e.includes('service')),
      'Property Operations': elements.filter(e => e.includes('property') || e.includes('maxvar')),
      'Security Operations': elements.filter(e => e.includes('sigoption')),
      'Data Operations': elements.filter(e => e.includes('insert') || e.includes('column')),
      'Script Control': elements.filter(e => ['script', 'description', 'check', 'statements', 'freeform', 'sql'].includes(e)),
    };
    
    // Add categorized elements
    for (const [category, categoryElements] of Object.entries(categories)) {
      if (categoryElements.length > 0) {
        lines.push(`${category}:`);
        for (const element of categoryElements) {
          const elementData = schema[element];
          const desc = elementData.description 
            ? ` - ${elementData.description.split('\n')[0].substring(0, 80)}${elementData.description.length > 80 ? '...' : ''}`
            : '';
          lines.push(`  • ${element}${desc}`);
        }
        lines.push('');
      }
    }
    
    // Add uncategorized elements
    const categorized = new Set(Object.values(categories).flat());
    const uncategorized = elements.filter(e => !categorized.has(e));
    
    if (uncategorized.length > 0) {
      lines.push('Other Elements:');
      for (const element of uncategorized) {
        const elementData = schema[element];
        const desc = elementData.description 
          ? ` - ${elementData.description.split('\n')[0].substring(0, 80)}${elementData.description.length > 80 ? '...' : ''}`
          : '';
        lines.push(`  • ${element}${desc}`);
      }
    }
    
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('💡 TIP: For real-world DBC script examples, use the retrieve-specific-examples-and-documentation tool');
    lines.push('to search the "dbc_examples" RAG index. This will show you proven examples of how these elements');
    lines.push('are used in actual Maximo DBC implementations.');
    
    return {
      content: [
        {
          type: "text",
          text: lines.join('\n')
        }
      ]
    };
  } catch (error) {
    logger.error("Error listing DBC elements:", error);
    throw error;
  }
}

/**
 * Handler for dbc-search-elements tool
 * Searches for DBC elements by name or description
 */
export async function handleDBCSearchElements(params = {}) {
  try {
    const { query, limit = 20, includeAttributes = false } = params;
    
    if (!query) {
      throw new Error("Query parameter is required");
    }
    
    logger.info(`Searching DBC elements for: ${query}`);
    
    const results = await searchDBCElements(query, { limit, includeAttributes });
    
    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No DBC elements found matching "${query}". Try a different search term or use dbc-list-elements to see all available elements.`
          }
        ]
      };
    }
    
    const searchTerms = query.trim().split(/\s+/).filter(t => t.length > 0);
    const isMultiTerm = searchTerms.length > 1;
    
    const lines = [
      `DBC Element Search Results for "${query}" (${results.length} matches)`,
      ``
    ];
    
    if (isMultiTerm) {
      lines.push(`Searching with OR logic for: ${searchTerms.join(', ')}`);
      lines.push('');
    }
    
    for (const result of results) {
      const matchInfo = result.matchedTerms && result.matchedTerms.length > 0
        ? ` [matched: ${result.matchedTerms.join(', ')}]`
        : '';
      lines.push(`Element: ${result.element} (relevance: ${result.score})${matchInfo}`);
      
      if (result.data.description) {
        const desc = result.data.description.split('\n')[0];
        lines.push(`  Description: ${desc}`);
      }
      
      lines.push(`  Content Model: ${result.data.contentModel}`);
      
      if (result.data.attributes && Object.keys(result.data.attributes).length > 0) {
        const attrCount = Object.keys(result.data.attributes).length;
        const requiredCount = Object.values(result.data.attributes).filter(a => a.required).length;
        lines.push(`  Attributes: ${attrCount} total (${requiredCount} required)`);
      }
      
      if (result.data.children && result.data.children.length > 0) {
        lines.push(`  Allowed Children: ${result.data.children.join(', ')}`);
      }
      
      lines.push('');
    }
    
    lines.push(`Use dbc-get-element-info with the element name to get full details.`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('💡 TIP: Search the "dbc_examples" RAG index using retrieve-specific-examples-and-documentation');
    lines.push(`with query "${query}" to find real DBC script examples using these elements.`);
    
    return {
      content: [
        {
          type: "text",
          text: lines.join('\n')
        }
      ]
    };
  } catch (error) {
    logger.error("Error searching DBC elements:", error);
    throw error;
  }
}

/**
 * Handler for dbc-get-element-info tool
 * Gets detailed information about a specific DBC element
 */
export async function handleDBCGetElementInfo(params = {}) {
  try {
    const { elementName, includeDetails = true } = params;
    
    if (!elementName) {
      throw new Error("elementName parameter is required");
    }
    
    logger.info(`Getting DBC element info for: ${elementName}`);
    
    const element = await getDBCElement(elementName);
    
    if (!element) {
      return {
        content: [
          {
            type: "text",
            text: `DBC element "${elementName}" not found. Use dbc-list-elements or dbc-search-elements to find available elements.`
          }
        ]
      };
    }
    
    const formattedInfo = formatDBCElement(element, includeDetails);
    
    const ragTip = [
      '',
      '---',
      '',
      '💡 TIP: For practical examples of how to use this element, search the "dbc_examples" RAG index',
      'using the retrieve-specific-examples-and-documentation tool. Query examples:',
      `  • "${elementName} example"`,
      `  • "${elementName} usage"`,
      '  • Or describe what you want to accomplish (e.g., "create table with attributes")'
    ].join('\n');
    
    return {
      content: [
        {
          type: "text",
          text: formattedInfo + ragTip
        }
      ]
    };
  } catch (error) {
    logger.error("Error getting DBC element info:", error);
    throw error;
  }
}

/**
 * Handler for dbc-get-element-attributes tool
 * Gets attribute information for a specific DBC element
 */
export async function handleDBCGetElementAttributes(params = {}) {
  try {
    const { elementName, search } = params;
    
    if (!elementName) {
      throw new Error("elementName parameter is required");
    }
    
    logger.info(`Getting DBC element attributes for: ${elementName}${search ? ` (search: ${search})` : ''}`);
    
    const result = await getDBCElementAttributes(elementName, search);
    
    if (!result) {
      return {
        content: [
          {
            type: "text",
            text: `DBC element "${elementName}" not found. Use dbc-list-elements or dbc-search-elements to find available elements.`
          }
        ]
      };
    }
    
    const lines = [
      `Attributes for DBC Element: ${result.element}`,
      ``
    ];
    
    if (result.description) {
      lines.push(`Description: ${result.description}`);
      lines.push('');
    }
    
    const attrCount = Object.keys(result.attributes).length;
    
    if (attrCount === 0) {
      lines.push('This element has no attributes.');
    } else {
      lines.push(`Total Attributes: ${attrCount}`);
      lines.push('');
      
      for (const [attrName, attrData] of Object.entries(result.attributes)) {
        const required = attrData.required ? ' [REQUIRED]' : ' [OPTIONAL]';
        const defaultVal = attrData.default ? ` (default: "${attrData.default}")` : '';
        
        lines.push(`${attrName}${required}${defaultVal}`);
        
        if (result.attributeDescriptions[attrName]) {
          lines.push(`  Description: ${result.attributeDescriptions[attrName]}`);
        }
        
        if (attrData.enumValues) {
          lines.push(`  Type: enum`);
          lines.push(`  Valid values: ${attrData.enumValues.join(', ')}`);
          
          // Show enum descriptions if available
          if (attrData.enumDescriptions) {
            lines.push(`  Value descriptions:`);
            for (const [enumVal, enumDesc] of Object.entries(attrData.enumDescriptions)) {
              if (enumDesc) {
                lines.push(`    • ${enumVal}: ${enumDesc}`);
              }
            }
          }
        } else {
          lines.push(`  Type: ${attrData.type}`);
        }
        
        lines.push('');
      }
    }
    
    if (search) {
      lines.push(`(Filtered by search term: "${search}")`);
    }
    
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('💡 TIP: To see how these attributes are used in real DBC scripts, search the "dbc_examples"');
    lines.push(`RAG index using retrieve-specific-examples-and-documentation with query "${elementName}".`);
    
    return {
      content: [
        {
          type: "text",
          text: lines.join('\n')
        }
      ]
    };
  } catch (error) {
    logger.error("Error getting DBC element attributes:", error);
    throw error;
  }
}

/**
 * Handler for dbc-get-element-children tool
 * Gets information about allowed child elements
 */
export async function handleDBCGetElementChildren(params = {}) {
  try {
    const { elementName } = params;
    
    if (!elementName) {
      throw new Error("elementName parameter is required");
    }
    
    logger.info(`Getting DBC element children for: ${elementName}`);
    
    const element = await getDBCElement(elementName);
    
    if (!element) {
      return {
        content: [
          {
            type: "text",
            text: `DBC element "${elementName}" not found. Use dbc-list-elements or dbc-search-elements to find available elements.`
          }
        ]
      };
    }
    
    const lines = [
      `Allowed Children for DBC Element: ${elementName}`,
      ``
    ];
    
    if (element.description) {
      lines.push(`Description: ${element.description.split('\n')[0]}`);
      lines.push('');
    }
    
    lines.push(`Content Model: ${element.contentModel}`);
    lines.push('');
    
    if (element.hasTextContent) {
      lines.push('This element can contain text content (#PCDATA).');
      lines.push('');
    }
    
    if (!element.children || element.children.length === 0) {
      lines.push('This element does not allow child elements.');
      
      if (element.contentModel.includes('EMPTY')) {
        lines.push('(Element is defined as EMPTY - no content allowed)');
      }
    } else {
      lines.push(`Allowed Child Elements (${element.children.length}):`);
      lines.push('');
      
      const schema = await loadDBCSchema();
      
      for (const childName of element.children) {
        const childElement = schema[childName];
        if (childElement) {
          const desc = childElement.description 
            ? ` - ${childElement.description.split('\n')[0].substring(0, 100)}${childElement.description.length > 100 ? '...' : ''}`
            : '';
          lines.push(`  • ${childName}${desc}`);
        } else {
          lines.push(`  • ${childName}`);
        }
      }
      
      lines.push('');
      lines.push('Use dbc-get-element-info with any child element name to get more details.');
    }
    
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('💡 TIP: For complete DBC script examples showing proper element nesting and structure,');
    lines.push('search the "dbc_examples" RAG index using retrieve-specific-examples-and-documentation.');
    
    return {
      content: [
        {
          type: "text",
          text: lines.join('\n')
        }
      ]
    };
  } catch (error) {
    logger.error("Error getting DBC element children:", error);
    throw error;
  }
}

/**
 * Handler for dbc-validate-structure tool
 * Validates a proposed DBC element structure
 */
export async function handleDBCValidateStructure(params = {}) {
  try {
    const { elementName, attributes = {}, children = [] } = params;
    
    if (!elementName) {
      throw new Error("elementName parameter is required");
    }
    
    logger.info(`Validating DBC structure for: ${elementName}`);
    
    const element = await getDBCElement(elementName);
    
    if (!element) {
      return {
        content: [
          {
            type: "text",
            text: `DBC element "${elementName}" not found. Cannot validate.`
          }
        ]
      };
    }
    
    const issues = [];
    const warnings = [];
    
    // Validate attributes
    const providedAttrs = Object.keys(attributes);
    const validAttrs = Object.keys(element.attributes);
    
    // Check for invalid attributes
    for (const attrName of providedAttrs) {
      if (!validAttrs.includes(attrName)) {
        issues.push(`Invalid attribute: "${attrName}" is not a valid attribute for ${elementName}`);
      }
    }
    
    // Check for missing required attributes
    for (const [attrName, attrData] of Object.entries(element.attributes)) {
      if (attrData.required && !providedAttrs.includes(attrName)) {
        issues.push(`Missing required attribute: "${attrName}"`);
      }
    }
    
    // Validate attribute values (enum types)
    for (const [attrName, attrValue] of Object.entries(attributes)) {
      const attrDef = element.attributes[attrName];
      if (attrDef && attrDef.enumValues) {
        if (!attrDef.enumValues.includes(attrValue)) {
          issues.push(`Invalid value for attribute "${attrName}": "${attrValue}" is not one of [${attrDef.enumValues.join(', ')}]`);
        }
      }
    }
    
    // Validate children
    if (children.length > 0) {
      if (!element.children || element.children.length === 0) {
        if (element.contentModel.includes('EMPTY')) {
          issues.push(`Element ${elementName} is defined as EMPTY and cannot have child elements`);
        } else if (!element.hasTextContent) {
          warnings.push(`Element ${elementName} may not support child elements according to its content model: ${element.contentModel}`);
        }
      } else {
        for (const childName of children) {
          if (!element.children.includes(childName)) {
            issues.push(`Invalid child element: "${childName}" is not allowed in ${elementName}. Allowed: [${element.children.join(', ')}]`);
          }
        }
      }
    }
    
    // Build result
    const lines = [
      `DBC Structure Validation for: ${elementName}`,
      ``
    ];
    
    if (issues.length === 0 && warnings.length === 0) {
      lines.push('✓ Validation passed! The structure appears to be valid.');
    } else {
      if (issues.length > 0) {
        lines.push(`✗ Validation failed with ${issues.length} issue(s):`);
        lines.push('');
        for (const issue of issues) {
          lines.push(`  ✗ ${issue}`);
        }
        lines.push('');
      }
      
      if (warnings.length > 0) {
        lines.push(`⚠ ${warnings.length} warning(s):`);
        lines.push('');
        for (const warning of warnings) {
          lines.push(`  ⚠ ${warning}`);
        }
        lines.push('');
      }
    }
    
    // Show what was validated
    lines.push('Validated Structure:');
    lines.push(`  Element: ${elementName}`);
    if (providedAttrs.length > 0) {
      lines.push(`  Attributes: ${providedAttrs.join(', ')}`);
    }
    if (children.length > 0) {
      lines.push(`  Children: ${children.join(', ')}`);
    }
    
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('💡 TIP: Before creating your DBC script, consult the "dbc_examples" RAG index using');
    lines.push('retrieve-specific-examples-and-documentation to review proven examples and best practices');
    lines.push('from real Maximo DBC implementations.');
    
    return {
      content: [
        {
          type: "text",
          text: lines.join('\n')
        }
      ]
    };
  } catch (error) {
    logger.error("Error validating DBC structure:", error);
    throw error;
  }
}

/**
 * Export all DBC tool handlers
 */
export const dbcToolHandlers = {
  "dbc-list-elements": handleDBCListElements,
  "dbc-search-elements": handleDBCSearchElements,
  "dbc-get-element-info": handleDBCGetElementInfo,
  "dbc-get-element-attributes": handleDBCGetElementAttributes,
  "dbc-get-element-children": handleDBCGetElementChildren,
  "dbc-validate-structure": handleDBCValidateStructure,
};

// Made with Bob
