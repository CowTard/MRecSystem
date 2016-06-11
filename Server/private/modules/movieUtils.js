(function() {

    'use strict';

    var Promise = require('bluebird');

    module.exports = {

        /*
            Receives the user movie preferences and the new one.
            @returns: An array with new importance atributes    
        */
        calculate_new_importance_function: function(movieLikes, new_movie) {

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
                    actors: compareAtributes(globalInformation.actors, new_movie.actors.split('- ')),
                    directors: compareAtributes(globalInformation.directors, new_movie.directors.split('- ')),
                    writers: compareAtributes(globalInformation.writers, new_movie.writers.split('- ')),
                    genre: compareAtributes(globalInformation.genre, new_movie.genre.split(', ')),
                    rated: compareAtributes(globalInformation.rated, [new_movie.rated]),
                    imdb: compareAtributes(globalInformation.writers, [new_movie.imdbrating]),
                    year: compareAtributes(globalInformation.writers, [new_movie.year.substr(2, 1) + '0']),
                    // Time atributes
                    idletime: compareAtributes(globalInformation.idletime, [new_movie.idletime.toString().slice(0, -1) + '0']),
                    runtime: compareAtributes(globalInformation.runtime, [new_movie.runtime.toString().slice(0, -1) + '0']),
                    talktime: compareAtributes(globalInformation.talktime, [new_movie.talktime.toString().slice(0, -1) + '0'])
                };

                resolve(importance);
            });
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

    // A function that compares the new movie atributes with old information system have
    function compareAtributes(oldInformation, newInformation) {

        var positiveBalanceOfParameters = 0,
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
            if (oldInformation[value] > 0) {
                numberOfLikesNewParamHave += oldInformation[value];

                if (value == mostLikedAtr) {
                    bonus = true;
                }
            }
        });

        var importance = (numberOfLikesNewParamHave / positiveBalanceOfParameters);

        if (bonus && importance * 1.1 <= 1) importance = importance * 1.1;

        return { importance: importance, favorite: mostLikedAtr };
    }

})();
