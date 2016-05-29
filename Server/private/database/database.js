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
            client.query('INSERT INTO movies (title, actors,directors,genre, idletime, rated, runtime, talktime, timeToRead, year, imdbrating, poster) VALUES ' + movies, [], function(err, result) {
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
                    resolve(result);
                }
            });
        });
    };

    // Function to get all the data from a movie by id
    exports.getAllMovies = function(userID) {
        return new Promise(function(resolve, reject) {
            client.query('select movies.*, movies_users.userid is not null as liked \
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

    // Function to get only liked movies
    exports.getLikedMovies = function(userID) {
        return new Promise(function(resolve, reject) {
            client.query('select movies.* from movies, movies_users where movies_users.userID = $1 and movies_users.movieid = movies.id;', userID, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    };

    // Function to insert a 'like' on certain movie
    exports.insertLike = function(data) {
        return new Promise(function(resolve, reject) {
            client.query('INSERT INTO movies_users (userid, movieID) VALUES($1,$2)', data, function(err, result) {
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
