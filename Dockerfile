FROM node:16

ENV SPARQL_ENDPOINT http://triplestore:8890/sparql
ENV CONFIG_FILE config/config-mashlib-files.json
ENV EMAIL_SENDER ""
ENV EMAIL_PORT 465
ENV EMAIL_USER ""
ENV EMAIL_PASSWORD ""
ENV BASE_URL http://localhost:3000
ENV PORT 3000
ENV ROOT_FILE_PATH ./
WORKDIR /usr/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE ${PORT}
CMD [ "npm", "start",\
    "--",\
    "-c", "$CONFIG_FILE",\
    "-s", "$SPARQL_ENDPOINT",\
    "-b", "$BASE_URL",\
    "-f", "$ROOT_FILE_PATH",\
    "-p", "$PORT",\
    "--emailSenderName", "$EMAIL_SENDER",\
    "--emailPort", "$EMAIL_PORT",\
    "--emailUser", "$EMAIL_USER",\
    "--emailPassword", "$EMAIL_PASSWORD"] 