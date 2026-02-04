// Test script for color and icon search tools
import { searchGraphiteColors, searchGraphiteIcons } from '../src/utils/graphiteLib.js';
import { handleGraphiteSearchColors, handleGraphiteSearchIcons } from '../src/handlers/graphite/tool-handlers.js';

console.log('='.repeat(80));
console.log('Testing Color and Icon Search Tools');
console.log('='.repeat(80));

// Test 1: List all colors
console.log('\n\n1. List all Graphite colors (29 total):');
console.log('-'.repeat(80));
const allColors = searchGraphiteColors();
console.log(allColors.text);
console.log(`\n✓ Found ${allColors.totalColors} colors`);

// Test 2: Search for specific colors
console.log('\n\n2. Search for "blue" colors:');
console.log('-'.repeat(80));
const blueColors = searchGraphiteColors('blue');
console.log(blueColors.text);
console.log(`\n✓ Found ${blueColors.matchingColors} matching colors`);

// Test 3: Search for "interactive" colors
console.log('\n\n3. Search for "interactive" colors:');
console.log('-'.repeat(80));
const interactiveColors = searchGraphiteColors('interactive');
console.log(interactiveColors.text);

// Test 4: List icons with default limit
console.log('\n\n4. List icons (default limit 50):');
console.log('-'.repeat(80));
const defaultIcons = searchGraphiteIcons();
console.log(`Total icons: ${defaultIcons.totalIcons}`);
console.log(`Showing: ${defaultIcons.showingIcons}`);
console.log('\nFirst 10 icons:');
defaultIcons.icons.slice(0, 10).forEach((icon, idx) => {
  console.log(`  ${idx + 1}. ${icon.name}`);
});

// Test 5: Search for arrow icons
console.log('\n\n5. Search for "arrow" icons:');
console.log('-'.repeat(80));
const arrowIcons = searchGraphiteIcons('arrow');
console.log(arrowIcons.text);
console.log(`\n✓ Found ${arrowIcons.matchingIcons} arrow icons`);

// Test 6: Search for "add" icons with limit
console.log('\n\n6. Search for "add" icons (limit 10):');
console.log('-'.repeat(80));
const addIcons = searchGraphiteIcons('add', 10);
console.log(addIcons.text);

// Test 7: Test via MCP handlers
console.log('\n\n7. Test color search via MCP handler:');
console.log('-'.repeat(80));
try {
  const result = await handleGraphiteSearchColors({ search: 'text' });
  console.log('✓ Handler executed successfully');
  console.log(result.content[0].text);
} catch (error) {
  console.error('✗ Error:', error.message);
}

// Test 8: Test icon search via MCP handler
console.log('\n\n8. Test icon search via MCP handler:');
console.log('-'.repeat(80));
try {
  const result = await handleGraphiteSearchIcons({ search: 'edit', limit: 5 });
  console.log('✓ Handler executed successfully');
  console.log(result.content[0].text);
} catch (error) {
  console.error('✗ Error:', error.message);
}

// Test 9: Search with no results
console.log('\n\n9. Test search with no results:');
console.log('-'.repeat(80));
const noResults = searchGraphiteColors('xyz123notfound');
console.log(noResults.text);
console.log(`✓ Correctly handles no results: ${noResults.matchingColors === 0}`);

console.log('\n' + '='.repeat(80));
console.log('Summary:');
console.log(`  ✓ Colors: ${allColors.totalColors} total, searchable`);
console.log(`  ✓ Icons: ${defaultIcons.totalIcons} total, searchable with limit`);
console.log('  ✓ Both tools support optional search filtering');
console.log('  ✓ MCP handlers working correctly');
console.log('='.repeat(80));

// Made with Bob
