FROM node:22.22.0

#COPY . /app
WORKDIR /app
#RUN npm install

CMD ["node", "server.js"]

