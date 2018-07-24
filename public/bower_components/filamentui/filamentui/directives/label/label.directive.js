angular.module('filamentui')

    .directive('filamentuiLabel', [function () {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/label/label.html',
            scope: {
                "text" : "=",
                "labelclass" : "="
            },
            link: function (scope, element, attrs) {
            }
        };
}]);
