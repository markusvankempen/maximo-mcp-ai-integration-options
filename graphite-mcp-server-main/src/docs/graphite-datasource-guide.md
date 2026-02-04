# Graphite Datasource – MCP Quick Guide

This is a brief guide for using Graphite Datasources in MCP contexts.

---

## 📦 Overview
Graphite Datasources provide data to UI components. They can:

- Load and cache records
- Search, filter, and paginate
- Save, add, update, and delete data

**Types:**  
- `<json-datasource>`: in-memory, client-side  
- `<maximo-datasource>`: connects to Maximo OSLC APIs  
- `<custom-datasource>`: fully custom adapter logic  

---

## ⚙️ Controllers
Attach JS classes to a datasource for logic and lifecycle hooks.

```xml
<json-datasource controller="DataController" id="ds" src="Data.js"/>
```

**Common hooks:**  
- `onDatasourceInitialized(ds)`  
- `onBeforeLoadData(ds,query)`  
- `onAfterLoadData(ds,items,query)` ← mutate items before merge  
- `onLoadDataFailed(error,ds,query)`  
- `onBeforeSaveData({datasource,items})`  
- `onAfterSaveData({datasource,items})`  
- `onValueChanged({datasource,item,field,oldValue,newValue})`

Use `app.findDatasource('name')` to access any datasource in controllers.

---

## 📡 Common API Patterns
```js
let ds = app.findDatasource('work');

// Force reload
await ds.forceReload();

// Search
ds.search('Tom', ['displayname']);
ds.searchQBE({age: '>30'});

// Iterate
ds.forEach(item => console.log(item));

// Save
let item = ds.get(0);
item.description = 'New';
await ds.save();
```

Other APIs: `undoItemChanges(item)`, `applyInMemoryFilter(fn)`, `getSelectedItems()`.

---

## 🧩 Depends-On
Datasources can depend on others to enforce load order:

```xml
<json-datasource id="ds1" src="data1.js"/>
<json-datasource id="ds2" src="data2.js" depends-on="ds1"/>
```

Child waits until parent has loaded.

---

## 🖇 Doclinks (Maximo)
To use doclinks in Graphite attachment lists:
- Your object structure must have a path `ASSET->DOCLINKS`
- Use `attachment="true"`
- Use either nested `<maximo-datasource relationship="doclinks">` or `<attribute name="doclinks{*}">`

Use `getChildDatasource('doclinks', item, {query: {attachment: true}})` to build per-record child datasources.

---


## ⚡ Loading
Ways datasources load:
1. `pre-load="true"`
2. Bound to UI component on render
3. `ds.load()` from controller
4. Reacts to `page.state` or `page.params` changes

Use `can-load="{condition}"` to prevent unwanted loads.

---

## 🧬 Multi-level Datasources
- Nested datasources can now support full CRUD to 4+ levels deep
- Mobile currently supports max 2 nested levels (desktop supports 4+)
- Use `depends-on` and `child-datasource` hierarchies

---

## ⚡ Loader Function Example
You can use a loader function to dynamically load data from an API or local logic.

**loader.js**
```js
const loader = async (query) => {
  const resp = await fetch('/api/items');
  return {
    items: await resp.json()
  };
};
export default loader;
```

**datasource in XML**
```xml
<json-datasource id="itemsDS" src="loader.js" pre-load="true" />
```

**Referencing datasource data in the UI**
```xml
<data-list datasource="itemsDS">
  <list-item>
    <label label="{item.name}" />
    <label label="{item.description}" />
  </list-item>
</data-list>
```

Use `item` bindings to access fields of each record from the datasource.

## Datasource CRUD operations

### Adding/Creating data
```
  let item = await ds.addNew();
  item.field = 'value';
  ds.save();
```

### Updating data
```
  let item = ds.get(0);
  item.field = 'newvalue';
  await ds.save();
```

### Deleting data
```
  let item = ds.get(0);
  let deleted = await ds.deleteItem(item);
  if (deleted) {
    // should reload after delete so that the datasource state of items is reflected.
    ds.load();
  }
```

## Do’s & Don’ts (summary)
- ✅ Use async loader functions when using json-datasource to load data.
- ✅ maximo-datasource when loading maximo data.
- ✅ json-datasource when loading non maximo data.
- ✅ custom-datasource in rare extreme cases.
- ✅ use smart-input when needing to get editable information from a datasource, since it knows the data type from the schema.
- ❌ Do not use static arrays, or force load data using `.load({src:[]})`. (ie, use loader function instead)
- ❌ Do not create a data controller unless we need to manipulate the data after loading.
- ❌ Do not use elements like text-input, date-input, etc, when building editable forms for a datasource.  Use smart-input because it knows the actual component types based on the datasource schema.
