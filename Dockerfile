FROM node:10.19.0-stretch
MAINTAINER gerardo.v.flores@gmail.com
RUN git clone https://github.com/gerardofb/edgewaters.git
WORKDIR edgewaters
RUN git checkout colasmensajes
RUN git pull
RUN npm install
EXPOSE 4000
