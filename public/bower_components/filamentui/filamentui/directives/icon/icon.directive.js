angular.module('filamentui')

    .directive('filamentuiIcon', [function () {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/icon/icon.html',
            scope: {
                'status': '='
            },
            link: function (scope, element, attrs) {}
        };
}]);
