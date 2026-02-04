/**
 * Utility functions for processing Maximo JSON schemas
 */

/**
 * Filter schema properties based on mode
 * @param {Object} schema - Full JSON schema object
 * @param {string} mode - Output mode: 'brief', 'standard', or 'full'
 * @returns {Object} Filtered schema
 */
export function filterSchemaByMode(schema, mode = 'standard') {
  if (!schema || !schema.properties) {
    return schema;
  }

  const filteredSchema = {
    resource: schema.resource,
    description: schema.description,
    title: schema.title,
    type: schema.type,
    properties: {}
  };

  // Include pk and uniqueid for all modes
  if (schema.pk) filteredSchema.pk = schema.pk;
  if (schema.uniqueid) filteredSchema.uniqueid = schema.uniqueid;
  if (schema.required) filteredSchema.required = schema.required;

  // Define which fields to include for each mode
  const modeFields = {
    brief: ['title', 'type'],
    standard: ['title', 'type', 'remarks', 'maxLength', 'hasList', 'subType', 'searchType'],
    full: null // null means include all fields
  };

  const fieldsToInclude = modeFields[mode];

  // Process each property
  for (const [propName, propValue] of Object.entries(schema.properties)) {
    if (mode === 'full') {
      // Include everything
      filteredSchema.properties[propName] = propValue;
    } else {
      // Filter to specified fields
      const filteredProp = {};
      
      for (const field of fieldsToInclude) {
        if (propValue[field] !== undefined) {
          filteredProp[field] = propValue[field];
        }
      }
      
      // Always include type
      if (!filteredProp.type && propValue.type) {
        filteredProp.type = propValue.type;
      }
      
      // For arrays and objects, include minimal structure info
      if (propValue.type === 'array' && propValue.objectName) {
        filteredProp.objectName = propValue.objectName;
        if (mode === 'standard') {
          filteredProp.note = 'Use full mode to see nested schema';
        }
      }
      
      filteredSchema.properties[propName] = filteredProp;
    }
  }

  return filteredSchema;
}

/**
 * Search schema properties by name, title, or remarks
 * @param {Object} schema - JSON schema object
 * @param {string} searchTerm - Search term (case-insensitive)
 * @returns {Object} Schema with only matching properties
 */
export function searchSchemaProperties(schema, searchTerm) {
  if (!schema || !schema.properties || !searchTerm) {
    return schema;
  }

  const searchLower = searchTerm.toLowerCase();
  // Split search term into multiple terms for OR matching
  const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0);
  
  const filteredSchema = {
    resource: schema.resource,
    description: schema.description,
    title: schema.title,
    type: schema.type,
    properties: {}
  };

  if (schema.pk) filteredSchema.pk = schema.pk;
  if (schema.uniqueid) filteredSchema.uniqueid = schema.uniqueid;
  if (schema.required) filteredSchema.required = schema.required;

  let matchCount = 0;
  for (const [propName, propValue] of Object.entries(schema.properties)) {
    const nameLower = propName.toLowerCase();
    const titleLower = propValue.title?.toLowerCase() || '';
    const remarksLower = propValue.remarks?.toLowerCase() || '';
    
    // Check if ANY search term matches (OR logic)
    const hasMatch = searchTerms.some(term =>
      nameLower.includes(term) ||
      titleLower.includes(term) ||
      remarksLower.includes(term)
    );
    
    if (hasMatch) {
      filteredSchema.properties[propName] = propValue;
      matchCount++;
    }
  }

  filteredSchema.matchCount = matchCount;
  filteredSchema.totalProperties = Object.keys(schema.properties).length;

  return filteredSchema;
}

/**
 * Limit the number of properties returned
 * @param {Object} schema - JSON schema object
 * @param {number} limit - Maximum number of properties to return
 * @returns {Object} Schema with limited properties
 */
export function limitSchemaProperties(schema, limit) {
  if (!schema || !schema.properties || !limit) {
    return schema;
  }

  const limitedSchema = {
    resource: schema.resource,
    description: schema.description,
    title: schema.title,
    type: schema.type,
    properties: {}
  };

  if (schema.pk) limitedSchema.pk = schema.pk;
  if (schema.uniqueid) limitedSchema.uniqueid = schema.uniqueid;
  if (schema.required) limitedSchema.required = schema.required;

  const propertyEntries = Object.entries(schema.properties);
  const limitedEntries = propertyEntries.slice(0, limit);

  for (const [propName, propValue] of limitedEntries) {
    limitedSchema.properties[propName] = propValue;
  }

  limitedSchema.returnedProperties = limitedEntries.length;
  limitedSchema.totalProperties = propertyEntries.length;
  
  if (limitedEntries.length < propertyEntries.length) {
    limitedSchema.note = `Showing ${limitedEntries.length} of ${propertyEntries.length} properties. Increase limit or use search to see more.`;
  }

  return limitedSchema;
}

/**
 * Format schema for text output with statistics
 * @param {Object} schema - JSON schema object
 * @param {Object} options - Formatting options
 * @returns {string} Formatted text output
 */
