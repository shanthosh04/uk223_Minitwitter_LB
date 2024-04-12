# Verwende das offizielle Node.js-Image als Basisimage
FROM node:latest

# Setze das Arbeitsverzeichnis innerhalb des Containers
WORKDIR /app

# Kopiere package.json und package-lock.json in den Container
COPY package*.json ./
COPY package-lock.json .

# Installiere Abhängigkeiten
RUN yarn install

# Kopiere den Rest des Codes in den Container
WORKDIR /uk233minitwitterlb

# Port freigeben
EXPOSE 4200

# Befehl, um die Anwendung auszuführen
CMD ["yarn", "dev"]
