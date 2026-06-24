# Usa uma imagem oficial do Node com as dependências completas do Chromium para o Puppeteer
FROM ghcr.io/puppeteer/puppeteer:21.9.0-node20

# Trocar para o usuário root para criar pastas e instalar dependências extras se necessário
USER root

WORKDIR /usr/src/app

# Copiar os arquivos de dependência
COPY package*.json ./

# Instalar as dependências do projeto
RUN npm install

# Copiar todo o código fonte
COPY . .

# Construir a aplicação (Frontend React e Backend Node)
RUN npm run build

# Definir as variáveis de ambiente necessárias para o Puppeteer no Docker
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Expor a porta usada pela aplicação
EXPOSE 3000

# Executar a aplicação
CMD ["npm", "start"]
