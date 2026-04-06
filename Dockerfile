FROM node:20-alpine

ENV BASE_URL=http://localhost:3000/
ENV PORT=3000
ENV ROOT_FILE_PATH=./data
ENV CONFIG_FILE=/config/file_based/mashlib-files.json

WORKDIR /usr/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE ${PORT}
CMD npm start -- \
    -c "$CONFIG_FILE" \
    -b "$BASE_URL" \
    -f "$ROOT_FILE_PATH" \
    -p "$PORT"
