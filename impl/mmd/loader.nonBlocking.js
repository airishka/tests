define("loader.nonBlocking", function(){
   var arrLoaded = [];      
    
   return {
        id: 'loader.nonBlocking',
        load: function (src, onload, params) {
                var script = document.createElement('script'); 
                
                script.onloadDone = false;
                script.src = src;
                script.setAttribute("type", "text/javascript");
                if('undefined' !== typeof params){
                    script.setAttribute(params[0], params[1]);
                }
                //Others
                script.onload = function() {
                            script.onloadDone = true;
                            if ("function" === typeof onload) onload.apply(null, params);
                };
                //IE
                script.onreadystatechange = function() {
                            if ( "loaded" === script.readyState && !script.onloadDone ) {
                                script.onloadDone = true;
                                if ("function" === typeof onload) {
                                    
                                    script.onload.apply(null, params);
                                }
                            }
                };
                document.getElementsByTagName('head')[0].appendChild(script);
        }        
    };
});
