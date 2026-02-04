# Mobile QBE Filter

## Overview

The `mobile-qbe-filter` is a powerful feature in Maximo Mobile applications that enables filtering data directly from the local mobile database. It provides a way to define query filters that are applied to data stored in the device's offline database, allowing applications to efficiently retrieve and display only the relevant records without requiring a server connection.

This feature is particularly valuable in mobile applications where:
- Users need to work offline
- Data sets can be large
- Performance optimization is critical
- Specific subsets of data need to be displayed based on certain criteria

## Key Concepts

### What is QBE?

QBE (Query By Example) is a database query technique where users provide sample values to search for matching records. In Maximo, QBE allows users to filter data by specifying conditions on attributes.

### How mobile-qbe-filter Works

The `mobile-qbe-filter` property is defined in the Maximo datasource registry as an object type that specifies filtering criteria for the mobile local database. When a datasource loads data, these filters are applied to the local database query.

Under the hood, the `mobile-qbe-filter` works through the following process:

1. The filter is defined in XML as a property of a `maximo-datasource` or `maximo-datasource-override` element
2. When data is requested, the `DisconnectedDataAdapter` processes the filter through its `_parseMobileQbeFilter` method
3. The filter is converted into a format suitable for querying the local database
4. The query is executed against the local database, returning only records that match the filter criteria

### Filter Syntax

The `mobile-qbe-filter` uses a JSON-like syntax within XML attributes. The basic structure is:

```xml
mobile-qbe-filter="{{'attribute1': 'operator value', 'attribute2': 'operator value'}}"
```

Where:
- `attribute` is the field name to filter on
- `operator` is one of the supported operators (=, !=, >, <, >=, <=, etc.)
- `value` is the value to compare against

### Supported Operators

The following operators are supported in mobile-qbe-filter expressions:

| Operator | Description | Example |
|----------|-------------|---------|
| = | Equal to | `'status': '=PENDING'` |
| != | Not equal to | `'status': '!=CLOSE'` |
| > | Greater than | `'priority': '>2'` |
| >= | Greater than or equal to | `'priority': '>=3'` |
| < | Less than | `'duedate': '<&SYSDAY&'` |
| <= | Less than or equal to | `'duedate': '<=&SYSDAY&'` |
| in | In a list of values | `'status': 'in PENDING,INPROG'` |
| !in | Not in a list of values | `'status': '!in COMP,CAN,CLOSE'` |

### Integration with DisconnectedDataAdapter

The `mobile-qbe-filter` is processed by the `DisconnectedDataAdapter` class, which:

1. Parses the filter using the `_parseMobileQbeFilter` method
2. Converts it to a mobile query format using the `_qbeToMobileQuery` method
3. Applies the filter during local data retrieval

### Implementation Details

The implementation of `mobile-qbe-filter` in the `DisconnectedDataAdapter.js` file involves several key methods:

#### _parseMobileQbeFilter Method

This method converts the mobile-qbe-filter object into a format compatible with the datasource QBE format:

```javascript
_parseMobileQbeFilter(filter) {
  let parsedFilter = {};
  if (filter) {
    Object.keys(filter).forEach(key => {
      let value = filter[key];
      let qbeValue = {};
      if (typeof value === 'string' && value !== '') {
        if (value.indexOf(',') > 0) {
          if (value.startsWith('!=')) {
            value = value.substring(2);
            qbeValue.operator = '!in';
          } else {
            if (value[0] === '=') {
              value = value.substring(1);
            }
            qbeValue.operator = 'in';
          }
          qbeValue.value = parseArray(value);
        } else {
          qbeValue = parseQbeValue(value, null, true);
        }
        parsedFilter[key] = qbeValue;
      } else if (Array.isArray(value)) {
        qbeValue.operator = 'in';
        qbeValue.value = value;
        parsedFilter[key] = qbeValue;
      }
    });
  }
  return parsedFilter;
}
```

This method handles:
- String values with comma-separated lists (converting them to 'in' or '!in' operators)
- Single string values (parsing them using the parseQbeValue utility)
- Array values (converting them to 'in' operators)

#### _prepareLocalQuery Method

