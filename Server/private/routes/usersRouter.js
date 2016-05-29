(function() {

    'use strict';

    var database = require('../database/database'),
        bcrypt = require('bcrypt-nodejs'),
        crypto = require('crypto');


    // Definition of the routes related with authentication.
    module.exports = function(server) {

        // Route related with register.
        server.post('/api/auth/register', function(req, res) {

            if (req.body.password == req.body.cpassword) {
                bcrypt.hash(req.body.password, null, null, function(err, hash) {
                    if (err) {
                        res.status(406).send('We couldn\'t hash your password.');
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
                            if (err) {
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

        // Route responsible to get all the movies.
        server.get('/api/movies', function(req, res) {

            // Get user in question by cookie
            var user = req.cookies.session.split('-')[0];

            database.getSensitiveData([user])
                .then(function(_info) {

                    database.getAllMovies([_info.id])
                        .then(function(_data) {
                            res.status(200).send(_data);
                        })
                        .catch(function() {
                            res.status(406).send('Oops. Something went wrong!');
                        });
                })
                .catch(function(err) {
                    res.status(406).send('Email is not valid. We could not reference this like to your account.');
                });
        });

        // Route responsible to handle the movie likes
        server.post('/api/movie', function(req, res) {

            // Get user in question by cookie
            var user = req.cookies.session.split('-')[0];

            database.getSensitiveData([user])
                .then(function(_info) {

                    // Get post parameter
                    var movieID = req.body.id;

                    // Add it to database
                    database.insertLike([_info.id, movieID])
                        .then(function(result) {












                            res.status(200).send('OK');
                        })
                        .catch(function(err) {
                            res.status(406).send(err);
                        });
                })
                .catch(function(err) {
                    res.status(406).send('Email is not valid. We could not reference this like to your account.');
                });
        });

        // Route that returns all liked movies from the requester
        server.get('/api/movies/liked', function(req, res) {

            // Get user in question by cookie
            var user = req.cookies.session.split('-')[0];

            database.getSensitiveData([user])
                .then(function(_info) {
                    database.getLikedMovies([_info.id])
                        .then(function(result) {
                            res.status(200).send(result);
                        })
                        .catch(function(err) {
                            res.status(406).send(err);
                        });
                })
                .catch(function(err) {
                    res.status(406).send('Email is not valid. We could not resolve this request.');
                });

        });
    };

}());
