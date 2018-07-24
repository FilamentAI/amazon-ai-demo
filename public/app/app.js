var app = angular.module('tribe', [
    'ui.router',
    'filamentui',
    'ngStorage',
    'ngWebSocket'
]);

app.constant('CONSTANTS', {
    "date": "EEEE, d MMM, y"
});

app.config(function ($urlRouterProvider, $stateProvider, $locationProvider) {
    $locationProvider.html5Mode({
        enabled: true
    });

    $urlRouterProvider
        .otherwise('');

    $stateProvider
        // Test layout
        .state('header', {
            views: {
                '': {
                    templateUrl: 'filamentui/layouts/page_header.html'
                }
            }
        });



    $stateProvider
        .state('home', {
            name: 'home',
            parent: 'header',
            url: '/',
            views: {
                'headerContent': {
                    template: '<tribe-header></tribe-header>'
                },
                'pageContent': {
                    templateUrl: 'filamentui/layouts/content_smaller.html'
                },
                'title@home': {
                    template: '<page-header></page-header>'
                },
                'content@home': {
                    templateUrl: 'app/pages/home/home.html',
                    controller: 'HomeCtrl'
                }
            },
            data: {
                title: 'Machine Learning Demo'
            }
        });
});

app.controller('MainCtrl', ['$scope', '$stateParams', '$state', '$rootScope', '$http', '$localStorage', 
    function ($scope, $stateParams, $state, $rootScope, $http, $localStorage) {

        $scope.logout = function () {
            window.location.href = "/auth/logout";
        }
}]);

app.filter('thousandSuffix', function () {
    return function (input, decimals) {
        var exp, rounded,
            suffixes = ['k', 'M', 'G', 'T', 'P', 'E'];

        if (window.isNaN(input)) {
            return null;
        }

        if (input < 1000) {
            return input;
        }

        exp = Math.floor(Math.log(input) / Math.log(1000));

        return (input / Math.pow(1000, exp)).toFixed(decimals) + suffixes[exp - 1];
    };
});
