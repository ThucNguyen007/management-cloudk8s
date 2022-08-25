#Base Image node
FROM node:lts-alpine3.16

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
