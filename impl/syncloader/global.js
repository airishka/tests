(function(root, d, factory){
	var scripts = d.getElementsByTagName( 'script' ),
		hook = scripts[ scripts.length - 1 ].getAttribute('data-blub');

	root.sQ = factory(root);
	sQ.hook = hook;
	
	if('undefined' === typeof root.define) {
		root.define = sQ.specify;
		root.define.amd = {};
	}
	
	d.write(
		// test browser capability for dataURI script src
		'<script src="data:text/javascript;base64,c1EuZHU9MQ=="><'+'/script>',
		
		//  enqueue loading of the hook after browser test
		'<script>if(sQ.hook)sQ.load(sQ.hook, function(){});<'+'/script>'
	);


})(this, document, function(root){
	var queue = [],
		assocQueue = {},
		specified = {},
		required = {},
		config = {'baseUrl': ''},
		
		utils = {
			getObjKeys: function(obj) {
				var key, k = [];
				if ('undefined' === typeof obj) { return k; }
				
				for (key in obj) {
					if (obj.hasOwnProperty(key)) { k.push(key); }
				}
				return k;
			},
			
			isAbsolutePath: function(pathStr) {
				return ('string' !== typeof pathStr) ? false : pathStr.match(/^\w+:/);
			},
			/**
	         * Given a relative module name, like mapval/something, normalize it to
	         * a real name that can be mapped to a path.
	         * @param {String} name the relative name
	         * @returns {String} normalized name
	         */
			usePathFallback: function (name) {

	            var nameParts = name && name.split('/'),
	                map = config.paths,
	                mapValue, i, nameSegment, foundMap;

	            //Apply map config if available.
	            if (nameParts && map) {

					//Find the longest name segment match in the config.
					//So, do joins on the biggest to smallest lengths of baseParts.
					for (i = nameParts.length; i > 0; i -= 1) {
						nameSegment = nameParts.slice(0, i).join('/');

	                    //name segment has  config, find if it has one for
	                    //this name.
	                    mapValue = map[nameSegment];
	                    if (mapValue) {
							//Match, update name to the new value.
							foundMap = mapValue;
							break;
						}
					}

                    if (foundMap) {
                        nameParts.splice(0, i, foundMap);
                        name = nameParts.join('/');
						
                    }
	            }

	            return name;
			}
	
		},
	

		sQ = {
			config: function(configObj, keysArr) {
				var tKey;
				
				keysArr = keysArr || utils.getObjKeys(configObj);
				
				while(tKey = keysArr.shift()) {
					if ('undefined' !== configObj[tKey]) {
						config[tKey] = configObj[tKey];
					}
				}
				return config;
			},
			
			checkUrl: function(url) {
				var isAp = utils.isAbsolutePath(url),
					src = isAp ? url : utils.usePathFallback(url);
				
				if ('undefined' !== typeof required[url]) {
					src += required[url].isModule ? '.js' : '';
				}

				return (isAp ? "" : config.baseUrl) + src;
			},
			normalize: function(path){
				return utils.usePathFallback(path);
			},

			load: function (src, func) {
				func = func || {};
				func.src = src;
				queue.push(func);
				assocQueue[src] = func;
				var url = this.checkUrl(src);
				document.write('<script src="'+url+'"><'+'/script>',
					'<script id="'+src+'" data-item="'+src+'" src="'+((this.du) ? "data:text/javascript;base64,c1EuZHEoKQ==" : "http://www.chip.de/js/amd/sync/triggerSyncDequeue.js")+'"><'+'/script>');
			},

			retrieve: function(html, func) {
				func = func || {};
				
				func.src = escape(html);
				queue.push(func);
				assocQueue[func.src] = func;
				var url = this.checkUrl(func.src);
				
				document.write('<div id="retrievedContent">'+ html +'</div>',
					'<script id="'+func.src+'" data-item="'+func.src+'" src="'+((this.du) ? "data:text/javascript;base64,c1EuZHEoKQ==" : "http://www.chip.de/js/amd/sync/triggerSyncDequeue.js")+'"><'+'/script>');
				
			},

			// dequeue
			dq: function () {
				
				var func,
					scripts = document.scripts ? document.scripts : document.getElementsByTagName( 'script' ),
					queueSrc = scripts[ scripts.length - 1 ].getAttribute('data-item');
					
				// TODO: test document.write order, instead of using appName
				if(navigator.appName=="Microsoft Internet Explorer") {
					func = queue.shift();
				} else {
					func = assocQueue[queueSrc];
				}
				
				if ('function' === typeof func) {
					var rel = document.getElementById('retrievedContent');
					
					func.call(root, (rel? rel.innerHTML : '-1'));
				}
			},
			// du: is script dataUri possible
			du: false,

			specify: function (name, dependencies, factory) {
				//Allow for anonymous functions	
				if (typeof name !== 'string') { 
					//Adjust args appropriately 
					factory = dependencies; 
					dependencies = name; 
					name = null; 
				} 
				function isArray(arr) { return 'undefined' !== typeof arr && arr.splice; }
		        //This module may not have dependencies
		        if (!isArray(dependencies)) {
		            factory = dependencies;
		            dependencies = [];
		        }
				if(null === name) {
					//TODO:
					//name = this.utils.createModuleName();
				}
				
				var module = specified[name] = {};

				module.name = name;
				module.dependencies = dependencies;
				module.factory = factory;

			},

			require: function ( dep, callback) {
				if (callback === null && 'undefined' !== typeof required[dep]) {
					callback = required[dep].callback;
				}

				var counter, self = this,
					oldCallback, makeLoad,
					depResults = [],
					tResolve = function (specifiedModule, args) {
						args = args || [];
						if ("function" === typeof specifiedModule.factory) {
							specifiedModule.result = specifiedModule.factory.apply(root, args);
						} else {
							specifiedModule.result = specifiedModule.factory;
						}
						console.log('this for callback', this);
						console.info('module', specifiedModule.name, ' is specified factory call made, result is: ', specifiedModule.result);
						console.log('callback', callback.toString());
						
						callback.call(this, specifiedModule.result);
					},
					requireString = function () {
						
						if (specified[dep]) {
							if (0 === specified[dep].dependencies.length || 'undefined' !== typeof specified[dep].result ) {
								tResolve(specified[dep]);
							} else {
								sQ.require(specified[dep].dependencies, function () {
									
									tResolve(specified[dep], arguments);

								})
							}
							
						} else {
							if ('undefined' === typeof required[dep]) {
								required[dep] = {
									callback: callback,
									isModule: (-1 === dep.lastIndexOf('.js'))
								};
								sQ.load(dep, function(){
									sQ.require(dep, null)
								});
							} else {
								if (required[dep].isModule) {
									//add current callback to callback stack and wait for specify call on module load
									oldCallback = required[dep].callback;
									required[dep].callback = function() {
										oldCallback.apply(root, arguments);
										callback.apply(root, arguments);
									};
								} else {
								
									// else if simple file, do specify it - there is no specify call (never)
									specified[dep] = {
										name: dep,
										dependencies: '',
										factory: null,
										result: null
									};
									//call callback for simple file
									sQ.require(dep, required[dep].callback);
								}
								
							}
						}
					},
					requireArray = function () {
						var results = 0;
						
						if (0===dep.length){
							callback.call(this, depResults);
						} else {
							for (counter=0; counter < dep.length; counter++) {
	
								(function(c){
									
									sQ.require(dep[c], function(result){
	
										depResults[c] =  result;
										results++;
	
										if (dep.length === results) {
											callback.apply(this, depResults)
										}
									});
								})(counter);
							}
						}
					};

				if ("string" === typeof dep) {
					requireString();
				} else {
					requireArray();
				}
			}

		};
	
	root.specify = sQ.specify;

	root.specify.md = true;

	return sQ;
});