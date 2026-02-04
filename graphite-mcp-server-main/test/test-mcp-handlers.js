// Test script for MCP tool handlers
import { 
  handleGraphiteShowComponentProperties,
  handleGraphiteShowComponentSamples,
  handleGraphiteShowMultipleComponentProperties
} from '../src/handlers/graphite/tool-handlers.js';

console.log('='.repeat(80));
console.log('Testing MCP Tool Handlers');
console.log('='.repeat(80));

// Test 1: Show component properties without search
console.log('\n\n1. Testing handleGraphiteShowComponentProperties (no search):');
console.log('-'.repeat(80));
try {
  const result = await handleGraphiteShowComponentProperties({ componentName: 'data-list' });
  console.log('✓ Handler executed successfully');
  console.log(`Response type: ${result.content[0].type}`);
  console.log(`Response length: ${result.content[0].text.length} characters`);
  console.log('\nFirst 200 characters:');
  console.log(result.content[0].text.substring(0, 200) + '...');
} catch (error) {
  console.error('✗ Error:', error.message);
}

// Test 2: Show component properties with search
console.log('\n\n2. Testing handleGraphiteShowComponentProperties (with search):');
console.log('-'.repeat(80));
try {
  const result = await handleGraphiteShowComponentProperties({ 
    componentName: 'data-list',
    search: 'datasource'
  });
  console.log('✓ Handler executed successfully');
  console.log(`Response length: ${result.content[0].text.length} characters`);
  console.log('\nFiltered response:');
  console.log(result.content[0].text);
} catch (error) {
  console.error('✗ Error:', error.message);
}

// Test 3: Show component samples
console.log('\n\n3. Testing handleGraphiteShowComponentSamples:');
console.log('-'.repeat(80));
try {
  const result = await handleGraphiteShowComponentSamples({ componentName: 'data-list' });
  console.log('✓ Handler executed successfully');
  console.log(`Response length: ${result.content[0].text.length} characters`);
  console.log('\nFirst 300 characters:');
  console.log(result.content[0].text.substring(0, 300) + '...');
} catch (error) {
  console.error('✗ Error:', error.message);
}

// Test 4: Show multiple component properties
console.log('\n\n4. Testing handleGraphiteShowMultipleComponentProperties:');
console.log('-'.repeat(80));
try {
  const result = await handleGraphiteShowMultipleComponentProperties({ 
    componentNames: ['data-list', 'table', 'box']
  });
  console.log('✓ Handler executed successfully');
  console.log(`Response length: ${result.content[0].text.length} characters`);
  console.log('\nFirst 400 characters:');
  console.log(result.content[0].text.substring(0, 400) + '...');
} catch (error) {
  console.error('✗ Error:', error.message);
}

// Test 5: Error handling - invalid component
console.log('\n\n5. Testing error handling (invalid component):');
console.log('-'.repeat(80));
try {
  const result = await handleGraphiteShowComponentProperties({ 
    componentName: 'invalid-component-xyz'
  });
  console.error('✗ Should have thrown an error');
} catch (error) {
  console.log('✓ Error correctly handled:', error.message);
}

// Test 6: Error handling - empty array
console.log('\n\n6. Testing error handling (empty array):');
console.log('-'.repeat(80));
try {
  const result = await handleGraphiteShowMultipleComponentProperties({ 
    componentNames: []
  });
  console.error('✗ Should have thrown an error');
} catch (error) {
  console.log('✓ Error correctly handled:', error.message);
}

console.log('\n' + '='.repeat(80));
console.log('All handler tests completed!');
console.log('='.repeat(80));

// Made with Bob
