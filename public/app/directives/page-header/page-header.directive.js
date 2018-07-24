angular.module('tribe')

    .directive('pageHeader', ['$state', function ($state) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'app/directives/page-header/page-header.html',
            scope: {
            },
            link: function (scope, element, attrs) {
                scope.title = $state.current.data.title;
                scope.page = $state.current.data.page;

            }
        };
}]);