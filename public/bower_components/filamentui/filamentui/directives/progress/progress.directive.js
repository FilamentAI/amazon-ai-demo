angular.module('filamentui')

    .directive('filamentuiProgress', [function () {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/progress/progress.html',
            scope: {
                'label' : '=',
                'progress': '=',
                'background': '=?',
                'options': '=?'
            },
            link: function ($scope, element, attrs, ngModel) {

                $scope.currentProgress = 0;

                $scope._calcStyle = function() {
                    var progress = _progress();

                    progress = progress > 100 ? 100 : progress;
                    progress = progress < 0 ? 0 : progress;

                    var style = {
                        width: progress + '%',
                        background: _background(progress)
                    };

                    return style;
                }

                var _progress = function () {
                    if ( $scope.progress ) {
                        if (typeof $scope.progress === 'function') {
                            $scope.currentProgress = $scope.progress();
                        } else {
                            $scope.currentProgress = $scope.progress;
                        }
                    }

                    return $scope.currentProgress;
                }

                var _background = function () {
                    if ( $scope.background ) {
                        if ( typeof $scope.background === 'function' ) {
                            if ( $scope.currentProgress ) {
                                return $scope.background( $scope.currentProgress );
                            } else {
                                return $scope.background( 0 );
                            }
                        } else {
                            return $scope.background;
                        }
                    } else {
                        return '#27ae60';
                    }
                }
            }
        };
}]);
