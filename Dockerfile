#Base Image node
FROM node:lts-alpine3.16

# Install Google Chrome Image
# RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add - && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list
# RUN apt-get update && apt-get -y install google-chrome-stable

WORKDIR /app

RUN npm install -g pm2

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production --silent

COPY . .

# Create a group and user
RUN addgroup -g 1012 appgroup

RUN adduser -D -u 1009  appuser -G appgroup

RUN chown -R appuser:appgroup /app

USER appuser

CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production"]
