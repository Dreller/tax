const {
    contextBridge,
    ipcRenderer
 } = require('electron');

// Expose Methods to Renderers
contextBridge.exposeInMainWorld( "Controller", {
        // From HTML to Main Process - Wait for a Response.
        Call: function( callChannel, callParams ){
            console.log( `PreLoad - ContextBridge - Controller - Call - ` + callChannel );
            console.log( callParams );
            return ipcRenderer.invoke( callChannel, callParams );
        },
        // From HTML to Main Process - Don't wait for a Response.
        Transmit: function( transChannel, transParams ){
            console.log( `PreLoad - ContextBridge - Controller - Transmit - ` + transChannel );
            console.log( transParams );
            ipcRenderer.send( transChannel, transParams );
        }
    }
);
