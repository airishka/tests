
//Map the configure({}) call to loader-specific call.
var require = new require({
	loader: 'loader.nonBlocking' 
}), 
	config = require.configure,

    //Map the top-level entry point to start loading to loader-specific call.
    go = require,

    //Indicate what levels of the API are implemented by this loader,
    //and therefore which tests to run.
    implemented = {
        basic: true,
        anon: true,
        funcString: true,
        namedWrapped: true,
        require: true,
        plugins: true
        //Does NOT support pluginDynamic in 1.0
        //pluginDynamic: true
    };

//Remove the global require, to make sure a global require is not assumed
//in the tests
require = undefined;


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

define("loader.blocking", function(){

        var queue = [], 
            assocQueue = {},
            moduleID,
            du = false,
            implPath = '../../impl/mmd/';
        
        return {
            id: "loader.blocking",
            load: function (src, onload, params) {
                    onload = onload || {};
                    onload.src = src;
                    onload.params = params;
                    queue.push(onload);
                    assocQueue[src] = onload;
                    document.write('<script type="text/javascript" src="'+src+'"><'+'/script>', '<script type="text/javascript" id="'+src+'" data-item="'+src+'" src="'+((this.du) ? "data:text/javascript;base64,c1EuZHEoKQ==" : implPath+"triggerSyncDequeue.js")+'"><'+'/script>');
            },
            dq : function () {
                var onload,
                    scripts = document.scripts ? document.scripts : document.getElementsByTagName( 'script' ),
                    queueSrc = scripts[ scripts.length - 1 ].getAttribute('data-item');
                    
                // TODO: test document.write order, instead of using appName
                if(navigator.appName=="Microsoft Internet Explorer") {
                    onload = queue.shift();
                } else {
                    onload = assocQueue[queueSrc];
                }
                
                if ('function' === typeof onload) {
                    onload.apply(null, onload.params);
                }
            }
        }
});
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


