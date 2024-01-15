const { app, BrowserWindow } = require('electron');
const electronIpcMain = require('electron').ipcMain;
const path = require('node:path');
const crypto = require('crypto');
const jm = require('json-db-memory');
const fs = require('fs');
const { default: JsonDataStore } = require('json-db-memory');
var DB = {};
var DBLINK;

console.log( '>>> NEW TAX INSTANCE <<<' );
console.log( '--- Process/Environment Variables ---' );
console.log( process.env );
console.log( '-------------------------------------' );

// Initialize Shared Memory
var SharedMemory_FileList;

function DatabaseList(){
    console.group( "DatabaseList()" );
    console.log( "Clear SharedMemory_FileList..." );
    SharedMemory_FileList = [];
    fs.readdir( './node_modules/json-db-memory/data', function( err, files ){
        if( err ){
            console.error('Unable to scan directory: ' + err );
        }
        console.log( files.length + " file(s) discovered:" );
        console.log( files );
        SharedMemory_FileList = files.filter( (element) => element != "example.json" && element != "testData.json"  ).sort();
    });
    console.groupEnd();
}
DatabaseList();

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
 *   - Load an Existing Database:
 *      Request:
 *          {
 *              method: 'DatabaseLoad',
 *              file: 'filename-without-ext'
 *          }
 *   - Save a segment in the Database:
 *      Request: 
            {
                method: 'DatabaseSaveSegment',
                segment: supplier|domain|person,
                data: {}
            }
 * 
 */
electronIpcMain.handle('engine', async ( event, MyObject ) => {
    console.group("Invoke 'index.js'");
    console.log( MyObject );
    if( MyObject.constructor === Object ){
        if( MyObject.method == "DatabaseCreate" ){ 
            var response = await DatabaseCreate( MyObject );
        }
        if( MyObject.method == "DatabaseSaveSegment" ){
            var response = await DatabaseSaveSegment( MyObject );
        }
        if( MyObject.method == "DatabaseLoad" ){
            var response = await DatabaseLoad( MyObject );
        }
        if( MyObject.method == "GetDatabase" ){
            var response = DB;
        }
        if( MyObject.method == "GetAppContext" ){
            var response = {
                name: "CompilaTAX",
                dbfiles: SharedMemory_FileList
            };
        }
        console.log( "Response -> ");
        console.log( response );
        console.groupEnd();
        return response;
    }else{
        console.log( 'ERROR - MyObject is not an Object!' );
        console.groupEnd();
        return false;
    }
});

function DatabaseSaveSegment( ReqObject ){
    if( ReqObject.segment == "supplier" ){
        DB.supplier = ReqObject.data;
        DBLINK.set( "supplier", JSON.stringify( ReqObject.data ) );
        return true;
    }
    if( ReqObject.segment == "domain" ){
        DB.domain = ReqObject.data;
        DBLINK.set( "domain", JSON.stringify( ReqObject.data ) );
        return true;
    }
    if( ReqObject.segment == "person" ){
        DB.person = ReqObject.data;
        DBLINK.set( "person", JSON.stringify( ReqObject.data ) );
        return true;
    }
    return false;
}

function DatabaseCreate( ReqObject ){
    var dbName = ReqObject.year;
    DBLINK = new JsonDataStore( dbName );
    DBLINK.set( 'info', JSON.stringify({year: ReqObject.year}) );
    DBLINK.set( 'supplier', '[]' );
    DBLINK.set( 'person', '[]' );
    DBLINK.set( 'domain', '[]' );
    DBLINK.set( 'receipt', '[]' );

    return true;
}

function DatabaseLoad( ReqObject ){
    DBLINK = new JsonDataStore( ReqObject.file );
    var MyDB = {
        info: JSON.parse( DBLINK.get("info") ),
        supplier: JSON.parse( DBLINK.get("supplier") ),
        person: JSON.parse( DBLINK.get("person") ),
        domain: JSON.parse( DBLINK.get("domain") ),
        receipt: JSON.parse( DBLINK.get("receipt") )
    }
    DB = MyDB;
    return true ;
}