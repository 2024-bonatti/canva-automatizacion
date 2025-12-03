import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreamos __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Contenido del Dockerfile
const dockerfileContent = `# Etapa 1: Construcción
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

// 2. Contenido de nginx.conf
const nginxContent = `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
`;

// 3. Contenido de docker-compose.yml
const composeContent = `version: '3.8'

services:
  sistema-cisterna-app:
    container_name: sistema_cisterna_plc
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    restart: always
`;

// Función para escribir archivos
function crearArchivo(nombre, contenido) {
    const ruta = path.join(__dirname, nombre);
    fs.writeFileSync(ruta, contenido);
    console.log(`✅ Creado: ${nombre}`);
}

console.log("🚀 Generando archivos de despliegue Docker...");

crearArchivo('Dockerfile', dockerfileContent);
crearArchivo('nginx.conf', nginxContent);
crearArchivo('docker-compose.yml', composeContent);

console.log("\n✨ ¡Listo! Archivos generados correctamente.");
console.log("👉 Ahora ejecuta: git add . && git commit -m 'Add Docker files' && git push");