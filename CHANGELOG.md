## 1.4.0
### New
* Updated Angular to version 12. The update improves security and stability.

### Fixed
* When detecting new local plugins, plentyDevTool didn't detect any plugins when no plugin was selected for synchronisation. This issue has been resolved.
* When deleting plugin files from the local system and pulling the plugin again, the deleted files are restored. This only applies to files present in the plentymarkets system.
* Diacritics are now accurately recognised as forbidden characters.

## 1.3.2
### Fixed
* The login now also works for own cloud systems with an ID of 9 or less.

## 1.3.1
### Fixed
* The login prompt the system displays after a session has timed out gets no longer caught in an infinite loop.

## 1.3.0
### New
* Local file processing is now queued when opening the app and when toggling plugins on or off. This means it's now possible to toggle plugins without plentyDevTool locking the entire UI for file processing.

### Fixed
* When the session has expired, plentyDevTool no longer becomes unresponsive after performing an action. Instead, users are now prompted to either log in again or close the system.
* Local plugins that were detected for installation no longer persist on the dashboard when logging out and into a different system.

## 1.2.1
### New
* Added login option for own clouds.

### Fixed
* Fixed build error when releasing the plentyDevTool on Big Sur.

## 1.2.0
### New
* It's now possible to log into multiple systems at the same time. Switching between systems doesn't require logging out. It's possible to log out either from one system or all systems.

## 1.1.6
### New
* Added message at the end of the push process if a full build action is required.

## 1.1.5
### Fixed
* Added a server select to the login screen. This allows you to select the Ireland (IE) cloud manually if the system doesn't connect to the correct server automatically.

## 1.1.4
### Fixed
* Paths specified in the `plenty.ignore` file are no longer watched. This speeds up local file processing significantly.

## 1.1.3
### Changed
* Global shortcuts have been changed to menu entries and local shortcuts.

### Fixed
* The tab key is no longer disabled globally while plentyDevTool is running.

## 1.1.2
Skipped.

## 1.1.1
### Fixed
* Shortcuts no longer work on the login screen. This prevents the login from becoming inaccessible.
* Text overflow of plugin names in the left sidebar of the dashboard.

## 1.1.0
### New
* **Update core framework to lastast version.**
* **Add EULA:** The license for using this applciation has been added for the inital instalation and also online
* **Add keyboard shortcuts.** The shortcuts are as follows:
    - Pull: `CMD+P` (macOS) or `CTRL+P` (Windows & Linux)
    - Push: `CMD+D` (macOS) or `CTRL+U` (Windows & Linux)
    - Detect new local plugin: `CMD+D` (macOS) or `CTRL+D` (Windows & Linux)

### Changed
* The tab key has been disabled.

### Fixed
* It's no longer necessary to close and re-open the application to log in after uploading a plugin.

## 0.4.1

### Fixed

* **Case insensitive filesystem support:** On case-insensitive file systems, files (where only the case was changed) were deleted immediately after they were pulled. This has been fixed.

## 0.4.0

### New
* **User interface performance:** The user interface can now be operated smoothly while many files are synchronized.
* **German user interface:** The user interface has been translated to german.

### Fixed

* **Non-closable success messages:** Success messages can now be closed as intended.
* **New plugins without ServiceProvider:** New plugins are now recognized even if no ServiceProvider is specified in plugin.json, because this is optional.
* **Windows certificate updated:** Users will not longer see a warning, if they use plentyDevTool on Windows for the first time.

## 0.3.1

### Fixed

* **Unhandled Exception on malformed plugin zips:** the download of a plugin as zip file will sometimes fail. plentyDevTool can now handle it better and downloads the single files as a fallback.
* **Show not changed files as "modified" (MacOS):** MacOS sometimes changes the last modified timestamp of files when they are read-only. For this reason, MacOS now performs an additional content check to prevent files from being incorrectly displayed as "modified".
* **Multiple syncs (MacOS)** Under MacOS, the internal sync logic is no longer executed multiple times when the window is closed and reopened without closing the app completely (cmd + q) in the meantime.
* **No Push while building**: Changes are no longer pushed if a build process is already running in the system.
## 0.3.0

### New

* **Show current action details** Below the progress bar, the currently processed file is now displayed for a better understanding of the process.
* **Continuable Downloads** If a download is interrupted, the already written data will now be deleted and downloaded again at the next "pull".

### Fixed

* **Changes on same file remote and local** It is no longer attempted to rename a deleted file on pulling if the same file has also been modified remotely.
* **Error during ZIP extraction** If an error prevents unpacking plugins downloaded as ZIP files, the plugin files will now be downloaded individually.
* **Progress bar on Login** A progress bar is no longer displayed in the login screen if the app wants to log in with expired credentials.

## 0.2.0

### New

* **Logger**: From now on a log file will be written.
* **Disallowed Characters in file paths** Files with not allowed characters in file path will not longer be pushed. Instead a warning displays a list of them.

### Fixed

* **Install new Plugin** Plugin directories must have the same name as the plugin. A bug in the check has been fixed.

## 0.1.0

### New

* **Auto update**: From now on, you will immediately know when we release a new version - plentyDevTool will tell you and give you the option to update right away.
* **Keyboard shortcuts**: You can now use a number of keyboard shortcuts: Cut (X), Copy (C), Paste (V), Select all (A), and Undo (Z) and forced quit (Q). The last one means Mac OS users no longer have to close the app via the taskbar.
* **Tooltips**: We added some tooltips to the buttons above the plugin set menu.

### Fixed

* **High CPU load on Windows and Linux**: We slowed down the watcher to reduce the load. It may take up to 3 seconds now for changed files to be displayed in the list.
* **File renaming bug on Windows**: There was a bug when making changes to the renamed file both locally and remotely. Is is now fixed.
* **Linux file watcher bug**: The file watcher was acting up on Linux systems and no longer does.

## 0.0.1
