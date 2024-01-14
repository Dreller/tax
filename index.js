const { app, BrowserWindow } = require('electron');

const CreateWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        heitht: 600,
        center: true,
        autoHideMenuBar: false,
        webPreferences: {
            nodeIntegration: true
        }
    })

    let $ = require('jquery');
    win.$ = $;

    win.loadFile('./html/welcome.html');

    win.webContents.openDevTools();
}

app.whenReady().then(() => {
    CreateWindow();

    app.on('activate', () => {
        if( BrowserWindow.getAllWindows().length === 0 ) CreateWindow();
    } )
});

app.on('window-all-closed', () => {
    if( process.platform !== 'darwin' ) app.quit();
})