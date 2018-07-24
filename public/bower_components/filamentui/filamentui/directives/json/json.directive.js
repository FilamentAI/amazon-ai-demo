angular.module('filamentui')

    .directive('filamentuiJson', [function () {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/json/json.html',
            scope: {
                'json' : '='
            },
            link: function ($scope, element, attrs, ngModel) {
            //   console.log($scope.json);
            }
        };
}]);
