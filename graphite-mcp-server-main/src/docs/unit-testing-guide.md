# Graphite Unit Testing Guide

## Overview
Graphite applications are state machines that can be fully controlled from unit tests. This guide explains how to effectively test controllers and other components without manually setting up the entire application structure.

## Getting Started

### Creating a Test Stub
When building your application, use the `--create-test-stub` parameter to generate a test stub in `./src/test/AppTestSub.js`. This stub serves as the foundation for your unit tests.

### Basic Test Structure
```javascript
import sinon from 'sinon';
import newTestStub from './test/AppTestStub';

it('can use the app stub', async () => {
  let spies = {};
  let initializeApp = newTestStub({
    onNewApp: (app) => {
      spies.initSpy = sinon.spy(app, 'initialize');
    },
  });

  await initializeApp();
  expect(spies.initSpy.callCount).toBe(1);
});
```

The `newTestStub` function returns an async function that initializes the Application. Once initialized, you can interact with the application for testing.

## Common Testing Scenarios

### Initialize App to a Specific Page
```javascript
let initializeApp = newTestStub({
  currentPage: 'woDetailPage',
});
let app = await initializeApp();
expect(app.currentPage.name).toBe('woDetailPage');
```

### Initialize Data on a Datasource
```javascript
let initializeApp = newTestStub({
  currentPage: 'woDetailPage',
  datasources: {
    wods: {
      data: require('./testdata.js'),
    },
  },
});
let app = await initializeApp();
let ds = app.findDatasource('wods');
expect(ds.state.hasData).toBe(false);
await ds.load();
expect(ds.state.hasData).toBe(true);
```

### Access Controllers
Controllers are stored in arrays. You'll typically access them using `.controllers[0]`:

```javascript
let app = await initializeApp();
let controller = app.currentPage.controllers[0];
await controller.loadMyData();
```

### Register Spies on Datasource Events
Early in initialization:
```javascript
let spies = {
  afterLoadData: sinon.fake()
};
let initializeApp = newTestStub({
  datasources: {
    wods: {
      data: require('./testdata.js'),
      eventSpies: {
        'after-load-data': spies.afterLoadData
      }
    }
  }
});
let app = await initializeApp();
expect(spies.afterLoadData.callCount).toBe(1);
```

After initialization:
```javascript
let spies = {
  afterLoadData: sinon.fake()
};
let app = await initializeApp();
app.findDatasource('wods').on('after-load-data', spies.afterLoadData);
await app.controllers[0].doSomething();
expect(spies.afterLoadData.callCount).toBe(1);
```

### Register Spies on Controller Lifecycle Methods
```javascript
let spies = {
  pageResumed: null
};
let initializeApp = newTestStub({
  currentPage: 'woDetailPage',
  onNewController: (controller, name) => {
    if (name === 'MyController') {
      spies.pageResumed = sinon.spy(controller, 'pageResumed');
    }
  }
});
let app = await initializeApp();
expect(spies.pageResumed.callCount).toBe(1);
```

### Wait for Data to Load
```javascript
import { waitUtils } from '@maximo/maximo-js-api';

it('waits for data', async () => {
  let app = await initializeApp();
  let ds = app.findDatasource('wods');
  
  // Wait for the datasource to be fully loaded
  await waitUtils.waitForCondition(() => ds.state.hasData);
  
  expect(ds.state.totalCount).toBe(10);
});
```

### Navigate Between Pages
```javascript
let app = await initializeApp({
  currentPage: 'page1',
});

expect(app.currentPage.name).toBe('page1');

app.setCurrentPage('page2');
expect(app.currentPage.name).toBe('page2');
```

## Configuration Options

| Option | Description |
|--------|-------------|
| `currentPage` | Initialize this page as default |
| `logLevel` | Set logging level (0-4: ERROR, WARN, INFO, DEBUG, TRACE; default: -1 off) |
| `datasources` | Configure datasources by name |
| `datasources.dsname.data` | Set data for the datasource named `dsname` |
| `datasources.dsname.eventSpies.EVENT_NAME` | Register a spy for the event on datasource |
| `onNewApp` | Called with the `app` instance after creation |
| `onNewPage` | Called with the `page` instance after creation |
| `onNewController` | Called with (`controller`, `ClassName`, `owner`) after creation |
| `onNewDatasource` | Called with (`datasource`, `dataadapter`, `options`) after creation |
| `onNewDataAdapter` | Called with (`dataAdaper`, `options`) after creation |
| `onNewDialog` | Called with (`dialog`, `options`, `owner`) after creation |
| `onNewDatasourceOptions` | Called with (`options`) after creation |
| `onNewPageOptions` | Called with (`options`) after creation |
| `onNewAppOptions` | Called with (`options`) after creation |
| `onNewDialogOptions` | Called with (`options`) after creation |
| `onNewState` | Called with (`state`, `app or page`) after creation |

The `onNew` hooks provide control over test initialization. You can modify the provided object or return a new one.