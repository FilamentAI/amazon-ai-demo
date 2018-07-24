angular.module('tribe')

    .directive('tribeHeader', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'app/directives/header/header.html',
            scope: {
                mode: '=',
                toggleSideMenu: '&',
                isLocked: '='
            },
            link: function (scope, element, attrs) {

                scope.logout = function () {
                    window.location.href = "/auth/logout";
                }
                
                scope.nodeRed = function () { 
                    window.location.href = "/red";
                }
            }
        };
}]);
