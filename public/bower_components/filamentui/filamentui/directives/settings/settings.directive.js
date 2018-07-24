angular.module('filamentui')

    .directive('filamentuiSettings', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/settings/settings.html',
            scope: {
                "settings": "&?"
            },
            link: function ($scope, element, attrs) {
                $scope._settings = function () {
                    if ( $scope.settings != null ) {
                        $scope.settings();
                    }
                }
            }
        };
}]);
