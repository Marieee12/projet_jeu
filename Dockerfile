# Image de base Node.js
FROM node:22.22.0

# Définir le dossier de travail
WORKDIR /app

# Lancer l'application
CMD ["sh", "-c", "npm install && node server.js"]
