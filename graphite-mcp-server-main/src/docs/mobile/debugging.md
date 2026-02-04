# Debugging Maximo Mobile Applications

You can use the debugging logs available in the apps themselves to troubleshoot applications. Some scenarios might require additional tools to debug an error.

## Development Applications

To debug the application you need a debuggable version of the container apps. You can build them yourself or you can download automatically built versions.

> **Note**: For iOS you need to build the development versions as they are not available through the download link.

## Preparing Device for Debugging

To debug an app using your iOS or Android device, you must configure it.

### For Android

1. Open Settings on your device.
2. Select About Phone > Build Number.
3. Tap the Build Number option 7 times.
4. Check Settings > System > Advanced > Developer Options and verify that the Developer Options setting is ON.
5. Turn on USB debugging in Settings > System > Advanced > Developer Options > USB debugging.
6. Connect the device to your computer using a USB cable.
7. Allow USB debugging on the device if you are prompted.
8. Open the app you want to debug on the device and then open the Chrome browser on your computer.
9. In Address box of the Chrome browser, type chrome://inspect/#devices.
10. When you see your app, click Inspect.

Note: There will be two inspect links for the same app. To inspect network requests, please use the inspect link which indicates 'Maximo Mobile Network/DB Inspector'. For all other purposes like inspecting DOM, Memory, Local and Session Storage use the other inspect link.

Alternatively to inspect Network Requests, you can also use Android Studio to watch network requests. For this, you will need Android Studio installed.
To inspect network requests here:
1. Open Android Studio
2. Go to View → Tool Windows → App Inspection
3. If your device emulator is running the app. The app inspection window will show the emulator and the inspectable apps. Select the device and the app you would like to inspect and go to network tab

#### Inspecting Database

An experimental feature was added to inspect the Maximo Mobile SQLite DB. This functionality is limited and support for this may drop in future. To inspect DB follow these steps:

- Open Chrome and in the address bar input chrome://inspect
- The page will display any inspectable applications if your device is connected and the application.
- For each app two inspectors will be displayed (MAIN INSPECTOR and AUX INSPECTOR) as shown in picture below.

![Inspector example](../images/inspector.png)

- AUX inspector is used to inspect network and databases while MAIN inspector is used for all other purposes
- To inspect SQLite DB, open the MAIN INSPECTOR by clicking the inspect link. Go to Console tab and execute:

```javascript
DevToolPlugin.addCredentials("sqlcipher_db_password")
```

- Go back to the inspectors page and open AUX INSPECTOR by clicking on its inspect link.
- Go to Applications tab and expand the WebSql section and use as displayed in the figure below

![SQL Inspector example](../images/sql.png)

### For iOS

1. Open Settings on your device.
2. Navigate to Safari > Advanced.
3. Turn on the Web Inspector.
4. Open the app and connect your iOS device to Apple computer.
5. From your computer, open Safari and click Develop.

> **Note**: If you don't see a Develop menu item, you must enable it. Navigate to Safari > Preferences > Advanced. Enable the Show develop on menu bar option at the bottom. Reconnect your iOS device.

6. Open the app on your mobile device. From your computer, in the Develop menu, hover over the app. Click the app name to open the browser Inspector tool. If you don't see the app, ensure that the app was built with a profile that contains your developer certificate.

## Using the Development Tools to Debug