This method incorporates the mobile-qbe-filter into the query options:

```javascript
if (query.mobileQbeFilter) {
  qbeQuery = {
    ...qbeQuery,
    ...this._parseMobileQbeFilter(query.mobileQbeFilter)
  };
}
if (Object.keys(qbeQuery).length > 0) {
  options.query.mobileQuery = this._qbeToMobileQuery(
    qbeQuery,
    query.datasource,
    query.searchAttributes
  );
  options.query.exactMatch = false;
}
```

This code merges any existing QBE query with the parsed mobile-qbe-filter and converts it to a mobile query format.

#### _qbeToMobileQuery Method

This method transforms the QBE format into the mobile query format that the local database can process:

```javascript
_qbeToMobileQuery(qbe, ds) {
  let mobileQueryObject = {$and: []};
  let operatorLookup = {
    '<': '$lt',
    '<=': '$lte',
    '>': '$gt',
    '>=': '$gte',
    'in': '$elemMatch',
    '!in': '$notIn',
    '=': '$eq',
    '!=': '$ne',
    '*=': '$exists',
    '*': '$null',
    '!=%': '$notlike',
    '%': '$like'
  };
  
  // Implementation details...
  
  return mobileQueryObject;
}
```

This method handles various operators and creates a structured query object with `$and` conditions that the mobile database can process efficiently.

## Examples

### Basic Filtering

Filter work orders that are not in COMP, CAN, CLOSE, or WAPPR status:

```xml
<maximo-datasource id="todaywoassignedDS"
                  object-structure="mxapiwodetail"
                  saved-query="ASSIGNEDWOLIST"
                  mobile-qbe-filter="{{'status_maxvalue': '!=COMP,CAN,CLOSE,WAPPR'}}"
                  offline-immediate-download="true">
</maximo-datasource>
```

In this example:
- `status_maxvalue` is the attribute being filtered
- `!=` is the "not equal to" operator
- `COMP,CAN,CLOSE,WAPPR` is a comma-separated list of values to exclude
- The filter is automatically converted to a `!in` operation internally

### Multiple Conditions

Filter inspection results that are in PENDING status and not historical:

```xml
<maximo-datasource-override id="pendingds"
                           saved-query="INSPRESULTPENDING"
                           mobile-qbe-filter="{{'status_maxvalue': '=PENDING', 'historyflag': '!=true'}}"
                           offline-immediate-download="false"/>
```

This example demonstrates:
- Multiple conditions combined with an implicit AND operation
- Different operators (`=` and `!=`) used in the same filter
- Filtering on both a string field (`status_maxvalue`) and a boolean field (`historyflag`)

### Empty Filter

Sometimes you might need to specify an empty filter to override a parent datasource's filter:

```xml
<maximo-datasource-override id="myWorkOrder"
                           saved-query="uxtechnicianstatusfilteredwolist"
                           mobile-qbe-filter="{{}}"/>
```

This is useful when:
- You want to clear filters inherited from a parent datasource
- You're relying solely on the saved query for filtering
- You need to temporarily disable filtering for testing or debugging

### Filtering with Multiple Values

Filter work orders with specific status values:

```xml
<maximo-datasource-override id="myworkCreatedLocally"
                           saved-query="CREATEDLOCALLY"
                           mobile-qbe-filter="{{'status_maxvalue': '!=COMP,CAN,CLOSE'}}"/>
```

### Real-World Use Cases

#### Work Order Filtering by Status

A common pattern in Maximo Mobile applications is filtering work orders by status:

```xml
<maximo-datasource id="wolistDS"
                  object-structure="mxapiwodetail"
                  mobile-qbe-filter="{{'status_maxvalue': '!=COMP,CAN,CLOSE,WAPPR', 'hidewo': '!=HIDE'}}"
                  offline-immediate-download="true">
</maximo-datasource>
```

This filter ensures that:
1. Only active work orders are shown (excluding completed, canceled, closed, or waiting for approval)
2. Hidden work orders are excluded
3. The data is downloaded for offline use

#### Inspection Results by Status and Type

For inspection applications, filtering by both status and historical flag:

