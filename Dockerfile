FROM alpine:latest

WORKDIR /usr/src/app

COPY index.js package*.json ./

RUN apk add nodejs
RUN apk add npm
RUN npm install

EXPOSE 8080
CMD ["npm", "start", "--"]