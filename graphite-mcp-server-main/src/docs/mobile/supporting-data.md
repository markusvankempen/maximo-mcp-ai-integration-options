# Supporting Data (Lookup Data)

Supporting data, also referred to as lookup data, is supplementary data used by apps. Supporting data is separate from the transactional data that is primarily processed by apps. Supporting data is referenced by transactional data during app use.

As an example, an app can use data from the MXAPIWODETAIL object structure as transactional data. This transactional data can then load supporting data from MXAPIASSET and MXAPIOPERLOC.

## Defining a Datasource as Supporting Data

To designate a datasource as supporting data, edit your app's app.xml file, add the property lookup-data to the datasource, and then set the property to true.

Define the mxapisynonymdomain object structure as supporting data:

```xml
<maximo-datasource id="synonymdomainData" object-structure="mxapisynonymdomain" saved-query="MOBILEDOMAIN" selection-mode="single" lookup-data="true">
  <schema id="schemaId">
    <attribute name="value" searchable="true" id="attributeValue"/>
    <attribute name="maxvalue" searchable="true" id="attributeMaxValue"/>
    <attribute name="description" searchable="true" id="attributeDescription"/>
    <attribute name="domainid" searchable="true" id="attributeDomainId"/>
    <attribute name="valueid" unique-id="true" searchable="true" id="attributeValueId"/>
    <attribute name="siteid" searchable="true" id="attributeSiteId"/>
    <attribute name="orgid" searchable="true" id="attributeOrgId"/>
    <attribute name="defaults" id="attributeDefaults"/>
  </schema>
</maximo-datasource>
```

> **Important**: There is a limitation on sharing supporting data between apps. Datasources used by more than one app must be defined using the same object structures and queries for all the apps. Failing to do this can cause errors, including unexpected or missing data.

## Supporting Data Download

Maximo Mobile loads supporting data from the server before an app is used for the first time. Supporting data is stored locally in an SQLITE database for offline use. Supporting data is loaded by the application using the pre-loaded database or through the page by page method.

> **Note**: Regardless of method, supporting data loads only once. Supporting data load occurs during the initial onboarding process for the Maximo Mobile app. Any subsequent access of supporting data does not trigger another download. If you want to refresh supporting data, you must refresh it manually.

### Pre-loaded DB

A server side crontask generates an SQLITE database of supporting data. This database is populated with supporting data that is accessible by a group of users. This database is compressed and made available for users when they are onboarding or when they refresh their data on their mobile device. The majority of the data gathering effort occurs on the Maximo server. The Maximo Mobile app simply downloads, uncompresses, and encrypts the database on the device. This method is more efficient than the alternative page by page method which processes data requests on demand.

### Page by Page

The page by page method of loading supporting data involves requesting data from the Maximo server for each app page and each supporting datasource that was not previously loaded. This method is slower than the pre-loaded database method.

During the onboarding process, supporting data is loaded in one of two ways:

1. By default, any datasources marked as supporting data are downloaded by the navigator-app after compressed files are downloaded. The user cannot access the app or any navigator tiles until all files are successfully downloaded.

2. Supporting data that is labeled with the offline-immediate-download property set to false is not loaded until after the app is initialized for the first time.

Define the mxapisynonymdomain object structure with the added property:

```xml
<maximo-datasource id="synonymdomainData" object-structure="mxapisynonymdomain" saved-query="MOBILEDOMAIN" selection-mode="single" lookup-data="true" offline-immediate-download="false">
  <schema id="schemaId">
    <attribute name="value" searchable="true" id="attributeValue"/>
    <attribute name="maxvalue" searchable="true" id="attributeMaxValue"/>
    <attribute name="description" searchable="true" id="attributeDescription"/>
    <attribute name="domainid" searchable="true" id="attributeDomainId"/>
    <attribute name="valueid" unique-id="true" searchable="true" id="attributeValueId"/>
    <attribute name="siteid" searchable="true" id="attributeSiteId"/>
    <attribute name="orgid" searchable="true" id="attributeOrgId"/>
    <attribute name="defaults" id="attributeDefaults"/>
  </schema>
</maximo-datasource>
```

> **Note**: For datasources marked as lookup-data="true", marking them as offline-immediate-download="true" or omitting the property altogether leads to the same behavior. The data will be downloaded from the Navigator before the app's tiles are enabled.

> **Important**: The app is fully initialized and usable after supporting data marked as offline-immediate-download="false" is loaded. A loading icon inside a grey screen is displayed during initialization. Avoid marking unnecessary or large sets of supporting data with this property to avoid creating usability issues.

## Supporting Data Refresh

Previously downloaded supporting data can be refreshed through the Navigator. The app provides two refresh methods: Delta refresh or Full reload.

To refresh the data, complete the following steps:

