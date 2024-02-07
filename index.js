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
    var _Database = {};
    var _Info = {};


    // Legacy
    var _Debug = true;
    var _SourceFilesList;

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
        height: 700,
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

const DATA = {
    GetAll: function(){
        return _Database;
    },
    CreateFile: function( sYear = "" ){

        // Ask user where to save the file...
        dialog.showSaveDialog( _MainWin, {
            title: "New Database Location",
            buttonLabel: "Create here",
            filters: [
                { name: "CompilaTAX files", extensions: ["ctax"]}
            ]
        } ).then( result => {
            if( result.canceled == false ){
                var myFileDest = result.filePath;
                _Database = {
                    meta: {
                        year: sYear,
                        dbv: 1
                    },
                    person: [],
                    domain: [],
                    category: [],
                    supplier: [],
                    receipt: []
                };
                fs.writeFileSync( myFileDest, JSON.stringify( _Database, null, 4 ), function( err ){
                    if( err ) throw err;
                    console.log( 'New File Created!' );
                } );
                _Info = {
                    db: {
                        path: result.filePath,
                        version: 1
                    }
                }
                _MainWin.loadFile('./html/home.html');
                return true;
            }
        });
    },
    LoadFile: function(){

        // Ask user to browse to the file to load...
        dialog.showOpenDialog( _MainWin, {
            title: "Open a Database",
            buttonLabel: "Open",
            filters: [
                { name: "CompilaTAX files", extensions: ["ctax"]}
            ],
            properties: [
                "openFile"
            ]
        }).then( result => {
            if( result.canceled == false ) {
                fs.readFile( result.filePaths[0], function( err, fileContent ){
                    if( err ) throw err;
                    _Database = JSON.parse( fileContent);
                    _Info = {
                        db: {
                            path: result.filePaths[0],
                            version: _Database.meta.dbv
                        }
                    }
                    console.log( _Database );
                    console.log( _Info );
                    _MainWin.loadFile('./html/home.html');
                    return true;
                } );
            }
        });

    },
    SaveFile: function(){
        fs.writeFile( _Info.db.path, JSON.stringify( _Database, null, 4 ), function( err ){
            if( err ) throw err;
            console.log( 'Database Updated!' );
            return true;
        } );
    },
    Insert: function( sTable = "", oData = {} ){
        _Database[ sTable.toLowerCase() ].push( oData );
        DATA.SaveFile();
        return true;
    },
    Update: function( sTable = "", oData = {} ){
        _Database[ sTable.toLowerCase() ] = _Database[ sTable.toLowerCase() ].filter( x => x.id != oData.id );
        _Database[ sTable.toLowerCase() ].push( oData );
        DATA.SaveFile();
        return true;
    }
}


 ipcMain.handle( 'window-manager', async( event, MyObject ) => {
    var WindowAction = MyObject.method.toLowerCase();
    var WindowActionList = [
        "open",
        "close",
        "get-data",
        "tell",
        "error"
    ];
    if( WindowActionList.includes( WindowAction) ){
        switch( WindowAction ){
            case "open":
                ChildWindow( MyObject.page, MyObject );
                break;
            case "close":
                _SubWin.hide();
                _MainWin.webContents.executeJavaScript('tblRefresh()');
                break;
            case "get-data":
                return _SubWinData;
                _SubWinData = {};
                break;
            case "tell":
                dialog.showMessageBox( _MainWin,{
                    message: MyObject.title,
                    detail: MyObject.message
                });
                return true;
                break;
            case "error":
                dialog.showErrorBox( MyObject.title, MyObject.message );
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
 ipcMain.handle( 'data', ( event, MyObject ) => {
    switch( MyObject.key ){
        case "get-all":
            return  DATA.GetAll();
            break;
        case "save":
            console.log( "Object to save");
            console.log( MyObject.data );
            if( MyObject.action == "add" ){
                return DATA.Insert( MyObject.table, MyObject.data )
            }else{
                return DATA.Update( MyObject.table, MyObject.data )
            }
            break;
        case "load":
            return DATA.LoadFile();
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
            var response = await DATA.CreateFile( MyObject.year );
        }
        if( MyObject.method == "DatabaseSaveSegment" ){
            var response = await DatabaseSaveSegment( MyObject );
        }
        if( MyObject.method == "DatabaseLoad" ){
            var response = await DB.LoadFile( MyObject.file );
        }
        if( MyObject.method == "GetDatabase" ){
            var response = await DATA.GetAll();
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