export function formatSchemaOutput(schema, options = {}) {
  const { mode = 'standard', originalSize, filteredSize } = options;
  
  let output = '';
  
  // Add header with statistics
  output += `=== ${schema.title || schema.resource} Schema ===\n`;
  output += `Object Structure: ${schema.resource}\n`;
  if (schema.description) {
    output += `Description: ${schema.description}\n`;
  }
  
  const propCount = Object.keys(schema.properties || {}).length;
  
  if (schema.pk) {
    output += `Primary Key: ${schema.pk.join(', ')}\n`;
  }
  
  if (schema.uniqueid) {
    output += `Unique ID: ${schema.uniqueid}\n`;
  }
  
  output += `\nProperties: ${propCount}`;
  
  if (schema.totalProperties && schema.totalProperties !== propCount) {
    output += ` (filtered from ${schema.totalProperties})`;
  }
  
  if (schema.matchCount !== undefined) {
    output += ` (${schema.matchCount} matches)`;
  }
  
  output += `\n`;
  
  // Show required fields prominently
  if (schema.required && schema.required.length > 0) {
    output += `Required Fields: ${schema.required.join(', ')}\n`;
  }
  
  output += `Detail Level: ${mode}\n`;
  
  if (originalSize && filteredSize) {
    const reduction = ((1 - filteredSize / originalSize) * 100).toFixed(1);
    output += `Token Efficiency: ${reduction}% reduction (${(originalSize / 1024).toFixed(2)} KB → ${(filteredSize / 1024).toFixed(2)} KB)\n`;
  }
  
  if (schema.note) {
    output += `\n⚠️  ${schema.note}\n`;
  }
  
  output += '\n';
  
  // Format properties in a readable way
  const properties = schema.properties || {};
  const propKeys = Object.keys(properties);
  
  if (propKeys.length === 0) {
    output += 'No properties found.\n';
    return output;
  }
  
  // Group properties by type for better readability in brief mode
  if (mode === 'brief') {
    output += 'Property List:\n\n';
    propKeys.forEach(propName => {
      const prop = properties[propName];
      const isRequired = schema.required && schema.required.includes(propName);
      const requiredMarker = isRequired ? ' *' : '';
      const title = prop.title ? ` (${prop.title})` : '';
      const type = prop.type || 'unknown';
      const isArray = type === 'array' ? ' []' : '';
      output += `  ${propName}${requiredMarker}${title}\n`;
      output += `    Type: ${type}${isArray}\n`;
      if (isRequired) {
        output += `    Required: Yes\n`;
      }
      if (prop.objectName) {
        output += `    Related Object: ${prop.objectName}\n`;
      }
      output += '\n';
    });
  } else {
    // Standard and full modes show more detail
    output += 'Properties:\n\n';
    propKeys.forEach(propName => {
      const prop = properties[propName];
      const isRequired = schema.required && schema.required.includes(propName);
      const requiredMarker = isRequired ? ' *' : '';
      
      output += `  ${propName}${requiredMarker}\n`;
      
      if (prop.title) {
        output += `    Title: ${prop.title}\n`;
      }
      
      output += `    Type: ${prop.type || 'unknown'}`;
      if (prop.subType) {
        output += ` (${prop.subType})`;
      }
      output += '\n';
      
      if (isRequired) {
        output += `    Required: Yes\n`;
      }
      
      if (prop.remarks) {
        output += `    Description: ${prop.remarks}\n`;
      }
      
      if (prop.maxLength) {
        output += `    Max Length: ${prop.maxLength}\n`;
      }
      
      if (prop.hasList) {
        output += `    Has List: Yes\n`;
      }
      
      if (prop.searchType) {
        output += `    Search Type: ${prop.searchType}\n`;
      }
      
      if (prop.objectName) {
        output += `    Related Object: ${prop.objectName}\n`;
      }
      
      if (prop.note) {
        output += `    Note: ${prop.note}\n`;
      }
      
      // In full mode, show additional metadata
      if (mode === 'full') {
        if (prop.persistent !== undefined) {
          output += `    Persistent: ${prop.persistent}\n`;
        }
        if (prop.items) {
          output += `    Array Items: [nested schema]\n`;
        }
      }
      
      output += '\n';
    });
  }
  
  // Add legend if there are required fields
  if (schema.required && schema.required.length > 0) {
    output += '\n* = Required field\n';
  }
  
  return output;
}

/**
 * Process schema with all filters and options
 * @param {Object} schema - Full JSON schema
 * @param {Object} options - Processing options
 * @returns {Object} Processed schema with metadata
 */
export function processSchema(schema, options = {}) {
  const {
    mode = 'standard',
    search = null,
    limit = null
  } = options;

  let processedSchema = schema;
  const originalSize = JSON.stringify(schema).length;

  // Apply search filter first (most restrictive)
  if (search) {
    processedSchema = searchSchemaProperties(processedSchema, search);
  }

  // Apply limit
  if (limit && limit > 0) {
    processedSchema = limitSchemaProperties(processedSchema, limit);
  }

  // Apply mode filter (affects detail level)
  processedSchema = filterSchemaByMode(processedSchema, mode);

  const filteredSize = JSON.stringify(processedSchema).length;

  return {
    schema: processedSchema,
    metadata: {
      originalSize,
      filteredSize,
      reduction: ((1 - filteredSize / originalSize) * 100).toFixed(1),
      mode,
      search,
      limit
    }
  };
}

// Made with Bob
