'use strict';
module.exports = function( server, databaseObj, helper, packageObj) {

	const socket = require('socket.io');


	/**
	 * Here server is the main app object
	 * databaseObj is the mapped database from the package.json file
	 * helper object contains all the helpers methods.
	 * packegeObj contains the packageObj file of your plugin. 
	 */

	/**
	 * Initialize the plugin at time of server start.
	 * init method should never have any argument
	 * It is a constructor and is populated once the server starts.
	 * @return {[type]} [description]
	 */
	const init = function(){
		startSocketServer();
		trackChanges();
	};

	//Start the socket servr..
	const startSocketServer = function(){
		//Run this after starting of the server...
		server.once('started', function() {
			server.io = socket(server.start);
			listenToStatic(server.io);
			const pubsub = require("./pubsub")(server, databaseObj, helper, packageObj, server.io);
			pubsub.init();
		});
	};

	/**
	 * Listen to static events defined in conf.json file
	 * @param socket socket.io object.
     */
	const listenToStatic = function(socket){
		if(packageObj.onStart){
			if(packageObj.onStart.connection){
				var obj = packageObj.onStart.connection;
				//On connection established..
				socket.on('connection', function(socket){
					if(obj.message){
						console.info(obj.message);
					}

					if(packageObj.onStart.disconnect){
						socket.on('disconnect', function(socket){
							if(packageObj.onStart.disconnect.message){
								console.info(packageObj.onStart.disconnect.message);
							}
						});
					}
				});

			}
		}
	};


	/**
	 * Publish any changes made in the server..at real time to client..
	 * @param options {collection: string, method: string, modelId: MongoDb Object, data: {object|array} } Accepts an option with collection name , method like POST, PUT, DELETE and modelId
     */
	const publish = function(options){
		if(server.io){
			var socket = server.io;
			if (options) {
				var collection = options.collection;
				var method = options.method;
				var data = options.data;
				var modelId = options.modelId;
				if (method === 'POST') {
					let name = '/' + collection + '/' + method;
					socket.emit(name, data);
				}
				else {
					let name = '/' + collection + '/' + modelId + '/' + method;
					socket.emit(name, data);
				}
			} else {
				throw 'Error: Option must be an object type';
			}

		}else{
			console.error("Socket object `server.io` not present. User this method after server start.");
		}

	};

	/**
	 * Auto listen for any changes in the model defined in the `conf.json` by property `listen` and publish it accordingly.
	 */
	const trackChanges = function(){
		const {listen} = packageObj;
		if(listen){
			listen.forEach(function(collectionObj){
				const {collection, methods} = collectionObj;
				if(collection && methods){
					methods.forEach(function(method){
						if(method === "PUT"){
							//Listen for update..
							onChanges(collection, method);
						}

						if(method === "DELETE"){
							//Listen for delete..
							onDelete(collection);
						}

						if(method === "POST"){
							//Listen for create..
							onChanges(collection, method);
						}
					});
				}
			});
		}

	};

	/**
	 * Listen for onCreate and on Update of data and publish changes to the client subscribers.
	 * @param collection {string} name of collection
	 * @param method {string} name of method. PUT|POST
     */
	const onChanges = function(collection, method){
		let model = server.models[collection];
		if(model){
			if(packageObj.debug){
				console.info("Socket: Tracking " + method +  " for collection: " + collection );
			}
			
			model.observe("after save", function(ctx, next){
				if(method === "POST"){
					if(ctx.isNewInstance){
						if(packageObj.debug){
							console.info("Socket: Publishing " + method + " event for collection: " + collection);
						}
						publish({
							collection: collection,
							data: ctx.instance,
							method: method
						});
					}
				}else{
					if(method === "PUT"){
						if(packageObj.debug){
							console.info("Socket: Publishing " + method + " event for collection: " + collection);
						}
						publish({
							collection: collection,
							data: ctx.instance,
							method: method,
							modelId: ctx.instance.id
						});
					}
				}
				//Call the next middleware..
				next();
			});
		}
	};

	/**
	 * Listen for on delete of the model and publish reports to the client subscribers.
	 * @param collection {string} name of collection
	 */
	const onDelete = function(collection){
		let model = server.models[collection];
		if(model){

			if(packageObj.debug){
				console.info("Socket: Tracking DELETE for collection: " + collection );
			}

			model.observe('after delete', function(ctx, next){
				if(ctx.where){
					if(ctx.where.id){
						if(packageObj.debug){
							console.info("Socket: Publishing DELETE event for collection: " + collection + " id: " + ctx.where.id );
						}
						publish({
							collection: collection,
							method: 'DELETE',
							modelId: ctx.where.id
						});
					}
				}

				//Call the next middleware..
				next();
			});
		}
	};


	//return all the methods that you wish to provide user to extend this plugin.
	return {
		init: init,
		publish: publish
	}
}; //module.exports
