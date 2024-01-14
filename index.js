const { app, BrowserWindow } = require('electron');
const electronIpcMain = require('electron').ipcMain;
const path = require('node:path');
const crypto = require('crypto');
const jm = require('json-db-memory');
const { default: JsonDataStore } = require('json-db-memory');

console.log( '>>> NEW TAX INSTANCE <<<' );
console.log( '--- Process/Environment Variables ---' );
console.log( process.env );
console.log( '-------------------------------------' );

// Initialize JSON-DB-MEMORY

const CreateWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        heitht: 600,
        center: true,
        autoHideMenuBar: false,
        webPreferences: {
            preload: path.join( __dirname  + '/preload.js' ),
            contextIsolation: true
        }
    });
    
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
});

/**
 * Main Processing Engine.  Pass the appropriate MyObject.
 * 
 * - DATABASE
 *   - Create New Database:
 *      Request:
 *          {
 *              method: 'new',
 *              year: 2024
 *          }
 *      Response:
 *          {
 *              file: 'guid'
 *          }
 * 
 */
electronIpcMain.handle('engine', ( event, MyObject ) => {
    if( MyObject.constructor === Object ){
        if( MyObject.method == "new" ){
            DatabaseCreate( { year: MyObject.year } );
        }
    }else{
        return false;
    }
});

electronIpcMain.handle('test', ( event, Message ) => {
    console.log("Test");
    console.log( Message );
    return "ABC";
});

function DatabaseCreate( ReqObject ){
    var dbName = ReqObject.year + '.jtax';
    var dbPath = process.env.INIT_CWD + '/data/' + dbName;
    var myDB = new JsonDataStore( dbName );
    myDB.set( 'year', ReqObject.year );
}