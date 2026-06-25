# ========== STAGE 1: Build ==========
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .

# ARG para seleccionar el perfil de compilación.
# Valores posibles: production | k8s | development
# Por defecto: k8s (para Minikube local)
ARG NG_CONFIG=k8s

# Usar npx ng directamente para evitar problemas con npm run build
RUN npx ng build --configuration=${NG_CONFIG}

# ========== STAGE 2: Serve ==========
FROM nginx:alpine
COPY --from=build /app/dist/delivery-frontendd/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
