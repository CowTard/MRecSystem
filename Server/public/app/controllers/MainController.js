(function() {

    'use strict';

    // Created the controller to the landing view
    var MainController = function($scope, MainService) {

        console.log('Main Controller loaded.');

        // Varible used in order to show server messages to user.
        $scope.user_Message = '';

        $scope.username = '';

        // Variable holding all movie information
        $scope._moviesOnDatabase = [];

        // Scope function to handle login
        $scope.login = function(user) {

            MainService.login(user)
                .then(function(result) {
                    $scope.user_Message = result.data;
                })
                .catch(function(err) {
                    $scope.user_Message = err.data;
                });
        };

        // Scope function to handle register
        $scope.register = function(user) {

            MainService.register(user)
                .then(function(result) {
                    $scope.user_Message = result.data;

                    // Reset user scope variables
                    $scope.user_reg = {};

                })
                .catch(function(err) {
                    $scope.user_Message = err.data;
                });
        };

        // Scope function to hangle upload JSON file
        $scope.upload = function(data) {

            MainService.upload(data)
                .then(function(result) {
                    $scope.user_Message = result.data;
                })
                .catch(function(err) {
                    $scope.user_Message = err.data;
                });
        };

        // Scope function to retrieve all movies in database
        $scope.getMovies = function(_movies) {

            MainService.getMovies()
                .then(function(result) {
                    $scope._moviesOnDatabase = result.data;
                })
                .catch(function(err) {
                    $scope.user_Message = err.data;
                });
        };

        // Scope function to retrieve logged user
        $scope.getLoggedUser = function() {

            var cookie = MainService.getLoggedUser();
            var username = cookie.split('-');
            $scope.username = username[0];
        };

        // Scope function to erase the existing session cookie
        $scope.logout = function() {
            MainService.logout();
        };

        // Scope function to like movie
        $scope.likedMovie = function(_movieID, isMovieLiked) {

            if (!isMovieLiked) {
                MainService.likedMovie(_movieID)
                    .then(function(_result) {

                    })
                    .catch(function(err) {
                        $scope.user_Message = err.data;
                    });
            }
        };
    };

    // Injecting modules used for better minifing later on
    MainController.$inject = ['$scope', 'MainService'];

    // Enabling the controller in the app
    angular.module('movieRecommender').controller('MainController', MainController);

}());
