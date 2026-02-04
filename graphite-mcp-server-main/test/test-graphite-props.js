// Test script for the updated graphite property tools
import { 
  getComponentProperties, 
  getComponentSamples,
  getMultipleComponentProperties 
} from '../src/utils/graphiteLib.js';

console.log('='.repeat(80));
console.log('Testing Graphite Property Tools');
console.log('='.repeat(80));

// Test 1: Get properties for data-list
console.log('\n\n1. Testing getComponentProperties for "data-list":');
console.log('-'.repeat(80));
const dataListProps = getComponentProperties('data-list');
if (dataListProps.error) {
  console.error('ERROR:', dataListProps.error);
} else {
  console.log(`Found ${dataListProps.properties.length} properties`);
  console.log('\nFirst 3 properties:');
  dataListProps.properties.slice(0, 3).forEach(prop => {
    console.log(`  - ${prop.name}: ${prop.type}`);
  });
}

// Test 2: Search for properties with "datasource"
console.log('\n\n2. Testing property search for "datasource" in data-list:');
console.log('-'.repeat(80));
const searchResult = getComponentProperties('data-list', 'datasource');
if (searchResult.error) {
  console.error('ERROR:', searchResult.error);
} else {
  console.log(`Found ${searchResult.properties.length} matching properties`);
  searchResult.properties.forEach(prop => {
    console.log(`  - ${prop.name}: ${prop.description}`);
  });
}

// Test 3: Get samples for data-list
console.log('\n\n3. Testing getComponentSamples for "data-list":');
console.log('-'.repeat(80));
const samples = getComponentSamples('data-list');
if (samples.error) {
  console.error('ERROR:', samples.error);
} else {
  console.log(`Found ${samples.samples.length} samples`);
  if (samples.samples.length > 0) {
    console.log(`First sample: ${samples.samples[0].name}`);
  }
}

// Test 4: Get multiple component properties
console.log('\n\n4. Testing getMultipleComponentProperties:');
console.log('-'.repeat(80));
const multiProps = getMultipleComponentProperties(['data-list', 'table', 'box']);
if (multiProps.error) {
  console.error('ERROR:', multiProps.error);
} else {
  console.log(`Retrieved properties for ${multiProps.components.length} components`);
  multiProps.components.forEach(comp => {
    if (comp.error) {
      console.log(`  - ${comp.componentName || 'unknown'}: ERROR - ${comp.error}`);
    } else {
      console.log(`  - ${comp.componentName}: ${comp.properties.length} properties`);
    }
  });
}

// Test 5: Error handling - non-existent component
console.log('\n\n5. Testing error handling with non-existent component:');
console.log('-'.repeat(80));
const errorTest = getComponentProperties('non-existent-component');
if (errorTest.error) {
  console.log('✓ Error correctly handled:', errorTest.error);
} else {
  console.error('✗ Should have returned an error');
}

console.log('\n' + '='.repeat(80));
console.log('Tests completed!');
console.log('='.repeat(80));

// Made with Bob
