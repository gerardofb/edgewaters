// funciones de manejo de datos
var saveRedis = require("redis");
var clienteControlador = saveRedis.createClient();
exports.addUser = function addUser(user, name){
    clienteControlador.multi()
    .hset('user:' + user, 'name', name)
    .zadd('users', Date.now(), user)
    .exec();
    console.log("agregando usuario a redis");
    };