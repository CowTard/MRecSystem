(function() {

    'use strict';

    var MovieController = function($scope, MovieService) {

        console.log('Movie Controller loaded.');
        $scope.likedMovies = [];
        $scope.dislikedMovies = [];
        $scope.reviewedMovies = 3;
        // Function to get all reviewed movies
        $scope.getReviewedMovies = function() {
            var i;
            MovieService.getReviewedMovies()
                .then(function(result) {
                    for (i = 0; i < result.data.length; i++) {
                        if (result.data[i].liked == true)
                            $scope.likedMovies.push(result.data[i]);
                        else $scope.dislikedMovies.push(result.data[i]);
                    }

                    $scope.reviewedMovies = i;

                })
                .catch(function(err) {
                    $scope.user_Message = result.data;
                });
        };

        // Function to get best rated movies
        $scope.getBestRatedMovies = function() {
            var i;
            MovieService.getRatedMovies()
                .then(function(result) {
                    $scope.recommendedMovies = result.data;
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
