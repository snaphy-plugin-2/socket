/*Written by Robins Gupta*/
(function(){'use strict';})();
module.exports = function( server, databaseObj, helper, packageObj) {

    //Constructor..
    const init = function(){
        exposeSubscribeMethod();
    };



    //Add subscribe post method to defined models in conf.json
    const exposeSubscribeMethod = function(){
        if(packageObj.listen){
            packageObj.listen.forEach(function(collectionObj){
                addSubscribeMethod(collectionObj);
            });
        }
    };

    //Add subscribers method..
    const addSubscribeMethod = function(collectionObj){
        const {collection} = collectionObj;
        const Model = server.models[collection];

        /**
         * Create namespace and rooms for listening to changes to model and publish accordingly.
         * @param where {object} Where query
         * @param callback callback method.
         */
        Model.subscribe = function(where, callback){
            let collectionEventData = storage.findOrCreate(collection);
            //Now find or create namespaces to the collection..
            let namespace = collectionEventData.findOrCreate(where);
            if(namespace){
                //Now create room for namespace..
                let room = namespace.findOrCreate(namespace, where);
            }

            //Now returning the callback..
            callback(null, {});
        };

        Model.remoteMethod(
            'subscribe', {
                accepts: [{
                    arg: 'where',
                    type: 'object'
                }],
                returns: {
                    arg: 'data',
                    type: 'object'
                },
                description: "Create namespace and rooms for listening to changes in the model.",
                http: {
                    status: 201
                }
            }
        );
    };


    /**
     * Stores the event data.
     * @type {{get, findOrCreate}}
     */
    let storage = (function(){
        //Variable will hold all the subscribers list attached to the model..
        let eventStorage = {};

        // --------------------------defines private methods.-----------------------


        /**
         * Initialize rooms object for given namespaces.
         * @param namespace {{parent: (collection.namespaces|{parent}), name: string, fields: Array, socket: Array, clients: number, rooms: {parent: *}, onConnect: onConnect, onDisconnect: onDisconnect, remove: remove, findOrCreate}} object of which this chat room is a part of.
         * @param where {{}} Where query of subscribe
         * @returns {*}
         */
        const initRooms = function(namespace, where){
            if(namespace){
                if(where){
                    //Room will be like for namespaces namespace key ==> "/Chat/Field1/Field2/Field3", rooms ==> /Field1Value/Field2Value/ room is value of each fields
                    //For namespace like "/Chat" room will be ==> "/"
                    let room = `/`;
                    for(let key in where){
                        if(where.hasOwnProperty(key)){
                            //Add key to namespace..
                            room = `${room}${where[key]}/`;
                        }
                    }

                    //Now create room for this if not present..
                    namespace.rooms = namespace.rooms || {};
                    if(!namespace.rooms[room]){
                        //Create a room for the given namespace..
                        namespace.rooms[room] = {
                            where: where,
                            parent: namespace.rooms,
                            name: room,
                            //Client connected to this rooms..
                            clients: 0
                        };


                        if(packageObj.debug){
                            console.info(`Room ${room} created successfully for namespace ${namespace.name}`);
                        }

                    }else{
                        if(packageObj.debug){
                            console.info(`Room ${room} already present for namespace ${namespace.name}`);
                        }
                    }

                    return namespace.rooms[room];
                }
            }
        };

        /**
         * Create model storage for a model
         * @param modelName
         * @returns {{name: *, namespaces: {parent: *}, findOrCreate: collection.findOrCreate}}
         */
        const initModelStorageObject = function(modelName){
            const collection = {
                name: modelName,
                namespaces:{

                },

                /**
                 * Find namespace object or create one..
                 * @param where {{}} Where query of subscribe
                 * @returns {*}
                 */
                findOrCreate : function(where){
                    if(where){
                        let namespaceString = `/${this.name}`;
                        let fields = [];
                        for(let key in where){
                            if(where.hasOwnProperty(key)){
                                //Add key to namespace..
                                namespaceString = `${namespaceString}/${key}`;
                                fields.push(key);
                            }
                        }



                        //Now search for this namespace object..
                        if(!this.namespaces[namespaceString]){
                            const socket = server.io;
                            //namespace not present..create one..
                            let nsp = socket.of(namespaceString);
                            let that = this;

                            /**
                             * Define namespace object
                             * @type {{parent: (collection.namespaces|{parent}), name: string, fields: Array, socket: Array, clients: number, rooms: {parent: *}, onConnect: onConnect, onDisconnect: onDisconnect, remove: remove, findOrCreate}}
                             * @example
                             * namespace key ==> "/Chat/Field1/Field2/Field3": {}
                             */
                            this.namespaces[namespaceString] = {
                                parent: that.namespaces,
                                name: namespaceString,
                                fields: fields,
                                socket: nsp,
                                //Client connected to this namespace..
                                clients: 0,
                                //Store the name of the rooms
                                rooms: {
                                    parent: that.namespaces[namespaceString]
                                },
                                //When a new node connects to namespace..
                                onConnect: function(socket){
                                    console.info(`A Node connected with namespace ${namespaceString}`);
                                    this.clients++;
                                    //Join and findOrCreate rooms on calling..
                                    //This name space will listen to `create` event to join users to any room..
                                    socket.on('create', function(room){
                                        //increment clients number..
                                        if(!that.namespaces[namespaceString].rooms[room]){
                                            initRooms(that.namespaces[namespaceString], where);
                                        }

                                        //If rooms present..
                                        if(that.namespaces[namespaceString].rooms[room]){
                                            //Increment rooms..
                                            that.namespaces[namespaceString].rooms[room].clients++;
                                            socket.join(room);
                                            if(packageObj.debug) {
                                                console.info(`Room ${room} joined under namespace ${namespaceString}.`);
                                            }
                                        }else {
                                            if (packageObj.debug) {
                                                console.error(`Cannot join ${room} as room object not presnet.`);
                                            }
                                        }
                                    });

                                    socket.on('leave', function(room){
                                        //leave this room..
                                        socket.leave(room);
                                        //Decrement client and remove if empty..
                                        if(that.namespaces[namespaceString].rooms[room]){
                                            //Increment rooms..
                                            that.namespaces[namespaceString].rooms[room].clients--;
                                            if(packageObj.debug) {
                                                console.info(`Room ${room} leaving under namespace ${namespaceString}.`);
                                            }
                                            if(that.namespaces[namespaceString].rooms[room].clients === 0){
                                                //remove this room..
                                                delete that.namespaces[namespaceString].rooms[room];
                                                if(packageObj.debug) {
                                                    console.info(`Deleting room from namespace as all clients got disconnected`);
                                                }
                                            }
                                        }else{
                                            if(packageObj.debug) {
                                                console.info(`Cannot leave Room ${room} as room not present under namespace ${namespaceString}.`);
                                            }
                                        }
                                    });
                                },
                                onDisconnect: function(){
                                    this.clients--;
                                    if(packageObj.debug) {
                                        console.info(`A Node disconnected with namespace ${namespaceString}`);
                                    }
                                    if(this.clients === 0){
                                        //Remove this namespaces from the parent list...
                                        this.remove();
                                    }
                                },
                                //Delete this reference from the namespaces list..
                                remove: function(){
                                    if(packageObj.debug) {
                                        console.info(`Deleting namespace  ${namespaceString} as all clients got disconnected`);
                                    }
                                    delete this.parent[this.name];
                                },


                                //FindOrCreate Rooms for this namespace..
                                findOrCreate: initRooms
                            };

                            nsp.on('connection', function(socket){
                                that.namespaces[namespaceString].onConnect(socket);
                                socket.on('disconnect', function(){
                                    that.namespaces[namespaceString].onDisconnect();
                                });
                            });

                            //store the reference of socket variable in namespace..
                            this.namespaces[namespaceString].socket = nsp;

                            if(packageObj.debug){
                                console.info(`Namespace ${namespaceString} created successfully for Collection ${modelName}`);
                            }
                        }else{
                            if(packageObj.debug){
                                console.info(`Namespace ${namespaceString} already present`);
                            }
                        }


                        return this.namespaces[namespaceString];
                    }
                } //findOrCreate namespace method.
            };

            //Adding parent reference to namespace..
            //Add parent reference to namespaces..
            collection.namespaces.parent = collection;
            return collection;
        };

        return {
            //Get the eventStorage object..
            get: function(){
                return eventStorage;
            },
            /**
             * Find the event obj for collection or create a new one if not present..
             * @param collection
             */
            findOrCreate: function(collection){
                if(!eventStorage[collection]){
                    eventStorage[collection] = initModelStorageObject(collection);
                }

                if(packageObj.debug){
                    console.info(`Collection ${collection} created successfully`);
                }

                return eventStorage[collection];
            }
        };
    })();



    //Run the constructor..
    init();

    return storage;
};