1. From the Navigator, open the app menu:
   ![Navigator main menu](../images/navigator_9dot.png)

2. Inside the Settings page, click Data update. Click "Get latest data" to start a delta refresh or "Update all data" to do a reload all data:
   ![Navigator settings data update screen](../images/navigator_settings.png)

### Full Reload

A full reload refreshes the full dataset of current supporting data by downloading all supporting data. Similar to the onboarding process, the Navigator checks to see if a pre-loaded database is available. If no preloaded database is available, the download occurs using the page by page method. This process ignores the offline-immediate-download flag and updates all new and changed datasources from the Navigator). If a pre-loaded database is available, the preloaded database is downloaded. After the preloaded database download is complete, a delta refresh is performed, updating any records that were created or modified since this preloaded database was generated.

### Delta Refresh

Delta refresh updates supporting data records that were created or modified since the last data load. The entire dataset is not downloaded. This process is similar to the page by page download method. The offline-immediate-download flag is ignored and a delta update of all datasources is initiated from the Navigator.

The delta refresh method relies on the rowstamp and maxrowstamp fields. Every Maximo database record includes a field called rowstamp. The rowstamp field is updated when a record is inserted or updated. When the supporting data is downloaded, the Maximo server returns a maxrowstamp field as part of the response headers. These items are stored inside the Maximo Mobile's SQLITE database in the METRICS table. For the preloaded database process, the database is generated with the METRICS table populated with this field.

![Maxrowstamp returned as part of header](../images/network_maxrowstamp.png)

This maxrowstamp field indicates the latest updated record for that object structure. To initiate a delta refresh, Maximo Mobile retrieves the maxrowstamp value that is stored in the database and includes it as part of the request to the server. The value is passed as part of the query parameter under the parameter name lastfetchts.

Request for the mxapisynonymdomain object structure:

```
<protocol>://<server>:<port>/maximo/oslc/os/mxapisynonymdomain?interactive=1&lean=1&relativeuri=1&internalvalues=1&fetchmodedelta=1&lastfetchts=<maxrowstamp>
```

> **Note**: The parameter fetchmodedelta=1 must be enabled to allow delta related operations during the fetch request. Operations like the maxrowstamp header to be returned from or the lastfetchts parameter to be considered during the server's data fetch.

The server will return new or modified records for the dataset. Maximo Mobile downloads and stores its own record on the local database. If no data was changed, the server will not return that dataset and Maximo Mobile will continue to the next dataset.

> **Important**: There is a limitation to the delta method. Some supporting data objects have child objects. For example, ASSETS can have LOCATIONS associated with them. However, the delta process checks the maxrowstamp of the parent object only. It does not check child objects. The Maximo server does not update the maxrowstamp field of the parent object if the child object is updated. In this scenario, the delta process will not download any data, even though there were changes to the child object.

## Image Library

Starting at 9.1, Maximo Mobile was redesigned to consume images as a stream instead of retrieving record images during the data download process. This means that images associated with records like assets or locations will be downloaded apart from the other data and will be executed at the end of the onboarding process.

### System Properties

There are new system properties that were introduced to control the resize of the images and their inclusion in lookup data:

| Property Name | Property Value |
|---------------|---------------|
| maximo.mobile.imglib.disableImagesFromLookup | Define if no image should be added to the lookup data. By default its value is 0 and images will be added to lookup data. |
| maximo.mobile.imglib.resizeatserver | Define if image library for transactional data should be resized when consumed by Maximo Mobile. If this property value is set to 1, images will be resized before being returned to the mobile devices if not resized yet. The dimension will be the value of the two next properties. The process will consider aspect ratio to avoid image distortion. By default images are not resized. |
| maximo.mobile.imglib.resize.height | Define the height for image library resize. Default value is 400px. If value is 0 the image will not be resized. |
| maximo.mobile.imglib.resize.width | Define the width for image library resize. Default value is 400px. If value is 0 the image will not be resized. |

### Cron Task

A new cron task called "MobileImgLibGeneration" is in charge of retrieving the image from imglib table and resizing them based on the system properties defined above. The cron task has two parameters:

| Property Name | Property Value |
|---------------|---------------|
| ThreadCount | Number of threads to be used for images resize process, the default value is 1. |
| WhereClauseCond | Filter for images to be resized allowing usage of conditional expression to filter images that will be resized. |

### Images Retrieval

During the data download, Maximo Mobile collects the images that need to be downloaded based on the data retrieved and stores it in a queue. After all data has been downloaded, the images download starts. It gets 100 images at a time from the queue and asks for them from the new stream API. The stream API returns one image at a time and mobile also processes one image at a time. The images download first downloads transactional data then downloads lookup data.

![Images Download Flow](../images/imglib-stream-flow-Download-images-Flow.jpg)