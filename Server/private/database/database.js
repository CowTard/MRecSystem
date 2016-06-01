(function() {

    'use strict';

    var pg = require('pg'),
        Promise = require('bluebird'),
        database = require('../secrets/database'),
        conString = 'postgres://' + database.user + ':' + database.password + '@' + database.url + ':' + database.port + '/' + database.database,
        client = new pg.Client(conString);

    // Function called in the start of the server to connect to the database
    exports.connect = function() {
        return new Promise(function(resolve, reject) {
            client.connect(function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    // Function to disconnect the database from the server. Shouldn't be called.
    exports.disconnect = function() {
        client.end();
    };

    // Function to insert a new user on database
    exports.addUser = function(user) {
        return new Promise(function(resolve, reject) {
            client.query('INSERT INTO users(email, password,token) VALUES ($1, $2, $3) RETURNING id', user, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.rows[0].id);
                }
            });
        });
    };

    // Function to get user' sensitive data
    exports.getSensitiveData = function(user_email) {
        return new Promise(function(resolve, reject) {
            client.query('SELECT id, password,token from users where email = $1', user_email, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.rows[0]);
                }
            });
        });
    };

    // Function to insert movies in database
    exports.insertMovies = function(movies) {
        return new Promise(function(resolve, reject) {
            client.query('INSERT INTO movies (title, actors,directors,genre, idletime, rated, runtime, talktime, writers, year, imdbrating, poster) VALUES ' + movies, [], function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    };

    // Function to get all the data from a movie by id
    exports.getMovieByID = function(id) {
        return new Promise(function(resolve, reject) {
            client.query('SELECT * from movies where id = $1', id, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.rows[0]);
                }
            });
        });
    };

    // Function to get all the data from a movie
    exports.getMovies = function() {
        return new Promise(function(resolve, reject) {
            client.query('select * from movies ', function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    };


    // Function to get all the data from a movie by id
    exports.getAllMovies = function(userID) {
        return new Promise(function(resolve, reject) {
            client.query('select movies.*, movies_users.liked , movies_users.userid is not null as liked \
                            from movies LEFT JOIN movies_users \
                            ON movies_users.movieid = movies.id and movies_users.userid = $1\
                            ORDER BY movies.id', userID, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    };

    // Function to get all the rating functions except the one of the logged user
    exports.getRatingFunctionsOtherUsers = function(userID) {
        return new Promise(function(resolve, reject) {
            client.query('select * from ratingfunction where userid != $1', userID, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    };

    // Function to get the liked movies of all the users except the one of the logged user
    exports.getMoviesLikedByOtherUsers = function(userID) {
        return new Promise(function(resolve, reject) {
            client.query('select * from movies_users where userid != $1', userID, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    };

    exports.insertUserSimilarity = function(user1ID, user2ID) {
        return new Promise(function(resolve, reject) {
            client.query('INSERT INTO users_similarity VALUES($1,$2)', [user1ID, user2ID], function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    };

    // Function to get only liked movies
    exports.getLikedMovies = function(userID) {
        return new Promise(function(resolve, reject) {
            client.query('select movies.* from movies, movies_users where movies_users.userID = $1 and movies_users.movieid = movies.id and movies_users.liked = true;', userID, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    };

    // Function to get all reviewed movies
    exports.getReviewedMovies = function(userID) {
        return new Promise(function(resolve, reject) {
            client.query('select movies.*, movies_users.liked from movies, movies_users where movies_users.userID = $1 and movies_users.movieid = movies.id', userID, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    };

    // Function to insert a 'like' on certain movie
    exports.insertReview = function(data) {
        return new Promise(function(resolve, reject) {
            client.query('INSERT INTO movies_users (userid, movieID, liked) VALUES($1,$2, $3)', data, function(err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    };

    // Function to retrieve rating function
    exports.getRatingFunction = function(userID) {
        return new Promise(function(resolve, reject) {
            client.query('Select * from ratingfunction where userid = $1', userID, function(err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    };

    // Function to retrieve rating function
    exports.getRatedMoviesForUser = function(userID) {
        return new Promise(function(resolve, reject) {
            client.query('Select * from predictions join movies on predictions.movieid = movies.id where userid = $1 order by rating DESC', userID, function(err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    };

    // Function to update best atributes
    exports.updateBestAtributes = function(user) {
        return new Promise(function(resolve, reject) {
            client.query('UPDATE bestAtributes SET actors = $1 ,directors = $2, genre = $3, idleTime = $4, rated = $5, runtime = $6, talktime = $7, \
                    writers = $8, year = $9, imdbrating = $10 WHERE userid = $11', user, function(err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    };

    exports.updateAllMovies = function(movies, userid) {
        return new Promise(function(resolve, reject) {
            movies.forEach(function(movie) {
                client.query('UPDATE predictions set rating = $1 where userid = $2 and movieid = $3', [movie.rating, userid, movie.id], function(err, result) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        resolve(result.rows);
                    }
                });
            });

        });
    };

    exports.searchMovie = function(movieTitle) {
        return new Promise(function(resolve, reject) {
            client.query('select * from movies where title like $1', ['%' + movieTitle + '%'], function(err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    };


}());
