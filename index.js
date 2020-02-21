const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const rediscliente = require('redis');
const redis = require('socket.io-redis');
const identificadorfile = require("guid");
const fs = require('fs');
const csv = require('csv-parser')
let salasActivas = [];
const protocol = require('https');
const modelo = require('./models');
const controlador = require('./controlador');
const cors = require('cors');
const desencripta = require('./cryptoutils').verifyPassword;
const encripta = require('./cryptoutils').hashPassword;
function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename)
    var fileSizeInBytes = stats["size"]
    return fileSizeInBytes
}

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, '/index.html'))
});
app.use("/", express.static(path.join(__dirname, '/')));
var server = http.listen(4000, function(){
    console.log("servidor escuchando en el puerto 4000");
});
app.use((req, res, next) => {
    const origin = req.get('origin');
  
    // TODO Add origin validation
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
    next();
  });
const io_s = require('socket.io')(server);
const cliente = rediscliente.createClient(6379,"redis");
// funciones de registro y logueo
function registerProcess(req, res){
    console.log('intentando registrar usuario');
    var registro = req.query;
    console.log(registro.usuario);
    console.log(registro.claro);
    controlador.getUser(registro.usuario, function callbackreg(err,exito){
        console.log('en intentando registro');
        console.log(exito);
        if(exito == null){
          encripta(registro.claro, function(objeto, encriptado){
                    console.log('contraseña encriptada');
                    var base = encriptado.toString("base64");
                    console.log(base);
                    controlador.addUser(registro.usuario, base);
                    res.send({exito:true});
                });
        }
else {
    res.send({exito:false});
}});
}
function loginProcess(req, res){
    console.log('intentando iniciar sesión');
    var login = req.query;
    console.log(login.claro);
    controlador.getUserPassword(login.usuario, function(err, reply){
        var encriptado = new Buffer(reply, "base64");
        console.log(encriptado);
    desencripta(login.claro, encriptado, function(objetos, data){
       if(data){
            res.send({exito:true});
        }
        else{
            res.send({exito:false});
        }
    });
});
}
app.get('/registerprocess', cors(), registerProcess);
app.get('/loginprocess', cors(), loginProcess);
// finalizan funciones de registro y logueo
cliente.subscribe("edgewaters");

io_s.adapter(redis({
    host: 'redis',
    port: 6379,
    subClient:cliente,
}));
const io = io_s;
io.on('connection', function(socket){
    console.log('se ha conectado un usuario');
    socket.send(JSON.stringify(
        {type:'serverMessage', 
        message: 'Bienvenido al chat de usuarios. Usted está conectaodo'}));
    socket.on('disconnect', function(){
        console.log('se ha desconectado un usuario');
    });
    socket.on("message", function(message){
        console.log('eschuché un mensaje');
        console.log(message);
        
        if(message.type=="userMessage"){
            socket.send(JSON.stringify(message));
        }
        if(message.type=="privateMessage"){
            if(message.message.indexOf("/") != 0 && message.message.indexOf("ck=")!= 4){

            let mensaje = {type:"privateMessage", message:message.apodo+": "+message.message};
            io.in(message.roomName).emit("message",JSON.stringify(mensaje));
            }
            else{
                let indice = message.message.indexOf("=")+1;
                let file = identificadorfile.raw()+".csv";
                
                console.log(file);
                let archivo = fs.createWriteStream(file);
                let url = "https://stooq.com/q/l/?s="+message.message.substring(indice,message.message.length)+"&f=sd2t2ohlcv&h&e=csv";
                const request = protocol.get(url, function(response){
                   response.pipe(archivo).on('close', function(){
                    console.log("tamanio de archivo "+getFilesizeInBytes(file));
                    const results = [];
                    fs.createReadStream(file).pipe(csv()).on('data',(data)=>results.push(data)).on('end',()=>{
                        console.log(results);
                        let precio = results.length > 0 && !isNaN(parseFloat(results[0].High))
                        ? parseFloat(results[0].High) : "INDEFINIDO";
                        console.log('precio '+precio);
                        let accion = message.message.substring(indice,message.message.length).toUpperCase();
                        let mensaje = {type:"privateMessage", message: precio != "INDEFINIDO" ? "BOT: "+"La cotización de acciones de "+accion+" es $"+precio+" por acción." : "BOT: No se pudo determinar esta cotización de acción."};
                        io.in(message.roomName).emit("message",JSON.stringify(mensaje));
                    })
                   });
                })
            }
        }
    });
    // CABMIAR DE SALA
    socket.on("cambiarSala", function(cambio){
        console.log('en cambio de room');
        console.log("sala antigua: "+cambio.old+", sala nueva: "+cambio.nuevo);
        socket.in(cambio.old).leave(cambio.old);
        socket.in(cambio.old).join(cambio.nuevo);
    })
    socket.on("login_user",function(room){
        console.log('iniciando sala '+room.name);
        socket.join(room.name);
        socket.room = room.name;
        salasActivas.push(room.name);
        let mensajesala = "El usuario "+room.nickname+" ha iniciado sesión";
        let salas = [];
            io.in(room.name).emit("message",JSON.stringify({type:"loginMessage",message:mensajesala}));
            console.log(io.sockets.adapter.rooms);
            // GUARDAR EL USUARIO
            
            for(var sala in io.sockets.adapter.rooms){
                console.log("enumerando salas");
                console.log(sala);
                console.log(io.sockets.adapter.rooms[sala].length);
                let salaBuscada = '';
                salasActivas.forEach((datos)=>{
                    if(datos == sala && salaBuscada != sala){
                    salaBuscada = sala;
                    salas.push({salaChat:sala, usuarios:io.sockets.adapter.rooms[sala].length});
                    }
                });
            }
                io.sockets.emit("salasSocket",JSON.stringify(salas));
    });
    socket.on("list_rooms", function(){
        console.log(io.sockets.adapter.rooms);
        let salas = [];
        for(var sala in io.sockets.adapter.rooms){
            console.log("enumerando salas");
            console.log(sala);
            console.log(io.sockets.adapter.rooms[sala].length);
            let salaBuscada = '';
            salasActivas.forEach((datos)=>{
                if(datos == sala && salaBuscada != sala){
                salaBuscada = sala;
                salas.push({salaChat:sala, usuarios:io.sockets.adapter.rooms[sala].length});
                }
            });
        }
        socket.emit("salasSocket",JSON.stringify(salas));
    });
});

