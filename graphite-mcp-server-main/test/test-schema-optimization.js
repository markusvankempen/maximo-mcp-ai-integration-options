import { getSchema } from '../src/maximo.js';
import { processSchema, formatSchemaOutput } from '../src/utils/schema-utils.js';
import { promises as fs } from 'fs';

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

async function testSchemaOptimization() {
  try {
    console.log('=== Testing Schema Optimization ===\n');
    
    // Fetch the full schema
    console.log('1. Fetching full schema for mxapiasset...');
    const fullSchema = await getSchema('mxapiasset', '*');
    
    if (fullSchema['oslc:Error']) {
      console.error('Error fetching schema:', fullSchema['oslc:Error']['oslc:message']);
      return;
    }
    
    const originalSize = JSON.stringify(fullSchema).length;
    console.log(`   Original size: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Properties: ${Object.keys(fullSchema.properties).length}\n`);
    
    // Test 1: Brief mode
    console.log('2. Testing BRIEF mode...');
    const briefResult = processSchema(fullSchema, { mode: 'brief' });
    console.log(`   Size: ${(briefResult.metadata.filteredSize / 1024).toFixed(2)} KB`);
    console.log(`   Reduction: ${briefResult.metadata.reduction}%`);
    await fs.writeFile('test-brief-schema.json', JSON.stringify(briefResult.schema, null, 2));
    console.log('   Saved to: test-brief-schema.json\n');
    
    // Test 2: Standard mode
    console.log('3. Testing STANDARD mode (default)...');
    const standardResult = processSchema(fullSchema, { mode: 'standard' });
    console.log(`   Size: ${(standardResult.metadata.filteredSize / 1024).toFixed(2)} KB`);
    console.log(`   Reduction: ${standardResult.metadata.reduction}%`);
    await fs.writeFile('test-standard-schema.json', JSON.stringify(standardResult.schema, null, 2));
    console.log('   Saved to: test-standard-schema.json\n');
    
    // Test 3: Full mode
    console.log('4. Testing FULL mode...');
    const fullResult = processSchema(fullSchema, { mode: 'full' });
    console.log(`   Size: ${(fullResult.metadata.filteredSize / 1024).toFixed(2)} KB`);
    console.log(`   Reduction: ${fullResult.metadata.reduction}%`);
    console.log('   (Should be same as original)\n');
    
    // Test 4: Search functionality
    console.log('5. Testing SEARCH functionality (search="date")...');
    const searchResult = processSchema(fullSchema, { mode: 'standard', search: 'date' });
    console.log(`   Size: ${(searchResult.metadata.filteredSize / 1024).toFixed(2)} KB`);
    console.log(`   Reduction: ${searchResult.metadata.reduction}%`);
    console.log(`   Properties found: ${Object.keys(searchResult.schema.properties).length}`);
    console.log(`   Matching properties:`, Object.keys(searchResult.schema.properties).slice(0, 10).join(', '));
    await fs.writeFile('test-search-schema.json', JSON.stringify(searchResult.schema, null, 2));
    console.log('   Saved to: test-search-schema.json\n');
    
    // Test 5: Limit functionality
    console.log('6. Testing LIMIT functionality (limit=10)...');
    const limitResult = processSchema(fullSchema, { mode: 'standard', limit: 10 });
    console.log(`   Size: ${(limitResult.metadata.filteredSize / 1024).toFixed(2)} KB`);
    console.log(`   Reduction: ${limitResult.metadata.reduction}%`);
    console.log(`   Properties returned: ${Object.keys(limitResult.schema.properties).length}`);
    console.log(`   Note: ${limitResult.schema.note}`);
    await fs.writeFile('test-limit-schema.json', JSON.stringify(limitResult.schema, null, 2));
    console.log('   Saved to: test-limit-schema.json\n');
    
    // Test 6: Combined filters
    console.log('7. Testing COMBINED filters (search="status", mode="brief", limit=5)...');
    const combinedResult = processSchema(fullSchema, { 
      mode: 'brief', 
      search: 'status', 
      limit: 5 
    });
    console.log(`   Size: ${(combinedResult.metadata.filteredSize / 1024).toFixed(2)} KB`);
    console.log(`   Reduction: ${combinedResult.metadata.reduction}%`);
    console.log(`   Properties returned: ${Object.keys(combinedResult.schema.properties).length}`);
    console.log(`   Properties:`, Object.keys(combinedResult.schema.properties).join(', '));
    await fs.writeFile('test-combined-schema.json', JSON.stringify(combinedResult.schema, null, 2));
    console.log('   Saved to: test-combined-schema.json\n');
    
    // Test 7: Formatted output
    console.log('8. Testing FORMATTED output...');
    const formattedOutput = formatSchemaOutput(standardResult.schema, {
      mode: 'standard',
      originalSize: standardResult.metadata.originalSize,
      filteredSize: standardResult.metadata.filteredSize
    });
    await fs.writeFile('test-formatted-output.txt', formattedOutput);
    console.log('   Saved to: test-formatted-output.txt\n');
    
    // Summary
    console.log('=== Summary ===');
    console.log(`Original size:  ${(originalSize / 1024).toFixed(2)} KB (100%)`);
    console.log(`Brief mode:     ${(briefResult.metadata.filteredSize / 1024).toFixed(2)} KB (${briefResult.metadata.reduction}% reduction)`);
    console.log(`Standard mode:  ${(standardResult.metadata.filteredSize / 1024).toFixed(2)} KB (${standardResult.metadata.reduction}% reduction)`);
    console.log(`Full mode:      ${(fullResult.metadata.filteredSize / 1024).toFixed(2)} KB (${fullResult.metadata.reduction}% reduction)`);
    console.log(`\nSearch filter:  ${(searchResult.metadata.filteredSize / 1024).toFixed(2)} KB (${searchResult.metadata.reduction}% reduction, ${Object.keys(searchResult.schema.properties).length} properties)`);
    console.log(`Limit filter:   ${(limitResult.metadata.filteredSize / 1024).toFixed(2)} KB (${limitResult.metadata.reduction}% reduction, ${Object.keys(limitResult.schema.properties).length} properties)`);
    console.log(`Combined:       ${(combinedResult.metadata.filteredSize / 1024).toFixed(2)} KB (${combinedResult.metadata.reduction}% reduction, ${Object.keys(combinedResult.schema.properties).length} properties)`);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testSchemaOptimization();

// Made with Bob
