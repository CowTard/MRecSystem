(function() {

    'use strict';

    var pg = require('pg'),
        Promise = require('bluebird'),
        database = require('../secrets/database'),
        conString = 'postgres://' + database.user + ':' + database.password + '@' + database.url + ':' + database.port + '/' + database.database,
        client = new pg.Client(conString);

    // Function called in the start of the server to connect to the database
    exports.connect = function() {
        return new Promise(function(resolve, reject) {
            client.connect(function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    // Function to disconnect the database from the server. Shouldn't be called.
    exports.disconnect = function() {
        client.end();
    };

}());
