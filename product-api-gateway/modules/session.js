const session = require('express-session')
const redis = require('redis')
const RedisStore = require('connect-redis')(session)

const client = redis.createClient({
  // this must match the container name of redis image
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD 
})

module.exports = session({
  store: new RedisStore({
    client
  }),
  secret: 'supersecret',
  resave: false,
  saveUninitialized: true
})
