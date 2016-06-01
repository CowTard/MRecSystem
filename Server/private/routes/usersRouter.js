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
                        .then(function(_temp) {

                            database.getReviewedMovies([_info.id])
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

                                                        importance[1][sortable[i][0]] = parseFloat(importance[1][sortable[i][0]]) + parseFloat(sortable[i][1]);
                                                        importance[1][sortable[trade_attr_index][0]] = parseFloat(importance[1][sortable[trade_attr_index][0]]) - parseFloat(sortable[i][1]);

                                                        importance[1][sortable[i][0]] = importance[1][sortable[i][0]].toString();
                                                        importance[1][sortable[trade_attr_index][0]] = importance[1][sortable[trade_attr_index][0]].toString();
                                                    } else {
                                                        importance[1][sortable[i][0]] = parseFloat(importance[1][sortable[i][0]]) + parseFloat(importance[1][sortable[trade_attr_index][0]]) - parseFloat(sortable[i][1]);
                                                        importance[1][sortable[trade_attr_index][0]] = '0';

                                                        importance[1][sortable[i][0]] = importance[1][sortable[i][0]].toString();
                                                    }
                                                }

                                                console.log(importance[1]);
                                                database.getMovies()
                                                    .then(function(result) {

                                                        var arrayUpdate = [];

                                                        result.forEach(function(mov) {

                                                            var bonus = false,
                                                                rating = 0;

                                                            // , [0], _ac, _dir, _gen, _rated, _writers, _decades, _runtime, _idleTime, _talktime, _imdbrating]
                                                            // Actors 

                                                            var result = checkingAtributeOnLikedArray(mov.actors, importance[2]);

                                                            rating += parseFloat(importance[1].actors) * result[0];
                                                            bonus = bonus || result[1];

                                                            //console.log('Actors: ', parseFloat(importance[1].actors) * result[0] * 10);

                                                            // Directors 

                                                            result = checkingAtributeOnLikedArray(mov.directors, importance[3]);

                                                            rating += parseFloat(importance[1].directors) * result[0];
                                                            bonus = bonus || result[1];

                                                            //console.log('Directors: ', parseFloat(importance[1].directors) * result[0] * 10);

                                                            // Genres 

                                                            result = checkingAtributeOnLikedArray(mov.genre, importance[4]);

                                                            rating += parseFloat(importance[1].genre) * result[0];
                                                            bonus = bonus || result[1];

                                                            //console.log('Genres: ', parseFloat(importance[1].genre) * result[0] * 10);

                                                            // Rated 

                                                            result = checkingAtributeOnLikedArray(mov.rated, importance[5]);

                                                            rating += parseFloat(importance[1].rated) * result[0];
                                                            bonus = bonus || result[1];

                                                            //console.log('Rate: ', parseFloat(importance[1].rated) * result[0] * 10);

                                                            // Writers 

                                                            result = checkingAtributeOnLikedArray(mov.writers, importance[6]);

                                                            rating += parseFloat(importance[1].writers) * result[0];
                                                            bonus = bonus || result[1];

                                                            //console.log('Writers: ', parseFloat(importance[1].writers) * result[0] * 10);

                                                            // Decades 

                                                            result = checkingAtributeOnLikedArray(mov.year, importance[7]);

                                                            rating += parseFloat(importance[1].year) * result[0];
                                                            bonus = bonus || result[1];

                                                            //console.log('Decades: ', parseFloat(importance[1].year) * result[0] * 10);

                                                            // Run Time 

                                                            if (importance[8][0].length === 0 || importance[8][1].length === 0)
                                                                result = 1;
                                                            else
                                                                result = checkingTimeSimilarity(mov.runtime, importance[8]);

                                                            rating += parseFloat(importance[1].runtime) * result;

                                                            //console.log('Run time: ', parseFloat(importance[1].runtime) * result * 10);

                                                            // idle Time 
                                                            if (importance[9][0].length === 0 || importance[9][1].length === 0)
                                                                result = 1;
                                                            else
                                                                result = checkingTimeSimilarity(mov.idletime, importance[9]);

                                                            rating += parseFloat(importance[1].idletime) * result;

                                                            //console.log('Idle time: ', parseFloat(importance[1].idletime) * result * 10);

                                                            // talk Time 
                                                            if (importance[10][0].length === 0 || importance[10][1].length === 0)
                                                                result = 1;
                                                            else
                                                                result = checkingTimeSimilarity(mov.talktime, importance[10]);

                                                            rating += parseFloat(importance[1].talktime) * result;

                                                            //console.log('Talk time: ', parseFloat(importance[1].talktime) * result * 10);
                                                            arrayUpdate.push({ 'rating': rating * 10, 'id': mov.id });
                                                        });

                                                        database.updateAllMovies(arrayUpdate, _info.id)
                                                            .then(function(_res) {

                                                                var ar_toUpdate = [];
                                                                // TODO: Panic. Change
                                                                for (var ratefun in importance[1]) {
                                                                    if (ratefun != 'id' && ratefun != 'userid') {
                                                                        console.log(ratefun);
                                                                        ar_toUpdate.push(importance[1][ratefun]);
                                                                    }
                                                                }

                                                                ar_toUpdate.push(_info.id);

                                                                console.log(ar_toUpdate);
                                                                database.updateRatingFunction(ar_toUpdate)
                                                                    .then(function(_) {
                                                                        res.status(200).send('OK');
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
                                                        console.log(err);
                                                        res.status(406).send('We could not resolve your request.');
                                                    });

                                            })
                                            .catch(function(err) {
                                                console.log(err);
                                                res.status(406).send(err);
                                            });
                                    } else {
                                        res.status(406).send('Not a single thing to evaluate');
                                    }
                                })
                                .catch(function(err) {
                                    console.log(err);
                                    res.status(406).send('We could not resolve your request.');
                                });
                        })
                        .catch(function(err) {
                            console.log(err);
                            res.status(406).send(err);
                        });
                })
                .catch(function(err) {
                    res.status(406).send('Email is not valid. We could not reference this like to your account.');
                });
        });

        // Route responsible to handle the movie likes
        server.get('/api/updatePredictions', function(req, res) {

            // Get user in question by cookie
            var user = req.cookies.session.split('-')[0];

            database.getSensitiveData([user])
                .then(function(loggedUser) {
                    var movies = [{
                        id: 1,
                        rating: 8
                    }, {
                        id: 2,
                        rating: 0
                    }, {
                        id: 3,
                        rating: 5
                    }];
                    //mudar para post e ter realmente os filmes aqui
                    database.updateAllMovies(movies, loggedUser.id)
                        .then(function(result) {
                            res.status(200).send(result);
                        })
                        .catch(function(err) {
                            res.status(406).send(err);
                        });
                })
                .catch(function(err) {
                    res.status(406).send('Email is not valid. We could not reference this like to your account.');
                });
        });

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
            // Params = [ Actors, Directors, Genre, IdleTime, imdbRating, Rated, runtime, talktime, writers, year]
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
            //  --> writers
            //      Like writers vs dislike writers | If there's repetition, improve. Contradition = ? 
            //
            //  @returns [ Importance , Actors, Directors, Genre, IdleTime, imdbRating, Rated, runtime, talktime, writers, year]
            //

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

            // Get liked and disliked writers
            var writers = [
                [], // liked writers
                [] // Disliked writers
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

                        // Sorting writers
                        _movie.writers.split('- ').forEach(function(writer) {
                            writers[_movie.liked & 1].push(writer);
                        });

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
                        'actors': similarity(actors),
                        'directors': similarity(directors),
                        'genre': similarity(genres),
                        'rated': similarity(rated),
                        'writers': similarity(writers),
                        'decades': similarity(decades),
                        'runtime': time_similarity(runtime),
                        'idleTime': time_similarity(idleTime),
                        'talktime': time_similarity(talktime),
                        'imdbrating': { 'importance': 0.1, 'pref_param': '9', 'sorted': imdbrating } // Need one way of checking
                    };

                    database.updateBestAtributes([importance.actors.pref_param, importance.directors.pref_param,
                            importance.genre.pref_param, importance.idleTime.pref_param, importance.rated.pref_param,
                            importance.runtime.pref_param, importance.talktime.pref_param, importance.writers.pref_param,
                            importance.decades.pref_param, importance.imdbrating.pref_param, id
                        ])
                        .then(function(result) {

                            var _ac = importance.actors.sorted,
                                _dir = importance.directors.sorted,
                                _gen = importance.genre.sorted,
                                _rated = importance.rated.sorted,
                                _writers = importance.writers.sorted,
                                _decades = importance.decades.sorted,
                                _runtime = importance.runtime.sorted,
                                _idleTime = importance.idleTime.sorted,
                                _talktime = importance.talktime.sorted,
                                _imdbrating = importance.imdbrating.sorted;

                            importance.actors = importance.actors.importance * functionParameters[0].actors;
                            importance.directors = importance.directors.importance * functionParameters[0].directors;
                            importance.genre = importance.genre.importance * functionParameters[0].genre;
                            importance.rated = importance.rated.importance * functionParameters[0].rated;
                            importance.writers = importance.writers.importance * functionParameters[0].writers;
                            importance.decades = importance.decades.importance * functionParameters[0].year;
                            importance.runtime = importance.runtime.importance * functionParameters[0].runtime;
                            importance.idleTime = importance.idleTime.importance * functionParameters[0].idletime;
                            importance.talktime = importance.talktime.importance * functionParameters[0].talktime;
                            importance.imdbrating = importance.imdbrating.importance * functionParameters[0].imdbrating;

                            resolve([importance, functionParameters[0], _ac, _dir, _gen, _rated, _writers, _decades, _runtime, _idleTime, _talktime, _imdbrating]);
                        })
                        .catch(function(err) {
                            console.log(err);
                            reject(err);
                        });
                })
                .catch(function(err) {
                    console.log(err);
                    reject('We couldn\'t resolve your request');
                });
        });
    }

    // Function that calculates the similarity
    /*
        Need major improvement on duration.
    */
    function similarity(a_data) {

        var unique_entries = 0,
            changeable_a_data_0 = a_data[0],
            changeable_a_data_1 = a_data[1],
            positive_reps = {},
            negative_reps = {};

        // Get number of repetitions in liked content
        for (var i = 0; i < changeable_a_data_1.length; i++) {

            if (positive_reps.hasOwnProperty(changeable_a_data_1[i])) {
                continue;
            } else {
                positive_reps[changeable_a_data_1[i]] = 0;

                unique_entries += 1;

                for (var j = 0; j < changeable_a_data_1.length; j++) {
                    if (j != i && changeable_a_data_1[i] == changeable_a_data_1[j]) {
                        positive_reps[changeable_a_data_1[i]] += 1;
                    }
                }
            }
        }


        var balance = positive_reps;

        // Get number of repetitions in disliked content
        for (var t = 0; t < changeable_a_data_0.length; t++) {

            if (negative_reps.hasOwnProperty(changeable_a_data_0[t])) {
                continue;
            } else {
                negative_reps[changeable_a_data_0[t]] = 0;

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

        var most_liked_param = '',
            most_liked_param_number_of_rep = -500,
            numberOfRepetitions = 0,
            number_of_keys = 0,
            sumRepetions = 0;

        for (key in balance) {

            if (balance.hasOwnProperty(key)) {

                number_of_keys += 1;
                if (balance[key] > most_liked_param_number_of_rep) {

                    most_liked_param = key;
                    most_liked_param_number_of_rep = balance[key];
                    numberOfRepetitions += Math.abs(balance[key]);
                } else if (balance[key] > 1 && balance[key] < -1) {
                    numberOfRepetitions += Math.abs(balance[key]);
                }

                sumRepetions += balance[key];
            }
        }

        var mediamRepetions = Math.abs(sumRepetions / number_of_keys);

        // Return: Bigger repetitions and more repetitions => more importance
        var importance = Math.sqrt((most_liked_param_number_of_rep - mediamRepetions) * numberOfRepetitions / number_of_keys);

        return { 'pref_param': most_liked_param, 'importance': importance, 'sorted': balance };
    }

    // Function to retrieve a new function
    function calculateImportantAtt(importance, numberToChange) {
        if (numberToChange > 1 + importance.length / 2) {
            throw 'YOU CANT DO THIS.';
        } else {

            var array_imp = {};
            for (var key in importance) {
                array_imp[key] = importance[key];
            }

            return array_imp;
        }
    }

    // Function to calculate similarity between times
    function time_similarity(a_data) {

        var positive_reviews = a_data[1],
            negative_reviews = a_data[0];

        var positiveTime = 0;
        positive_reviews.forEach(function(value) {
            positiveTime += value;
        });

        var negativeTime = 0;
        negative_reviews.forEach(function(value) {
            negativeTime += value;
        });

        if (positive_reviews.length === 0 || negative_reviews.length === 0) {
            return { 'importance': 0, 'pref_param': -1, 'sorted': a_data };
        }

        var importance = Math.sqrt(Math.pow(positiveTime / positive_reviews.length - negativeTime / negative_reviews.length, 2));

        return { 'importance': 1 / Math.exp(1 - 1 / Math.pow(importance, 2)), 'pref_param': positiveTime / positive_reviews.length, 'sorted': a_data };
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
                        var diffWriters = Math.abs(functionLoggedUser[0].writers - functionsToCompare[i].writers);
                        var diffYear = Math.abs(functionLoggedUser[0].year - functionsToCompare[i].year);
                        var diffImdbrating = Math.abs(functionLoggedUser[0].imdbrating - functionsToCompare[i].imdbrating);

                        var variation = diffActors + diffDirectors + diffGenre + diffIdletime + diffRated + diffRuntime + diffTalktime + diffWriters + diffYear + diffImdbrating;
                        if (bestVariation === null || variation < bestVariation) {
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
                    if (moviesLoggedUser[i].id == moviesOthers[j].movieid)
                        similarMovies.push(moviesOthers[j].userid);

                }
            }

            mostSimilarUserID = getTheHighestOcurrence(similarMovies);

            resolve(mostSimilarUserID);

        });
    }

    function getTheHighestOcurrence(array) {
        if (array.length === 0)
            return null;
        var modeMap = {};
        var maxEl = array[0],
            maxCount = 1;
        for (var i = 0; i < array.length; i++) {
            var el = array[i];
            if (modeMap[el] === null)
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


    // Function to check if a user is on preferable one
    function checkingAtributeOnLikedArray(movieParam, userParam) {

        var Num_param = 1;
        var movieParams = movieParam.split('- '),
            bonus = false;

        movieParams.forEach(function(param) {
            if (userParam.hasOwnProperty(param) && userParam[param] > 0) {
                if (userParam[param] > 5) {
                    bonus = true;
                }

                Num_param += 1;
            }
        });

        return [Num_param / movieParams.length, bonus];
    }

    // Function to check time
    function checkingTimeSimilarity(movieParam, userParam) {

        var pos_median = 0;

        userParam[1].forEach(function(value) {
            pos_median += value;
        });

        pos_median = pos_median / userParam[1].length;

        var result = 0;
        if (movieParam <= pos_median)
            result = Math.pow(movieParam, 2) / Math.pow(pos_median, 2);
        else {
            result = Math.pow(movieParam - 2, 2) / Math.pow(pos_median - 2, 2);
        }

        return result;
    }

}());
