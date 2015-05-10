
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
               Handlebars, $ ) {

        Handlebars.registerPartial({
          tabs: tabsTemplate.template
        });

        /** CONSTANTS */

        var match;
        var buddyMatch;

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
            }
        ];
        var scoreCardsFinished = '<div class="score-cards-finished">Oops, looks like you\'ve rated all our art pieces! Hope you found a match, or try again later!</div>';

        var BUDDIES = [
            {
                name : 'David'

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

        var initScoring = function ( $container, index ) {

            $container.html( scoreCardTemplate.render( scoreCards[ index ] ) );

            var like = function () {

                $(this).addClass('rotate-left').delay(700).fadeOut( 1, function () {
                    match = MUSEUMS[ scoreCards[ index ].match ];
                    $('#app .tab-matches' ).append('<span class="badge">1</span>');

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

            $('.matches-results' ).hide();
            $('.'+ resultId ).show(100);
        };

        /** 'ROUTING' */

        $(document ).on('submit', '.intro-form', function ( e ) {
            e.preventDefault();

            gotoSimonProfile();
        });

        $(document ).on('click', '.tab-profile', function ( e ) {
            e.preventDefault();

            gotoSimonProfile();
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

        $(document ).on('click', '.matches-choice', function () {
            showMatchResults( $(this ).data('match') );
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


        /** KICKOFF */

        $('#app').html( introTemplate.render({}) );
    }
);