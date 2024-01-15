const IconSVG = "../node_modules/bootstrap-icons/bootstrap-icons.svg#";
const debug = true;

var AppData = {};
var Database = {};

const CT = {

    ProperCase: function( text ){
        var sWIP = text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
        if( debug ){
            console.groupCollapsed( "CT.ProperCase()" );
            console.log( `Input: "${text}"` )
            console.log( `Output: "${sWIP}"` )
            console.groupEnd();
        }
        return sWIP;
    }

}


// Fetch URL Parameters
const urlParams = new URLSearchParams(window.location.search);
var localParams = {};
for( const key of urlParams.keys()){
    localParams[key] = urlParams.get(key);
}

function GetAppData( Options = {} ){
    ipcRender.invoke( 'engine', { method: "GetAppContext" })
    .then( (response) => {
      AppData = {...response, 
        param: localParams
      };
      DrawScreen();
      if( Options.hasOwnProperty("filelist") && Options.filelist != "" ){
        AppData.dbfiles.forEach( function(thisItem){
            $(`#${Options.filelist}`).append(`<li><a class="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover" href="load_db.html?file=${thisItem}">Fiscal Year ${thisItem.split(".")[0]}</a></li>`);
          });
      }
    })
}
function DrawScreen(){
    // App Name
    document.title = AppData.name;
    $("#AppTitle").html( AppData.name );
}


function DrawBreadcrumb( MyArray = [] ){
    console.groupCollapsed( "DrawBreadcrumb()" );
    console.log( "Parameter 'MyArray':" );
    console.table( MyArray );

    // Remove any entry to welcome.html
        var wipArray = MyArray.filter( x => x.href != "home.html" );
        console.log( "Removed link to 'home.html':" );
        console.table( wipArray );

    // Always Start with the Home Link
        var wip = `<li class="breadcrumb-item"><a class="icon-link icon-link-hover"  style="--bs-icon-link-transform: translate3d(0, -.125rem, 0);" href="home.html">
        <svg class="bi" aria-hidden="true"><use xlink:href="${IconSVG}house"></use></svg> Home</a></li>`;
        // If there is nothing in the array, we are in Home
        if( wipArray.length == 0 ){
            var wip = `<li class="breadcrumb-item active" aria-current="page"><span class="icon-link">
            <svg class="bi" aria-hidden="true"><use xlink:href="${IconSVG}house-fill"></use></svg> Home</span></li>`;
        }
    // Extract the last element
        var wipLast = wipArray.pop();

    // Add items bewteen
        wipArray.forEach( function( thisItem ){ 
            wip = wip + `<li class="breadcrumb-item"><a href="${thisItem.href}}">${thisItem.label}</a></li>`;
         });


    // Add the last element (where we are now)
    if( wipLast !== undefined ){
        wip = wip + `<li class="breadcrumb-item active" aria-current="page">${wipLast.label}</li>`;
    }
    console.groupEnd();

    return `<nav aria-label="breadcrumb"><ol class="breadcrumb">${wip}</ol></nav>`;
    
}

function Tell( Options = "" ){
    var objTitle = "";
    var objContent = "";
    var objModal = "";
    var objUUID = crypto.randomUUID();
    var objType = "ok-only";
    var objButtons = "";

    if( typeof Options == "string" ){
        objContent = Options;
    }
    if( typeof Options == "object" ){
        if( Options.hasOwnProperty( "type" ) ){
            objType = Options.type;
        }
        if( Options.hasOwnProperty( "title" ) ){
            objTitle = Options.title;
        }
        if( Options.hasOwnProperty( "content" ) ){
            objContent = Options.content;
        }
    }

    // Buttons
    if( objType == "ok-only" ){
        objButtons = `<button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>`;
    }

    // Build Modal
    objModal = `
        <div id="${objUUID}" class="modal">
            <div class="modal-dialog">
                <div class="modal-content">
                    ${
                        objTitle == "" ? "":`<div class="modal-header"><h5>${objTitle}</h5></div>`
                    }
                    <div class="modal-body">
                        ${objContent}
                    </div>
                    <div class="modal-footer">
                        ${objButtons}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Insert the modal in the document
    $(objModal).appendTo("body");

    // Invoke the modal
    const domModal = document.getElementById( objUUID );
    const thisModal = new bootstrap.Modal( domModal );
    domModal.addEventListener('hidden.bs.modal', event => {
        $(`#${objUUID}`).remove();
    })
    thisModal.show();  

   
}

