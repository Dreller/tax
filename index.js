const { app, BrowserWindow } = require('electron');
const electronIpcMain = require('electron').ipcMain;
const path = require('node:path');
const crypto = require('crypto');
const jm = require('json-db-memory');
const fs = require('fs');
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
            nodeIntegration: true,
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
 *              method: 'DatabaseCreate',
 *              year: 2024
 *          }
 * 
 */
electronIpcMain.handle('engine', async ( event, MyObject ) => {
    if( MyObject.constructor === Object ){
        if( MyObject.method == "DatabaseCreate" ){ 
            var response = await DatabaseCreate(MyObject)
        }

        return response;
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
    console.log( `Call to: DatabaseCreate() `);
    console.log( ReqObject );
    var dbName = ReqObject.year;
    // Look for an existing file
    var existingFiles = [];
    fs.readdir( './node_modules/json-db-memory/data', function( err, files ){
        if( err ){
            console.log('Unable to scan directory: ' + err );
        }
        files.forEach(function(file){
            existingFiles.push( file );
        });
        console.log( existingFiles );
    });
    if( existingFiles.includes( dbName + ".json" )){
        console.error("DATABASE ALREADY EXISTS!");
        return false;
    }else{
        var myDB = new JsonDataStore( dbName );
        myDB.set( 'info', JSON.stringify({year: ReqObject.year}) );
        myDB.set( 'suppliers', '[]' );
        myDB.set( 'persons', '[]' );
        myDB.set( 'domains', '[]' );
        myDB.set( 'receipts', '[]' );

        var DB =  DatabaseLoad( { file: dbName } );
        console.log( 'Result of DatabaseCreate: ');
        console.log( DB );
        return DB;
    }

}

function DatabaseLoad( ReqObject ){
    console.log( `Call to: DatabaseLoad()` );
    console.log( ReqObject );
    var myDB = new JsonDataStore( ReqObject.file );

    var MyObj = {
        info: JSON.parse( myDB.get("info") ),
        supplier: JSON.parse( myDB.get("suppliers") ),
        person: JSON.parse( myDB.get("persons") ),
        domain: JSON.parse( myDB.get("domains") ),
        receipt: JSON.parse( myDB.get("receipts") )
    } 

    console.log( 'Result of DatabaseLoad: ');
    console.log( MyObj );
    return JSON.stringify( MyObj) ;
}