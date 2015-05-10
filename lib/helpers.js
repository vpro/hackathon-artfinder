var express = require('express');
var pathUtil = require('path');
var chatHistory = [];

exports.notifyLivereload = function( basePath, livereload, event ) {

    // `gulp.watch()` events provide an absolute path
    // so we need to make it relative to the server root
    var fileName = pathUtil.relative( basePath, event.path );

    livereload.changed( fileName );
};

exports.startExpress = function( basePath, port ) {

    port = port || 4000;

    var app = express();
    var server = require('http').Server( app );
    var io = require('socket.io')( server );


    app.use(express.static( basePath ));

    server.listen( port, '0.0.0.0', function () {
        console.log('express server started on localhost:'+ port );
    } );

    /**
     * bind socket events
     */

    io.on('connection', function ( client ) {

        chatHistory.forEach(function ( msg ) {
            client.emit( 'message', msg );
        });

        client.on('message', function ( msg ) {

            chatHistory.push( msg );

            io.emit('message', msg )
        });
    });
};