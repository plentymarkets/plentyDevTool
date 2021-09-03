[![PlentyDevToolLogo](https://cdnmp.plentymarkets.com/8501/meta/images/icon_plugin_xs.png)](https://angular.io/)

# plentyDevTool

## Logging

#### Write Logs

* Main process:
  
    import * as log from 'electron-log';
  
    log.info('Hello World', value1, value2, ...);

* Angular App:
  
    LogService.info('Hello World', value1, value2, ...);

#### Loglevel

1. error (self explaining)
2. warn (self explaining)
3. info (information you want to see every time. Example: JobQueue is empty)
4. debug (information you **DONT** want to see every time. Example: Writing a key to the localstorage)

#### Read Logs

Logs will be displayed in the terminal and in the DevTools (DevTools do not include some entries from the start of the application).

Logs will also be written to the following files:

* **on Linux:** `~/.config/<app name>/log.log`
* **on macOS:** `~/Library/Logs/<app name>/log.log`
* **on Windows:** `%USERPROFILE%\AppData\Roaming\<app name>\log.log`

## Installation

1. Clone the repository and check out
2. Run `npm i`
3. Start application: `npm start`

## Configuration

1. Log in
2. Select local folder for synchronisation
3. Select plugins for synchronisation

## Requirements for auto deploy

- Turn on auto deploy by activating the toggle in the plugin overview
- The plugin must have been built successfully at least once before it can be deployed automatically

## You want to use a specific lib (like rxjs) in electron main thread ?

You can do this! Just by importing your library in npm dependencies (not devDependencies) with `npm install --save`. It will be loaded by electron during build phase and added to the final package. Then use your library by importing it in `main.ts` file. Easy no ?

## Code structure

The components related to the UI part, where Angular is used as a framework, are located under `src/app`. These have a basic structure for an Angular project and the most important of them are the following:
* `app.module.ts` - contain all the imported components
* `app-routing.module.ts` - contain the routes
* `components` directory
* `providers` directory - contains the services, interfaces and enums

Under `src/sync-worker` directory you can find the functions responsible for file synchronization.

The main file `main.ts` contains functions for creating, starting and updating the application.

## Code functionality
The application is using “Electron” and transforms a web application into a desktop application. Using the `IpcRenderer` from Electron you can send asynchronous or synchronous messages to the main process or to a specified window. There are 3 functions used for this(send, sendSync and sendTo) which can be found at the following link: https://www.electronjs.org/docs/api/ipc-renderer.

Under `providers` directory you can find the ElectronService which has 2 functions used for sending messages:
* sendToMain(channel, payload?)
* sendToSyncWorker(channel, payload?)

Most of the messages sent from Angular triggers the second method.

### Examples:
* If a user does not have modified files, he is not able to do a “Push” action so the button is disabled. But he has another option to do an action, by using a shortcut. The shortcuts are defined in the `main.ts` file which can be accessed by sending a message thru `ipcRenderer.sendToMain()`.

```
this.electronService.sendToMain(
    state ? EVENTS.menu.enable : EVENTS.menu.disable,
    MENU_ITEMS.actions.push
 );
```

After the message is received, a function is called in `main.ts` file. `IpcMain` is imported from Electron and the method `.on()` is used to subscribe to the response.

`ipcMain.on(EVENTS.menu.enable, (event, menuItemId) => toggleMenuItem(menuItemId, true));`

`ipcMain.on(EVENTS.menu.disable, (event, menuItemId) => toggleMenuItem(menuItemId, false));`

* To initialize and synchronize the selected plugins, a message is sent thru `ipcRenderer.sendTo()`, but first calling the function from ElectronService.

```
this.electronService.sendToSyncWorker(EVENTS.syncer.init, options);

-> this.ipcRenderer.sendTo(this.syncWorkerWebContentsId, channel, payload);
```

In the `syncer.ts` file, the method `ipcRenderer.on()` is called and used to subscribe to the response.
```
ipcRenderer.on(EVENTS.syncer.init, 
      (event, options: SyncerOptionsInterface) => {
          log.debug('initEvents');
          …
          this.init(options);
      }
);
```

Two very important files are `syncer.ts` and  `watcher.ts`. The messages are emitted using ElectronService and subscribed in the Syncer. In the constructor, we subscribe to the following events:
1. Initialization - initialize the selected plugins
2. Pulling - pull the selected plugins
3. Pushing - push the changes
4. Installing - install the chosen plugins
5. Stopping - stop the synchronization

The watcher will start after the initialization is done or before the first job from the queue. The connection to the Watcher is made by calling the following functions:
* start() - initialize the watcher and the subscriptions to:
    * onWatcherAdd() 
        * check if the localPath should be synchronized and check if there are any new or modified files and push them into an array
    * onWatcherChange()
        * check if the localPath should be synchronized and check if there are any modified files and push them into an array
    * onWatcherUnlink()
        * check if the localPath should be synchronized and check if there are any deleted files and push them into an array
    * onWatcherReady()
        * check if there are any differences between the current files and all the entries from database and push them into an array
        * emit a message which contains the changes
        * emit a message which contains new plugins which can be installed (only if the option `Detect new plugins` is selected)
* stop() - close the watcher
* getChanges() - get the changes
