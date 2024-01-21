// Load Packages
    const { app, BrowserWindow, ipcMain } = require('electron');
    const path = require('node:path');
    const crypto = require('crypto');
    const jm = require('json-db-memory');
    const fs = require('fs');
    const { default: JsonDataStore } = require('json-db-memory');

// Initialize Variables at the Main Level
    var _Debug = true;
    var _SourceFilesList;
    var _Database = {};
    var _JsonMemory;

// Debug Function for Tracing in the Process Console
function _LOG(sText = "", oData = null){
    if( _Debug ){
        console.log( sText );
        if( oData !== null ){
            var ObjectType = typeof oData;
            console.log( "oData is a: " + ObjectType );
            switch( ObjectType ){
                case "array":
                    console.dir( oData );
                    break;
                case "object":
                    console.log( oData );
                    break;
                default:
                    console.log( "Unhandled Object Type: " + ObjectType );
                    console.log( oData );
            }
        }
        
    }
}

// Start the Instance
    _LOG( "New TAX Instance", process.env );


// Main Window
    const Window_Main = () => {
        const win = new BrowserWindow({
            width: 1250,
            height: 1000,
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
        Window_Main();

        app.on('activate', () => {
            if( BrowserWindow.getAllWindows().length === 0 ) Window_Main();
        } )
    });

    app.on('window-all-closed', () => {
        if( process.platform !== 'darwin' ) app.quit();
    });



// Database Manipulation Methods
const DB = {
    GetFiles: function(){
        _LOG( "> Get List of Source Files" );
        _SourceFilesList = [];
        fs.readdir( './node_modules/json-db-memory/data', function( err, files ){
            if( err ){
                console.error( 'XXXXX -> Error in DB.GetFiles <- XXXXX');
                console.error( err );
            }
            _LOG( files.length + " file(s) discovered." );
            _SourceFilesList = files.filter( x => x != "example.json" && x != "testData.json" ).sort();
            _LOG( "Source Files Found:", _SourceFilesList );
        } );
    },
    CreateFile: function( oParams ){
        _LOG( "> Create New Database", oParams );
        var Keys = ['year', 'demo'];
        if( TOOL.ArrayContains( Keys, oParams ) ){
            if( oParams.demo == true ){
                DB.CreateDemoFile( oParams );
            }else{
                _JsonMemory = new JsonDataStore( oParams.year );
                _JsonMemory.set( 'info', JSON.stringify(oParams) );
                _JsonMemory.set( 'supplier', '[]' );
                _JsonMemory.set( 'person', '[]' );
                _JsonMemory.set( 'domain', '[]' );
                _JsonMemory.set( 'receipt', '[]' );
            }
        }else{
            console.error( "XXXXX -> Error in DB.CreateFile <- XXXXX" );
            console.error( "Missing Keys: " + Keys.join(", ") );
        }
        return true;
    },
    CreateDemoFile: function( oParams ){
        _JsonMemory = new JsonDataStore( oParams.year + "-DEMO" );
        _JsonMemory.set( 'info', JSON.stringify( oParams ) );
        _JsonMemory.set( 'supplier', '[]' );
        _JsonMemory.set( 'person', '[]' );
        _JsonMemory.set( 'domain', '[]' );
        _JsonMemory.set( 'receipt', '[]' );
    },
    LoadFile: function( sFile = "" ){
        _LOG( "> Load a Database ", {file: sFile} );
        _JsonMemory = new JsonDataStore( sFile );
        console.log( _JsonMemory );
        _Database = {
            meta: JSON.parse( _JsonMemory.get( "meta" ) ),
            domain: JSON.parse( _JsonMemory.get( "domain" ) ),
            person: JSON.parse( _JsonMemory.get( "person" ) ),
            supplier: JSON.parse( _JsonMemory.get( "supplier" ) ),
            receipt: JSON.parse( _JsonMemory.get( "receipt" ) )
        }
        return true;
    },
    GetObject: function(){
        return _Database;
    },
    Insert: function( sTable = "", oData = {} ){
        _Database[ sTable.toLowerCase() ].push( oData );
        _JsonMemory.set( sTable.toLowerCase(), _Database[ sTable.toLowerCase() ] );
        return true;
    },
    Update: function( sTable = "", oData = {} ){
        _Database[ sTable.toLowerCase() ] = _Database[ sTable.toLowerCase() ].filter( x => x.id != oData.id );
        _Database[ sTable.toLowerCase() ].push( oData );
        _JsonMemory.set( sTable.toLowerCase(), _Database[ sTable.toLowerCase() ] );
        return true;
    }
}

const TOOL = {
    ArrayContains: function( RequiredKeys = [], BaseArray = [] ){
        _LOG( ">> Tool ArrayContains() " );
        _LOG( "Required Keys:", RequiredKeys );
        _LOG( "Base Array: ", BaseArray );

        // Create an empty array
            var CheckList = [];
        // Loop in RequiredKeys to ensure it is present is BaseArray
            for( const RequiredKey in RequiredKeys ){
                CheckList.push( BaseArray.includes( RequiredKey ) );
            }
        // Returns TRUE if the CheckList Array DOES NOT CONTAINS any false.
        _LOG( "Final Check List:", CheckList );
        return !(CheckList.includes( false ));
    }
}




DB.GetFiles();



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
ipcMain.handle('engine', async ( event, MyObject ) => {
    console.group("Invoke 'index.js'");
    console.log( MyObject );
    if( MyObject.constructor === Object ){
        if( MyObject.method == "test"){
           
                const win2 = new BrowserWindow({
                    width: 1250,
                    height: 1000,
                    center: true,
                    autoHideMenuBar: false,
                    webPreferences: {
                        preload: path.join( __dirname  + '/preload.js' ),
                        nodeIntegration: true,
                        contextIsolation: true
                    }
                });
                
                win2.loadFile('./html/form_receipt.html');
                //win2.webContents.openDevTools();
                var response = true;
        }
        if( MyObject.method == "DatabaseCreate" ){ 
            var response = await DB.CreateFile( MyObject );
        }
        if( MyObject.method == "DatabaseSaveSegment" ){
            var response = await DatabaseSaveSegment( MyObject );
        }
        if( MyObject.method == "DatabaseLoad" ){
            var response = await DB.LoadFile( MyObject.file );
        }
        if( MyObject.method == "GetDatabase" ){
            var response = _Database;
        }
        if( MyObject.method == "GetAppContext" ){
            var response = {
                name: "CompilaTAX",
                dbfiles: _SourceFilesList
            };
        }
        if( MyObject.method == "DatabaseSaveReceipt" ){
            var response = await DatabaseSaveReceipt( MyObject );
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

function DatabaseSaveReceipt( ReqObject ){
    _JsonMemory.set( "receipt", JSON.stringify( ReqObject.data ) );
    return true;
}

function DatabaseSaveSegment( ReqObject ){
    if( ReqObject.segment == "supplier" ){
        DB.supplier = ReqObject.data;
        _JsonMemory.set( "supplier", JSON.stringify( ReqObject.data ) );
        return true;
    }
    if( ReqObject.segment == "domain" ){
        DB.domain = ReqObject.data;
        _JsonMemory.set( "domain", JSON.stringify( ReqObject.data ) );
        return true;
    }
    if( ReqObject.segment == "person" ){
        DB.person = ReqObject.data;
        _JsonMemory.set( "person", JSON.stringify( ReqObject.data ) );
        return true;
    }
    return false;
}
