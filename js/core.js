const IconSVG = "../node_modules/bootstrap-icons/bootstrap-icons.svg#";
const debug = true;

var TAX = {
    menu: {
      mainSection: "home",
      subSection: "all"
    },
    who: "all"
  };

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


function CreateObject( sType, objParams ){
    var sHTML = "";
    var sSelectOptions = "";

    var sOptions = `id="${objParams.id}"`;
        if( objParams.hasOwnProperty( "map" ) ){
            sOptions = sOptions + ` data-map="${objParams.map}"`;
        }
        if( objParams.hasOwnProperty( "source" ) ){
            sOptions = sOptions + ` data-source="${objParams.source}"`;
            // Is this a Select List ?  If Yes, build the Options to insert...
            if( sType == "select" ){
                (_DATA[objParams.source]).forEach( function(item){
                    sSelectOptions = sSelectOptions + `<option value="${item.id}">${item.name}</option>`;
                });
            }
            // Is this a Select List ?  If Yes, build the Options to insert...
            if( sType == "categories" ){
                ( _DATA.domain ).forEach( function( thisDomain ){
                    sSelectOptions = sSelectOptions + `<optgroup label="${thisDomain.name}">`;
                    ( _DATA.category ).filter( x => x.domain == thisDomain.id ).forEach( function(item){
                        sSelectOptions = sSelectOptions + `<option value="${item.id}">${item.name}</option>`;
                    });
                    sSelectOptions = sSelectOptions + `</optgroup>`;
                })

            }
        }
        if( objParams.hasOwnProperty( "onchange" ) ){
            sOptions = sOptions + ` onchange="${objParams.onchange}"`;
        }
        let sPlainClass = "form-control";
        if( objParams.hasOwnProperty( "readonly" ) ){
            if( objParams.readonly == true ){
                sOptions = sOptions + ` readonly`;
                sPlainClass = "form-control-plaintext";
            }
        }

        // Required Prompt ?
        if( objParams.hasOwnProperty("required") ){
            sOptions = sOptions + ` data-required="${ objParams.required == true ? "Y" : "N" }"`
        }else{
            sOptions = sOptions + ` data-required="N"`
        }
        
        // Clean up
        sOptions = sOptions.trim();


    switch( sType ){
        case "blank":
            sHTML = `&nbsp;`;
            break;
        case "p":
            sHTML = `<p id="${objParams.id}"></p>`;
            break;
        case "categories":
        case "select":
            sHTML = `
                <label for="${objParams.id}" class="form-label">${objParams.label}</label>
                <select class="form-select" ${sOptions}>
                    <option value="" selected disabled hidden></option>
                    ${sSelectOptions}
                </select>
            `;
            break;
        case "text":
            sHTML = `
                <label for="${objParams.id}" class="form-label">${objParams.label}</label>
                <input type="text" class="form-control" ${sOptions}>
            `;
            break;
        case "date":
            sHTML = `
                <label for="${objParams.id}" class="form-label">${objParams.label}</label>
                <input type="text" data-control="date-prompt" class="form-control" ${sOptions}>
            `;
            break;
        case "amount":
            sHTML = `
                <label for="${objParams.id}" class="form-label text-end">${objParams.label}</label>
                <input type="number" min="0" max="9999999999" step="0.01" class="${sPlainClass} text-end" data-control="cash-prompt" data-amount="${objParams.cashtype}" ${sOptions}>
            `;
            break;
        case "memo":
            sHTML = `
                <label for="${objParams.id}" class="form-label">${objParams.label}</label>
                <textarea class="form-control" rows="3" ${sOptions}></textarea>
            `;
            break;
       }

    if( objParams.hasOwnProperty( "divSize" ) ){
        sHTML = `<div class="col-md-${objParams.divSize}">${sHTML}</div>`;
    }

    return sHTML;
}


function Tell( Options = {} ){
    Controller.Call( 'window-manager', { method: 'error', title: Options.title, message: Options.content } );
}

