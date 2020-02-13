const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);


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
    });
});

