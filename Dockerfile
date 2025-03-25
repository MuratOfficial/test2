# Используем официальный образ Node.js
FROM node:18

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь код в контейнер
COPY . .

# Создаем папку temp и даем права на запись
RUN mkdir -p /app/temp && chmod -R 777 /app/temp

# Открываем порт 3000
EXPOSE 3000

# Запускаем сервер с нужным параметром OpenSSL
CMD ["node", "--openssl-legacy-provider", "server.js"]
