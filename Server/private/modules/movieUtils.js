(function() {

    'use strict';

    var Promise = require('bluebird'),
        database = require('../database/database')

    module.exports = {

        /*
            Receives the user movie preferences and the new one.
            @returns: An array with new importance atributes    
        */
        calculate_new_importance_function: function(movieLikes, new_movie, is_new_movie_liked) {

            return new Promise(function(resolve, reject) {

                var globalInformation = {
                    // Non time atributes
                    actors: {},
                    directors: {},
                    writers: {},
                    genre: {},
                    rated: {},
                    imdb: {},
                    year: {},
                    // Time atributes
                    idletime: {},
                    runtime: {},
                    talktime: {}
                };

                // Populating globalInformation object
                movieLikes.forEach(function(movie) {

                    var isMovieLiked = movie.liked ? 1 : -1;

                    // Actors
                    globalInformation.actors = updateNonTimingAtributeValues(globalInformation.actors, movie.actors.split('- '), isMovieLiked);

                    // Directors
                    globalInformation.directors = updateNonTimingAtributeValues(globalInformation.directors, movie.directors.split('- '), isMovieLiked);

                    // Writers
                    globalInformation.writers = updateNonTimingAtributeValues(globalInformation.writers, movie.writers.split('- '), isMovieLiked);

                    // Genre
                    globalInformation.genre = updateNonTimingAtributeValues(globalInformation.genre, movie.genre.split(', '), isMovieLiked);

                    // Rated
                    globalInformation.rated = updateNonTimingAtributeValues(globalInformation.rated, [movie.rated], isMovieLiked);

                    // IMDB
                    globalInformation.imdb = updateNonTimingAtributeValues(globalInformation.imdb, [movie.imdbrating], isMovieLiked);

                    // year [ on Decades ]  => Litle hack: We know there is not a movie before 1920, so we can just take the third number and add a zero.
                    globalInformation.year = updateNonTimingAtributeValues(globalInformation.year, [movie.year.substr(2, 1) + '0'], isMovieLiked);

                    // Idletime
                    globalInformation.idletime = updateTimingAtributeValues(globalInformation.idletime, [movie.idletime], isMovieLiked);

                    // Runtime
                    globalInformation.runtime = updateTimingAtributeValues(globalInformation.runtime, [movie.runtime], isMovieLiked);

                    // Talktime
                    globalInformation.talktime = updateTimingAtributeValues(globalInformation.talktime, [movie.talktime], isMovieLiked);
                });

                var importance = {
                    // Non time atributes
                    actors: comparePositiveAtributes(globalInformation.actors, new_movie.actors.split('- ')),
                    directors: comparePositiveAtributes(globalInformation.directors, new_movie.directors.split('- ')),
                    writers: comparePositiveAtributes(globalInformation.writers, new_movie.writers.split('- ')),
                    genre: comparePositiveAtributes(globalInformation.genre, new_movie.genre.split(', ')),
                    rated: comparePositiveAtributes(globalInformation.rated, [new_movie.rated]),
                    imdb: comparePositiveAtributes(globalInformation.imdb, [new_movie.imdbrating]),
                    year: comparePositiveAtributes(globalInformation.year, [new_movie.year.substr(2, 1) + '0']),
                    // Time atributes
                    idletime: comparePositiveAtributes(globalInformation.idletime, [new_movie.idletime.toString().slice(0, -1) + '0']),
                    runtime: comparePositiveAtributes(globalInformation.runtime, [new_movie.runtime.toString().slice(0, -1) + '0']),
                    talktime: comparePositiveAtributes(globalInformation.talktime, [new_movie.talktime.toString().slice(0, -1) + '0'])
                };

                resolve(importance);
            });
        },

        /*
            Calculates new Rating function
        */
        adjust_rating_function: function(old_rating_function, importanceValues) {

            return new Promise(function(resolve, reject) {

                for (var key in old_rating_function) {
                    old_rating_function[key] = parseFloat(old_rating_function[key]);
                }

                var sorted = top_bot_Scorer(importanceValues);

                // Increasing top performer and decreasing bottom performer
                var topPerformer = sorted[0],
                    new_param_import_to_add = old_rating_function[topPerformer[0]] * (1 + topPerformer[1].importance) / 10,
                    new_rating_function = old_rating_function;

                // removing importance while decreasedValue < new_param_import_to_add
                var sumOfDecreased = 0;

                for (var i = sorted.length - 1; i > 0; i--) {

                    if (sumOfDecreased / new_param_import_to_add >= 1) break;

                    var paramOnUse = sorted[i][0];

                    if (paramOnUse == 'imdb') paramOnUse = 'imdbrating';

                    var missingAdd = new_param_import_to_add - sumOfDecreased;

                    var toRemoveOnThisParameter = 0.75 * missingAdd;

                    if (old_rating_function[paramOnUse] - toRemoveOnThisParameter >= 0) {
                        sumOfDecreased += toRemoveOnThisParameter;

                        new_rating_function[paramOnUse] -= toRemoveOnThisParameter;
                    } else {

                        var maxToRemove = 0.70 * old_rating_function[paramOnUse];

                        sumOfDecreased += maxToRemove;

                        new_rating_function[paramOnUse] -= maxToRemove;
                    }
                }

                new_rating_function[topPerformer[0]] += sumOfDecreased;

                resolve(new_rating_function);

            });
        },

        /*
            Calculate ratings.
        */
        processNewRatings: function(movies, balances, ratingFunction) {

            return new Promise(function(resolve, reject) {

                var balance = {};

                for (var key in balances) {
                    balance[key] = balances[key].balance;
                }


                var updateArray = [];

                movies.forEach(function(value) {
                    var rating = 0;
                    // actors
                    rating += Number(ratingFunction.actors) * contentValue(balance.actors, value.actors.split('- '));

                    // directors
                    rating += Number(ratingFunction.directors) * contentValue(balance.directors, value.directors.split('- '));

                    // genre
                    rating += Number(ratingFunction.genre) * contentValue(balance.genre, value.genre.split(', '));

                    // idletime
                    rating += Number(ratingFunction.idletime) * contentValue(balance.idletime, [value.idletime.toString().slice(0, -1) + '0']);

                    // rated
                    rating += Number(ratingFunction.rated) * contentValue(balance.rated, [value.rated]);

                    // runtime
                    rating += Number(ratingFunction.runtime) * contentValue(balance.runtime, [value.runtime.toString().slice(0, -1) + '0']);

                    // talktime
                    rating += Number(ratingFunction.talktime) * contentValue(balance.talktime, [value.talktime.toString().slice(0, -1) + '0']);

                    // writers
                    rating += Number(ratingFunction.writers) * contentValue(balance.writers, value.writers.split('- '));

                    // year
                    rating += Number(ratingFunction.year) * contentValue(balance.year, [value.year.substr(2, 1) + '0']);

                    // imdbrating
                    rating += Number(ratingFunction.imdbrating) * contentValue(balance.imdb, [value.imdbrating]);

                    updateArray.push({ id: value.id, rating: Math.round(rating * 1000) / 100 })

                })

                resolve(updateArray);
            })
        }
    };

    // A function that returns an update object as this { x: numberOfTimesThatWasRepeated}
    function updateNonTimingAtributeValues(globalAtribute, movieAtribute, likedOrNot) {

        // This variable is just an hack. Unfortunately the API used, sometimes duplicates values.
        var added = {};

        movieAtribute.forEach(function(atr) {

            if (!added.hasOwnProperty(atr)) {
                added[atr] = 0;

                if (globalAtribute.hasOwnProperty(atr)) {
                    globalAtribute[atr] += likedOrNot;
                } else {
                    globalAtribute[atr] = likedOrNot;
                }

            }
        });

        return globalAtribute;
    };

    // A function that returns an update object as this { x: numberOfTimesThatWasRepeated}
    function updateTimingAtributeValues(globalAtribute, movieAtribute, likedOrNot) {

        // We are dividing by 10m intervals.
        var timeInterval = movieAtribute.toString().slice(0, -1) + '0';

        if (globalAtribute.hasOwnProperty(timeInterval)) {
            globalAtribute[timeInterval] += likedOrNot;
        } else {
            globalAtribute[timeInterval] = likedOrNot;
        }

        return globalAtribute;
    };

    // A function that compares the new movie atributes with old information system we have
    function comparePositiveAtributes(oldInformation, newInformation) {

        var positiveBalanceOfParameters = 1,
            mostLikedAtr = '',
            numberOfLikes_ofMost_successul_att = -1000,
            numberOfLikesNewParamHave = 0,
            bonus = false; // A parameter has a bonus of 10% if a key of newly added movie is the most favorite

        // Get most value information on this parameter
        for (var atr in oldInformation) {

            if (oldInformation[atr] > numberOfLikes_ofMost_successul_att) {
                numberOfLikes_ofMost_successul_att = oldInformation[atr];
                mostLikedAtr = atr;
            }

            if (oldInformation[atr] > 0) {
                positiveBalanceOfParameters += oldInformation[atr];
            }
        }

        // Check newly added actors with the information we got above
        newInformation.forEach(function(value) {

            if (oldInformation.hasOwnProperty(value)) {

                oldInformation[value] += 1;

                if (oldInformation[value] > 0) {
                    numberOfLikesNewParamHave += oldInformation[value];

                    if (value == mostLikedAtr) {
                        bonus = true;
                    }
                }
            }
        });

        var importance = (numberOfLikesNewParamHave / positiveBalanceOfParameters);

        if (bonus && importance * 1.1 <= 1) importance = importance * 1.1;

        return { importance: importance, balance: oldInformation, favorite: mostLikedAtr };
    }

    // A function that compares new movie at atrivutes with old information we have
    function compareNegativeAtributes(oldInformation, newInformation) {

        var negativeBalanceOfParameters = 1,
            mostDislikedAtr = '',
            numberOfLikes_ofMost_successul_att = 1000,
            numberOfLDislikesNewParamHave = 0,
            bonus = false; // A parameter has a bonus of 10% if a key of newly added movie is the most favorite

        // Get most value information on this parameter
        for (var atr in oldInformation) {

            if (oldInformation[atr] < numberOfLikes_ofMost_successul_att) {
                numberOfLikes_ofMost_successul_att = oldInformation[atr];
                mostDislikedAtr = atr;
            }

            if (oldInformation[atr] < 0) {
                negativeBalanceOfParameters += Math.abs(oldInformation[atr]);
            }
        }

        // Check newly added actors with the information we got above
        newInformation.forEach(function(value) {

            if (oldInformation.hasOwnProperty(value)) {

                oldInformation[value] -= 1;

                if (oldInformation[value] < 0) {
                    numberOfLDislikesNewParamHave += Math.abs(oldInformation[value]);

                    if (value == mostDislikedAtr) {
                        bonus = true;
                    }
                }
            }
        });

        var importance = (numberOfLDislikesNewParamHave / negativeBalanceOfParameters);

        if (bonus && importance * 1.1 <= 1) importance = importance * 1.1;

        return { importance: importance, balance: oldInformation, favorite: mostDislikedAtr };
    }


    // A function that retrieves top importance scorer and bottom importance scorer.
    function top_bot_Scorer(importanceValues) {

        var sorted = [];

        for (var param in importanceValues) {
            sorted.push([param, importanceValues[param]]);
        }

        return sorted.sort(function(a, b) {
            return b[1].importance - a[1].importance
        });
    }

    // A function that retrieves a value based on its content and on information we have.
    function contentValue(oldInformation, movieUnderReview) {

        var contentValue = 0;

        movieUnderReview.forEach(function(value) {

            if (oldInformation.hasOwnProperty(value) && oldInformation[value] > 0) {
                contentValue++;
            }
        });

        return contentValue / movieUnderReview.length;
    }

})();
