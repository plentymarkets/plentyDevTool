import {
    app,
    BrowserWindow,
    dialog,
    ipcMain,
    Menu,
    MenuItemConstructorOptions,
    screen,
    shell
} from 'electron';
require('@electron/remote/main').initialize();
import * as path from 'path';
import * as url from 'url';
import {EVENTS, MENU_ITEMS} from './src/constants';
import {autoUpdater, UpdateInfo} from 'electron-updater';
import * as log from 'electron-log';

autoUpdater.logger = log;
log.info('App starting...');

let userInterface: BrowserWindow, syncWorker: BrowserWindow, serve: boolean;
let currentTimestamp: number;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');
// @ts-ignore
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

function checkForUpdates() {
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
        const messageBoxOptions = {
            type: 'question',
            buttons: ['Yes, please', 'No'],
            defaultId: 0,
            title: 'Update available!',
            message: `Install version ${info.version} now?`,
            detail: 'If you select "No", the update will be installed at the next start.'
        };

        dialog.showMessageBox(userInterface, messageBoxOptions).then((data: Electron.MessageBoxReturnValue) => {
            if (data.response === 0) {
                /**
                 * setImmediate executes this at the next iteration of the node event loop
                 * this a necessary workaround to close the window on macOS
                 */
                setImmediate(() => {
                    app.removeAllListeners('window-all-closed');
                    BrowserWindow.getAllWindows().forEach(function (browserWindow) {
                        browserWindow.removeAllListeners('close');
                    });
                    if (userInterface) {
                        userInterface.close();
                    }
                    autoUpdater.quitAndInstall();
                });
            }
        });
    });
    // noinspection JSIgnoredPromiseFromCall
    autoUpdater.checkForUpdates();
}

function createMenu() {
    const applicationSubmenu: Array<MenuItemConstructorOptions> = [
        {
            label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => {
                app.quit();
            }
        }
    ];

    const template = [{
        label: 'Application',
        submenu: applicationSubmenu
    },
    {
        label: 'Edit',
        submenu: [
            {label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:'},
            {label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:'},
            {label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:'},
            {label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:'},
            {label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:'},
        ]
    },
    {
        id: MENU_ITEMS.actions.all,
        label: 'Actions',
        submenu: [
            {
                id: MENU_ITEMS.actions.pull,
                enabled: false,
                label: 'Pull',
                accelerator: 'CommandOrControl+P',
                click() {
                    userInterface.webContents.send(EVENTS.menu.pull);
                }
            },
            {
                id: MENU_ITEMS.actions.push,
                enabled: false,
                label: 'Push',
                accelerator: 'CommandOrControl+U',
                click() {
                    userInterface.webContents.send(EVENTS.menu.push);
                }
            },
            {
                id: MENU_ITEMS.actions.detect,
                enabled: false,
                label: 'Detect new Plugins',
                accelerator: 'CommandOrControl+D',
                click() {
                    userInterface.webContents.send(EVENTS.menu.detect);
                }
            },
        ]
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'Forum', click: () => {
                    // noinspection JSIgnoredPromiseFromCall
                    shell.openExternal('https://forum.plentymarkets.com/c/plugin-entwicklung/plentydevtool');
                }
            }
            /**,{
                    label: 'License', click: () => {
                        shell.openExternal('https://www.plentymarkets.eu/');
                    }
                }*/
        ]
    }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function toggleAllMenuActions(menuItemId: string, state: boolean) {
    const mainMenuItem = Menu.getApplicationMenu().getMenuItemById(menuItemId)

    if (mainMenuItem && mainMenuItem.submenu && mainMenuItem.submenu.items) {
        mainMenuItem.submenu.items.forEach(menuItem => {
            menuItem.enabled = state;
        })
    }
}

function toggleMenuItem(menuItemId: string, state: boolean) {
    const menuItem = Menu.getApplicationMenu().getMenuItemById(menuItemId)

    if (menuItem) {
        menuItem.enabled = state;
    }
}

function createUserInterface() {
    const size = screen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    userInterface = new BrowserWindow({
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
        webPreferences: {
            backgroundThrottling: false,
            webSecurity: false,
            devTools: !!serve,
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    require('@electron/remote/main').enable(userInterface.webContents);

    if (serve) {
        require('electron-reload')(__dirname, {
            electron: require(`${__dirname}/node_modules/electron`)
        });
        // noinspection JSIgnoredPromiseFromCall
        userInterface.loadURL('http://localhost:4200');
        userInterface.webContents.openDevTools();
    } else {
        // noinspection JSIgnoredPromiseFromCall
        userInterface.loadURL(url.format({
            pathname: path.join(__dirname, 'dist/index.html'),
            protocol: 'file:',
            slashes: true
        }));
    }

    userInterface.on('closed', () => {
        userInterface = null;
        if (syncWorker) {
            syncWorker.close();
            syncWorker = null;
        }
    });
}

function createSyncWorker() {
    syncWorker = new BrowserWindow({
        show: serve,
        webPreferences: {
            nodeIntegration: true,
            backgroundThrottling: false,
            devTools: serve,
            contextIsolation: false,
        }
    });
    require('@electron/remote/main').enable(syncWorker.webContents);
    // noinspection JSIgnoredPromiseFromCall
    syncWorker.loadURL(url.format({
        pathname: path.join(__dirname, 'src', 'sync-worker.html'),
        protocol: 'file:',
        slashes: true
    }));
    if (serve) {
        syncWorker.webContents.openDevTools();
    }
}

function startApplication() {
    createSyncWorker();
    setTimeout(() => {
        createUserInterface();
        createMenu();
        checkForUpdates();
    }, 1000);
}

ipcMain.on(EVENTS.logMain, (event, msg) => console.log(msg));
ipcMain.on(EVENTS.getSyncWorkerWebContentsId, (event) => event.returnValue = syncWorker.webContents.id);
ipcMain.on(EVENTS.watcher.currentTimestamp, (event) => event.returnValue = currentTimestamp);
ipcMain.on(EVENTS.watcher.newTimestamp, (event, timestamp) => currentTimestamp = timestamp);

ipcMain.on(EVENTS.menu.enable, (event, menuItemId) => toggleMenuItem(menuItemId, true));
ipcMain.on(EVENTS.menu.disable, (event, menuItemId) => toggleMenuItem(menuItemId, false));
ipcMain.on(EVENTS.menu.toggleAllActions, (event, state) => toggleAllMenuActions(MENU_ITEMS.actions.all, state));

try {
    if (app.requestSingleInstanceLock()) {
        app.on('ready', startApplication);
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });
        app.on('activate', () => {
            if (userInterface === null) {
                startApplication();
            }
        });
        app.on('second-instance', () => {
            if (userInterface) {
                if (userInterface.isMinimized()) {
                    userInterface.restore();
                }
                userInterface.focus();
            }
        });
    } else {
        app.quit();
    }
} catch (e) {
    // Catch Error
    // throw e;
}
