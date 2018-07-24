angular.module('filamentui')

    .directive('filamentuiRadio', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'filamentui/directives/radio/radio.html',
            scope: {
                'label': '='
            },
            require: 'ngModel',
            link: function ($scope, element, attrs, ngModel) {
                $scope._click = function (e) {
                    e.stopPropagation();
                    $scope._checked = !$scope._checked;

                    if (ngModel) {
                        ngModel.$setViewValue($scope._checked);
                    }
                }

                // when angular detects a change to the model,
                // we update our widget
                if (ngModel) {
                    ngModel.$render = function() {
                        $scope._checked = ngModel.$viewValue;
                    }
                }
            }
        };
    }]);
