(function() {

    'use strict';

    var Promise = require('bluebird'),
        database = require('../database/database');

    module.exports = {

        /*
            Receives the user movie preferences and the new one.
            @returns: An array with new importance attributes
        */
        calculate_new_importance_function: function(movieLikes, new_movie) {

            return new Promise(function(resolve, reject) {

                var globalInformation = {
                    // Non time attributes
                    actors: {},
                    directors: {},
                    writers: {},
                    genre: {},
                    rated: {},
                    imdb: {},
                    year: {},
                    // Time attributes
                    idletime: {},
                    runtime: {},
                    talktime: {}
                };

                // Populating globalInformation object
                movieLikes.forEach(function(movie) {

                    var isMovieLiked = movie.liked ? 1 : -1;

                    // Actors
                    globalInformation.actors = updateNonTimingAttributeValues(globalInformation.actors, movie.actors.split('- '), isMovieLiked);

                    // Directors
                    globalInformation.directors = updateNonTimingAttributeValues(globalInformation.directors, movie.directors.split('- '), isMovieLiked);

                    // Writers
                    globalInformation.writers = updateNonTimingAttributeValues(globalInformation.writers, movie.writers.split('- '), isMovieLiked);

                    // Genre
                    globalInformation.genre = updateNonTimingAttributeValues(globalInformation.genre, movie.genre.split(', '), isMovieLiked);

                    // Rated
                    globalInformation.rated = updateNonTimingAttributeValues(globalInformation.rated, [movie.rated], isMovieLiked);

                    // IMDB
                    globalInformation.imdb = updateNonTimingAttributeValues(globalInformation.imdb, [movie.imdbrating], isMovieLiked);

                    // year [ on Decades ]  => Little hack: We know there is not a movie before 1920, so we can just take the third number and add a zero.
                    globalInformation.year = updateNonTimingAttributeValues(globalInformation.year, [movie.year.substr(2, 1) + '0'], isMovieLiked);

                    // Idletime
                    globalInformation.idletime = updateTimingAttributeValues(globalInformation.idletime, [movie.idletime], isMovieLiked);

                    // Runtime
                    globalInformation.runtime = updateTimingAttributeValues(globalInformation.runtime, [movie.runtime], isMovieLiked);

                    // Talktime
                    globalInformation.talktime = updateTimingAttributeValues(globalInformation.talktime, [movie.talktime], isMovieLiked);
                });


                var importance = {
                    // Non time attributes
                    actors: comparePositiveAttributes(globalInformation.actors, new_movie.actors.split('- ')),
                    directors: comparePositiveAttributes(globalInformation.directors, new_movie.directors.split('- ')),
                    writers: comparePositiveAttributes(globalInformation.writers, new_movie.writers.split('- ')),
                    genre: comparePositiveAttributes(globalInformation.genre, new_movie.genre.split(', ')),
                    rated: comparePositiveAttributes(globalInformation.rated, [new_movie.rated]),
                    imdb: comparePositiveAttributes(globalInformation.imdb, [new_movie.imdbrating]),
                    year: comparePositiveAttributes(globalInformation.year, [new_movie.year.substr(2, 1) + '0']),
                    // Time attributes
                    idletime: comparePositiveAttributes(globalInformation.idletime, [new_movie.idletime.toString().slice(0, -1) + '0']),
                    runtime: comparePositiveAttributes(globalInformation.runtime, [new_movie.runtime.toString().slice(0, -1) + '0']),
                    talktime: comparePositiveAttributes(globalInformation.talktime, [new_movie.talktime.toString().slice(0, -1) + '0'])
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

                });

                resolve(updateArray);
            })
        }
    };

    // A function that returns an update object as this { x: numberOfTimesThatWasRepeated}
    function updateNonTimingAttributeValues(globalAttribute, movieAttribute, likedOrNot) {

        // This variable is just an hack. Unfortunately the API used, sometimes duplicates values.
        var added = {};

        movieAttribute.forEach(function(atr) {

            if (!added.hasOwnProperty(atr)) {
                added[atr] = 0;

                if (globalAttribute.hasOwnProperty(atr)) {
                    globalAttribute[atr] += likedOrNot;
                } else {
                    globalAttribute[atr] = likedOrNot;
                }

            }
        });

        return globalAttribute;
    }

    // A function that returns an update object as this { x: numberOfTimesThatWasRepeated}
    function updateTimingAttributeValues(globalAttribute, movieAttribute, likedOrNot) {

        // We are dividing by 10m intervals.
        var timeInterval = movieAttribute.toString().slice(0, -1) + '0';

        if (globalAttribute.hasOwnProperty(timeInterval)) {
            globalAttribute[timeInterval] += likedOrNot;
        } else {
            globalAttribute[timeInterval] = likedOrNot;
        }

        return globalAttribute;
    }

    // A function that compares the new movie attributes with old information system we have
    function comparePositiveAttributes(oldInformation, newInformation) {

        var positiveBalanceOfParameters = 1,
            mostLikedAtr = '',
            numberOfLikes_ofMost_successful_att = -1000,
            numberOfLikesNewParamHave = 0,
            bonus = false; // A parameter has a bonus of 10% if a key of newly added movie is the most favorite

        // Get most value information on this parameter
        for (var atr in oldInformation) {

            if (oldInformation[atr] > numberOfLikes_ofMost_successful_att) {
                numberOfLikes_ofMost_successful_att = oldInformation[atr];
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

        var contentValue = 0,
            added = false;

        movieUnderReview.forEach(function(value) {

            if (oldInformation.hasOwnProperty(value) && oldInformation[value] > 0) {
                contentValue++;
                added = true;
            } else if (oldInformation.hasOwnProperty(value) && oldInformation[value] < 0) {
                contentValue--;
                added = true;
            }
        });

        var points = 0;

        if (contentValue < 0) points = 0;
        else if (contentValue == 0 && added) points = movieUnderReview.length / 2;
        else if (contentValue >= 1) points = movieUnderReview.length;

        return contentValue / movieUnderReview.length;
    }

})();
