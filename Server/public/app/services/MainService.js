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

        this.logout = function() {
            $cookies.remove('session', {
                path: '/'
            });

            $window.location = '/';


        };
    };

    // Injecting modules used for better minifing later on
    MainService.$inject = ['$http', '$q', '$cookies', '$window', '$location'];

    // Enabling the service in the app
    angular.module('movieRecommender').service('MainService', MainService);

}());
