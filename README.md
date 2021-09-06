[![PlentyDevToolLogo](https://cdnmp.plentymarkets.com/8501/meta/images/icon_plugin_xs.png)](https://angular.io/)

# plentyDevTool

## Installation

1. Clone the repository.
2. Check out the `main` branch.
3. Open the command line.
4. Run `npm i` to install the node modules.
5. Run `npm start` to start the application.

For configuration details and the functionality of the app, refer to the docs.

## Code structure

plentyDevTool uses Angular as its UI framework. The related components are located in the `src/app` folder. These components follow the basic structure of an Angular project. The most important ones are the following:
* `app.module.ts` - contains all the imported components
* `app-routing.module.ts` - contains the routes
* `components` directory - contains the different views
* `providers` directory - contains the services, interfaces and enums

The `src/sync-worker` directory contains all functions responsible for file synchronisation.

The main file `main.ts` contains the functions for creating, starting and updating the application.

## Code functionality

The application uses [https://www.electronjs.org/](ElectronJS) to transform a web application into a desktop application. Using the `ipcRenderer` module from Electron, you can send asynchronous or synchronous messages to the main process or to a specified window. This includes the three functions `send`, `sendSync` and `sendTo`. You can learn more about them in the Electron documentation: https://www.electronjs.org/docs/api/ipc-renderer.

The `providers` directory contains the `ElectronService`. This service defines the two functions used for sending messages:
* `sendToMain(channel, payload?)`
* `sendToSyncWorker(channel, payload?)`

Most of the messages sent from Angular trigger the second method.

### Example 1: User actions

If a user does not have modified files, they're not able to execute a **Push** action, so the button is disabled. However, there's also a shortcut for the **Push** action. To make sure the user can only trigger a **Push** when there are modified files, the shortcut has to be disabled as well.

The shortcuts are defined in the `main.ts` file. The application can access `main.ts` by sending a message through `ipcRenderer.sendToMain()`.

```
this.electronService.sendToMain(
    state ? EVENTS.menu.enable : EVENTS.menu.disable,
    MENU_ITEMS.actions.push
 );
```

After the message is received, a function is called in `main.ts`. This function uses the `ipcMain` module from Electron and the `.on()` method to subscribe to the response. Depending on the response, the action gets either enabled or disabled.

`ipcMain.on(EVENTS.menu.enable, (event, menuItemId) => toggleMenuItem(menuItemId, true));`

`ipcMain.on(EVENTS.menu.disable, (event, menuItemId) => toggleMenuItem(menuItemId, false));`

### Example 2: Synchronisation

To initialise and synchronise the selected plugins, a message is sent through `ipcRenderer.sendTo()`. plentyDevTool extends this functionality by first calling the `sendToSyncWorker` method in `ElectronService`. This method implements checks before starting the initialisation and synchronisation process.

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

Two very important files are `syncer.ts` and `watcher.ts`. The messages are emitted using `ElectronService` and subscribed to in the syncer. In the constructor, we subscribe to the following events:
1. Initialisation - initialises the selected plugins
2. Pulling - pulls the selected plugins
3. Pushing - pushes the changes
4. Installing - installs the chosen plugins
5. Stopping - stops the synchronisation

The watcher will start after the initialisation is done or before the first job from the queue. The connection to the watcher is made by calling the following functions:
* `start()` - initialises the watcher
* `stop()` - closes the watcher
* `getChanges()` - gets the changes

After initialising the watcher, the `start()` method subscribes to the methods listed below. `onWatcherAdd`, `onWatcherChange` and `onWatcherUnlink` all check that `localPath` should be synchronised before proceeding.

* `onWatcherAdd()` - checks if there are any new files and pushes them into an array
* `onWatcherChange()` - checks if there are any modified files and pushes them into an array
* `onWatcherUnlink()` - checks if there are any deleted files and pushes them into an array

Finally, there's `onWatcherReady`. This method implements the following functionality:

* checks if there are any differences between the current files and all the entries from the database and pushes them into an array
* emits a message which contains the changes
* if the user click on **Detect new plugins**, emits a message which contains the plugins that can be installed

## Logging

### Write Logs

* Main process:
  
    import * as log from 'electron-log';
  
    log.info('Hello World', value1, value2, ...);

* Angular App:
  
    LogService.info('Hello World', value1, value2, ...);

### Loglevel

1. error
2. warn
3. info (information you want to see every time, for example: JobQueue is empty)
4. debug (information you *DON'T* want to see every time, for example: Writing a key to the localstorage)

### Read Logs

Logs will be displayed in the terminal and in the DevTools (DevTools do not include some entries from the start of the application).

Logs will also be written to the following files:

* **on Linux:** `~/.config/<app name>/log.log`
* **on macOS:** `~/Library/Logs/<app name>/log.log`
* **on Windows:** `%USERPROFILE%\AppData\Roaming\<app name>\log.log`

## You want to use a specific lib (like rxjs) in electron main thread?

You can do this! Just by importing your library in npm dependencies (not devDependencies) with `npm install --save`. It will be loaded by electron during build phase and added to the final package. Then use your library by importing it in `main.ts` file.

