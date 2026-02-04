# Graphite State Management Guide

## Overview
State is a fundamental concept in Graphite applications. The UI updates only in response to state changes, whether at the application level, page level, or through components like datasources.

## Key Concepts

### State Scopes
- **Page State**: Accessible only within the page using `page.state.YOUR_PROPERTY`
- **Application State**: Accessible across all pages using `app.state.YOUR_PROPERTY`

### Creating and Using State

**Basic State Declaration:**
```xml
<states>
  <state name="button_label" value="Hello" type="string" />
</states>
```

**Binding UI to State:**
```xml
<button label="{page.state.button_label}" on-click="{page.state.button_label='World'}"/>
```

### URL-Enabled State
Enable browser navigation and bookmarking with URL-enabled state:

```xml
<states>
  <state name="selectedTabIndex" url-enabled="true" value="0" type="number"/>
</states>
```

### State Change Handlers

- **on-validate**: Called before state changes; can cancel the change
- **on-changed**: Called after state changes

```xml
<states>
  <state name="selectedTabIndex" value="0" type="number" on-changed="onTabChanged" on-validate="onTabValidate"/>
</states>
```

Controller functions:
```js
onTabChanged(event) {
  // Handle the change (event contains newValue and oldValue)
}

onTabValidate(event) {
  // Validate the change (set event.cancelled = true to prevent change)
  if (event.newValue > 3) event.cancelled = true;
}
```

## Built-in Application State

| Property | Description |
|----------|-------------|
| connected | Is the application connected to a remote server |
| networkConnected | Is the network available |
| authenticated | Is current application fully authenticated |
| pageLoading | Is a page being loaded |
| initializationComplete | Is the application fully initialized |
| screen.width | Width of screen in pixels |
| screen.height | Height of screen in pixels |
| screen.isPortrait | Is the screen in portrait mode |
| screen.isLandscape | Is the screen in landscape mode |
| screen.size | Screen size as 'sm', 'md', 'lg', 'xlg', 'max' |
| currentPageName | The ID of the current page being shown |
| currentApplication.id | ID of the application |
| currentApplication.label | Title of the application |
| currentApplication.icon | Icon of the application |
| platform | 'browser' or 'mobile' |

## Practical Examples

**Disable a button when offline:**
```xml
<button label="Submit" disabled="{!app.state.networkConnected}" />
```

**Hide content on small screens:**
```xml
<box hidden="{app.state.screen.width < 300}">
   <table datasource="ds"/>
</box>
```

**Device-specific content:**
```xml
<box hidden="{app.device.isMobile}">
  <table datasource="ds" />
</box>
```

## Best Practices
- Use page state unless you need to share state across multiple pages
- Think of state as a global data store for your page and application
- Use URL-enabled state for bookmarkable UI states
- Leverage built-in application state for responsive design