(function() {

    'use strict';

    // Created the services related to users
    var MovieService = function($http, $q, $cookies, $window, $location) {
        console.log('Main service loaded.');

        var deferred = $q.defer();

        // Function to get only liked movies
        this.getReviewedMovies = function() {

            return $http.get('/api/movies/liked')
                .success(function(result) {
                    deferred.resolve(result);
                })
                .error(function(err) {
                    deferred.reject(err);
                });
        };
    };

    // Injecting modules used for better minifing later on
    MovieService.$inject = ['$http', '$q', '$cookies', '$window', '$location'];

    // Enabling the service in the app
    angular.module('movieRecommender').service('MovieService', MovieService);

}());
