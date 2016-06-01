(function() {

    'use strict';

    // Created the services related to users
    var SearchService = function($http, $q, $cookies, $window, $location) {
        console.log('Search service loaded.');

        var deferred = $q.defer();

        // Scope function to search movie
        this.searchMovieEnd = function(movieTitle) {
            return $http.post('/api/search', { title: movieTitle })
                .success(function(result) {
                    deferred.resolve(result);
                })
                .error(function(err) {
                    deferred.reject(err);
                });
        };
    };

    // Injecting modules used for better minifing later on
    SearchService.$inject = ['$http', '$q', '$cookies', '$window', '$location'];

    // Enabling the service in the app
    angular.module('movieRecommender').service('SearchService', SearchService);

}());
