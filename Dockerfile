FROM node:24

ENV CSS_SPARQL_ENDPOINT=http://triplestore:8890/sparql
ENV CSS_CONFIG=config/config-mashlib-files.json
ENV EMAIL_SENDER=""
ENV EMAIL_HOST=""
ENV EMAIL_PORT=465
ENV EMAIL_USER=""
ENV EMAIL_PASSWORD=""
ENV CSS_BASE_URL=http://localhost:3000
ENV CSS_PORT=3000
ENV CSS_ROOT_FILE_PATH=/data
WORKDIR /usr/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE ${CSS_PORT}
CMD [ "npm", "start",\
    "--",\
    "--emailSenderName", "$EMAIL_SENDER",\
    "--emailHost", "$EMAIL_HOST",\
    "--emailPort", "$EMAIL_PORT",\
    "--emailUser", "$EMAIL_USER",\
    "--emailPassword", "$EMAIL_PASSWORD"] 
