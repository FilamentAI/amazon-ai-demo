angular.module('filamentui')

    .directive('filamentuiHelp', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/help/help.html',
            scope: {
                "help": "&?"
            },
            link: function ($scope, element, attrs, ngModel) {
                $scope._help = function () {
                    $scope.selected = !$scope.selected;
                    if ( $scope.help != null ) {
                        $scope.help();
                    }
                }
            }
        };
}]);