```xml
<maximo-datasource id="assignedworkds"
                  object-structure="mxapiinspectionres"
                  mobile-qbe-filter="{{'status_maxvalue': '!=COMPLETED,CAN,REVIEW', 'historyflag': '!=true'}}"
                  offline-immediate-download="false">
</maximo-datasource>
```

This filter:
1. Excludes completed, canceled, or in-review inspections
2. Shows only current (non-historical) inspections

## Best Practices

### Performance Optimization

1. **Be Specific**: Define filters that are as specific as possible to reduce the amount of data processed.

2. **Use Indexed Fields**: Whenever possible, filter on fields that are indexed in the local database for better performance.

3. **Combine with Other Filtering Mechanisms**: Use `mobile-qbe-filter` in conjunction with `saved-query` and `where` clauses for optimal filtering.

4. **Test with Large Datasets**: Ensure your filters perform well with the expected volume of data.

### Syntax Guidelines

1. **Proper Formatting**: Ensure the JSON-like syntax is correctly formatted with double quotes around the entire expression and single quotes for internal values.

2. **Escape Special Characters**: When using special characters or XML entities, make sure they are properly escaped.

3. **Validate Operators**: Use the correct operators for the data types you're filtering (e.g., string vs. numeric vs. date).

### Offline Considerations

1. **Offline-First Design**: Design your filters with offline usage in mind, considering what data users will need when disconnected.

2. **Data Volume**: Balance between downloading enough data for offline use and keeping the local database size manageable.

3. **Combine with offline-immediate-download**: For critical data that should be available offline, combine `mobile-qbe-filter` with `offline-immediate-download="true"`.

### Common Patterns

1. **Status Filtering**: Filtering by status is one of the most common use cases, as seen in many examples.

2. **Excluding Completed Items**: Many applications filter out completed, canceled, or closed items to focus on active work.

3. **User-Specific Data**: Filter data specific to the current user for personalized views.

4. **Date-Based Filtering**: Filter records based on date ranges, often using system variables like `&SYSDAY&`.

## Troubleshooting

### Common Issues and Solutions

#### Filter Not Applied

**Issue**: The filter appears to be ignored and all records are returned.

**Possible Causes and Solutions**:
1. **Syntax Error**: Ensure the JSON-like syntax is correctly formatted.
   ```xml
   <!-- Incorrect -->
   mobile-qbe-filter="{'status_maxvalue': '!=COMP'}"
   
   <!-- Correct -->
   mobile-qbe-filter="{{'status_maxvalue': '!=COMP'}}"
   ```

2. **Attribute Name Mismatch**: Verify that the attribute name in the filter matches the actual field name in the database schema.

3. **Operator Compatibility**: Ensure the operator is compatible with the field type (e.g., don't use string operators on numeric fields).

#### No Records Returned

**Issue**: The filter is too restrictive and no records are returned.

**Possible Causes and Solutions**:
1. **Overly Specific Filter**: Try simplifying your filter to see if records appear.
2. **Data Availability**: Check if the data exists in the local database by temporarily removing the filter.
3. **Case Sensitivity**: Some filters may be case-sensitive. Try adjusting the case of your filter values.

#### Performance Issues

**Issue**: Filtering is slow, especially with large datasets.

**Possible Causes and Solutions**:
1. **Non-Indexed Fields**: Filter on indexed fields whenever possible.
2. **Complex Filters**: Simplify complex filters or break them down into multiple steps.
3. **Data Volume**: Consider using `saved-query` in combination with `mobile-qbe-filter` to reduce the initial dataset size.

### Debugging Techniques

1. **Start Simple**: Begin with a simple filter and gradually add complexity.
2. **Test Incrementally**: Test each condition separately before combining them.
3. **Verify Data**: Use developer tools to inspect the local database and verify the data exists.
4. **Check Logs**: Review application logs for any errors related to filtering.

## Conclusion

The `mobile-qbe-filter` is an essential tool for optimizing data retrieval in Maximo Mobile applications. By applying filters directly to the local database, it improves application performance and user experience, especially in offline scenarios. Understanding how to effectively use this feature will help you build more efficient and responsive mobile applications.