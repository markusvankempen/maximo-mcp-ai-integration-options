// Test OR search logic for icons, colors, and schema properties
import { searchGraphiteIcons, searchGraphiteColors } from '../src/utils/graphiteLib.js';
import { searchSchemaProperties } from '../src/utils/schema-utils.js';

console.log('Testing OR search logic...\n');

// Test 1: Icon search with multiple terms
console.log('=== Test 1: Icon Search with OR logic ===');
console.log('Search: "barcode scan qr"');
const iconResult = searchGraphiteIcons('barcode scan qr', 20);
console.log(`Found ${iconResult.matchingIcons} icons`);
console.log('Icons:', iconResult.icons.map(i => i.name).join(', '));
console.log();

// Test 2: Color search with multiple terms
console.log('=== Test 2: Color Search with OR logic ===');
console.log('Search: "blue interactive text"');
const colorResult = searchGraphiteColors('blue interactive text');
console.log(`Found ${colorResult.matchingColors} colors`);
console.log('Colors:', colorResult.colors.map(c => c.key).slice(0, 10).join(', '));
console.log();

// Test 3: Schema search with multiple terms
console.log('=== Test 3: Schema Property Search with OR logic ===');
const mockSchema = {
  resource: 'test',
  type: 'object',
  properties: {
    assetnum: { title: 'Asset Number', type: 'string', remarks: 'The asset identifier' },
    description: { title: 'Description', type: 'string', remarks: 'Asset description' },
    location: { title: 'Location', type: 'string', remarks: 'Where the asset is located' },
    status: { title: 'Status', type: 'string', remarks: 'Current status of asset' },
    workorder: { title: 'Work Order', type: 'string', remarks: 'Related work order' }
  }
};

console.log('Search: "asset work location"');
const schemaResult = searchSchemaProperties(mockSchema, 'asset work location');
console.log(`Found ${schemaResult.matchCount} of ${schemaResult.totalProperties} properties`);
console.log('Properties:', Object.keys(schemaResult.properties).join(', '));
console.log();

console.log('=== All tests completed ===');

// Made with Bob
