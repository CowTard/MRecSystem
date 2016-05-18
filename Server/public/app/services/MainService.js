(function() {

    'use strict';

    // Created the services related to users
    var MainService = function($http, $window) {
        console.log('hi');
    };

    // Injecting modules used for better minifing later on
    MainService.$inject = ['$http', '$window'];

    // Enabling the service in the app
    angular.module('movieRecommender').service('MainService', MainService);

}());
