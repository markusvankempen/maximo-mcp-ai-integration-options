# Controllers & Events – Graphite House Rules

## Types
- **Application controllers**, **Page controllers**, **Datasource controllers**.
- Multiple controllers may exist at the same level (e.g., page + datasource). **Event dispatch is fan-out (not ordered)**.

## Naming & Location
- Files are **ES classes** (no extends), **vanilla JS only** (never React).
- Constructor is not required; prefer methods only.
- Named **`SomeNameController.js`** in either `src/` or `src/controllers/`.

## Event Model (core)
- Prefer **named events** from UI:  
  `<button on-click="openItem" on-click-arg="{item}" />`
- Event flow: **Datasource → Page → Application**. All relevant controllers are offered the event. Handling **does not stop propagation**.
- To **target** a specific owner, **prefix** with its ID: `dsWO:myEvent`.
  `<button on-click="dsWO:myEvent" />`
- **Arg** is a single value; use an object when needed:  
  `<button on-click="openItem" on-click-arg="{{'datasource': ds, 'item': item}}" />`

### Controller event handlers
- Define a method on your controller with the event name:
```js
class MyPageController {
  openItem(event /* or item */) { /* ... */ }
}
```

### Expressions as events
- You can bind expressions: `<button on-click="{eventManager.emit('doSomething', item.wonum)}" />`
- **Don’t call controller methods from bindings to drive UI**.  
  Instead, **bind to state** and update that state from your controller.

**Anti-pattern:**
```xml
<button label="Clicks {page.controllers[0].getCounter()}"
        on-click="{page.controllers[0].incrementCounters()}" />
```
**Do this instead:**
```xml
<button label="Clicks {page.state.counter}"
        on-click="incrementCounter"
        on-click-arg="page" />
```
```js
incrementCounter(page) { page.state.counter += 1; }
```

## Lifecycle Hooks

### Application
- `applicationInitialized(app)` – once; capture `app`.
- `onContextReceived({ context, app })`
- `onAppSerialize({ app })`
- `onAppDeserialize({ app })`
- `onApplicationBeforeFirstRender({ app })` – returns an **async function** that is awaited **before** first render.

### Page
- `pageInitialized(page, app)` – once; after page & datasources init.
- `pageResumed(page, app)` – **called every time** page becomes active (including the first time).
- `pagePaused(page, app)` – called when leaving page.
- `getPageStack(stack, page)` – mutate breadcrumb stack.
- `onPageSerialize({ page })` / `onPageDeserialize({ page })`.
- to navigate to another page from Javascript: `app.setCurrentPage({name: PAGEID, params: {...}})`

**Order on navigation:**  
`oldPage.pagePaused → newPage.pageInitialized (first time) → newPage.pageResumed → process datasource dynamic props → preload datasources (if any) → render.`

### Datasource (controller)
Attach via:  
```xml
<json-datasource id="ds" controller="DataController" src="Data.js" />
```
```js
export default class DataController {
  onDatasourceInitialized(datasource) {}
  onBeforeLoadData(datasource, query) {}
  onAfterLoadData(datasource, items, query) {
    // mutate items array; do NOT use ds.items/ds.getItems() here; do NOT async.
  }
  onLoadDataFailed(error, datasource, query) {}
  onBeforeSaveData({ datasource, items, throwError }) {}
  onAfterSaveData({ datasource, items, hasNewItems }) {}
  onSaveDataFailed({ datasource, items, warnings }) {}
  onBeforeAddData({ datasource, item, options }) {}
  onAddDataFailed({ datasource, item, error }) {}
  onBeforeAddNewData({ datasource, options }) {}
  onAddNewRecord({ datasource, item }) {}
  onAddNewFailed({ error, datasource, response }) {}
  onDatasourceSelectionChanged({ datasource, item, selected, selectionCount, clearSelection }) {}
  onValueChanged({ datasource, item, field, oldValue, newValue, changes }) {
    // common case; you may set warnings or revert values
    if (field === 'price') {
      if (newValue > 100) datasource.setWarning(item, field, 'The cost of $100 is too high');
      if (newValue < 0) item[field] = oldValue;
    }
  }
}
```

## Calling controller functions (returning values)
- Framework is **state/event driven**. If you call a controller method for a value, the UI won’t auto-update.
- If multiple controllers can handle a callable function, the **last param must be the previous value**:
```js
calculateSomething(item, currentValue) { return item.a * item.b; }
```
```xml
<field value="{dsWO.callController('calculateSomething', item)}" />
```

## Testing Controllers (App Test Stub)
- Build with `--create-test-stub` to generate `src/test/AppTestStub.js`.
- Typical pattern:
```js
import newTestStub from './test/AppTestStub';
const init = newTestStub({
  currentPage: 'woDetailPage',
  datasources: { wods: { data: require('./testdata.js') } },
  onNewController: (controller, name) => { /* attach spies early if needed */ }
});
const app = await init();
const ds = app.findDatasource('wods');
await ds.load(); // if not preloaded
const controller = app.currentPage.controllers[0];
await controller.doSomething();
```
- You can register **event spies** on datasources (e.g., `'after-load-data'`), and you can **wait** for data with `waitUtils.waitForCondition(() => ds.state.hasData)`.

## Do’s & Don’ts (summary)
- ✅ Keep controller logic short; prefer quick validation/post-processing.
- ✅ Use named events + state updates to drive UI.
- ✅ Put app/page/datasource lifecycle logic in the proper hooks.
- ✅ Controller events in .js files always, never inline in the XML.
- ❌ Long-running work in controllers.
- ❌ React/JSX or component logic inside controllers.
- ❌ Depending on any fixed handler order across controllers at the same level.
- ❌ Inline javascript controller methods in the xml.  the <controller> element is never to be used.
- ❌ Do not use async controller lifecycle methods