# Stage 1: Build de l'application Angular
FROM node:20-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json (si disponible)
COPY package*.json ./

# Installer toutes les dépendances (dev incluses pour le build)
RUN npm ci

# Copier le code source
COPY . .

# Build de l'application pour la production (avec budgets ajustés)
RUN npm run build -- --configuration=production

# Stage 2: Serveur Nginx pour servir l'application
FROM nginx:alpine

# Supprimer la configuration par défaut de nginx
RUN rm -rf /usr/share/nginx/html/*
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage builder (Angular 19 utilise le dossier browser/)
COPY --from=builder /app/dist/retro-nova-backoffice/browser /usr/share/nginx/html

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/nginx.conf

# Vérifier que les fichiers sont bien copiés et créer un fichier de test
RUN ls -la /usr/share/nginx/html/
RUN echo "Test file" > /usr/share/nginx/html/test.txt

# S'assurer que les permissions sont correctes
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Commande pour démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
