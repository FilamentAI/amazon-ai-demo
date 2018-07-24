angular
    .module('filamentui')
    .directive('filamentuiButton', ['$timeout', '$q', function ($timeout, $q) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/button/button.html',
            scope: {
                click: '&?',
                options: '=',
                openOnSelectOption: '=',
                position: '=',
                size: '=?'
            },
            link: function ($scope, element, attrs) {
                $scope._isPlus = element.hasClass('plus');

                $scope.selectedMenu = null;
                $scope.menuIcon = null;

                $scope.lastClick = null;
                $scope.processing = false;

                $scope.disabledClass = '';

                $scope.loadingIconColour = '#fff';
                if (element.hasClass('delete')) {
                    $scope.loadingIconColour = '#d0021b';
                } else if (element.hasClass('info')) {
                    $scope.loadingIconColour = '#31708F';
                }

                attrs.$observe('disabled', function(newVal, oldVal) {
                    if (newVal !== undefined && newVal !== oldVal) {
                        if (newVal) {
                            $scope.disabledClass = 'disabled';
                        } else {
                            $scope.disabledClass = '';
                        }
                    }
                });

                function setSelectedOption() {
                    var found = false;
                    if ($scope.options && $scope.options[0]) {
                        for ( var i = 0; i < $scope.options[0].length; i++ ) {
                            var m = $scope.options[0][i];
                            if ( m.if == null && !found ) {
                                $scope.selectedMenu = m;
                                $scope.selectedOption = $scope.selectedMenu.title;
                                $scope.menuIcon = $scope.selectedMenu.icon;
                                found = true;
                                break;
                            } else if ( m.if != null && m.if () ) {
                                $scope.selectedMenu = m;
                                $scope.selectedOption = $scope.selectedMenu.title;
                                $scope.menuIcon = $scope.selectedMenu.icon;
                                found = true;
                                break;
                            } else {
                                // iterate....
                            }
                        }
                    }
                }

                $scope._toggleOptions = function ( $event ) {
                    if ( $event ) {
                        $event.stopPropagation();
                        $event.preventDefault();
                    }

                    if (!$scope._disabled()) {
                        $scope.displayOptions = !$scope.displayOptions;
                    }
                }

                $scope._closeOptions = function () {
                    $scope.displayOptions = false;
                }

                $scope._clickMenu = function ( menu ) {
                    $scope.selectedMenu = menu;
                    $scope.menuIcon = $scope.selectedMenu.icon;
                    $scope.selectedOption = $scope.selectedMenu.title;
                    $scope.displayOptions = false;

                    if ( $scope._isPlus || ( $scope.openOnSelectOption && $scope.openOnSelectOption ) ) {
                        menu.action();
                    }
                }

                $scope._click = function () {
                    function executePromise (promise) {
                        if (promise) {
                            $scope.processing = true;
                            $q.when(promise).then(function(resolved) {
                                $scope.processing = false;
                            }, function() {
                                $scope.processing = false;
                            });
                        }
                    }

                    function executeClick () {
                        if (!$scope.processing) {
                            if ( $scope.selectedMenu ) {
                                var promise = $scope.selectedMenu.action(); // do the thing selected...
                                executePromise(promise);
                            } else if (!$scope.selectedOption && $scope.options) {
                                $scope._toggleOptions();
                            } else {
                                if ($scope.click) {
                                    $timeout ( function () {
                                        var promise = $scope.click();
                                        executePromise(promise);
                                    }, 100);
                                }
                            }
                        }
                    }

                    if (!$scope._disabled()) {
                        executeClick();
                    }
                }

                $scope._disabled = function () {
                    return element.hasClass('disabled');
                }
            }
        };
}]);
