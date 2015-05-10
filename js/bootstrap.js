
define('jquery', function () {

    window.jQuery(document).on("mobileinit", function(){
        window.jQuery.mobile.ajaxEnabled=false;
        window.jQuery.mobile.loadingMessage = false;
    });

    return window.jQuery;
});

requirejs.config({
    paths : {
        handlebars : 'vendor/js/handlebars.amd.min'
    }
});

require(
    [
        'js/lib/template!templates/intro.html',
        'js/lib/template!templates/profile.html',
        'js/lib/template!templates/score.html',
        'js/lib/template!templates/matches.html',
        'js/lib/template!templates/tabs.html',
        'js/lib/template!templates/score-card.html',
        'js/lib/template!templates/chat.html',
        'js/lib/template!templates/admin.html',
        'handlebars',
        'jquery',
        'http://code.jquery.com/mobile/1.4.4/jquery.mobile-1.4.4.min.js'
    ],

    function ( introTemplate,
               profileTemplate,
               scoreTemplate,
               matchesTemplate,
               tabsTemplate,
               scoreCardTemplate,
               chatTemplate,
               adminTemplate,
               Handlebars, $ ) {

        Handlebars.registerPartial({
          tabs: tabsTemplate.template
        });

        /** CONSTANTS */

        var match;
        var socket;
        var username;
        var buddyMatch;
        var chatHistory = [];

        var MUSEUMS = {

            'kroller' : {
                title: 'Kroller Muller Museum',
                description: 'The Kröller-Müller Museum is an art museum and sculpture garden, located in the Hoge Veluwe National Park in Otterlo in the Netherlands. ',
                image: 'https://lh6.ggpht.com/MRtGp7GG2Uu1U3W0_OCOb-1ZjjLyDkN7K63ceV11yUgcQVQ6Je0jjb5w6g=fbw=1-s50'
            },

            'stedelijk' : {
                title: 'Stedelijk Museum',
                description: 'The Stedelijk Museum Amsterdam, colloquially known as the Stedelijk, is a museum for modern art, contemporary art, and design located in Amsterdam, the Netherlands.',
                image: 'http://www.tempelhof.nl/resources/images/omgeving/standard/thumb_stedelijk_museum.jpg'
            },

            'vangogh': {
                'title': 'Van Gogh Museum',
                'description': 'Step into Van Gogh\'s world. Discover the world\'s largest collection of works by Vincent van Gogh at the Van Gogh Museum, featuring masterpieces such as Almond Blossom and The Bedroom.',
                'image': 'http://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Van_Gogh_Museum_Amsterdam.jpg/1280px-Van_Gogh_Museum_Amsterdam.jpg'
            },

            'rijksmuseum': {
                title: 'Rijksmuseum',
                description: 'At the Rijksmuseum, art and history take on new meaning for a broad-based, contemporary national and international audience.',
                image: 'http://c573862.ssl.cf0.rackcdn.com/1/2/79674/1068060/4119276779_949aaba2d5_o_900.jpg'
            }
        };

        var scoreCards = [
            {
                image : "http://whatsupwithamsterdam.com/wordpress/wp-content/uploads/2012/09/km6.jpg",
                artist: 'Jean Dubuffet',
                date: '1973',
                title: 'Jardin d\'émail',
                match: 'kroller'
            },
            {
                image : 'https://www.artifex.nu/edit/upload/malevich1.png',
                artist: 'Kazimir Malevich',
                date: '1915',
                title: 'Suprematist composition (with 8 red rectangles)',
                match: 'stedelijk'
            },
            {
                image: 'http://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
                artist: 'Vincent van Gogh',
                date: '1889',
                title: 'De sterrennacht',
                match: 'vangogh'
            },
            {
                image: 'http://www.entoen.nu/media/_600/19.jpg',
                artist: 'Rembrandt van Rijn',
                date: '1642',
                title: 'De Nachtwacht',
                match: 'rijksmuseum'
            },
            {
                image: 'http://lh4.ggpht.com/XVSITSSFzZEdNM1SpHbJF12MqBvW3KTL2qjNta1-KMiOVd3s-p-LiQ2sXHsgRAs3GeMpiin_TwvLi9jpIySt1vLDdA=s500-c',
                artist: 'Jan Asselijn',
                date: '1650',
                title: 'De bedreigde zwaan',
                match: 'rijksmuseum'
            }
        ];
        var scoreCardsFinished = '<div class="score-cards-finished">Oops, looks like you\'ve rated all our art pieces! Hope you found a match, or try again later!</div>';

        var BUDDIES = [
            {
                name : 'David',
                image: 'https://pbs.twimg.com/profile_images/378800000546409603/914b4e0eace4c84012156083eb4a7c59_400x400.jpeg'
            }
        ];

        /** HELPERS */

        var gotoSimonProfile = function () {

            $('#app').html( profileTemplate.render({
                match: match,
                profileImage : 'https://lh6.googleusercontent.com/-ZeVgovL6sE4/AAAAAAAAAAI/AAAAAAAAAEs/6XUlqjKcdbo/photo.jpg',
                buttons : [
                    {
                        id: 'profile',
                        icon: 'user',
                        active: true
                    },
                    {
                        id: 'score',
                        icon: 'ok'
                    },
                    {
                        id: 'matches',
                        icon: 'heart'
                    }
                ]
            }) );
        };

        var showAdmin = function(){

            var $adminContainer = $('.admin-container');

            $adminContainer.html( adminTemplate.render( {
                scoreCards: scoreCards,
                museums: MUSEUMS
            } ) );

            $adminContainer.find('.admin' ).css({
                width: $adminContainer.width(),
                left: $adminContainer.width() + 5
            });

            $adminContainer.show();

            setTimeout(function () {
                $adminContainer.find('.admin' ).css({
                    left: 0
                });
            }, 10);

        };

        var hideAdmin = function(){

            var $adminContainer = $('.admin-container' );

            $adminContainer.find('.admin' ).css({
                left: $adminContainer.width()+5
            });

            setTimeout(function () {
                $adminContainer.html('' );
                $adminContainer.hide();
            }, 250);

        };

        var initScoring = function ( $container, index ) {

            $container.html( scoreCardTemplate.render( scoreCards[ index ] ) );

            var like = function () {

                $(this).addClass('rotate-left').delay(700).fadeOut( 1, function () {

                    // Fake match when liking 1 piece
                    match = MUSEUMS[ scoreCards[ index ].match ];
                    buddyMatch = BUDDIES[0];

                    $('#app .tab-matches .badge' ).remove();
                    $('#app .tab-matches').append('<span class="badge">2</span>');


                    if ( index == scoreCards.length -1 ) {
                        $container.append( scoreCardsFinished );
                    } else {

                        initScoring( $container, index+1 );
                    }
                });
            };

            var dislike = function () {
                $(this).addClass('rotate-right').delay(700).fadeOut(1, function () {
                    if ( index == scoreCards.length -1 ) {
                        $container.append( scoreCardsFinished );
                    } else {
                        initScoring( $container, index+1 );
                    }
                });
            };

            $container.find('> *').on('swiperight', like );

            $container.find('> *').on('click', '.score-like', like.bind( $container.find('> *') ) );

            $container.find('> *').on('swipeleft', dislike);

            $container.find('> *').on('click', '.score-dislike', dislike.bind( $container.find('> *') ) );
        };

        var showMatchResults = function ( resultId ) {
            $('.matches-choice').removeClass('active');
            $('[data-match="'+ resultId +'"]' ).addClass('active');

            if ( $('[data-match="'+ resultId +'"] .badge' ).length ) {
                $('[data-match="'+ resultId +'"] .badge' ).remove();
            }

            $('.matches-results' ).hide();
            $('.'+ resultId ).show(100);
        };

        var addChatMessage = function ( msg ) {
            $('#app .chat-window' ).append(
                '<div class="chat-message '+ ( ( msg.user === username ) ? 'you' : 'other' ) +'" data-id="'+ msg.id +'">'+
                msg.text +'</div>'
            );
        };

        /** 'ROUTING' */

        $(document ).on('submit', '.intro-form', function ( e ) {
            e.preventDefault();

            username = $('#email' ).val() || 'test';

            gotoSimonProfile();
        });

        $(document ).on('click', '.tab-profile', function ( e ) {
            e.preventDefault();

            gotoSimonProfile();
        });

        $(document).on('click', '.button-admin', function( e ){
            showAdmin();
        });

        $( document ).on('click', '.admin-header-back', function (e) {
            hideAdmin();
        });

        $(document ).on('click', '.profile [href], .matches [href], .tab-score', function ( e ) {

            e.preventDefault();

            $('#app').html( scoreTemplate.render({

                buttons : [
                    {
                        id: 'profile',
                        icon: 'user'
                    },
                    {
                        id: 'score',
                        icon: 'ok',
                        active: true
                    },
                    {
                        id: 'matches',
                        icon: 'heart'
                    }
                ]
            }) );

            initScoring( $('#app' ).find('.score-cards'), 0 );
        });

        $(document ).on('click', '.tab-matches', function ( e ) {

             e.preventDefault();

             $('#app').html( matchesTemplate.render({
                 museums :{
                    match: match
                 },
                 buddies : {
                     match: buddyMatch
                 },
                 buddyBadge : ( $('#app .tab-matches .badge' ).length > 0 ), /* to show a buddy badge */
                 buttons : [
                     {
                         id: 'profile',
                         icon: 'user'
                     },
                     {
                         id: 'score',
                         icon: 'ok'
                     },
                     {
                         id: 'matches',
                         icon: 'heart',
                         active: true
                     }
                 ]
             }) );

            showMatchResults('matches-museums');
         });


        $(document ).on('click', '.matches-choice', function () {
            showMatchResults( $(this ).data('match') );
        });


        $(document ).on('click', '.match-chat-button', function ( e ) {

            var $chatContainer = $('#app .chat-container' );

            e.preventDefault();

            $chatContainer.html( chatTemplate.render({}) );

            if ( chatHistory && chatHistory.length ) {

                chatHistory.forEach( addChatMessage );
            }

            $chatContainer.find('.chat' ).css({
                width: $chatContainer.width(),
                left: $chatContainer.width() + 5
            });

            $chatContainer.show();
            setTimeout(function () {
                $chatContainer.find('.chat' ).css({
                    left: 0
                });
            }, 10);
        });


        $( document ).on('click', '.chat-header-back', function (e) {

            var $chatContainer = $('#app .chat-container' );

            e.preventDefault();

            $chatContainer.find('.chat' ).css({
                left: $chatContainer.width()+5
            });

            setTimeout(function () {
                $chatContainer.html('' );
                $chatContainer.hide();
            }, 250);
        });

        $(document ).on('submit', '.chat-entry', function (e) {
            e.preventDefault();

            socket.emit('message', {
                id : 'chat-id-'+ (new Date()).getTime(),
                user: username,
                text: $('.chat-input' ).val()
            });
        });



        /** KICKOFF */

        $('#app').html( introTemplate.render({}) );

        socket = io( 'http://'+ document.location.host );

        socket.on('message', function ( msg ) {

            chatHistory.push( msg );

            if ( $('#app .chat-window' ).length &&
                ! $('#app .chat-message[data-id='+ msg.id +']' ).length
            ) {
                addChatMessage( msg );
            }
        });
    }
);