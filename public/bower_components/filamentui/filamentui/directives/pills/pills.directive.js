angular.module('filamentui')

    .directive('filamentuiPills', [function () {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/pills/pills.html',
            scope: {
                'options': '='
            },
            require: 'ngModel',
            link: function ($scope, element, attrs, ngModel) {
                $scope.selectedPill = null;

                ngModel.$render = function () {
                    if ( ngModel.$viewValue ) {
                        for ( var i = 0; i < $scope.options.length; i++ ) {
                            if ( $scope.options[i] == ngModel.$viewValue ) {
                                $scope.selectedPill = $scope.options[i];
                            }
                        }
                    }
                }

                ngModel.$render();

                $scope._click = function ( pill ) {
                    if ( pill.click && typeof pill.click == "function" ) {
                        if ( pill.disabled != null && typeof pill.disabled == "function" ) {
                            if ( !pill.disabled( pill ) ) {
                                $scope.selectedPill = pill;
                                pill.click ( pill );
                                ngModel.$setViewValue($scope.selectedPill);
                            }
                            // can't click on it if disabled...
                        } else {
                            $scope.selectedPill = pill;
                            pill.click ( pill );
                            ngModel.$setViewValue($scope.selectedPill);
                        }
                    } else {
                        if ( pill.disabled != null && typeof pill.disabled == "function" ) {
                            if ( !pill.disabled( pill ) ) {
                                $scope.selectedPill = pill;
                                ngModel.$setViewValue($scope.selectedPill);
                            }
                            // can't click on it if disabled...
                        } else {
                            $scope.selectedPill = pill;
                            ngModel.$setViewValue($scope.selectedPill);
                        }
                    }
                }
            }
        };
}]);
