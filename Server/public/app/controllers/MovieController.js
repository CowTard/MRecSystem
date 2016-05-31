(function() {

    'use strict';

    var MovieController = function($scope, MovieService) {

        console.log('Movie Controller loaded.');
        $scope.likedMovies = [];
        $scope.dislikedMovies = [];
        // Function to get only liked movies
        $scope.getReviewedMovies = function() {
            var i;
            MovieService.getReviewedMovies()
                .then(function(result) {
                    console.log(result.data);
                    for (i = 0; i < result.data.length; i++) {
                        if (result.data[i].liked == true)
                            $scope.likedMovies.push(result.data[i]);
                        else $scope.dislikedMovies.push(result.data[i]);
                    }
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
