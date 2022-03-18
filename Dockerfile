FROM node:16

ENV SPARQL_ENDPOINT http://triplestore:8890/sparql
ENV CONFIG_FILE config-mashlib-sparql.json

WORKDIR /usr/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000
CMD [ "npm", "start"]