FROM node:16

ENV SPARQL_ENDPOINT http://triplestore:8890/sparql
ENV CONFIG_FILE config/config-mashlib-files.json
ENV BASE_URL http://localhost:3000
ENV PORT 3000
ENV ROOT_FILE_PATH ./
WORKDIR /usr/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE ${PORT}
CMD [ "npm", "start"]