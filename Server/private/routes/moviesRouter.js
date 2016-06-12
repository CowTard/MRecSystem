(function() {

    'use strict';

    var database = require('../database/database'),
        Promise = require('bluebird'),
        movieUtils = require('../modules/movieUtils');


    // Definition of the routes related with authentication.
    module.exports = function(server) {

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
                .then(function(info) {

                    database.insertReview([info.id, req.body.id, req.body.review])
                        .then(function() {
                            res.status(200).send('OK');
                        })
                        .catch(function() {
                            res.status(406).send('Something went wrong on database insertion.');
                        })

                })
                .catch(function(err) {
                    res.status(406).send('There was something wrong.');
                });
        });

        // Route that returns all reviewed movies from the requester
        server.get('/api/movies/reviewed', function(req, res) {

            // Get user in question by cookie
            var user = req.cookies.session.split('-')[0];

            database.getSensitiveData([user])
                .then(function(_info) {
                    database.getReviewedMovies([_info.id])
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

        // Route that returns all rated movies from the requester
        server.get('/api/movies/rated', function(req, res) {

            // Get user in question by cookie
            var user = req.cookies.session.split('-')[0];

            database.getSensitiveData([user])
                .then(function(_info) {
                    database.getRatedMoviesForUser([_info.id])
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

            database.getReviewedMovies([3])
                .then(function(result) {

                    if (result.length > 0) {

                        database.getMovieByID([102])
                            .then(function(recentlyAddedMovie) {

                                movieUtils.calculate_new_importance_function(result, recentlyAddedMovie)
                                    .then(function(updatedAtributeFunction) {

                                        database.getRatingFunction([3])
                                            .then(function(old_rating_function) {

                                                movieUtils.adjust_rating_function(old_rating_function[0], updatedAtributeFunction)
                                                    .then(function(rating_function) {

                                                        var updating = [
                                                            rating_function.actors,
                                                            rating_function.directors,
                                                            rating_function.genre,
                                                            rating_function.idletime,
                                                            rating_function.rated,
                                                            rating_function.runtime,
                                                            rating_function.talktime,
                                                            rating_function.writers,
                                                            rating_function.year,
                                                            rating_function.imdbrating,
                                                            rating_function.userid,
                                                        ];
                                                        database.updateRatingFunction(updating)
                                                            .then(function() {
                                                                res.status(200).send('OK');
                                                            })
                                                            .catch(function() {
                                                                res.status(406).send('Something went wrong...');
                                                            })
                                                    })
                                                    .catch(function(err) {
                                                        console.log(err);
                                                        res.status(406).send('Something went wrong...');
                                                    });
                                            })
                                            .catch(function(err) {
                                                res.status(406).send('Something went wrong...');
                                            });
                                    })
                                    .catch(function(err) {
                                        res.status(406).send('Something went wrong...');
                                    })
                            })
                            .catch(function(err) {
                                res.status(406).send('Something went wrong...');
                            });
                    } else {
                        res.status(406).send('Not a single thing to evaluate');
                    }
                })
                .catch(function(_err) {
                    res.status(406).send('Something went wrong...');
                });
        });

    };
}());
