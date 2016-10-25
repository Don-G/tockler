process.env.NODE_ENV = (process.env.NODE_ENV || 'production').trim();
console.log(`Electron launching with NODE_ENV: ${process.env.NODE_ENV}`);
console.log((process.env.NODE_ENV == 'development'));

/*
 if (require('electron-squirrel-startup')) {
 return;
 }
 */

const Config = require('./config')

// electron
const electron = require('electron');
const app = electron.app;

const backgroundService = require('./background.service');

// Generate initial data
const InitialDatagenerator = require('./initialDataGenerator');
InitialDatagenerator.generate();

const Menu = electron.Menu;
const shell = electron.shell;
// const {crashReporter} = require('electron');
const BrowserWindow = electron.BrowserWindow;
let mainWindow = null;
let template;
let menu;

/*
 // Configure Tray
 const mb = require('./tray');
 app.on('activate-with-no-open-windows', function () {
 mb.window.show();
 });
 */
// Configure auto-launch
const AutoLaunch = require('auto-launch');
const appLauncher = new AutoLaunch({
	name: 'Tockler'
});

appLauncher.isEnabled().then((enabled) => {
	if (enabled) {
		return;
	}
	console.log('Enabling app launcher');
	return appLauncher.enable()
}).then((err) =>console.error(err));

// Configure context menu
/*
 require('electron-context-menu')({

 });
 */

// Single Instance Check
var iShouldQuit = app.makeSingleInstance(() => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}
		mainWindow.show();
		mainWindow.focus();
		console.log('Focusing main window');
	}
	return true;
});

if (iShouldQuit) {// && !config.isDev
	console.log('Quiting instance.');
	if (mainWindow) {
		mainWindow.close();
		mainWindow = null;
	}
	app.quit();
	//return;
}
// Configure chromium
app.commandLine.appendSwitch('disable-renderer-backgrounding');

// app

if (process.env.NODE_ENV == 'development') {
	require('electron-debug')();
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});


const {ipcMain} = require('electron');
ipcMain.on('close-app', () => {
	console.log('Closing app');

	mainWindow.close();
	mainWindow = null;

	app.quit();
});