Refer to either [Chrome's](https://developer.chrome.com/docs/devtools/overview) or [Safari's](https://support.apple.com/guide/safari-developer/welcome/mac) development tools documentation for more information.

## Enabling Source Maps on Graphite Applications

Code for default Graphite applications used by Maximo Mobile is minified by the build process which can complicate the debugging process. The code is optimized for runtime. It is not easy to read. Applications however can be rebuilt with source maps enabled.

> **Note**: Rebuilding the applications with source maps enabled increases the overall size of the application. Enable source maps if you need to debug an application. After you resolve your issue, rebuild the app with source maps disabled to decrease overhead.

> **Note**: For iOS/Safari users, if your app crashes after source maps are enabled, disable the source maps, and try debugging again without source maps.

### Setting Flags

To enable source mapping, set two flags before building and redeploying the application:

```
GRAPHITE_SOURCEMAP=inline-source-map
NODE_OPTIONS="--max_old_space_size=8192"
```

You can set these flags using the OS's environment variables or by using cross-env before the build command.

#### Using Environment Variables

##### On Windows:

Open a cmd window and enter the following commands before you start the build process.

```
SET GRAPHITE_SOURCEMAP=inline-source-map
SET NODE_OPTIONS="--max_old_space_size=8192"
```

##### On Linux/macOS:

Open a shell window and enter the following commands before you start the build process.

```
export GRAPHITE_SOURCEMAP=inline-source-map
export NODE_OPTIONS="--max_old_space_size=8192"
```

#### Using cross-env

Graphite supports the cross-env node module that you use to set flags as part of the build command. This method also allows you to avoid modifying environment variables.

1. Open the project folder of the app you want to debug and navigate to the inner app folder inside the packages folder. For navigator-app as an example:

```
navigator-app/applications/graphite/packages/navigator-app
```

2. Edit the packages.json file to include the build Maximo Mobile dev script command.

```
npx cross-env GRAPHITE_SOURCEMAP=inline-source-map NODE_OPTIONS=\"--max_old_space_size=8192\"
```

For navigator-app as an example:

```
"build:maximoMobile:all:dev": "npx cross-env GRAPHITE_SOURCEMAP=inline-source-map NODE_OPTIONS=\"--max_old_space_size=8192\" yarn build:production && npx maxdev-cli upload-app"
```

![Changed package.json navigator example](../images/navigator-build-mobiledev.png)

3. Run the build commands to generate and upload a new application zip file, which includes the source maps used during debug.

## Troubleshooting with Log Data

### Switch the Log Level for Developer

#### 1. app.xml

The developer can configure the attribute `default-log-level` to change the log level for the graphite application.

The enum log level:
- trace
- debug
- info
- warn
- error

Usage:
```javascript
<application id="containerApp" default-log-level="error" controller="AppController">
    <states id="states">
        <tstate name="state1" type="boolean" value="true" id="state1"/>
    </states>
</application>
```

#### 2. cordova-config.xml

The developer can configure the attribute `preference` to change the log level for CORDOVA application.

The enum log level:
- VERBOSE
- DEBUG
- INFO
- WARN
- ERROR

Usage (iOS, Android, Windows):
```javascript
<preference name="LogLevel" value="ERROR" />
```

#### 3. Environment variable: CI

When user build the graphite application:
- If the environment variable(process.env.CI) is configured with `true`, the `default-log-level` of graphite application will be set to error
- If the environment variable(process.env.CI) is configured with `false`, the `default-log-level` of graphite application will not be updated

### Switch the Log Level for End User

#### 1. Enable the Debug Mode with UI

The users can enable/disable the debug log mode with UI.

![Enable debug](../images/enable-debug.png)

#### 2. Download the Log Data with Text File

The users can send the log file to other device by the supporting application, for example: mail, bluetooth, message etc.

![Download log](../images/download-log.png)

#### 3. View the App Log of Browser by the `inspect` Mode

The users can view the log by the developer tools of Explorer:

a. Enable the view log mode:

![View log](../images/view-log.png)

b. View the log content:

![View log content](../images/view-log-content.png)

#### 4. View the App Log of Mobile Device (iOS, Android) by the Browser

The users can view the mobile log by the `chrome://inspect` of Chrome:

a. Input the `chrome://inspect` in the address bar of Chrome:

![Enable inspect](../images/enable-inspect.png)

b. Connect the emulator or mobile, select the correct device with UI:

![Enable debug on device](../images/enable-debug-device.png)

c. View the log content:

![View log content on device](../images/view-log-content-device.png)

#### 5. View the App Log of Mobile Device (Windows)

The users can view the Windows device log by the debug mode:

a. Open the app on the Windows device, and right click on the app, select the 'inspect' to view the log:

![Enable debug on Windows device](../images/enable-debug-device-windows.png)

b. View the log content:

![View log content on Windows device](../images/view-log-content-device-windows.png)

## Maximo Mobile Master Schema Troubleshooting

If there is an error while generating the master schema, the process is not interrupted. Apps and object structures with errors are skipped and the generation process continues. Error information is appended to the generated schema.

To validate the schema after an app build or while investigating an issue, the active schema can be obtained through the browser.

```
<protocol>://<server>:<port>/maximo/oslc/graphite/mobile/schema
```

After the master schema is retrieved, you can search for a section labeled Errors. This section will contain consolidated errors that occurred during the schema build.

![Errors example](../images/errors_example.png)

## Helpful Links During Debugging/Troubleshooting

Here are some links you may find helpful while troubleshooting applications running in Maximo Mobile:

- [Transaction Errors](./transactions.md#transaction-errors)
- [Master Schema Troubleshooting](./supporting-data.md#master-schema-trouble-shooting)
- [Supporting Data](./supporting-data.md)