FROM node:16

ENV SPARQL_ENDPOINT http://triplestore:8890/sparql

WORKDIR /usr/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000
CMD [ "npm", "start"]