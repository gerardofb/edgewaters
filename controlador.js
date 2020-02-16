// funciones de manejo de datos
const flow = require('flow-maintained');
var saveRedis = require("redis");
var clienteControlador = saveRedis.createClient(6379,'redis');
exports.addUser = function addUser(username, password)
{
    clienteControlador.incr('next:user:id', function(err, userid){
    flow.exec(
    function(){
    var user_string = 'user:' + userid;
    clienteControlador.set('user:' + username, userid, this.MULTI());
    clienteControlador.hset(username, 'password', password, this.MULTI());
    })
});
}
exports.getUser = function getUser(username, callback){
   clienteControlador.get("user:"+username, function(err, res){
       console.log(res);
       console.log(typeof callback);
       if (typeof callback == "function") callback(err,res);
   });
}
exports.getUserPassword = function getUserPassword(username, callback){
    clienteControlador.hget(username, "password", function(err,reply){
        console.log("en obteniendo contraseña para validar");
        console.log(reply);
        if(typeof callback == "function") callback(err, reply);
    })
}