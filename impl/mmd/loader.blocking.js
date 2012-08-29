define("loader.blocking", function(){

        var queue = [], 
            assocQueue = {},
            moduleID,
            du = false;
        
        return {
            id: "loader.blocking",
            load: function (src, onload, params) {
                    onload = onload || {};
                    onload.src = src;
                    onload.params = params;
                    queue.push(onload);
                    assocQueue[src] = onload;
                    document.write('<script type="text/javascript" src="'+src+'"><'+'/script>', '<script type="text/javascript" id="'+src+'" data-item="'+src+'" src="'+((this.du) ? "data:text/javascript;base64,c1EuZHEoKQ==" : "../triggerSyncDequeue.js")+'"><'+'/script>');             },
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
