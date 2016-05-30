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
                                        .then(function() {
                                            res.status(200).send('OK');
                                        })
                                        .catch(function(_err) {
                                            res.status(406).send('We could not resolve your request.');
                                        });
                                })
                                .catch(function(err) {
                                    console.log(err);
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
                    analizeLikedMovies(result, 1)
                        .then(function() {
                            res.status(200).send(result);
                        })
                        .catch(function(err) {
                            res.status(406).send(err);
                        });
                })
                .catch(function(res) {
                    res.status(406).send('ok');
                });
        });
    };

    // Function to analyze liked movies and return a new function
    function analizeLikedMovies(moviesArray, id) {
        return new Promise(function(resolve, reject) {

            //
            // ANALIZE FUNCTION
            //  
            // Params = [ Actors, Directors, Genre, IdleTime, imdbRating, Rated, runtime, talktime, country, year]
            //
            // --> Actors
            //      Liked Actors vs Disliked Actors | If there's repetition, improve. Contradition = ?
            // --> Directors
            //      Liked Directors vs Disliked Directors | If there's repetition improve. Contradition = ?
            // --> Genre
            //      Liked Genres vs Disliked Genres | If there's repetition improve. Contradition = ?
            //  --> IdleTime, runtime, talktime
            //      See function
            //  --> ImdbRating
            //      Calculate disparity
            //  --> Rated
            //      Liked rates vs dislike rates | If there's repetition, improve. Contradition = ?
            //  --> Year
            //      Like decades vs dislike decades | If there's repetition, improve. Contradition = ?
            //  --> Country
            //      Like country vs dislike country | If there's repetition, improve. Contradition = ? 

            // Get liked and disliked actors

            var actors = [
                [], // Liked actors
                [] // Disliked actors
            ];

            // Get liked and disliked directors
            var directors = [
                [], // Liked directors
                [] // Disliked directors
            ];

            // Get liked and dislike genres
            var genres = [
                [], // Liked genres
                [] // Disliked genres
            ];

            // Get Liked and disliked rated
            var rated = [
                [], // Liked rated
                [] // Disliked rated
            ];

            // Get liked and disliked decades
            var decades = [
                [], // Liked decades
                [] // Disliked decades
            ];

            // Get liked and disliked countries
            var countries = [
                [], // liked countries
                [] // Disliked countries
            ];

            // Get liked and disliked countries
            var imdbrating = [
                [], // liked ratings
                [] // Disliked ratings
            ];

            // Get liked and disliked countries
            var idleTime = [
                [], // liked idle times
                [] // Disliked idle times
            ];

            // Get liked and disliked countries
            var talktime = [
                [], // liked talk time
                [] // Disliked talk time
            ];

            // Get liked and disliked countries
            var runtime = [
                [], // liked runtime
                [] // Disliked runtime
            ];

            moviesArray.forEach(function(_movie, index) {

                // Sorting actors
                _movie.actors.split('- ').forEach(function(actor) {
                    actors[_movie.liked & 1].push(actor);
                });

                // Sorting directors
                _movie.directors.split('- ').forEach(function(director) {

                    directors[_movie.liked & 1].push(director);
                });

                // Sorting genres
                _movie.genre.split(', ').forEach(function(genre) {
                    genres[_movie.liked & 1].push(genre);
                });

                // Sorting rate
                rated[_movie.liked & 1].push(_movie.rated);

                // Sorting countries
                countries[_movie.liked & 1].push(_movie.country);

                // Sorting years
                // There is a bit of an hack here. We know for sure there isn't a movie that was released before 1920. 
                // With that we can just take the third number and add a 0 to have decades without getting ambiguous
                decades[_movie.liked & 1].push(_movie.year.split('')[2].toString() + '0');

                // Sorting imdb rating
                imdbrating[_movie.liked & 1].push(_movie.imdbrating);

                // Sorting idle time
                idleTime[_movie.liked & 1].push(_movie.idletime);

                // Sorting talk time
                talktime[_movie.liked & 1].push(_movie.talktime);

                // Sorting runtime
                runtime[_movie.liked & 1].push(_movie.runtime);
            });

            database.getRatingFunction([id])
                .then(function(functionParameters) {
                    console.log(functionParameters);
                    console.log('actors: ', actors);
                    console.log('directors: ', directors);
                    console.log('genres: ', genres);
                    console.log('rated: ', rated);
                    console.log('country: ', countries);
                    console.log('decades: ', decades);
                    console.log('IMDB: ', imdbrating);
                    console.log('country: ', countries);
                    console.log('IdleTime: ', idleTime);
                    console.log('Talk time: ', talktime);
                    console.log('Runtime: ', runtime);
                    resolve();
                })
                .catch(function(err) {
                    reject('We couldn\'t resolve your request');
                });
        });
    }

    // Function that calculates 
    function similiarity(a_data) {

    };

}());
