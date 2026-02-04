// Test script for the new enum values tool
import { getComponentEnumValues } from '../src/utils/graphiteLib.js';
import { handleGraphiteGetComponentEnumValues } from '../src/handlers/graphite/tool-handlers.js';

console.log('='.repeat(80));
console.log('Testing Enum Values Tool');
console.log('='.repeat(80));

// Test 1: Get enum values for a single property
console.log('\n\n1. Get enum values for table.row-height:');
console.log('-'.repeat(80));
const rowHeight = getComponentEnumValues('table', 'row-height');
console.log(rowHeight.text);

// Test 2: Get enum values for background-color (large list)
console.log('\n\n2. Get enum values for box.background-color (35 values):');
console.log('-'.repeat(80));
const bgColor = getComponentEnumValues('box', 'background-color');
console.log(`Total values: ${bgColor.totalEnumValues}`);
console.log('\nFirst 10 values:');
console.log(bgColor.text.split('\n').slice(0, 15).join('\n'));

// Test 3: Search for specific color values
console.log('\n\n3. Search for "blue" colors in box.background-color:');
console.log('-'.repeat(80));
const blueColors = getComponentEnumValues('box', 'background-color', 'blue');
console.log(blueColors.text);

// Test 4: Get enum values for multiple properties
console.log('\n\n4. Get enum values for multiple properties:');
console.log('-'.repeat(80));
const multiProps = getComponentEnumValues('data-list', ['row-space', 'background-color'], 'blue');
console.log(`Properties: ${multiProps.properties.length}`);
console.log(`Total enum values: ${multiProps.totalEnumValues}`);
console.log(`Filtered values: ${multiProps.filteredEnumValues}`);
console.log('\nOutput preview:');
console.log(multiProps.text.substring(0, 500) + '...');

// Test 5: Property without enum values
console.log('\n\n5. Test property without enum values (datasource):');
console.log('-'.repeat(80));
const noEnum = getComponentEnumValues('data-list', 'datasource');
console.log(noEnum.text);

// Test 6: Test MCP handler
console.log('\n\n6. Test MCP handler:');
console.log('-'.repeat(80));
try {
  const result = await handleGraphiteGetComponentEnumValues({
    componentName: 'table',
    propertyNames: 'row-height'
  });
  console.log('✓ Handler executed successfully');
  console.log('Response length:', result.content[0].text.length, 'characters');
} catch (error) {
  console.error('✗ Error:', error.message);
}

// Test 7: Test with search via handler
console.log('\n\n7. Test handler with search:');
console.log('-'.repeat(80));
try {
  const result = await handleGraphiteGetComponentEnumValues({
    componentName: 'box',
    propertyNames: 'background-color',
    search: 'red'
  });
  console.log('✓ Handler executed successfully');
  console.log(result.content[0].text);
} catch (error) {
  console.error('✗ Error:', error.message);
}

// Test 8: Error handling
console.log('\n\n8. Test error handling (invalid component):');
console.log('-'.repeat(80));
try {
  await handleGraphiteGetComponentEnumValues({
    componentName: 'invalid-component',
    propertyNames: 'some-prop'
  });
  console.error('✗ Should have thrown an error');
} catch (error) {
  console.log('✓ Error correctly handled:', error.message);
}

console.log('\n' + '='.repeat(80));
console.log('All enum values tests completed!');
console.log('='.repeat(80));

// Made with Bob
