angular
    .module('filamentui')
    .directive('filamentuiRoleCard', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/card/rolecard/rolecard.html',
            scope: {
                'card': '=',
                'click': '=',
                'selectedId': '=',
                'information': '=?'
            },
            link: function ($scope, element, attr) {
                $scope._click = function ( data ) {
                    if ( typeof $scope.click == 'function' ) {
                        $scope.click(data);
                    } else {
                        // do nothing...
                    }
                }

                $scope._information = function ( data ) {
                    if ($scope.information && typeof $scope.information === 'function') {
                        $scope.information(data);
                    }
                }

                $scope._cardClasses = function () {
                    var className = '';

                    if ($scope.card.tag) {
                        className += 'role-card-' + $scope.card.tag.toLowerCase();
                    }
                    if ($scope.selectedId === $scope.card.id) {
                        className += ' selected';
                    }

                    return className;
                }

                $scope._imgSrc = function () {
                    var imgTemplate = '';
                    if ( $scope.card.svg ) {
                        imgTemplate += 'filamentui/assets/img/' + $scope.card.svg;
                    } else if ($scope.card.img) {
                        imgTemplate += $scope.card.img;
                    }
                    return imgTemplate;
                }
            }
        }
}]);