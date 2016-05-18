(function () {

    'use strict';

    var express = require('express'),
        server = express(),
        http = require('http').Server(server),
        morgan = require('morgan'),
        path = require('path'),
        bodyParser = require('body-parser');
        //database = require('./database/database');

    /* Create a connection to the database
    database.connect()
        .then(function () {
            // Sending the error to the log file
            console.log('@server.js: Connected to database.');
        })
        .catch(function (err) {
            // Sending the error to the log file
            console.log('@server.js: Can\'t connect to database.');
            console.log(err);
        });
    */

    // Sets the folder where are the files are static
    server.use(express.static(path.resolve(__dirname, '../public/')));

    // Sets the folder where the views are
    server.set('views', path.resolve(__dirname, '../public/app'));

    // Sets the view engine to EJS
    server.set('view engine', 'ejs');

    // Allows the server to read JSON files
    server.use(bodyParser.urlencoded({
        extended: false
    }));

    server.use(bodyParser.json());

    // Outputs simple log information to the console.
    server.use(morgan('dev'));

    // Calls the router where all routes are called. This is done so the 'server.js' file is cleaner and more maintainable.
    require('./routes/router')(server, http);

    // Starts the server using port 8080
    http.listen(8080, function () {
        console.log('Server listening to port 8080');
    });

} ());