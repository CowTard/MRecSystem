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
                    var movieID = req.body.id,
                        review = req.body.review;

                    // Add it to database
                    database.insertReview([_info.id, movieID, review])
                        .then(function(result) {

                            database.getReviewedMovies([_info.id])
                                .then(function(_result) {

                                    analizeLikedMovies(_result)
                                        .then(function(_) {
                                            res.status(200).send('OK');
                                        })
                                        .catch(function(_err) {
                                            res.status(406).send('We could not resolve your request.');
                                        });
                                })
                                .catch(function(err) {
                                    res.status(406).send('We could not resolve your request.');
                                });
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
                    res.status(406).send('Email is not valid. We could not resolve your request.');
                });

        });

        server.get('/test', function(req, res) {

            database.getReviewedMovies([1])
                .then(function(result) {
                    res.status(200).send(result);
                })
                .catch(function(res) {
                    res.status(406).send('ok');
                });
        });
    };

    // Function to analyze liked movies and return a new function
    function analizeLikedMovies(moviesArray) {
        return new Promise(function(resolve, reject) {


            //
            // ANALIZE FUNCTION
            //  
            // Params = [ Actors, Directors, Genre, IdleTime, imdbRating, Rated, runtime, talktime, timetoread, year]
            //
            // --> Actors
            //      Liked Actors vs Disliked Actors | If there's repetition, improve. Contradition = ?
            // --> Directors
            //      Liked Directors vs Disliked Directors | If there's repetition improve. Contradition = ?
            // --> Genre
            //      Liked Genres vs Disliked Genres | If there's repetition improve. Contradition = ?
            //  --> IdleTime, runtime, talktime, timetoread
            //      See function
            //  --> ImdbRating
            //      Calculate disparity
            //  --> Rated
            //      Liked rates vs dislike rates | If there's repetition, improve. Contradition = ?
            //  --> Year
            //      Like decades vs dislike decades | If there's repetition, improve. Contradition = ?
            //
            // 

            console.log(moviesArray);

            // Get liked and disliked actors
            var dislikedActors = [];
            var likedActors = [];

            // Get liked and disliked directors
            var dislikedDirectors = [];
            var likedDirectors = [];

            // Get liked and dislike genres
            var dislikedGenres = [];
            var likedGenres = [];

            // Get Liked and disliked rated
            var dislikedRated = [];
            var likedRated = [];

            // Get liked and disliked decades
            var dislikedDecades = [];
            var likedDecades = [];

            for (var i = 0; i < len(moviesArray); i++) {

            }

            resolve();
        });
    }


}());
