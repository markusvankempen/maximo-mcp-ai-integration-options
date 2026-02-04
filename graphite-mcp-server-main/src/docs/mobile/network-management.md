# Network Management in Maximo Mobile

## Overview

NetworkManager is a Graphite API to manage network states in applications. In Maximo Mobile/Anywhere platform, the extended class is AnywhereNetworkManager. This document covers the specific implementation for the Maximo Mobile platform.

## Network State Properties

Here are the state properties in AnywhereNetworkManager, which you can access via `NetworkManager.get().state.xxx`:

### Atomic State Properties

- **networkEnabled**: Indicates whether the mobile device has enabled network adapters. The value is `false` if the mobile device has not enabled any network adapter or has turned on airplane mode.

- **bandwidthAcceptable**: Indicates whether the mobile device's network bandwidth is acceptable. The value is `false` if it has low bandwidth, for example, a 2G network.

- **serverReachable**: Indicates whether the mobile app can connect with the server. The value is `false` if the mobile app cannot connect with the server due to missing required VPN or if the server is down.

- **serverAuthenticated**: Indicates whether the mobile app has authenticated to the server. The value is `false` if the user has not logged in to the server or if the login session has expired.

### Combined State Properties

Based on the atomic properties above, here are the combined state properties in AnywhereNetworkManager, which are used by applications for different purposes:

- **networkConnected**: `networkEnabled && bandwidthAcceptable && serverReachable`
  - Used by Authenticator, which starts authentication only if `networkConnected` is `true`.

- **connected**: `networkConnected && serverAuthenticated` (in other words, all four state properties are `true`: `networkEnabled && bandwidthAcceptable && serverReachable && serverAuthenticated`)
  - Used by most components/applications, which call services only if `connected` is `true`.

## Network Events

Like NetworkManager, AnywhereNetworkManager provides events:

- **network-change**: This event is triggered whenever network state properties change. It includes a `networkState` parameter. You can subscribe to this event and add your logic to handle different network states.

Example code:

```javascript
NetworkManager.get().on('network-change', function(networkState) {
    if (!networkState.connected) {
        // show offline icon
    } else {
        // show online icon
    }

    if (!networkState.serverAuthenticated) {
        // show login button
    } else {
        // hide login button
    }
})
```

## Network Management Interface

AnywhereNetworkManager provides the following interfaces:

- **setServerReachable**: Takes a parameter `serverReachable` (boolean). If an application detects that the server is reachable or not, it can call NetworkManager to set the state property `serverReachable`. If the state value changes in NetworkManager, it will trigger the `network-change` event.

- **setServerAuthenticated**: Takes a parameter `serverAuthenticated` (boolean). If an application detects that the server is not authenticated, it can call NetworkManager to set the state property `serverAuthenticated` as `false`. If an application tries to set `serverAuthenticated` as `true`, NetworkManager will call a service to refresh all state properties. If the state value changes in NetworkManager, it will trigger the `network-change` event.

## Network Manager Interaction Flow

Here is the interaction flow related to network manager in navigator and embedded app:

![Network Manager Interaction Flow](../images/networkmanager.png)

In the AnywhereNetworkManager class, it calls a fixed service to refresh network state if `networkEnabled` and `bandwidthAcceptable` are true:

- For MAS, the service is "about"
- For EAM, the service is "whoami"

Typically:
- If service response statusCode is 200, then `serverReachable=true, serverAuthenticated=true`
- If statusCode is 401, then `serverReachable=true, serverAuthenticated=false`
- If timeout occurs, then `serverReachable=false`

## Periodic Network State Checking

AnywhereNetworkManager has a mechanism to periodically check network state. If `networkEnabled` and `bandwidthAcceptable` are true but `serverReachable` is false, then it starts polling and will check network state after a time interval (15 seconds), until `serverReachable` becomes true again.

## Integration with Application Lifecycle

During the Graphite initialization phase, the application sets the networkManager instance as `NetworkManager.get()`, and calls `NetworkManager.updateConnectionInfo` method, which checks network state and assigns proper network state values.

Embedded applications use the NetworkManager instance in the Navigator application (`NetworkManager.get()` is the same as `NetworkManager.getGlobal()`).

The `DisconnectedRESTConnection` may call NetworkManager's `setReachable` method if it encounters network issues.

## Best Practices

1. **Always check network state before making server requests**:
   ```javascript
   if (NetworkManager.get().state.connected) {
     // Make server request
   } else {
     // Handle offline scenario
   }
   ```

2. **Subscribe to network changes to update UI accordingly**:
   ```javascript
   NetworkManager.get().on('network-change', function(networkState) {
     // Update UI based on network state
   });
   ```

3. **Handle authentication issues properly**:
   ```javascript
   if (!NetworkManager.get().state.serverAuthenticated) {
     // Redirect to login or show login prompt
   }
   ```

4. **Consider offline capabilities**:
   - Design your application to work offline when possible
   - Cache necessary data for offline use
   - Queue transactions for later synchronization

5. **Provide clear feedback to users about network status**:
   - Show online/offline indicators
   - Inform users when operations cannot be performed due to network issues
   - Provide options to retry operations when network becomes available