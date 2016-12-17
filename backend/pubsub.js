/*Written by Robins Gupta*/
(function(){'use strict';})();
module.exports = function( server, databaseObj, helper, packageObj, socket) {

    //Constructor..
    const init = function(){

    };

    //Add subscribe post method to defined models in conf.json
    const addSubscribeMethod = function(){
        if(packageObj.listen){
            packageObj.listen.forEach(function(collectionObj){
                const {collection, method} = collectionObj;
            });
        }
    };

    return {
        init: init
    }
};
