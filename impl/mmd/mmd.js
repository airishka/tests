(function mmdDefine (root, factory){
	
	var factum,
		defaultFactoryConfig = {
			loader: null,
			baseUrl: ''
		};

	factum = factory (defaultFactoryConfig);
	
	root.require = factum.require;
	root.define = factum.define;	
	
	define('mmd', function() { return factum.require; });
	
})(this, function mmdFactory (defaultFactoryConfig){
	
	var defined = {},
		waiting = {},
		anonQueue = [],
		FILE_WHTITE_LIST = ['js','json','jsonp','css'], 
		ANON_DATA_ATTR = "data-req_module",
		factoryConfig = {},

		commonJsHandlers = {
			'require': function(mod) {
				return mod && mod.contextRequire || require;
			},
			 
			'exports': function(mod) {

				defined[mod.name].usingExports = true;
			     
				if (isDefined(mod.name)) {
				    return (defined[mod.name].exports = defined[mod.name].result = {});
				}
				
			},
			
			'module': function(mod) {
			    //debugger
				return (mod.module = {
					id: mod.name,
					uri: mod.url,
					config: function() {
						//return (config.config && config.config[mod.map.id]) || {};
					},
					exports: defined[mod.name].result
				});
			}
		};

	function extend (obj, obj2) {
		var tKey;
		
		for (tKey in obj2) {
			
			if (obj2.hasOwnProperty(tKey)) {
				obj[tKey] = obj2[tKey];
			}
		}
		
		return obj;
	}
	
	function isDefined( moduleId ) {
		return (defined.hasOwnProperty(moduleId));
	}


	function MmdClass (defautlInstanceConfig) {
		var instanceConfig = {};
		
		defautlInstanceConfig = defautlInstanceConfig || {};
		
		function getConfig () {
			var config = {};
			
			config = extend(config, factoryConfig);
			config = extend(config, instanceConfig);
			
			return config;
		}
		
		function setConfig (configObj) {
			var config = {};
			
			config = extend(config, factoryConfig);
			//config = extend(config, instanceConfig);
			config = extend(config, configObj);
			
			instanceConfig = config;
		}
		
		function getMmdInstance (configObj) {
			var config = {},
				mmdObj;
				
			config = extend(config, instanceConfig)
			config = extend(config, configObj)
			
			mmdObj = new MmdClass(config);
				
			return mmdObj.require;
		}
		
		function checkUrl(url, isModule) {
			var isAbsolute = ('string' !== typeof url) ? false : url.match(/^\w+:/),
				src = isAbsolute ? url : url; //utils.usePathFallback(url);
			
			src = checkPaths(src);
			src += isModule ? '.js' : '';

			return (isAbsolute ? "" : instanceConfig.baseUrl) + src;

		}

		function checkPaths(name) {
			var isPathConfig = instanceConfig.hasOwnProperty('paths') && instanceConfig.paths.hasOwnProperty(name);
			
			return isPathConfig ? instanceConfig.paths[name] : name;
		}

		function toUrl() {
			return instanceConfig.baseUrl + arguments[0];
		}

		
		function define (name, dependencies, factory){

			var isAnon = false;

			if ( typeof name !== 'string') {
				isAnon = true;
				factory = dependencies;
				dependencies = name;
				name = null;
			}

			if (dependencies && !dependencies.splice) {
				factory = dependencies;
				dependencies = [];
			}

			if(isAnon){
				anonQueue.push([name, dependencies, factory]);

			} else {
			
				if (!defined[name]) {
					defined[name] = {
						name: name,
						dependencies: dependencies,
						factory: factory
					};
				}

				resolveWaiting(name);
			}
		}	
		
		function require ( mixed ) {
			// debugger
			if (this instanceof require) {
			
				return getMmdInstance(arguments[0]);	
			
			} else {
				if (typeof arguments[0].sort == 'function'){
					requireArray(null, arguments[0], arguments[1]);
					
				} else if ('string' === typeof arguments[0]) {
					return requireString(arguments[0], arguments[1]);
					
				}		
			}
		}
		
		function requireArray (parent, dependencies, callback) {
			var results = [], forIndex,
				dependenciesLength = dependencies.length;
				
			function requireArrayItem(index){
				var module = dependencies[index];
				
				if (!commonJsHandlers[module])  {  
					requireString(module, function(result){
						results[index] =  result;
						
						if (dependenciesLength === results.length) {
							callback.apply(null, results)
						}
					});
				} else {

					results[index] = commonJsHandlers[module].call(null, waiting[parent]);
					
					if (dependenciesLength === results.length) {
						callback.apply(null, results);
					}
				}
			}		
			
			if (0 === dependenciesLength) {
				callback.apply(null, results);			
					
			} else {
				if(isDefined(parent)) { defined[parent].deps_required = true; }

				for(forIndex=0; forIndex < dependenciesLength; forIndex += 1){
					requireArrayItem(forIndex);
				}
			}
		}
		
		function requireString (module, callback) {
		
			var plugin = null;

			if (module.split('!').length === 2) {
				plugin = module.split('!')[0];
				module = module.split('!')[1];
			}

			if(plugin){

				requireString(plugin, function(plugin){
					plugin.load(
						[module], 
						function(){
							//the module is already loaded, but has 
							//no define call (css,text,html,plain js, smth)
							//then we should define it, to prevent load the same file as a script
							// (it doesn't have dependencies and factory)
							//now the module name doesn't include plugin prefix
							if (!isDefined(module)) { 
								define(module, [], null);
							}
							//module is a string and is defined now, resolve it   
							requireString(module, callback);
						}, toUrl
					);
				});
			} else {
  
				if (isDefined(module)) {
					if (defined[module].hasOwnProperty('result')) {
						if ('function' === typeof callback) 
							callback.call(null, defined[module].result);
						
						return defined[module].result;
					
					} else {

						if (0 === defined[module].dependencies.length || defined[module].deps_required) {
							resolveRequire(module, callback);
						} else {
							requireArray(module, defined[module].dependencies, function() {
								 resolveRequire(module, callback, arguments);
							});
						}

					}
				} else {
					waitFor(module, callback);
				}
			}
		}

		
		function resolveRequire(module, callback, args) {
			args = args || [];

			if ("function" === typeof defined[module].factory) {
				defined[module].result = defined[module].factory.apply(null, args);
				
			} else {
				defined[module].result = defined[module].factory;
			}
			
			if (defined[module].usingExports) {
				defined[module].result = extend(defined[module].result || {}, defined[module].exports);
			}
			
			if ('function' === typeof callback) {
				callback.call(null, defined[module].result);
			} 

			return defined[module].result;
		}
		
		function waitFor (module, callback) {
		    if(instanceConfig.hasOwnProperty('paths') && instanceConfig.paths.hasOwnProperty(module)){
		        module = instanceConfig.paths[module];
		    }
            
			var waitingModule = waiting[module] = waiting[module] || { callbacks: [] },
				ext = module.split('?')[0].split('#')[0].split('.').pop(),
				isModule = true,
				i;
			//if module has an extension - it is not a module
			for (i=FILE_WHTITE_LIST.length-1; i >= 0; i--) {
			  if(FILE_WHTITE_LIST[i] == ext) { 
			  	isModule = false;
			  	break;
			  } 
			};

	        extend( waitingModule, {
	            name: module,
                isModule: isModule, //(-1 === module.lastIndexOf('.js')),
                contextRequire: require,
                url:	checkUrl(module, isModule)
	        });
	        
	        waitingModule.callbacks.push(callback);
	        
	        if ('undefined' === typeof waiting[module].isLoading 
				&& module !== instanceConfig.loader
				&& instanceConfig.loader) {
					load(module);
			}
		}
		
		function load (module) {	    
			requireString(instanceConfig.loader, function(loader){
	
				var callback = waiting[module].isModule? function() {
				    var item = anonQueue.shift();

				    define(arguments[1], item[1], item[2]);
				} : function() {
					resolveWaiting(module);
				};

				if (!waiting[module].isLoading) {
					waiting[module].isLoading = instanceConfig.loader;
					if (waiting[module].isModule) {
						loader.load(waiting[module].url, callback, [ANON_DATA_ATTR, module]);
					} else {
						loader.load(waiting[module].url, callback);
					}
				}

	        });
		}
		
		function resolveWaiting(module){
			
			var counter, waitingCallbacksLength;
			
			if('undefined' !== typeof waiting[module]) {

				waitingCallbacksLength = waiting[module].callbacks.length;

				if (!waiting[module].isModule && !defined.hasOwnProperty(module)) {
					defined[module] = {
						name: module,
						dependencies: null,
						factory: null,
						result: null
					};
				}

				
				for (counter=0; counter < waitingCallbacksLength; counter++) {
					waiting[module].contextRequire(module, waiting[module].callbacks[counter]);
				}
				
				delete(waiting[module]);
			}			
		}
		
		setConfig(defautlInstanceConfig);
		
		define.amd = {};
		
		extend(this, {
			require: require,
			define: define
		});
		
		extend(this.require, {
			getConfig: getConfig,
			isDefined: isDefined
		});
	}
	
	extend(factoryConfig, defaultFactoryConfig);
	
	return new MmdClass;
});
