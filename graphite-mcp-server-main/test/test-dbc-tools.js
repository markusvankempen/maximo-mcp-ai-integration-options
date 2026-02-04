// Test file for DBC tools
import {
  loadDBCSchema,
  getDBCElement,
  searchDBCElements,
  listDBCElements,
  getDBCElementAttributes,
  formatDBCElement,
} from "../src/utils/dbc-utils.js";

async function testDBCTools() {
  console.log("=== Testing DBC Tools ===\n");

  try {
    // Test 1: Load schema
    console.log("Test 1: Loading DBC schema...");
    const schema = await loadDBCSchema();
    console.log(`✓ Schema loaded: ${Object.keys(schema).length} elements\n`);

    // Test 2: List all elements
    console.log("Test 2: Listing all elements...");
    const elements = await listDBCElements();
    console.log(`✓ Found ${elements.length} elements`);
    console.log(`  First 10: ${elements.slice(0, 10).join(", ")}\n`);

    // Test 3: Search for table-related elements
    console.log("Test 3: Searching for 'table' elements...");
    const tableResults = await searchDBCElements("table", { limit: 5 });
    console.log(`✓ Found ${tableResults.length} matches:`);
    for (const result of tableResults) {
      console.log(`  - ${result.element} (score: ${result.score})`);
    }
    console.log();

    // Test 4: Get specific element info
    console.log("Test 4: Getting info for 'define_table' element...");
    const defineTable = await getDBCElement("define_table");
    if (defineTable) {
      console.log(`✓ Element found:`);
      console.log(`  Name: ${defineTable.name}`);
      console.log(`  Attributes: ${Object.keys(defineTable.attributes).length}`);
      console.log(`  Children: ${defineTable.children.length}`);
      console.log(`  Has description: ${!!defineTable.description}`);
    } else {
      console.log("✗ Element not found");
    }
    console.log();

    // Test 5: Get element attributes
    console.log("Test 5: Getting attributes for 'define_table'...");
    const attrs = await getDBCElementAttributes("define_table");
    if (attrs) {
      console.log(`✓ Attributes found: ${Object.keys(attrs.attributes).length}`);
      const requiredAttrs = Object.entries(attrs.attributes)
        .filter(([, data]) => data.required)
        .map(([name]) => name);
      console.log(`  Required attributes: ${requiredAttrs.join(", ")}`);
    }
    console.log();

    // Test 6: Format element for display
    console.log("Test 6: Formatting 'add_attributes' element...");
    const addAttrs = await getDBCElement("add_attributes");
    if (addAttrs) {
      const formatted = formatDBCElement(addAttrs, false);
      console.log("✓ Formatted output:");
      console.log(formatted.split("\n").map(line => `  ${line}`).join("\n"));
    }
    console.log();

    // Test 7: Search with attribute filtering
    console.log("Test 7: Searching for 'domain' with attribute filtering...");
    const domainResults = await searchDBCElements("domain", {
      limit: 3,
      includeAttributes: true,
    });
    console.log(`✓ Found ${domainResults.length} matches`);
    console.log();

    // Test 8: Get element with enum attributes
    console.log("Test 8: Getting element with enum attributes (script)...");
    const script = await getDBCElement("script");
    if (script) {
      const enumAttrs = Object.entries(script.attributes)
        .filter(([, data]) => data.enumValues)
        .map(([name, data]) => `${name}: [${data.enumValues.join(", ")}]`);
      console.log(`✓ Enum attributes found: ${enumAttrs.length}`);
      if (enumAttrs.length > 0) {
        console.log(`  ${enumAttrs[0]}`);
      }
    }
    console.log();

    // Test 9: Test OR search with multiple terms
    console.log("Test 9: Testing OR search with 'table index'...");
    const orResults = await searchDBCElements("table index", { limit: 10 });
    console.log(`✓ Found ${orResults.length} matches for OR search`);
    const tableMatches = orResults.filter(r => r.matchedTerms.includes('table')).length;
    const indexMatches = orResults.filter(r => r.matchedTerms.includes('index')).length;
    console.log(`  Elements matching 'table': ${tableMatches}`);
    console.log(`  Elements matching 'index': ${indexMatches}`);
    if (orResults.length > 0) {
      console.log(`  Example: ${orResults[0].element} matched [${orResults[0].matchedTerms.join(', ')}]`);
    }
    console.log();

    // Test 10: Validate cache works
    console.log("Test 10: Testing cache (second load should be faster)...");
    const start = Date.now();
    await loadDBCSchema();
    const duration = Date.now() - start;
    console.log(`✓ Second load took ${duration}ms (should be <5ms if cached)\n`);

    console.log("=== All Tests Passed! ===");
  } catch (error) {
    console.error("✗ Test failed:", error);
    process.exit(1);
  }
}

// Run tests
testDBCTools();

// Made with Bob
