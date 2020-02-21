FROM node:10.19.0-stretch
MAINTAINER gerardo.v.flores@gmail.com
RUN git clone https://github.com/gerardofb/edgewaters.git
WORKDIR edgewaters
RUN git fetch
RUN git checkout contenedor_devready
RUN git pull
RUN npm install
EXPOSE 4000
