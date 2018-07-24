angular.module('filamentui')

    .directive('filamentuiDatetime', [function () {
        return {
            restrict: 'AE',
            replace: true,
            template: '<span class="filamentuiDatetime">{{ fromNow || timestamp | date : "dd/MM/yyyy hh:mm" }}</span>',
            scope: {
                timestamp: '=',
                fromNow: '=?'
            },
            link: function (scope, element, attrs) {
            }
        };
}]);
