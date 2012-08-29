define("loader.ajax", function(){ "use strict"
    var getXHRObj = null, script,
        addAndRun = function(code, params){
             script = document.createElement("script");
             script.setAttribute("type", "text/javascript");
             if('undefined' !== typeof params){
                script.setAttribute(params[0], params[1]);
             }
             script.text = code;
             
             document.getElementsByTagName('head')[0].appendChild(script);
        };
        
        
        if (window.XMLHttpRequest) {
                  getXHRObj = function(){return new XMLHttpRequest()};
        } else if ( window.ActiveXObject ) {
             try {
                  getXHRObj = function(){return new ActiveXObject("Microsoft.XMLHTTP")};
             } catch( e ) {
                  getXHRObj = function(){return new ActiveXObject("Msxml2.XMLHTTP")};
             }
        }

       
   return {
        id: 'loader.ajax',
        load: function (src, onload, params) {
                   var lnb = getXHRObj(),
                       requestHandler = function(){
                           if (lnb.readyState === 4) {
                                if (lnb.status === 200) {
                                    addAndRun(lnb.responseText, params); 
                                    if(onload){
                                        onload.apply(null, params);
                                    }
                                }   
                           }
                       };
                   lnb.onreadystatechange = requestHandler;
                   lnb.open("GET", src, true);
                   lnb.send(null);
        }
    };
    
});
