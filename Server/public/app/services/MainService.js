(function() {

    'use strict';

    // Created the services related to users
    var MainService = function($http, $q, $cookies, $window, $location) {
        console.log('Main service loaded.');

        var deferred = $q.defer();

        // Function to handle login
        this.login = function(user) {
            return $http.post('/api/auth/login', user)
                .success(function(res) {

                    $cookies.put('session', res, {
                        path: '/',
                        expires: user.remember ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()) : null
                    });

                    $window.location = '/dashboard';

                    deferred.resolve();
                })
                .error(function(err) {
                    deferred.reject(err);
                });
        };

        // Function to handle register
        this.register = function(user) {
            return $http.post('/api/auth/register', user)
                .success(function(res) {

                    deferred.resolve(res);
                })
                .error(function(err) {
                    deferred.reject(err);
                });
        };

        // Function to handle upload
        this.upload = function(data) {
            return $http.post('/parser', data)
                .success(function(res) {
                    deferred.resolve(res);
                })
                .error(function(err) {
                    deferred.reject(err);
                });
        };

        // Function to retrieve all movies information
        this.getMovies = function() {
            return $http.get('/api/movies')
                .success(function(res) {
                    deferred.resolve(res);
                })
                .error(function(err) {
                    deferred.reject(err);
                });
        };

        // Function to retrieve the user
        this.getLoggedUser = function() {
            var username = $cookies.get('session', {
                path: '/'
            });

            return username;
        };

        // Scope function to erase the existing session cookie
        this.logout = function() {
            $cookies.remove('session', {
                path: '/'
            });

            $window.location = '/';
        };

        // Scope function to like movie
        this.likedMovie = function(_movieID, review, predicted) {

            return $http.post('/api/movie', { id: _movieID, review: review, predicted: predicted })
                .success(function(result) {
                    deferred.resolve(result);
                })
                .error(function(err) {
                    deferred.reject(err);
                });
        };

        // Scope function to search movie
        this.searchMovieInit = function(movieTitle) {
            $window.location = '/search_results/' + movieTitle;
        };
    };

    // Injecting modules used for better minifing later on
    MainService.$inject = ['$http', '$q', '$cookies', '$window', '$location'];

    // Enabling the service in the app
    angular.module('movieRecommender').service('MainService', MainService);

}());
