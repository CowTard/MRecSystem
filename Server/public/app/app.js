(function() {

    'use strict';

    // Creation of the app, named 'movie recommender'
    var app = angular.module('movieRecommender', ['ngRoute']);

    app.config(function($routeProvider, $locationProvider) {

        // Definition of the view routes
        $routeProvider
            .when('/', {
                controller: 'MainController',
                templateUrl: 'app/views/login.ejs'
            })
            .when('/dashboard', {
                controller: 'MainController',
                templateUrl: 'app/views/dashboard.ejs'
            })
            .otherwise({
                redirectTo: '/'
            });

        // Enabling HTML5 mode so that the URL doesn't show up with hashtags
        $locationProvider.html5Mode(true);

    });

}());
