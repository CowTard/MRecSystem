(function () {

    'use strict';

    // Created the controller to the landing view
    var MainController = function ($scope, MainService) {

        console.log('Main Controller loaded.');

    };

    // Injecting modules used for better minifing later on
    MainController.$inject = ['$scope', 'MainService'];

    // Enabling the controller in the app
    angular.module('movieRecommender').controller('MainController', MainController);

} ());