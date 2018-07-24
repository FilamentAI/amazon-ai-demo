angular.module('filamentui')

    .directive('filamentuiMenu', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'filamentui/directives/menu/menu.html',
            scope: {
                'options' : '=',
                'position' : '=',
                'scope' : '=',
                'text' : '='
            },
            link: function ($scope, element, attrs) {
                $scope.displayOptions = false;

                $scope._toggleOptions = function ( $event ) {
                    $event.preventDefault();
                    $event.stopImmediatePropagation();
                    $scope.displayOptions = !$scope.displayOptions;
                    if ( angular.element('.menuButton', element).hasClass('active') ) {
                        angular.element('.menuButton', element).removeClass('active');
                    } else {
                        angular.element('.menuButton', element).addClass('active');
                    }
                }

                $scope._clickMenu = function ( $event, menu ) {
                    $event.preventDefault();
                    $event.stopImmediatePropagation();

                    $scope.displayOptions = false;

                    var params = menu;
                    if ( $scope.scope ) {
                        params = $scope.scope;
                    }

                    if ( menu.disabled ) {
                        // has a disabled function.. .
                        if ( !menu.disabled( $scope.scope ) ) {
                            if ( menu.action ) {
                                menu.action( params );
                            }
                        }
                    } else {
                        if ( menu.action ) {
                            menu.action( params );
                        }
                    }

                }

                $scope._showMenu = function ( menu, row ) {
                    if ( !menu.if ) {
                        return true;
                    } else {
                        return menu.if(row);
                    }
                }

                $scope._showMenuGroup = function( group, row ) {
                    var result = false;
                    group.forEach(function( menu ) {
                        result = result || $scope._showMenu(menu, row);
                    });
                    return result;
                }

                $scope._disableMenu = function (menu, row) {
                    if ( !menu.disabled ) {
                        return false;
                    } else {
                        return menu.disabled(row);
                    }
                }

                $scope._closeMenu = function () {
                    $scope.displayOptions = false;
                    angular.element('.menuButton', element).removeClass('active');
                }

                $scope._shouldHideMenu = function () {
                    return !$scope.displayOptions;
                }
            }
        };
}]);
