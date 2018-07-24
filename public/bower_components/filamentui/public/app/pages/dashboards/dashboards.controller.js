angular.module('filamentuiDemo')
    .controller('DashboardCtrl',

    [ '$rootScope', '$scope', '$stateParams', '$q', '$sce', 'apiService',

    function ( $rootScope, $scope, $stateParams, $q, $sce, apiService ) {
        $scope.hero_basic = {
            title: 'Hero Banner Basic',
            status: '',
            description: 'This is the simplest Hero Banner possible',
            lastUpdated: ''
        };

        $scope.hero_one = {
            title: 'Hero Banner Single Column',
            status: 'Stateful',
            description: 'This banner has one column of stuff',
            lastUpdated: '2012-01-01 01:00'
        };

        $scope.hero_two = {
            title: 'Hero Banner Double Column',
            status: 'Stated',
            description: 'This banner has two columns of stuff',
            lastUpdated: '2012-01-01 01:00'
        };

        $scope.hero_two_left = {
            title: 'Hero Banner Double Column',
            status: 'Stated',
            description: 'This banner has two columns of stuff, and the extra custom thing is on the left now.',
            lastUpdated: '2012-01-01 01:00'
        };

        $scope.hero_three = {
            title: 'Hero Banner Triple Column',
            status: 'Stated',
            description: 'This banner has two columns of stuff',
            lastUpdated: '2012-01-01 01:00'
        };

        $scope.clickMe = function() {
            console.log('Clicked a Menu Button');
        }
    }
]);
