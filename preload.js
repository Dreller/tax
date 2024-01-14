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
            'test',
            'engine'
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
                var response = ipcRenderer.invoke( channel, args );
                console.log( 'PRELOAD > Response from .Invoke: ');
                console.log( response );
                return response;
            }
        }



    }
)