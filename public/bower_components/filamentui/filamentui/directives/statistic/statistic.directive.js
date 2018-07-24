angular.module('filamentui')

    .directive('filamentuiStatistic', [function () {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                title: '=',
                value: '=',
                colour: '='
            },
            templateUrl: 'filamentui/directives/statistic/statistic.html'
        }
}]);
