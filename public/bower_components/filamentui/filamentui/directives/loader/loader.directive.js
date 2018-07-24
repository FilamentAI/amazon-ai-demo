angular.module('filamentui')

    .directive('filamentuiLoader', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'filamentui/directives/loader/loader.html',
            scope: {
                'type': '=?',
                'colour': '=?'
            },
            link: function ($scope, element, attrs) {
                // default type == spinner
                $scope.type = ( typeof $scope.type === 'undefined' ) ? 'wave' : $scope.type;
            }
        };
}]);
