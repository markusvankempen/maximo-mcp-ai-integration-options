import { getSchema } from '../src/maximo.js';
import { promises as fs } from 'fs';

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

async function analyzeSchema() {
  try {
    console.log('Fetching schema for mxapiasset...');
    
    // Test 1: Get full schema
    const fullSchema = await getSchema('mxapiasset', '*');
    await fs.writeFile('test-full-schema.json', JSON.stringify(fullSchema, null, 2));
    console.log('Full schema saved to test-full-schema.json');
    
    // Test 2: Get partial schema with selection
    const partialSchema = await getSchema('mxapiasset', 'assetnum,description,status');
    await fs.writeFile('test-partial-schema.json', JSON.stringify(partialSchema, null, 2));
    console.log('Partial schema saved to test-partial-schema.json');
    
    // Analyze the structure
    console.log('\n=== Schema Analysis ===');
    console.log('Full schema keys:', Object.keys(fullSchema));
    
    if (fullSchema.properties) {
      const propCount = Object.keys(fullSchema.properties).length;
      console.log(`Number of properties: ${propCount}`);
      
      // Sample a few properties to understand structure
      const sampleProps = Object.entries(fullSchema.properties).slice(0, 3);
      console.log('\nSample properties structure:');
      sampleProps.forEach(([name, prop]) => {
        console.log(`\n${name}:`, JSON.stringify(prop, null, 2).substring(0, 500));
      });
    }
    
    // Calculate size
    const fullSize = JSON.stringify(fullSchema).length;
    const partialSize = JSON.stringify(partialSchema).length;
    console.log(`\nFull schema size: ${fullSize} characters (${(fullSize/1024).toFixed(2)} KB)`);
    console.log(`Partial schema size: ${partialSize} characters (${(partialSize/1024).toFixed(2)} KB)`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

analyzeSchema();

// Made with Bob
