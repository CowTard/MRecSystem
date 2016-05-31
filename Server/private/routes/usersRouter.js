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
                            console.log(err);
                            res.status(406).send(err);
                        });
                })
                .catch(function(_err) {

                    console.log(_err);
                    res.status(406).send('ok');
                });
        });

        server.get('/testSimilarRating', function(req, res) {

            var user = req.cookies.session.split('-')[0];

            database.getSensitiveData([user])
                .then(function(loggedUser) {
                    database.getRatingFunctionsOtherUsers(loggedUser.id)
                        .then(function(functionsToCompare) {
                            similarityBetweenUsersRating(loggedUser.id, functionsToCompare)
                                .then(function(bestUserID) {
                                    database.insertUserSimilarity(loggedUser.id, bestUserID)
                                        .then(function() {
                                            res.status(200).send();
                                        })
                                        .catch(function(err) {
                                            res.status(406).send(err);
                                        });
                                })
                                .catch(function(err) {
                                    res.status(406).send(err);
                                });

                        })
                        .catch(function(err) {
                            res.status(406).send('Email is not valid. We could not reference this like to your account.');
                        });

                })
                .catch(function(err) {
                    res.status(406).send('Email is not valid. We could not reference this like to your account.');
                });

        });

        server.get('/testSimilarMovies', function(req, res) {

            var user = req.cookies.session.split('-')[0];

            database.getSensitiveData([user])
                .then(function(loggedUser) {
                    database.getMoviesLikedByOtherUsers(loggedUser.id)
                        .then(function(moviesOthers) {
                            database.getLikedMovies(loggedUser.id)
                                .then(function(moviesLoggedUser) {
                                    similarityBetweenUsersMovies(moviesLoggedUser, moviesOthers)
                                        .then(function(bestUserID) {
                                            database.insertUserSimilarity(loggedUser.id, bestUserID)
                                                .then(function() {
                                                    res.status(200).send();
                                                })
                                                .catch(function(err) {
                                                    res.status(406).send(err);
                                                });
                                            res.status(200).send();
                                        })
                                        .catch(function(err) {
                                            res.status(406).send(err);
                                        });
                                })
                                .catch(function(err) {
                                    res.status(406).send(err);
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

            database.getRatingFunction([id])
                .then(function(functionParameters) {

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

                    var importance = {
                        'actors': similiarity(actors),
                        'directors': similiarity(directors),
                        'genre': similiarity(genres),
                        'rated': similiarity(rated),
                        'countries': similiarity(countries),
                        //'decades': similiarity(decades),
                    };

                    console.log(importance);
                    resolve();
                })
                .catch(function(err) {
                    console.log(err);
                    reject('We couldn\'t resolve your request');
                });
        });
    }

    // Function that calculates the similiarity
    /*
		Need major improvement on duration.
    */
    function similiarity(a_data) {

        var unique_entries = 0,
            changeable_a_data_0 = a_data[0],
            changeable_a_data_1 = a_data[1],
            positive_reps = {},
            negative_reps = {},
            balance = positive_reps;


        // Get number of repetitions in liked content
        for (var i = 0; i < changeable_a_data_1.length; i++) {

            if (positive_reps.hasOwnProperty(changeable_a_data_1[i])) {
                continue;
            } else {
                positive_reps[changeable_a_data_1[i]] = 1;

                unique_entries += 1;

                for (var j = 0; j < changeable_a_data_1.length; j++) {
                    if (j != i && changeable_a_data_1[i] == changeable_a_data_1[j]) {
                        positive_reps[changeable_a_data_1[i]] += 1;
                    }
                }
            }
        }

        // Get number of repetitions in disliked content
        for (var t = 0; t < changeable_a_data_0.length; t++) {

            if (negative_reps.hasOwnProperty(changeable_a_data_0[t])) {
                continue;
            } else {
                negative_reps[changeable_a_data_0[t]] = 1;

                unique_entries += 1;

                for (var p = 0; p < changeable_a_data_0.length; p++) {
                    if (p != t && changeable_a_data_0[t] == changeable_a_data_0[p]) {
                        negative_reps[changeable_a_data_0[t]] += 1;
                    }
                }
            }
        }

        // Get balance
        for (var key in negative_reps) {
            if (balance.hasOwnProperty(key)) {
                balance[key] -= negative_reps[key];
            } else {
                balance[key] = negative_reps[key];
            }
        }

        // Get some data
        // Get most liked parameters

        var most_liked_param = [],
            most_liked_param_number_of_rep = 0,
            numberOfRepetitions = 0,
            number_of_keys = 0,
            sumRepetions = 0;

        for (key in balance) {
            if (balance.hasOwnProperty(key)) {

                number_of_keys += 1;

                if (balance[key] > most_liked_param_number_of_rep) {
                    for (var value in most_liked_param) {
                        if (most_liked_param[value] < balance[key]) {
                            delete most_liked_param[value];
                        }
                    }
                    most_liked_param[key] = balance[key];
                    most_liked_param_number_of_rep = balance[key];
                    numberOfRepetitions += balance[key];
                } else if (balance[key] > 1 && balance[key] < -1) {
                    numberOfRepetitions += balance[key];
                }

                sumRepetions += balance[key];
            }
        }

        var mediamRepetions = sumRepetions / number_of_keys;

        //console.log('Pref: ', most_liked_param);
        //console.log('Media: ', mediamRepetions);

        //console.log('[' + most_liked_param + ', ' + most_liked_param_number_of_rep + ', ' + numberOfRepetitions + ', ' + number_of_keys + ']');

        // Return: Bigger repetitions and more repetitions => more importance

        var importance = Math.sqrt((most_liked_param_number_of_rep - mediamRepetions) * numberOfRepetitions / number_of_keys);

        // Function sqrt (  x_times_favorito * (x_times_favorito - median Repetitions)^2   )
        return { 'pref_param': most_liked_param, 'importance': importance };
    }

    //Function that calculates similarity between users and return the most similar
    function similarityBetweenUsersRating(loggedUserID, functionsToCompare) {

        return new Promise(function(resolve, reject) {
            var i;
            var mostSimilarUserID = null;
            var bestVariation = null;

            database.getRatingFunction(loggedUserID)
                .then(function(functionLoggedUser) {
                    for (i = 0; i < functionsToCompare.length; i++) {
                        var diffActors = Math.abs(functionLoggedUser[0].actors - functionsToCompare[i].actors);
                        var diffDirectors = Math.abs(functionLoggedUser[0].directors - functionsToCompare[i].directors);
                        var diffGenre = Math.abs(functionLoggedUser[0].genre - functionsToCompare[i].genre);
                        var diffIdletime = Math.abs(functionLoggedUser[0].idletime - functionsToCompare[i].idletime);
                        var diffRated = Math.abs(functionLoggedUser[0].rated - functionsToCompare[i].rated);
                        var diffRuntime = Math.abs(functionLoggedUser[0].runtime - functionsToCompare[i].runtime);
                        var diffTalktime = Math.abs(functionLoggedUser[0].talktime - functionsToCompare[i].talktime);
                        var diffCountry = Math.abs(functionLoggedUser[0].country - functionsToCompare[i].country);
                        var diffYear = Math.abs(functionLoggedUser[0].year - functionsToCompare[i].year);
                        var diffImdbrating = Math.abs(functionLoggedUser[0].imdbrating - functionsToCompare[i].imdbrating);

                        var variation = diffActors + diffDirectors + diffGenre + diffIdletime + diffRated + diffRuntime + diffTalktime + diffCountry + diffYear + diffImdbrating;
                        if (bestVariation == null || variation < bestVariation) {
                            bestVariation = variation;
                            mostSimilarUserID = functionsToCompare[i].userid;
                        }
                    }
                    resolve(mostSimilarUserID);
                })
                .catch(function(err) {
                    reject('We couldn\'t resolve your request');
                });

        });

    }

    //Function that calculates similarity between users and return the most similar
    function similarityBetweenUsersMovies(moviesLoggedUser, moviesOthers) {

        return new Promise(function(resolve, reject) {
            var i, j;
            var mostSimilarUserID = null;
            var similarMovies = [];
            for (i = 0; i < moviesLoggedUser.length; i++) {
                for (j = 0; j < moviesOthers.length; j++) {
                    if (moviesLoggedUser[i].id == moviesOthers[j].movieid) {
                        similarMovies.push(moviesOthers[j].userid);
                    }
                }
            }

            mostSimilarUserID = getTheHighestOcurrence(similarMovies);

            resolve(mostSimilarUserID);


        });

    }

    function getTheHighestOcurrence(array) {
        if (array.length == 0)
            return null;
        var modeMap = {};
        var maxEl = array[0],
            maxCount = 1;
        for (var i = 0; i < array.length; i++) {
            var el = array[i];
            if (modeMap[el] == null)
                modeMap[el] = 1;
            else
                modeMap[el]++;
            if (modeMap[el] > maxCount) {
                maxEl = el;
                maxCount = modeMap[el];
            }
        }
        return maxEl;
    }

}());
