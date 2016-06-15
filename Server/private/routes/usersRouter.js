(function() {

    'use strict';

    var database = require('../database/database'),
        Promise = require('bluebird'),
        bcrypt = require('bcrypt-nodejs'),
        crypto = require('crypto');


    // Definition of the routes related with authentication.
    module.exports = function(server) {

        // Route related with register.
        server.post('/api/auth/register', function(req, res) {

            if (req.body.password == req.body.cpassword) {
                bcrypt.hash(req.body.password, null, null, function(err, hash) {
                    if (err) {
                        res.status(406).send('We could not hash your password.');
                    } else {
                        crypto.randomBytes(32, function(err, buf) {

                            if (err) {
                                res.status(406).send('Sorry. Something went wrong.');
                            } else {
                                database.addUser([req.body.username, hash, buf.toString('hex')])
                                    .then(function(_) {
                                        res.status(200).send('You can login now :).');
                                    })
                                    .catch(function(err) {
                                        res.status(406).send('There was an error on our server. Try again later.');
                                    });
                            }
                        });
                    }
                });
            } else {
                res.status(406).send('Password do not match.');
            }
        });

        // Route related with login.
        server.post('/api/auth/login', function(req, res) {

            database.getSensitiveData([req.body.username])
                .then(function(_data) {
                    bcrypt.compare(req.body.password, _data.password, function(err, _res) {
                        if (err) {
                            res.status(406).send('Oops. Something went wrong!');
                        } else {
                            if (!_res) {
                                res.status(406).send('Email or password don\'t checkout');
                            } else {
                                res.status(200).send(req.body.username + '-' + _data.token);
                            }
                        }
                    });
                })
                .catch(function() {
                    res.status(406).send('Oops. Something went wrong!');
                });
        });

        // Route that returns all rated movies from the requester
        server.post('/api/search', function(req, res) {

            var movieTitle = req.body.title;
            // Get user in question by cookie
            var user = req.cookies.session.split('-')[0];

            database.getSensitiveData([user])
                .then(function(_info) {
                    database.searchMovie(_info.id, [movieTitle])
                        .then(function(result) {
                            res.status(200).send(result);
                        })
                        .catch(function(err) {
                            console.log(err);
                            res.status(406).send('Email is not valid. We could not resolve your request.');
                        });
                })
                .catch(function(err) {
                    res.status(406).send('Email is not valid. We could not resolve your request.');
                });

        });

    };
}());
