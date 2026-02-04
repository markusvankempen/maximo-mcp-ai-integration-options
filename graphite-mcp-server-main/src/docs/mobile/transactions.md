# Maximo Mobile Transactions

## Transaction Flow

Transactions are handled by the Maximo Mobile layer. It saves transaction data to the local database and syncs it up with the server when a connection to the server is available. Below is a brief overview of how a transaction flows through the app.

![Transaction Flow](../images/transaction-flow.png)

From the diagram above, we can see that once a transaction is saved to the local database, the response is immediately returned to the caller (app code). App developers should note this particular behavior since the transaction system will not wait for the transaction to be synced to the server before returning. For app code that cannot proceed without an actual response from the server, the transaction system provides events which an app can listen to.

## Transaction Objects

Before delving into events, it's helpful to understand the kind of data the transaction system returns. This will help the consuming code (app code) to extract required information from the response or the event. The transaction system can return or emit three kinds of objects:

1. **Transaction**
2. **TxStatus**
3. **FlushStatus**

![Return Objects](../images/return-objects.png)

## Listening to Transaction Events

The transaction system sends out various events:

### TX_DB_SAVED Event

This event is emitted when the transaction system is done updating the corresponding record and saving the record to its respective database collection. Subscribers/app code listening to this event will receive the Transaction object.

> Note: At this stage the transaction system will return a response to the datasource save caller. For any further updates from the transaction system, the app will have to listen to events emitted by the transaction system.

Usage:

```javascript
this.app.client.txManager.txExecutor.on('TX_DB_SAVED', txStatus => {
  log.i(txStatus.tx.recordHref)
})
```

### TX_UPLOAD Event

This event is emitted when the transaction system starts/finishes uploading the transaction to server. Subscribers/app code listening to this event will receive the TransactionStatus object.

Usage:

```javascript
this.app.client.txManager.txExecutor.on('TX_UPLOAD', txStatus => {
  log.i(txStatus.tx.recordHref);
  log.i(txStatus.tx.eventType);
})
```

The eventType attributes indicates the type of event:

| Event type | Description |
|------------|-------------|
| TX_UPLOAD_START | Transaction upload was started |
| TX_UPLOAD_COMPLETE | Transaction upload was completed |

### TX_FLUSH_COMPLETE Event

This event is emitted when the transaction system is done flushing all pending transactions to server. Subscribers/app code listening to this event will receive the FlushStatus object.

> Note: Be careful depending on this event. A flush can be triggered by many sources viz. device going offline to online, network timeout retries, user initiated etc. A subscriber listening to this event can receive an event triggered by any of these sources.

Usage:

```javascript
this.app.client.txManager.txExecutor.on('TX_FLUSH_COMPLETE', flushStatus => {
  log.i("Total transactions flushed: " + flushStatus.txStatusObj.length)
})
```

## Transaction Errors

The transaction system will return an error if a transaction was not uploaded successfully or if there is an error from the server. An error in the transaction system can be classified as 'SOFT' and 'FATAL' errors. Fatal errors are usually not expected. This will happen only in extreme edge cases viz. database corruption etc. The user should not be allowed to continue if such an error occurs.

Following errors can be returned in a TxStatus `error` attribute:

```json
BUSINESS_ERROR: {
  code: '15-3-10',
  message: 'Business Errors found',
  type: 'SOFT'
},
CONFLICT_ERRORTX: {
  code: '15-3-11',
  message: 'Conflict with an existing erred transaction',
  type: 'SOFT'
},
STAGING_TX_FAIL: {
  code: '10-1-11',
  message: 'Critical Error. Transaction could not be saved to staging queue',
  type: 'FATAL'
},
STAGING_TX_REMOVE_FAIL: {
  code: '10-1-12',
  message: 'Critical Error. Transaction could not be removed from staging queue',
  type: 'FATAL'
},
UPLOAD_DB_TX_FAIL: {
  code: '10-1-13',
  message: 'Critical Error. Transaction could not be saved to Upload queue',
  type: 'FATAL'
},
UPLOAD_DB_TX_REMOVE_FAIL: {
  code: '10-1-14',
  message: 'Critical Error. Transaction could not be removed from Upload queue',
  type: 'FATAL'
},
UPLOAD_FAILED_TIMEOUT: {
  code: '15-1-2',
  message: 'Transaction could not be uploaded due to network timeout. Scheduled for upload on next flush cycle',
  type: 'SOFT'
},
OFFLINE_CANNOT_UPLOAD: {
  code: '15-1-1',
  message: 'Transaction could not be uploaded since device is offline. Scheduled for upload on next flush cycle',
  type: 'SOFT'
},
UPLOAD_QUEUE_EMPTY: {
  code: '15-1-3',
  message: 'Upload queue empty.Nothing to flush',
  type: 'INFO'
},
FLUSH_REQUESTED: {
  code: '15-1-4',
  message: 'Flush requested',
  type: 'INFO'
},
UPLOAD_ATTACHMENT_FAILED: {
  code: '17-1-2',
  message: 'Upload attachment fail',
  type: 'FATAL'
}
```

