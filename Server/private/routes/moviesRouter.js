(function() {

    'use strict';

    var database = require('../database/database'),
        Promise = require('bluebird');


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
        server.post('/api/movie', function(req, res) {});

        // Route that returns all reviewd movies from the requester
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

            database.getReviewedMovies([1])
                .then(function(result) {

                    if (result.length > 0) {
                        analizeLikedMovies(result, 1)
                            .then(function(importance) {

                                var number_of_atributes_increase_every_time = 4;

                                var newFunction = calculateImportantAtt(importance[0], number_of_atributes_increase_every_time);

                                // Add importance

                                var sortable = [];
                                for (var att in newFunction)
                                    sortable.push([att, newFunction[att]]);

                                sortable = sortable.sort(function(a, b) {
                                    return a[1] - b[1];
                                });

                                var trade_attr_index = 0;
                                for (var i = sortable.length - 1; i > 10 - number_of_atributes_increase_every_time; i--, trade_attr_index++) {

                                    if (sortable[i][0] == 'decades')
                                        sortable[i][0] = 'year';

                                    if (sortable[trade_attr_index][0] == 'decades')
                                        sortable[trade_attr_index][0] = 'year';

                                    if (importance[1][sortable[trade_attr_index][0]] - sortable[i][1] >= 0) {

                                        importance[1][sortable[i][0]] = parseFloat(importance[1][sortable[i][0]]) + sortable[i][1];
                                        importance[1][sortable[trade_attr_index][0]] -= sortable[i][1];

                                        importance[1][sortable[i][0]] = importance[1][sortable[i][0]].toString();
                                        importance[1][sortable[trade_attr_index][0]] = importance[1][sortable[trade_attr_index][0]].toString();
                                    } else {
                                        importance[1][sortable[i][0]] += parseFloat(importance[1][sortable[trade_attr_index][0]]) - sortable[i][1];
                                        importance[1][sortable[trade_attr_index][0]] = '0';

                                        importance[1][sortable[i][0]] = importance[1][sortable[i][0]].toString();
                                    }
                                }


                                res.status(200).send(importance[1]);
                            })
                            .catch(function(err) {
                                console.log(err);
                                res.status(406).send(err);
                            });
                    } else {
                        res.status(406).send('Not a single thing to evaluate');
                    }
                })
                .catch(function(_err) {

                    console.log(_err);
                    res.status(406).send('ok');
                });
        });

    };
}());
