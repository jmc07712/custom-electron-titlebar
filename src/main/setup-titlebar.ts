/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) AlexTorresDev. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

export default () => {
	if (process.type !== 'browser') return

	const { BrowserWindow, Menu, MenuItem, ipcMain, getCurrentWindow } = require('electron')
	// Send menu to renderer title bar process
	ipcMain.handle('request-application-menu', async () => {
		const currentWindow = getCurrentWindow()
		return JSON.parse(JSON.stringify(
			currentWindow.menu,
			(key: string, value: any) => (key !== 'commandsMap' && key !== 'menu') ? value : undefined
		))
	})

	// Handle window events
	ipcMain.on('window-event', (event: any, eventName: String) => {
		const window = BrowserWindow.fromWebContents(event.sender)

		/* eslint-disable indent */
		if (window) {
			switch (eventName) {
				case 'window-minimize':
					window?.minimize()
					break
				case 'window-maximize':
					window?.isMaximized() ? window.unmaximize() : window?.maximize()
					break
				case 'window-close':
					window?.close()
					break
				case 'window-is-maximized':
					event.returnValue = window?.isMaximized()
					break
				default:
					break
			}
		}
	})

	// Handle menu events
	ipcMain.on('menu-event', (event: any, commandId: Number) => {
		const window = BrowserWindow.fromWebContents(event.sender)
		const item = getMenuItemByCommandId(commandId, window.menu)
		if (item) item.click(undefined, window, event.sender)
	})

	// Handle the minimum size.
	ipcMain.on('window-set-minimumSize', (event: any, width: number, height: number) => {
	    const window = BrowserWindow.fromWebContents(event.sender);
		
	    /* eslint-disable indent */
	    if (window) {
		window?.setMinimumSize(width, height);
	    }
	});

	// Handle menu item icon
	ipcMain.on('menu-icon', (event: any, commandId: Number) => {
		const window = getCurrentWindow()
		const item = getMenuItemByCommandId(commandId, window.menu)
		if (item && item.icon && typeof item.icon !== 'string') {
			event.returnValue = item.icon.toDataURL()
		} else {
			event.returnValue = null
		}
	})

	ipcMain.on('update-window-controls', (event: any, args: Electron.TitleBarOverlay) => {
		const window = BrowserWindow.fromWebContents(event.sender)
		try {
			if (window) window.setTitleBarOverlay(args)
			event.returnValue = true
		} catch (_) {
			event.returnValue = false
		}
	})
}

function getMenuItemByCommandId(commandId: Number, menu: Electron.Menu | null): Electron.MenuItem | undefined {
	if (!menu) return undefined

	for (const item of menu.items) {
		if (item.submenu) {
			const submenuItem = getMenuItemByCommandId(commandId, item.submenu)
			if (submenuItem) return submenuItem
		} else if (item.commandId === commandId) return item
	}

	return undefined
}
