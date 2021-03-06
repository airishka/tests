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
		mmdRequire,
		anonQueue = [],
		FILE_WHTITE_LIST = ['js','json','jsonp','css'], 
		ANON_DATA_ATTR = "data-req_module",
		factoryConfig = {},
		cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
		commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
		ostring = Object.prototype.toString,

		commonJsHandlers = {
			'require': function(mod) {
				return (mod && mod.contextRequire) || mmdRequire;
			},

			'exports': function(mod) {

				defined[mod.name].usingExports = true;

				if (isDefined(mod.name)) {
					return (defined[mod.name].exports = defined[mod.name].result = {});
				}
			},
			
			'module': function(mod) {
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
	function isFunction(it) {
		return ostring.call(it) === '[object Function]';
	}

	function isArray(it) {
		return ostring.call(it) === '[object Array]';
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
	
		
		//If no dependencies, and factory is a function, then figure out if it a
		//CommonJS thing with dependencies.
		if (!dependencies.length && isFunction(factory)) {
			//Remove comments from the factory string,
			//look for require calls, and pull them into the dependencies,
			//but only if there are function args.
			if (factory.length) {
				factory.toString()
						.replace(commentRegExp, '')
						.replace(cjsRequireRegExp, function(match, dep) {
							dependencies.push(dep);
						});

				//May be a CommonJS thing even without require calls, but still
				//could use exports, and module. Avoid doing exports and module
				//work though if it just needs require.
				//REQUIRES the function to expect the CommonJS variables in the
				//order listed below.
				dependencies = (factory.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(dependencies);
			}
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
	
	function resolveWaiting(module) {
		
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
		//public function on require
		function configure(confObj) {
			instanceConfig = extend(confObj, instanceConfig);
		}
		
		function getMmdInstance (configObj) {
			var config = {},
				mmdObj;
				
			config = extend(config, instanceConfig);
			config = extend(config, configObj);
			
			mmdObj = new MmdClass(config);
			//for required require
			mmdRequire = mmdObj.require;	
			return mmdObj.require;
		}
		
		function checkUrl(url, isModule) {
			var isAbsolute = ('string' !== typeof url) ? false : url.match(/^\w+:/);
					
				url += isModule ? '.js' : '';

			return (isAbsolute ? "" : instanceConfig.baseUrl) + url;

		}

		function toUrl() {
			return instanceConfig.baseUrl + arguments[0];
		}
		
		/**
         * Given a relative module name, like mapval/something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @returns {String} normalized name
         */
		function usePathFallback(name) {

			var nameParts = name && name.split('/'),
				map = instanceConfig.paths,
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
			
		function processRelativePath(moduleId, parentId) {
			if(!moduleId) return moduleId;
			
			var isString = 'string' === typeof moduleId,
				moduleIdArr = !isString? moduleId : [moduleId],
				mln = moduleIdArr.length,
				i, j, modArr, parentPathPartsArr, parentPath;
				
				function getParentPath(needTrailingSlash) {
					return parentId ? parentId.substr(0, parentId.lastIndexOf('/')+(!!needTrailingSlash*1)) : "";
				}

				function addTrailingSlash(url){
					return url && url.length-1 !== url.lastIndexOf('/')? url+'/': url;
				}
				
				for (i=0; i < mln; i += 1) {
					if(moduleIdArr[i].indexOf('../') === 0){
							parentPath = getParentPath();
							parentPathPartsArr = parentPath.split('/');
							
							modArr = moduleIdArr[i].split('/');
							
							for (j=0; j < modArr.length; j += 1) {
								if(-1 !== modArr[j].indexOf('..')){
									parentPathPartsArr.pop();
									modArr.splice(j, 1);
								}
							}

							moduleIdArr[i] = addTrailingSlash(parentPathPartsArr.join('/')) + modArr.join('/');
						
					}else{
						if (moduleIdArr[i].indexOf('./') === 0) {
							moduleIdArr[i] = moduleIdArr[i].replace('./', getParentPath(true));
						}
					}
				}
			
			return isString? moduleIdArr[0] : moduleIdArr;
		}
		
		function normalize(moduleId) {
		
			var isString = 'string' === typeof moduleId,
				moduleIdArr = !isString ? moduleId : [moduleId],
				i, mln = moduleIdArr.length;
				
				if (instanceConfig.hasOwnProperty('paths')) {
					for (i=0; i < mln; i++) {
						if (instanceConfig.paths.hasOwnProperty(moduleIdArr[i])){
							 moduleIdArr[i] = usePathFallback(moduleIdArr[i]);
						}
					}
				}
				
				return isString? moduleIdArr[0] : moduleIdArr;
		}
		/**
		 * @return {Object} waiting[moduleId] obj || {name: 'name', contextRequire: mmdRequire}
		 * @param {String} moduleId - wanted module
		 * @param {String} referId - reference to moduleName which parent is wanted
		 */
		function getModuleObj(moduleId, referId) {
			var modObj = null;
			
			if(waiting.hasOwnProperty(moduleId)) {
				modObj = waiting[moduleId];
			} else {
				modObj = {
					name: (defined[moduleId] && defined[moduleId].name) || 'top level require, module '+referId+' has no parent: '+ moduleId,
					contextRequire: mmdRequire
				};
			}
			//console.log('referId: "',referId,'", moduleId: "', moduleId, '", def', defined[moduleId], 'mobj', modObj);///
			return modObj;	
		}
		
		function require ( mixed ) {

			var reqModule;
			if (this instanceof require) {
			
				return getMmdInstance(arguments[0]);
			
			} else {
				
				//add path to moduleName if specified in config
				 reqModule = normalize(arguments[0], null);

				if (typeof reqModule.sort === 'function'){
					requireArray(null, reqModule, arguments[1]);
					
				} else if ('string' === typeof reqModule) {
					return requireString(reqModule, arguments[1]);
					
				}		
			}
		}
		
		function requireArray (parent, dependencies, callback) {
			var results = [], forIndex,
				dependenciesLength = dependencies.length,
				deps = dependencies.slice(0);//clone deps
				
			function requireArrayItem(index){
				var moduleId = deps[index],
					hasNotCompletedResult;
				

				if (!commonJsHandlers[moduleId])  { 
					requireString(moduleId, function(result){
						var e;
					
						results[index] = result;
				
						if (dependenciesLength === results.length) {
							
							if (!parent && waiting[moduleId] && waiting[moduleId].isModule) {
								for (e=0; e < results.length; e++) {
									if (!results[e]) hasNotCompletedResult = true;
								}
							}
							//wait for all circular dependencies to be resolved
							if (!hasNotCompletedResult) {
								if('function' === typeof callback){ 
									callback.apply(null, results);
								}
							}
						}
					}, parent);
				} else {
					//parent module is already required; or it is a top level require with more then one module required
					// console.log('_parent: "', parent, '", deps', deps);///
					results[index] = commonJsHandlers[moduleId].call(null, getModuleObj(parent, moduleId));
					
					if (dependenciesLength === results.length && 'function' === typeof callback) {
							callback.apply(null, results);
					}
				}
			}		
			
			if (0 === dependenciesLength) {
				callback.apply(null, results);
					
			} else {
				if ( isDefined(parent) ) { 
					defined[parent].deps_required = true;
				}

				for(forIndex=0; forIndex < dependenciesLength; forIndex += 1){
					requireArrayItem(forIndex);
				}
			}
			
		}
		
		function exec(text) {
			return eval(text);
		}
		
		function requireString (module, callback, parent) {
			//use config path callback
			module = normalize(module);
			
			var pluginName = null, pluginCallback, originalName = module;
						
			parent = parent || null;

			if (module && module.split('!').length === 2) {
				pluginName = module.split('!')[0];
				module = module.split('!')[1];
			}
			
			if(pluginName){
				
				pluginCallback = function(param){
									//the module is already loaded, but has 
									//no define call (css,text,html,plain js, smth)
									//then we should define it, to prevent load the same file as a script
									// (it doesn't have dependencies and factory)
									//now the module name doesn't include plugin prefix
									if (!isDefined(originalName)) {
										define(originalName, [], null);
									}
									if(param){
										defined[originalName].result = param;
									}							
									//module is a string and is defined now, resolve it	
									if(parent){
										requireString(parent, callback);
									}else{
										if (!isDefined(module)) {
										define(module, [], null);
										}
										if(param){
											defined[module].result = param;
										}
										requireString(module, callback);
									}
							};
							
				pluginCallback.fromText = function(moduleId, text){
								exec(text);
								requireString(moduleId, callback);
				};
				
				if(!defined[originalName]){
					requireString(pluginName, function(plugin){
					
						if (plugin && plugin.normalize) {
										module = plugin.normalize(module, function (name) {
											return processRelativePath(name, parent);
										});
						} else {
										module = processRelativePath(module, parent);
						}		
	
						plugin.load(module, mmdRequire, pluginCallback, instanceConfig);
					}, parent);
				}else{
					//TODO: please do DRY! ! !
					 if (defined[originalName].hasOwnProperty('result')) {
						if ('function' === typeof callback) {
							callback.call(null, defined[module].result);
						}

						return defined[originalName].result;
					} else {
						if (0 === defined[originalName].dependencies.length || defined[originalName].deps_required) {
							//if deps_required wait instead of immediately resolve? how long?
							resolveRequire(originalName, callback);
						} else {
							requireArray(originalName, defined[originalName].dependencies, function() {
								resolveRequire(originalName, callback, arguments);
							});
						}
					}
					///endtodo ! ! !

				}
					
			} else {
				if (isDefined(module)) {
					if (defined[module].hasOwnProperty('result')) {
						if ('function' === typeof callback) {
							callback.call(null, defined[module].result);
						}

						return defined[module].result;
					
					} else {
						
						if (0 === defined[module].dependencies.length || defined[module].deps_required) {
							//if deps_required wait instead of immediately resolve? how long?
							resolveRequire(module, callback);
						} else {
							requireArray(module, defined[module].dependencies, function() {
								resolveRequire(module, callback, arguments);
							});
						}

					}
				} else {
					waitFor(module, callback, parent);
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
		
		function waitFor (module, callback, parent) {

			var waitingModule = waiting[module] = waiting[module] || { callbacks: [] },
				ext = module.split('?')[0].split('#')[0].split('.').pop(),
				isModule = true,
				i,
				normalizeModuleId = normalize(module, parent);
			//if module has an extension - it is not a module
			for (i=FILE_WHTITE_LIST.length-1; i >= 0; i--) {
				if(FILE_WHTITE_LIST[i] === ext) { 
					isModule = false;
					break;
				} 
			}

			extend( waitingModule, {
				name: module,
				isModule: isModule, //(-1 === module.lastIndexOf('.js')),
				contextRequire: require,
				//first process relative path and then add base url to it
				url: checkUrl(processRelativePath(module, parent), isModule),
				normalizeModuleId: normalizeModuleId
			});

			waitingModule.callbacks.push(callback);

			if ('undefined' === typeof waiting[module].isLoading && 
				module !== instanceConfig.loader &&
				instanceConfig.loader) {
					load(module);
			}
		}
		
		function load (module) {
			requireString(instanceConfig.loader, function(loader){
				
				var callback = waiting[module].isModule ?
					function(ret) {
						var item;
						if(anonQueue.length){
							item = anonQueue.shift();
							define(arguments[1], item[1], item[2]); //
						}
					} : 
					function(ret) {
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
		
		setConfig(defautlInstanceConfig);
		
		define.amd = {};
		
		extend(this, {
			require: require,
			define: define
		});
		
		extend(this.require, {
			getConfig: getConfig,
			configure: configure,
			isDefined: isDefined,
			mmdRequire : mmdRequire,
			toUrl : toUrl
		});
	}
	
	extend(factoryConfig, defaultFactoryConfig);
	
	return new MmdClass;
});