## Local Transactions

Local Transactions are transactions that will not be synced up with server. However, they will be associated to a server transaction.

The purpose of local transactions is to create local transactions that are associated with a server transaction. This means that if the server transaction were to fail and the user performs an undo on it; the local transactions will also be undone.

Below is an example of how to create local transaction in an app:

1. Get the unique id using the `getUndoGroupID` api:

```javascript
let id = this.app.client.txManager.getUndoGroupID();
```

2. Pass this id to all datasource item changes starting with the changes intended for the server:

```javascript
//after changing data on workorder ds
await woEditResource.update(dataToUpdate, {undoGroupID: id});
```

3. The first pass should be the transaction meant for server. Only after that can local transaction can follow:

```javascript
//after changing data on inspection ds
await inspectionDS.update(dataToUpdate, {undoGroupID: id});
```

So in the case above workorder will go to the server and inspection change will be local. If workorder were to error and user reverts it, Inspection will also be reverted.

### Notes:

1. The group id is valid only for the current app session. This means the group id cannot be stored for later use across app restarts.
2. Always wait for the first server transaction using an await and verify it does not have a system/validation app error. If it has an error do not make the local changes. As long as datasource apis comes back successful, local changes can be saved.
3. The first change to go with a group id will be treated as server transaction. All the other transaction with the same group id will be linked and treated as local transaction.

## Exporting/Encrypting Database

The DisconnectedCollection api in the maximomobile library allows you to export/encrypt an external db.

The exportAsExternal function allows you to export contents of a db say `mydb1` to another db say `mydb2`.

A common use case of this api is to encrypt a downloaded db file:

```javascript
const DisconnectedDB = maximomobile.DisconnectedCollection;
DisconnectedDB.externalDBs(credentials)
    .exportAsExternal(
        dbName,
        dbLocation,
        attachOnInit,
        deleteAfteExport,
        externalDBName
    )
```

- **dbName**: string - Name of the downloaded db (i.e `mydb1`)
- **dbLocation**: string - Root folder where the database is located. If you have used the AssetDownloaded api to download the db, then it will provide you with this info.
- **attachOnInit**: boolean - Default value is false. If this parameter is true, the database will be attached to the main db on app startup
- **deleteAfteExport**: boolean - Default value is true. If this parameter is false, the api will not cleanup the downloaded file from storage (i.e mydb1)
- **externalDBName**: string - If a value is passed, the api will use this name to name the file where contents will be copied over (i.e mydb2). If you pass in mydb3, the api will name the file mydb3 instead of mydb2
- **credentials**: object - {username: 'uname', password: 'pwd'} - object which contains the credentials (i.e uname and pwd). If this is passed, all contents of mydb2 will be encrypted with password `pwd` including contents of mydb1 that were copied over to mydb2 by the export api.

> Note: The temporary disk space requirement to use this api is double the size of the original database you want to export (i.e if mydb1 has size of 1GB, the export api will require that device have a disk space of 2GB available temporarily during export)

## Supporting Transaction Error Handling

When a transaction has an error, it will be displayed at the Navigator error section.

After clicking at the error icon, the error screen will be displayed.

When a user opens this screen and clicks on the arrow icon to edit a record with an error, some configuration may be required at the loadApp method in the ErrorController class of the Maximo Mobile navigator.

This method receives the current errored transaction as an argument and handles the logic to navigate to the appropriate application for editing the record.

## Saving Data at Maximo Mobile

Saving in Maximo Mobile acts differently than the web version of the application. When a record is added/edited in Maximo Mobile, the data is not directly sent to the Maximo server. Instead, it creates an offline transaction that will be sent to the server when the platform determines it is the appropriate time (when connection with Maximo server is available).

For this reason, the record does not get business rules applied right after its creation, since the Maximo workflow will be applied to the data when it reaches the Maximo server. Since the data is not validated right after its creation/addition, an error may occur when it is sent to Maximo. In case of error, the record with error will be displayed in the Maximo Mobile navigator in the transaction section.

> Note: As best practice, applications running on Maximo Mobile should validate data as much as possible to avoid errors when data is sent to Maximo.