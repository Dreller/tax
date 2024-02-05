// Load Packages
    const { app, BrowserWindow, ipcMain, dialog } = require('electron');
    const path = require('node:path');
    const crypto = require('crypto');
    const jm = require('json-db-memory');
    const fs = require('fs');
    const url = require('url');
    const { default: JsonDataStore } = require('json-db-memory');
    const { constants } = require('node:fs/promises');

console.log( process.env );

// Initialize Variables at the Main Level
    var _Debug = true;
    var _SourceFilesList;
    var _Database = {};
    var _JsonMemory;
    var _JsonMemoryFile = "";
    var _JsonMemoryFilePath = "";
    var _MainWin;
    var _SubWin;
    var _SubWinData;

// App-level Triggers
app.whenReady().then(() => {
    OpenMainWindow();
    app.on('activate', () => {
        if( BrowserWindow.getAllWindows().length === 0 ) Window_Main();
    } )
});
app.on('window-all-closed', () => {
    if( process.platform !== 'darwin' ) app.quit();
});

// Main Window
function OpenMainWindow(){
    _MainWin = new BrowserWindow({
        width: 1250,
        height: 600,
        center: true,
        autoHideMenuBar: false,
        webPreferences: {
            preload: path.join( __dirname  + '/preload.js' ),
            nodeIntegration: true,
            contextIsolation: true
        }
    });
    _MainWin.loadFile('./html/welcome.html');
    if( _Debug ){
        _MainWin.webContents.openDevTools();
    }
}

// Child Window
function ChildWindow( sTargetPage, oArgs = {} ){
    _SubWinData = oArgs;
    console.log( "Capturing data for the SubWindow:" );
    console.log( oArgs );
    _SubWin = new BrowserWindow({
         parent: _MainWin,
        modal: true,
        width: 800,
        height: 600,
        center: true,
        autoHideMenuBar: false,
        webPreferences: {
            preload: path.join( __dirname  + '/preload.js' )
        }
    });

    _SubWin.loadFile( './html/' + sTargetPage );
    _SubWin["tax"] = _SubWinData;
    _SubWin.once('ready-to-show', () => {
        _SubWin.show()
    });

    _SubWin.on('closed', () => {
        // Dereference the window object to free up memory
        _SubWin = null;
    });
}

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
                _JsonMemory.set( 'category', '[]' );
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
        _JsonMemory.set( 'category', '[]' );
    },
    LoadFile: function( sFile = "" ){
        _LOG( "> Load a Database ", {file: sFile} );
        _JsonMemoryFile = sFile;
        _JsonMemoryFilePath = './node_modules/json-db-memory/data/' + sFile + ".json";
        _JsonMemory = new JsonDataStore( sFile );
        console.log( _JsonMemory );
        _Database = {
            meta: JSON.parse( _JsonMemory.get( "meta" ) ),
            domain: JSON.parse( _JsonMemory.get( "domain" ) ),
            category: JSON.parse( _JsonMemory.get( "category" ) ),
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
        _JsonMemory.set( sTable.toLowerCase(), JSON.stringify( _Database[ sTable.toLowerCase() ] ) );
        return true;
    },
    Update: function( sTable = "", oData = {} ){
        _Database[ sTable.toLowerCase() ] = _Database[ sTable.toLowerCase() ].filter( x => x.id != oData.id );
        _Database[ sTable.toLowerCase() ].push( oData );
        _JsonMemory.set( sTable.toLowerCase(), JSON.stringify( _Database[ sTable.toLowerCase() ] ) );
        return true;
    },
    Export: function(){
        dialog.showOpenDialog( _MainWin, {
            properties: ["openDirectory"],
            title: "Export Location",
            buttonLabel: "Export here"
        } ).then( result => {
            if( result.canceled == false ){

                var myDate = new Date();
                var myYear = myDate.getFullYear();
                var myMonth = ( myDate.getMonth() + 1 ).toString().padStart( 2, '0' );
                var myDay = myDate.getDate().toString().padStart( 2, '0' );
                var myHour = myDate.getHours().toString().padStart(2, '0' );
                var myMinute = myDate.getMinutes().toString().padStart(2, '0' );
                var mySecond = myDate.getSeconds().toString().padStart(2, '0' );
                var myFileName = `Tax Data - Year ${_JsonMemoryFile} - ${myYear}${myMonth}${myDay}-${myHour}${myMinute}${mySecond}.json`;
                var myFileDest = result.filePaths[0] + "/" + myFileName;
                _LOG( "Export File: " + _JsonMemoryFilePath );
                _LOG( " ... to: " + myFileDest );
                fs.copyFileSync( _JsonMemoryFilePath, myFileDest);
                dialog.showMessageBox( _MainWin, {
                    message: "Export successfully completed.",
                    type: "info",
                    detail: "The file has been exported to: " + myFileDest
                } );

            }
        })
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




 ipcMain.handle( 'window-manager', async( event, MyObject ) => {
    var WindowAction = MyObject.method.toLowerCase();
    var WindowActionList = [
        "open",
        "close",
        "get-data"
    ];
    if( WindowActionList.includes( WindowAction) ){
        switch( WindowAction ){
            case "open":
                ChildWindow( MyObject.page, MyObject );
                break;
            case "close":
                _SubWin.hide();
                break;
            case "get-data":
                return _SubWinData;
                _SubWinData = {};
                break;
        }
    }else{
        console.error( `Called IPC Channel 'window-manager' with an unknown action (${WindowAction})` );
    }
 } );

 // Data Transactions
 /** Object:
  *     {
  *         key         (str) Action Key
  *         action      (str) add or edit
  *         table       (str) Table of data
  *     }
  * 
  */
 ipcMain.handle( 'data', async( event, MyObject ) => {
    switch( MyObject.key ){
        case "get-all":
            return  await DB.GetObject();
            break;
        case "save":
            if( MyObject.action == "add" ){
                return DB.Insert( MyObject.table, MyObject.data )
            }else{
                return DB.Update( MyObject.table, MyObject.data )
            }
            break;
        case "export":
            return await DB.Export();
            break;
        default: 
            console.error( `Unhandled call to IPC Channel 'data': ${JSON.stringify(MyObject)}` );
    }


 });

ipcMain.handle('engine', async ( event, MyObject ) => {
    //console.group("Invoke 'index.js'");
    console.log( "Call to 'engine'...");
    console.log( MyObject );
    var response = true;
    if( MyObject.constructor === Object ){
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
        //console.groupEnd();
        return response;
    }else{
        console.log( 'ERROR - MyObject is not an Object!' );
        //console.groupEnd();
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
