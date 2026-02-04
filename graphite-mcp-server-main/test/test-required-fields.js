import { getSchema } from '../src/maximo.js';
import { processSchema, formatSchemaOutput } from '../src/utils/schema-utils.js';
import dotenv from 'dotenv';
dotenv.config();

async function testRequiredFields() {
  try {
    console.log('Testing required fields display...\n');
    
    const fullSchema = await getSchema('mxapiasset', '*');
    
    // Get only required fields
    const requiredFields = fullSchema.required || [];
    console.log(`Found ${requiredFields.length} required fields:`, requiredFields.join(', '));
    console.log('\n');
    
    // Test 1: Show required fields in brief mode with selection
    console.log('=== BRIEF MODE - Required Fields Only ===\n');
    const briefResult = processSchema(fullSchema, { 
      mode: 'brief'
    });
    
    // Filter to show only required fields
    const requiredOnlySchema = {
      ...briefResult.schema,
      properties: {}
    };
    
    requiredFields.forEach(field => {
      if (briefResult.schema.properties[field]) {
        requiredOnlySchema.properties[field] = briefResult.schema.properties[field];
      }
    });
    
    const briefOutput = formatSchemaOutput(requiredOnlySchema, {
      mode: 'brief',
      originalSize: briefResult.metadata.originalSize,
      filteredSize: JSON.stringify(requiredOnlySchema).length
    });
    
    console.log(briefOutput);
    
    // Test 2: Show required fields in standard mode
    console.log('\n\n=== STANDARD MODE - Required Fields Only ===\n');
    const standardResult = processSchema(fullSchema, { 
      mode: 'standard'
    });
    
    const standardRequiredSchema = {
      ...standardResult.schema,
      properties: {}
    };
    
    requiredFields.slice(0, 3).forEach(field => {
      if (standardResult.schema.properties[field]) {
        standardRequiredSchema.properties[field] = standardResult.schema.properties[field];
      }
    });
    
    const standardOutput = formatSchemaOutput(standardRequiredSchema, {
      mode: 'standard',
      originalSize: standardResult.metadata.originalSize,
      filteredSize: JSON.stringify(standardRequiredSchema).length
    });
    
    console.log(standardOutput);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRequiredFields();

// Made with Bob
