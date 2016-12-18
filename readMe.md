# socket plugin for Snaphy


####Real time data management with socket.io

#####This plugin is exposed on  `/socket` route

#####Please copy the `socket/socket` folder to `common/settings/` after plugin installed.



#API DOCUMENTATION
Socket plugin depends on socket.io to push real time data to the server.
To use this plugin.
```
//Load this plugin.
const {publish} = helper.loadPlugin('socket');

//Now to publish any data or changes to the server..
// @param options {collection: string, method: string, modelId: MongoDb Object, data: {object|array} } 
publish({
    collection: "Customer",
    method: "POST",
    data: {name: 'customer', message: 'a new customer has been created'}
});
```

publish method accepts 
1) `POST` when a new model is created.
2) `PUT` when a model property is changed.
3) `DELETE` when the model is deleted.


To listen to any connection and disconnect events on socket and outputs to stdout. Add  to conf.json file like this.
```
//conf.json
{
    ....
    ....
    "onStart":{
        "connection":{
          "message": "A new Node is connected" 
        },
        "disconnect":{
          "message": "A Node has been disconnected."
        }
      },
    ....
    ....      
}      
```

By default `debug = true` in conf.json to `log` for any data publish.  
In `production` disable the `debug = false`.  

###REAL TIME MODELS
>By Default Models don't listen to real time activities.  

####To Activate
In `conf.json`
```
{
   ...
   ... 
   "listen": [
       {
         "collection": "BrandManager",
         "methods": ["POST", "PUT", "DELETE"],
         "complexSubscribe": true
       },
       {
         "collection": "Customer",
         "methods": ["POST"]
       }
     ],
   ... 
   ...
}
```

Here,  
 1. `collection` is name of the model.
 2. `complexSubscribe` when set `true` start listening to any complex queries also.
    - Complex Queries like  
    - Listen to change in a model `Chat` where `customerId` == 12312 and `type` = "private"  
    - After activating you can also subscribe the models to listen to any models with simple where query too.



#####FUTURE ROAD MAP
 1. Add `ACL` to server `subscribe` method for listening to any collection changes. 





######Written by Robins Gupta

