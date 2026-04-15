FROM node:20-alpine

ENV BASE_URL=http://localhost:3000/
ENV PORT=3000
ENV ROOT_FILE_PATH=./data
ENV CONFIG_FILE=/config/file_based/mashlib-files.json

WORKDIR /usr/app

COPY package*.json ./
RUN npm install

COPY . .

# Bake default config and templates at their expected absolute paths.
# Operators can override either directory via volume mounts:
#   /config/          CSS configuration files
#   /templates/       Pod and root Solid templates
#   /usr/app/custom/  HTML/CSS/JS branding assets
COPY config/ /config/
COPY templates/ /templates/

EXPOSE ${PORT}
CMD npm start -- \
    -c "$CONFIG_FILE" \
    -b "$BASE_URL" \
    -f "$ROOT_FILE_PATH" \
    -p "$PORT"
