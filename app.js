var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const MongoClient = require("mongodb").MongoClient;

MongoClient.connect("mongodb+srv://newsletter:newsletter@cluster0.5gae8.mongodb.net/Newsletter?retryWrites=true&w=majority", { //HÄR KAN DU ÄNDRA ADRESSEN SKA VARA LOKALT ELLER TILL ETT MOLN
    useUnifiedTopology: true
})
.then(client => {
    console.log("Vi är uppkopplade mot databasen!");
    const db = client.db("usersbook");

    app.locals.db = db;
})

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'),{index:false}));

app.use('/', usersRouter);
app.use('/users', usersRouter);

module.exports = app;
