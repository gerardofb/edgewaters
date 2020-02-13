const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const identificadorfile = require("guid");
const fs = require('fs');
const csv = require('csv-parser')
let salasActivas = [];
const protocol = require('https');
function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename)
    var fileSizeInBytes = stats["size"]
    return fileSizeInBytes
}

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, '/index.html'))
});
app.use("/", express.static(path.join(__dirname, '/')));
http.listen(4000, function(){
    console.log("servidor escuchando en el puerto 4000");
});
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
                        let accion = message.message.substring(indice,message.message.length).toUpperCase();
                        let mensaje = {type:"privateMessage", message: "BOT: "+"La cita "+accion+" es $"+precio+" por acción."};
                        io.in(message.roomName).emit("message",JSON.stringify(mensaje));
                    })
                   });
                })
            }
        }
    });
    socket.on("login_user",function(room){
        console.log('iniciando sala '+room.name);
        socket.join(room.name);
        socket.room = room.name;
        salasActivas.push(room.name);
        let mensajesala = "El usuario "+room.nickname+" ha iniciado sesión";
        let salas = [];
            io.in(room.name).emit("message",JSON.stringify({type:"loginMessage",message:mensajesala}));
            console.log(io.sockets.adapter.rooms);
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
                io.in(room.name).emit("salasSocket",JSON.stringify(salas));
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

