const {
    contextBridge,
    ipcRenderer
 } = require('electron');

// Expose Methods to Renderers
contextBridge.exposeInMainWorld( "Controller", {
        // From HTML to Main Process - Wait for a Response.
        Call: function( callChannel, callParams ){
            return ipcRenderer.invoke( callChannel, callParams );
        },
        // From HTML to Main Process - Don't wait for a Response.
        Transmit: function( transChannel, transParams ){
            ipcRenderer.send( transChannel, transParams );
        }
    }
);