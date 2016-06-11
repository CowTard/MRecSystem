(function() {

    'use strict';

    var fs = require('fs'),
        database = require('../database/database');

    // Main router where all routes are called. This is done so the project code is cleaner and more maintainable.
    module.exports = function(server, http) {

        // Route to send landing view
        server.get('/', function(req, res) {
            res.render('index');
        });

        // Route to send dashboard view
        server.get('/dashboard', function(req, res) {
            res.render('index');
        });

        // Route to send recommender view
        server.get('/recommender', function(req, res) {
            res.render('index');
        });

        // Route to show parser input
        server.get('/parser', function(req, res) {
            res.render('index');
        });

        // Route to parse movie's json file
        server.post('/parser', function(req, res) {

            _asyncFor(JSON.parse(req.body.txtarea))
                .then(function(_) {
                    database.insertMovies(_)
                        .then(function(_r) {
                            res.status(200).send('OK');
                        })
                        .catch(function(err) {
                            console.log(err);
                            res.status(406).send(err);
                        });
                })
                .catch(function(err) {
                    console.log(err);
                    res.status(406).send('err');
                });
        });

        // Route to show parser input
        server.get('/search_results/:title', function(req, res) {
            res.render('index');
        });

        // Routes about movies and users
        require('./moviesRouter')(server);
        require('./usersRouter')(server);
    };


    // Function to pass an array of json objects to a string.
    function _asyncFor(_jsonObj) {
        return new Promise(function(resolve, reject) {

            var _string_with_all_obj = '';

            for (var index in _jsonObj) {
                var _obj = '(';

                _obj += "'" + escapeHtml(_jsonObj[index].title.replace(/,/g, '-')) + "'" + ',';
                _obj += "'" + escapeHtml(_jsonObj[index].actors.replace(/,/g, '-')) + "'" + ',';
                _obj += "'" + escapeHtml(_jsonObj[index].director.replace(/,/g, '-')) + "'" + ',';
                _obj += "'" + _jsonObj[index].genre + "'" + ',';
                _obj += _jsonObj[index].idleTime + ',';
                _obj += "'" + _jsonObj[index].rated + "'" + ',';
                _obj += _jsonObj[index].runtime + ',';
                _obj += _jsonObj[index].talkTime + ',';
                _obj += "'" + escapeHtml(_jsonObj[index].writer.replace(/ *\([^)]*\) */g, '').replace(/,/g, '-')) + "'" + ',';
                _obj += "'" + _jsonObj[index].year + "'" + ',';
                _obj += _jsonObj[index].imdbRating + ',';
                _obj += "'" + _jsonObj[index].poster + "'";

                _obj += '),';

                _string_with_all_obj += _obj;
            }

            _string_with_all_obj = _string_with_all_obj.slice(0, -1);

            resolve(_string_with_all_obj);
        });
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

}());
