const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const mongoose = require('mongoose')
const flash = require('connect-flash')
const bodyParser = require('body-parser');
const rabbitmq = require('amqplib/callback_api');

const apiAdapter = require('./apiAdapter');
const envProps = require('./env_props');
const indexRouter = require('./routes/index')
const session = require('./modules/session')
const passport = require('./modules/passport')

const searchServiceApi = apiAdapter(envProps.searchServiceURL);

const app = express()

const port = 8000;
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.disable('x-powered-by')

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

const dbHost = process.env.DB_HOST || 'localhost'
const dbPort = process.env.DB_PORT || 27017
const dbName = process.env.DB_NAME || 'my_db_name'
const dbUser = process.env.DB_USER
const dbUserPassword = process.env.DB_PASSWORD

const mongoUrl = 'mongodb+srv://product-api:y9A5BKSmnG4qzXy@firstcluster.gwfxw.mongodb.net/?retryWrites=true&w=majority'

const newConnection = function () { 
    // when using with docker, at the time we up containers. 
    // Mongodb take few seconds to starting, 
    // during that time NodeJS server will try to connect MongoDB until success.
    return mongoose.connect(
        mongoUrl, { 
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }, 
        (err) => {
            if (err) {
                console.error('Failed to connect to mongo on startup - retrying in 3 sec', err)
                setTimeout(newConnection, 3000)
            }
        })
}

newConnection();

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

// Set up the API routes ///////////////////////////////////////////////////////////////////////////////////////////////

// Create a new products
app.route('/api/v1/products').post( (req, res) => {
    const todoTitle = req.body.title;

    console.log('CALLED POST api/v1/products with title=' + todoTitle);

    // Send new Todo onto message queue for processing by product-search, and
    // Need different queues for the different ingestion services
    // (so we can have round-robin between each type when we scale up the solution)
    sendMessageOnQueue('search-ingestion', todoTitle);

    res.status(201).send(req.body);
});

// Search all todos
app.route('/api/v1/search').post((req, res) => {
    const searchText = req.body.searchText;

    console.log('CALLED POST api/v1/search with searchText=' + searchText);

    searchServiceApi.post(req.path, req.body)
        .then(resp => {
            console.log('Search Service response (' + resp.data + ')');
            res.send(resp.data);
        })
        .catch(err => {
            console.log('No response from Search Service');
        });
});

/**
 * Send a message on the passed in RabbitMQ Queue
 *
 * @param queueName the name of the queue to send message on
 * @param msg the message to send
*/
function sendMessageOnQueue(queueName, msg) {
    rabbitmq.connect(envProps.rabbitmqUrl, function (err, connection) {
        connection.createConfirmChannel(function (err, channel) {
            channel.assertQueue(queueName, {durable: true});
            channel.sendToQueue(queueName, Buffer.from(msg), {persistent: true},
                function (err, ok) {
                    if (err !== null)
                        console.warn("'%s' Message Nacked on queue '%s'", msg, queueName);
                    else
                        console.log("'%s' Message Acked on queue '%s'", msg, queueName);
                });
            console.log("Sent '%s' message on queue '%s'", msg, queueName);
        });

        setTimeout(function () {
            connection.close();
        }, 1000); // 1 second
    });
}

// Start the server ////////////////////////////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
    console.log('Product API Gateway started!');
});

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use(flash())
app.use(session)
app.use(passport.initialize())
app.use(passport.session())

app.use('/', indexRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404))
})

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.render('error')
})

// Start the server ////////////////////////////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
    console.log('Todo API Gateway started!');
});
