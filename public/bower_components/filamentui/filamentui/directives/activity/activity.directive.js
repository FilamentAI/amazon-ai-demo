angular.module('filamentui')

    .directive('filamentuiActivity', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/activity/activity.html',
            scope: {
                'activities' : '='
            },
            link: function ($scope, element, attrs, ngModel) {
                $scope.showAll = false;
                $scope.updateEvent = 'activity_' + new Date().getTime()+"_" + Math.ceil(Math.random()*100);
                $scope.orderDescriptionKeys = [ 'A - Z', 'Z - A' ];
                $scope.orderTimestampKeys = [ 'Most Recent', 'Oldest' ];

                $scope._fromNow = function ( timestamp ) {
                    return moment ( timestamp ).fromNow();
                }

                $scope._toggleViewMore = function ( ) {
                    $scope.showAll = !$scope.showAll;
                }

                $scope._click = function ( ) {
                    if ($scope.activities.action) {
                        if (typeof $scope.activities.action.click === 'function') {
                            $scope.activities.action.click();
                        }
                    }
                }

                $rootScope.$on($scope.updateEvent, function ( event, filterItems ) {
                    $scope.activities = filterItems;
                } );
            }
        };
}]);
