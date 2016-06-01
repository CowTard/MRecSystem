(function() {

    'use strict';

    // Created the controller to the landing view
    var SearchController = function($scope, $routeParams, SearchService) {

        console.log('Search Controller loaded.');

        $scope.searchedTitle = $routeParams.title;

        // Scope function to like movie
        $scope.searchMovieEnd = function() {
            SearchService.searchMovieEnd($scope.searchedTitle)
                .then(function(_result) {
                    $scope.searchedMovie = _result.data;
                })
                .catch(function(err) {
                    $scope.user_Message = err.data;
                });

        };

    };

    // Injecting modules used for better minifing later on
    SearchController.$inject = ['$scope', '$routeParams', 'SearchService'];

    // Enabling the controller in the app
    angular.module('movieRecommender').controller('SearchController', SearchController);

}());
