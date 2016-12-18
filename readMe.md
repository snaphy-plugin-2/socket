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
 2. DELETE method still has scope of improvement. As right now it doesn't handle delete all event.




######Usage on Client
```
Suppose model name is BrandManager
//Send POST REQUEST to http://0.0.0.0:3000/api/BrandManagers/subscribe?access_token=GzGSDEKaWovG9eCSVgYhJMxwEISLE2HIDsU9e23gD9d7C9Thxvfysz3KX6UQUyDM 
with data {
            "where":{
            	 "restrictHotDeal": true
            }
          }

var socket = io();
undefined
var nsp = io('/BrandManager/restrictHotDeal');
undefined
nsp.emit('create', '/true/');
n {io: n, nsp: "/BrandManager/restrictHotDeal", json: n, ids: 0, acks: Object…}_callbacks: Objectacks: Objectconnected: truedisconnected: falseid: "yE9-mbkHagZJRex9AAAB"ids: 0io: njson: nnsp: "/BrandManager/restrictHotDeal"receiveBuffer: Array[0]sendBuffer: Array[0]subs: Array[3]__proto__: Object
socket.on('PUT', function(data) {
   console.log('Incoming message:', data);
});
n {io: n, nsp: "/", json: n, ids: 0, acks: Object…}
nsp.on('PUT', function(data) {
   console.log('Incoming message:', data);
});
n {io: n, nsp: "/BrandManager/restrictHotDeal", json: n, ids: 0, acks: Object…}_callbacks: Objectacks: Objectconnected: truedisconnected: falseid: "yE9-mbkHagZJRex9AAAB"ids: 0io: njson: nnsp: "/BrandManager/restrictHotDeal"receiveBuffer: Array[0]sendBuffer: Array[0]subs: Array[3]__proto__: Object
nsp.to
undefined
nsp.on
(t,e){return this._callbacks=this._callbacks||{},(this._callbacks["$"+t]=this._callbacks["$"+t]||[]).push(e),this}
VM1394:2 Incoming message: Object {firstName: "PRINCE", lastName: "gup", email: "robin@demo.com", restrictHotDeal: true, status: "onhold"…}
VM1394:2 Incoming message: Object {firstName: "PRINCE", lastName: "gup", email: "robin@demo.com", restrictHotDeal: true, status: "onhold"…}added: "2016-12-16T12:19:47.470Z"email: "robin@demo.com"firstName: "PRINCE"id: "5851d6149f203a756f362fa2"lastName: "gup"restrictHotDeal: truestatus: "onhold"updated: "2016-12-18T22:24:08.248Z"username: "robinskumar73"__proto__: Object
socket.on('PUT', function(data) {
   console.log('Incoming messagesadd:', data);
});
n {io: n, nsp: "/", json: n, ids: 0, acks: Object…}
VM1394:2 Incoming message: Object {firstName: "PRINCE", lastName: "gup", email: "robin@demo.com", restrictHotDeal: true, status: "onhold"…}
VM1394:2 Incoming message: Object {firstName: "PRINCE", lastName: "gup", email: "robin@demo.com", restrictHotDeal: true, status: "onhold"…}
```


######Written by Robins Gupta