app.on('ready', () => {

	backgroundService.init();

	// global.BackgroundService = backgroundService;

	require('electron').powerMonitor.on('suspend', function () {
		console.log('The system is going to sleep');
		backgroundService.onSleep();
	});
	require('electron').powerMonitor.on('resume', function () {
		console.log('The system is going to resume');
		backgroundService.onResume();
	});

	// Initialize the window to our specified dimensions
	mainWindow = new BrowserWindow({width: 900, height: 620});

	// Tell Electron where to load the entry point from
	mainWindow.loadURL(`file://${Config.root}/dist/index.html`);

	const npmLifecycle = process.env.npm_lifecycle_event
	if (npmLifecycle === 'start-watch') {
		const livereload = require('electron-connect').client;
		livereload.create(mainWindow);
	}

	// Clear out the main window when the app is closed
	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	mainWindow.webContents.on('did-navigate-in-page', (e, url) => {
		console.log(`Page navigated: ${url}`);
	});

	let appTitle = `Angular 2 Seed Advanced`;

	let helpMenu = {
		label: 'Help',
		submenu: [{
			label: 'Learn More',
			click: () => {
				shell.openExternal('https://github.com/NathanWalker/angular-seed-advanced');
			}
		}, {
			label: 'Issues',
			click: () => {
				shell.openExternal('https://github.com/NathanWalker/angular-seed-advanced/issues');
			}
		}, {
			label: `My Amazing Parent: Minko Gechev's Angular 2 Seed`,
			click: () => {
				shell.openExternal('https://github.com/mgechev/angular-seed');
			}
		}, {
			label: 'Angular 2',
			click: () => {
				shell.openExternal('https://angular.io/');
			}
		}, {
			label: 'Electron',
			click: () => {
				shell.openExternal('http://electron.atom.io/');
			}
		}, {
			label: 'Electron Docs',
			click: () => {
				shell.openExternal('https://github.com/atom/electron/tree/master/docs');
			}
		}, {
			label: 'Codeology Visualization',
			click: () => {
				shell.openExternal('http://codeology.braintreepayments.com/nathanwalker/angular-seed-advanced');
			}
		}]
	};

	if (process.platform === 'darwin') {
		template = [{
			label: appTitle,
			submenu: [{
				label: `About ${appTitle}`,
				selector: 'orderFrontStandardAboutPanel:'
			}, {
				type: 'separator'
			}, {
				label: 'Services',
				submenu: []
			}, {
				type: 'separator'
			}, {
				label: 'Hide Angular 2 Seed Advanced',
				accelerator: 'Command+H',
				selector: 'hide:'
			}, {
				label: 'Hide Others',
				accelerator: 'Command+Shift+H',
				selector: 'hideOtherApplications:'
			}, {
				label: 'Show All',
				selector: 'unhideAllApplications:'
			}, {
				type: 'separator'
			}, {
				label: 'Quit',
				accelerator: 'Command+Q',
				click: () => {
					app.quit();
				}
			}]
		}, {
			label: 'Edit',
			submenu: [{
				label: 'Undo',
				accelerator: 'Command+Z',
				selector: 'undo:'
			}, {
				label: 'Redo',
				accelerator: 'Shift+Command+Z',
				selector: 'redo:'
			}, {
				type: 'separator'
			}, {
				label: 'Cut',
				accelerator: 'Command+X',
				selector: 'cut:'
			}, {
				label: 'Copy',
				accelerator: 'Command+C',
				selector: 'copy:'
			}, {
				label: 'Paste',
				accelerator: 'Command+V',
				selector: 'paste:'
			}, {
				label: 'Select All',
				accelerator: 'Command+A',
				selector: 'selectAll:'
			}]
		}, {
			label: 'View',
			submenu: (process.env.NODE_ENV == 'development') ? [{
				label: 'Reload',
				accelerator: 'Command+R',
				click: () => {
					mainWindow.restart();
				}
			}, {
				label: 'Toggle Full Screen',
				accelerator: 'Ctrl+Command+F',
				click: () => {
					mainWindow.setFullScreen(!mainWindow.isFullScreen());
				}
			}, {
				label: 'Toggle Developer Tools',
				accelerator: 'Alt+Command+I',
				click: () => {
					mainWindow.toggleDevTools();
				}
			}] : [{
				label: 'Toggle Full Screen',
				accelerator: 'Ctrl+Command+F',
				click: () => {
					mainWindow.setFullScreen(!mainWindow.isFullScreen());
				}
			}]
		}, {
			label: 'Window',
			submenu: [{
				label: 'Minimize',
				accelerator: 'Command+M',
				selector: 'performMiniaturize:'
			}, {
				label: 'Close',
				accelerator: 'Command+W',
				selector: 'performClose:'
			}, {
				type: 'separator'
			}, {
				label: 'Bring All to Front',
				selector: 'arrangeInFront:'
			}]
		},
			helpMenu];

		menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);
	} else {
		template = [{
			label: '&File',
			submenu: [{
				label: '&Open',
				accelerator: 'Ctrl+O'
			}, {
				label: '&Close',
				accelerator: 'Ctrl+W',
				click: () => {
					mainWindow.close();
				}
			}]
		}, {
			label: '&View',
			submenu: (process.env.NODE_ENV === 'development') ? [{
				label: '&Reload',
				accelerator: 'Ctrl+R',
				click: () => {
					mainWindow.restart();
				}
			}, {
				label: 'Toggle &Full Screen',
				accelerator: 'F11',
				click: () => {
					mainWindow.setFullScreen(!mainWindow.isFullScreen());
				}
			}, {
				label: 'Toggle &Developer Tools',
				accelerator: 'Alt+Ctrl+I',
				click: () => {
					mainWindow.toggleDevTools();
				}
			}] : [{
				label: 'Toggle &Full Screen',
				accelerator: 'F11',
				click: () => {
					mainWindow.setFullScreen(!mainWindow.isFullScreen());
				}
			}]
		},
			helpMenu];
		menu = Menu.buildFromTemplate(template);
		mainWindow.setMenu(menu);
	}

});
