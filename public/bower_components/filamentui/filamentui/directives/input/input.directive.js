angular.module('filamentui')

    .directive('filamentuiInput', [function ( ) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/input/input.html',
            scope: {
                'name': '=',
                'required': '=',

                'label': '=',
                'placeholder': '=',
                'errorMessage': '=',
                'infoMessage': '=',
                'helpMessage': '=',

                'rows': '=',
                'options': '=',
                'date': '=',

                'readonly': '=',
                'password': '=',
                'disabled': '=',
                'help': '&?',
                'valid': '&?',
                'size': '=?'
            },
            require: 'ngModel',
            link: function ($scope, element, attrs, ngModel) {
                $scope.input = {
                    value: null
                };

                $scope_showHelpMessage = false;
                $scope.originalValue = null;

                $scope.inputType = 'text';
                if ( $scope.password != null && $scope.password ) {
                    $scope.inputType = 'password';
                }

                $scope.readonlyClass = '';
                $scope.readonlyState = false;
                $scope.disabledClass = '';
                $scope.disabledState = false;

                attrs.$observe('readonly', function(newVal, oldVal) {
                    if (newVal !== undefined && newVal !== oldVal) {
                        if (newVal) {
                            $scope.readonlyClass = 'readonly';
                            $scope.readonlyState = true;
                        } else {
                            $scope.readonlyClass = '';
                        }
                    }
                });

                attrs.$observe('disabled', function(newVal, oldVal) {
                    if (newVal !== undefined && newVal !== oldVal) {
                        if (newVal) {
                            $scope.disabledClass = 'disabled';
                            $scope.disabledState = true;
                        } else {
                            $scope.disabledClass = '';
                        }
                    }
                });

                // when angular detects a change to the model,
                // we update our widget
                ngModel.$render = function model2view() {
                    if (ngModel.$viewValue != undefined) {
                        $scope.input.value = ngModel.$viewValue;
                        if ( $scope.originalValue == null ) {
                            // hopefully only do this once.
                            $scope.originalValue = angular.copy($scope.input.value);
                        }
                    }
                }

                $scope.onInputChange = function ()  {
                    ngModel.$setViewValue($scope.input.value);
                }

                $scope.clearInput = function () {
                    $scope.input.value = null;
                    ngModel.$setViewValue($scope.input.value);
                }

                $scope._hasChanged = function () {
                    return $scope.input.value && $scope.input.value !== '';
                }

                $scope._valid = function () {
                    if ( $scope.valid != null ) {
                        if ( typeof $scope.valid == 'function' ) {
                            return $scope.valid();
                        } else {
                            return $scope.valid;
                        }
                    } else {
                        return true;
                    }
                }
            }
        };
}]);
