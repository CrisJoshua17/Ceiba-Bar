# ========== STAGE 1: Build ==========
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration production

# ========== STAGE 2: Serve ==========
FROM nginx:alpine
COPY --from=build /app/dist/delivery-frontendd/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
