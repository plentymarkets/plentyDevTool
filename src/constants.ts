export const FORBIDDEN_CHARACTERS = {
    signs: ['\\', '{', '^', '}', '%', '`', ']', '"', '>', '[', '~', '<', '#', '|'],
    asciiCodes: {
        start: 128,
        end: 255
    }
};

export const WAIT_MILLISECONDS_BEFORE_PUBLISH_CHANGES_TO_UI = 1000;

export const ROUTES = {
    getOpensourcePlugins: '/rest/plugin_sets/s3-inbox-opensource-plugins',
    getPluginBuildOverview: '/rest/plugin_sets/buildOverview',
    files: {
        getObjectList: '/rest/plugin_sets/storage/inbox/list',
        getObjectDownloadURL: '/rest/plugin_sets/storage/inbox/object-url',
        getPluginZip: '/rest/plugin_sets/storage/inbox/get-zip',
        uploadObjects: '/rest/plugin_sets/storage/inbox',
        deleteObjects: '/rest/plugin_sets/storage/inbox',
        commitUploads: '/rest/plugin_sets/storage/inbox/commit'
    },
    getAuthorizedUser: '/rest/authorized_user'
};

export const URLS = {
    login: {
        local: 'http://login.plentymarkets.com/rest/login',
        cloud: 'https://plentymarkets-cloud-de.com/rest/login'
    },
    localVMUrl: 'http://master.plentymarkets.com'
};

export const MENU_ITEMS = {
    actions: {
        all: 'menu:actions:*',
        pull: 'menu:actions:pull',
        push: 'menu:actions:push',
        detect: 'menu:actions:detect',
    }
};

export const EVENTS = {
    menu: {
        pull: 'menu:pull',
        push: 'menu:push',
        detect: 'menu:detect',
        enable: 'menu:enableMenu',
        disable: 'menu:disableMenu',
        toggleAllActions: 'menu:toggleActions'
    },
    queue: {
        start: 'queue:start',
        progress: 'queue:progress',
        finished: 'queue:finished'
    },
    syncer: {
        init: 'syncer:init',
        stop: 'syncer:stop',
        pull: 'syncer:pull',
        push: 'syncer:push',
        buildErrors: 'syncer:buildErrors',
        installPlugin: 'syncer:installPlugin'
    },
    watcher: {
        loadingPlugins: 'watcher:loadingPlugins',
        publishChanges: 'watcher:changes',
        notSyncedPlugins: 'watcher:notSyncedPlugins',
        working: 'watcher:working',
        currentTimestamp: 'watcher:currentTimestamp',
        newTimestamp: 'watcher:newTimestamp'
    },
    logMain: 'log:main',
    notification: 'notification:send',
    getSyncWorkerWebContentsId: 'syncWorker:getWebContentsId'
};

export const LOCKFILE_NAME = 'currentJob.lock';

export const IGNOREFILE = {
    name: 'plenty.ignore',
    content: [
        '# PlentyDevTool ignore file',
        '',
        '# These rules are applied at the plugin data level (where the plugin.json is located).',
        '# This file contains some standard entries, which you can customize to your needs.',
        '# Lines beginning with \'#\' are ignored.',
        '# Changes take effect when the app is restarted or the syncPath is changed.',
        '# If this file is deleted, it is regenerated with the default entries.',
        '',
        '# Examples',
        '# *.*                      matches any file in root directory',
        '# *.js                     matches any js-file in root directory',
        '# foo.*                    matches any "foo named" file like foo.txt, foo.js, foo.ts,... in root directory',
        '# **/*.js                  matches every js-file in any directory',
        '# /node_modules/*.js       matches any js-files in node_modules directory',
        '# /node_modules/**/*.js    matches any js-files in node_modules directory and any subdirectory',
        '# /node_modules/**         matches everything in node_modules directory',
        '# **/node_modules/**       matches everything in every node_modules directory even if it is a subdirectory',
        '',
        '',
        '# OS specific files',
        '**/*.DS_Store',
        '',
        '# Library directories',
        '**/vendor/**',
        '**/node_modules/**',
        '',
        '# Other',
        '**/.git/**'
    ]
};
