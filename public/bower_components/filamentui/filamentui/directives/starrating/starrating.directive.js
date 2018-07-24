angular.module('filamentui')

    .directive('filamentuiStarRating', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/starrating/starrating.html',
            scope: {
                disabled: '=?'
            },
            require: "ngModel",
            link: function ($scope, element, attrs, ngModel) {
                $scope.stars = 0;

                $scope._select = function ( newValue ) {
                    // console.log("new value = " + newValue);
                    if ( $scope.disabled ) {
                        return; // do nothing
                    }
                    // set the value here?
                    ngModel.$setViewValue(newValue);
                    $scope.stars = newValue;
                }

                // when angular detects a change to the model,
                // we update our widget
                ngModel.$render = function model2view() {
                    if (ngModel.$viewValue != undefined) {
                        $scope.stars = ngModel.$viewValue;
                    }
                }
            }
        };
}]);
