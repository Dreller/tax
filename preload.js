const contextBridge = require('electron').contextBridge;
const ipcRenderer = require('electron').ipcRenderer;

// White-listed list of channels
const ipc = {
    'render': {
        // From HTML to Main
        'send': [],
        // From Main to HTML
        'receive': [],
        // Data Exchange (bidirection)
        'sendReceive':[
            'test'
        ]
    }
}

// Expose Methods to HTML
contextBridge.exposeInMainWorld(
    'ipcRender', {
        // From HTML to Main.
        send: (channel, args ) => {
            if( ipc.render.send.includes( channel )){
                ipcRenderer.send(channel, args );
            }
        },
        // From Main to HTML
        receive: (channel, listener ) => {
            if( ipc.render.receive.includes( channel )){
                ipcRenderer.on( channel, (event, ...args ) => listener( ...args ));
            }
        },
        // Data Exchange
        invoke: ( channel, args ) => {
            if( ipc.render.sendReceive.includes( channel )){
                return ipcRenderer.invoke( channel, args );
            }
        }



    }
)