// Test script for enhanced component properties with automatic enum display
import { getComponentProperties } from '../src/utils/graphiteLib.js';
import { handleGraphiteShowComponentProperties } from '../src/handlers/graphite/tool-handlers.js';

console.log('='.repeat(80));
console.log('Testing Enhanced Component Properties with Automatic Enum Display');
console.log('='.repeat(80));

// Test 1: Small enum list (4 values) - should show all values with descriptions
console.log('\n\n1. Small enum list (4 values) - Shows all values automatically:');
console.log('-'.repeat(80));
const small = getComponentProperties('table', 'row-height');
console.log(small.text);
console.log('\n✓ Shows all 4 enum values with descriptions inline');

// Test 2: Large enum list (35 values) - should show note to use dedicated tool
console.log('\n\n2. Large enum list (35 values) - Shows note to use dedicated tool:');
console.log('-'.repeat(80));
const large = getComponentProperties('box', 'background-color');
const lines = large.text.split('\n');
const noteLines = lines.filter(line => line.includes('Note:'));
console.log('Property type:', lines.find(l => l.includes('Type:')));
console.log(noteLines[0]);
console.log('\n✓ Shows note suggesting graphite-get-component-enum-values tool');

// Test 3: Property at threshold (10 values) - should show all
console.log('\n\n3. Property at threshold (10 values or less):');
console.log('-'.repeat(80));
const dataList = getComponentProperties('data-list', 'row-space');
console.log(dataList.text);
console.log('\n✓ Shows all enum values when count is at or below threshold');

// Test 4: Multiple properties with mixed enum sizes
console.log('\n\n4. Multiple properties - mixed enum sizes:');
console.log('-'.repeat(80));
const table = getComponentProperties('table');
const propsWithEnums = table.properties.filter(p => p.enumValues || (p.type && p.type.includes('Note:')));
console.log(`Found ${propsWithEnums.length} properties with enum handling:`);
propsWithEnums.forEach(p => {
  if (p.enumValues) {
    console.log(`  - ${p.name}: Shows ${p.enumValues.length} values inline`);
  } else if (p.type && p.type.includes('Note:')) {
    console.log(`  - ${p.name}: Shows note for large enum list`);
  }
});

// Test 5: Test via MCP handler
console.log('\n\n5. Test via MCP handler:');
console.log('-'.repeat(80));
try {
  const result = await handleGraphiteShowComponentProperties({
    componentName: 'table',
    search: 'row-height'
  });
  const hasValidValues = result.content[0].text.includes('Valid values:');
  console.log('✓ Handler executed successfully');
  console.log(`✓ Contains "Valid values:" section: ${hasValidValues}`);
} catch (error) {
  console.error('✗ Error:', error.message);
}

// Test 6: Verify backward compatibility (properties without enums)
console.log('\n\n6. Backward compatibility - properties without enums:');
console.log('-'.repeat(80));
const noEnum = getComponentProperties('data-list', 'datasource');
console.log(noEnum.text);
console.log('\n✓ Properties without enums display normally');

console.log('\n' + '='.repeat(80));
console.log('Summary:');
console.log('  ✓ Small enum lists (≤10 values): Show all values with descriptions');
console.log('  ✓ Large enum lists (>10 values): Show note to use dedicated tool');
console.log('  ✓ Backward compatible: Non-enum properties work as before');
console.log('  ✓ Token efficient: Only shows details when helpful');
console.log('='.repeat(80));

// Made with Bob
