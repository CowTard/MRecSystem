(function() {

    'use strict';

    var MovieController = function($scope, MovieService) {

        console.log('Movie Controller loaded.');

        // Function to get only liked movies
        $scope.getReviewedMovies = function() {

            MovieService.getReviewedMovies()
                .then(function(result) {
                    $scope.movies = result.data;
                })
                .catch(function(err) {
                    $scope.user_Message = result.data;
                });
        };

    };

    // Injecting modules used for better minifing later on
    MovieController.$inject = ['$scope', 'MovieService'];

    // Enabling the controller in the app
    angular.module('movieRecommender').controller('MovieController', MovieController);

}());
