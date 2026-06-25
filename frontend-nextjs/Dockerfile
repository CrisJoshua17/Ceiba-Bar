# ========== STAGE 1: Build ==========
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install

# Copiamos todo el código fuente primero
COPY . .

# ARG para seleccionar el archivo de entorno.
# Por defecto: .env.k8s (Minikube local)
# Para producción: --build-arg ENV_FILE=.env.production
ARG ENV_FILE=.env.k8s

# Copiamos el env DESPUÉS del COPY . . para que no sea sobreescrito
# El .dockerignore excluye .env.local, pero .env.k8s y .env.production sí entran
COPY ${ENV_FILE} .env.local

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ========== STAGE 2: Runtime ==========
FROM node:20-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER app
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "server.js"]
