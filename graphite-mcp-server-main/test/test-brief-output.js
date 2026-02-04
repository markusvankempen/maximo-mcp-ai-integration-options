import { getSchema } from '../src/maximo.js';
import { processSchema, formatSchemaOutput } from '../src/utils/schema-utils.js';
import dotenv from 'dotenv';
dotenv.config();

async function testBriefOutput() {
  try {
    console.log('Testing brief mode output format...\n');
    
    const fullSchema = await getSchema('mxapiasset', '*');
    
    // Test brief mode with limit
    const briefResult = processSchema(fullSchema, { mode: 'brief', limit: 10 });
    const briefOutput = formatSchemaOutput(briefResult.schema, {
      mode: 'brief',
      originalSize: briefResult.metadata.originalSize,
      filteredSize: briefResult.metadata.filteredSize
    });
    
    console.log('=== BRIEF MODE OUTPUT ===\n');
    console.log(briefOutput);
    
    console.log('\n\n=== SEARCH + BRIEF MODE OUTPUT ===\n');
    
    // Test search with brief mode
    const searchResult = processSchema(fullSchema, { mode: 'brief', search: 'status', limit: 5 });
    const searchOutput = formatSchemaOutput(searchResult.schema, {
      mode: 'brief',
      originalSize: searchResult.metadata.originalSize,
      filteredSize: searchResult.metadata.filteredSize
    });
    
    console.log(searchOutput);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBriefOutput();

// Made with Bob
