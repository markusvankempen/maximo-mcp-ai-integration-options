#!/usr/bin/env node
// Test script for the graphite-validate-xml tool

import { validateXml } from '../src/utils/graphiteLib.js';

console.log('Testing XML Validation Tool\n');
console.log('='.repeat(80));

// Test 1: Valid XML fragment
console.log('\n\nTest 1: Valid XML Fragment');
console.log('-'.repeat(80));
const validXml = `
<page id="test-page" label="Test Page">
  <text-input id="name-input" label="Name" />
  <button id="submit-btn" label="Submit" />
</page>
`;

try {
  const result1 = validateXml(validXml);
  console.log(result1.text);
  console.log('\nValidation Status:', result1.valid ? '✓ PASSED' : '✗ FAILED');
} catch (error) {
  console.error('Error:', error.message);
}

// Test 2: Invalid XML (missing required attributes)
console.log('\n\n' + '='.repeat(80));
console.log('\nTest 2: Invalid XML (testing error handling)');
console.log('-'.repeat(80));
const invalidXml = `
<page>
  <text-input />
</page>
`;

try {
  const result2 = validateXml(invalidXml);
  console.log(result2.text);
  console.log('\nValidation Status:', result2.valid ? '✓ PASSED' : '✗ FAILED');
} catch (error) {
  console.error('Error:', error.message);
}

// Test 3: Complex valid XML with datasource
console.log('\n\n' + '='.repeat(80));
console.log('\nTest 3: Complex XML with Datasource');
console.log('-'.repeat(80));
const complexXml = `
<page id="asset-page" label="Assets">
  <maximo-datasource id="assetDS" object-structure="mxapiasset" />
  <table datasource="assetDS">
    <table-column label="Asset Number" attribute="assetnum" />
    <table-column label="Description" attribute="description" />
  </table>
</page>
`;

try {
  const result3 = validateXml(complexXml);
  console.log(result3.text);
  console.log('\nValidation Status:', result3.valid ? '✓ PASSED' : '✗ FAILED');
} catch (error) {
  console.error('Error:', error.message);
}

// Test 4: Test with options
console.log('\n\n' + '='.repeat(80));
console.log('\nTest 4: XML with Custom Options (strict mode)');
console.log('-'.repeat(80));
const xmlWithOptions = `
<page id="test-page" label="Test">
  <button id="btn1" label="Click Me" />
</page>
`;

try {
  const result4 = validateXml(xmlWithOptions, {
    transformer: 'mobile',
    platform: 'mobile',
    strict: true,
    idPrefix: 'test_'
  });
  console.log(result4.text);
  console.log('\nValidation Status:', result4.valid ? '✓ PASSED' : '✗ FAILED');
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n\n' + '='.repeat(80));
console.log('\nAll tests completed!');
console.log('='.repeat(80));

// Made with Bob
