angular
    .module('filamentui')
    .directive('filamentuiBack', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/back/back.html',
            scope: {
                "label": "=",
                "back": "&?"
            },
            link: function ($scope, element, attrs, ngModel) {
                $scope._back = function () {
                    if ( $scope.back != null ) {
                        $scope.back();
                    }
                }
            }
        };
}]);
