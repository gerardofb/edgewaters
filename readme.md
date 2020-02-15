RETO DE PROGRAMACIÓN FULLSTACK DE EDGEWATERS

El proyecto consiste en crear un chat que permite a los usuarios conectarse para enviar mensajes con un comando al bot,
el cual responde con el precio de la acción de la cotización de acciones solicitada a través de un servicio web.

El chat está implementado en node.js con la librería sockets.io y los usuarios pueden conectarse a las salas de otros
usuarios para enviar mensajes privados a los usuarios conectados.

Se utiliza redis como broker de mensajes y para almacenar los datos del chat.

INSTRUCCIONES PARA CORRER EL BACKEND DESDE LA IMAGEN DE DOCKER:

El proyecto completo se puede recrear con el archivo docker-compose.yml provisto en este repositorio, para ello correr 
el siguiente comando: docker-compose build.

Una vez recreada la imagen se puede levantar el ambiente con este comando: docker-compose up --force-recreate.

ANALIZAR LA ACTIVIDAD DE REDIS:

Se puede acceder a redis dentro del contenedor de docker con el siguiente comando: docker exec -it edgewatersltd_redis_1 sh.
