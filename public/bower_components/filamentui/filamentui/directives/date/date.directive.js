angular.module('filamentui')

    .directive('filamentuiDate', [function () {
        return {
            restrict: 'AE',
            replace: true,
            template: '<span class="filamentuiDate">{{ fromNow || timestamp | date : "dd/MM/yyyy" }}</span>',
            scope: {
                timestamp: '=',
                fromNow: '=?'
            },
            link: function (scope, element, attrs) {
            }
        };
}]);
