angular
    .module('filamentui')
    .directive('filamentuiCardContainer', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/cards/cards.html',
            scope: {
                'cards': '=',
                'actions': '=',
                'heading': '=',
                'showRatings': '=',
                'onPageChange': '=',
                'options': '=',
                'pagerId': '=',
                'filterBy': '=',
                'orderBy': '=',
                'addTitle': '=?'
            },
            link: function ($scope, element, attrs) {
                $scope.showAdd = !( $scope.addTitle == null );

                $scope.addCard = {
                    'category': 'add',
                    'description': $scope.addTitle
                }

                $scope.pagination = {
                    currentPage: 1,
                    _totalItems: 0,
                    perPage: ( $scope.options && $scope.options.perpage ? $scope.options.perpage : 10 )
                };

                // see pager.directive.js for details
                $scope.pagerOptions = {
                    perPage: $scope.pagination.perPage,
                    directionLinks: true,
                    boundaryLinks: true,
                    onPageChange: pageChanged,
                    pagerId: $scope.pagerId,
                    autoHide: $scope.options.autoHide
                }

                function pageChanged ( newPageNum, oldPageNum ) {
                    getData();
                }

                var sortCards = function() {
                    if ($scope.orderBy) {
                        var reverse = $scope.orderBy.charAt(0) === '-';
                        var sortProperty;

                        if (reverse) {
                            sortProperty = $scope.orderBy.slice(1);
                        } else {
                            sortProperty = $scope.orderBy;
                        }

                        // Sort cards using orderBy property
                        $scope._cards = $scope._cards.sort(function(a, b) {
                            // Reverse sort
                            if (reverse) {
                                return a[sortProperty] < b[sortProperty] ? 1 : -1;
                            } else {
                                return a[sortProperty] > b[sortProperty] ? 1 : -1;
                            }
                        });
                    }
                }

                function getData () {
                    var startIndex = $scope.pagination.currentPage * $scope.pagination.perPage;
                    if ( typeof $scope.cards == 'function' ) {
                        // Get data asynchronously
                        $scope.cards({
                            'start' : startIndex,
                            'perpage' : ( $scope.pagination.perPage ? $scope.pagination.perPage : $scope.pagination._totalItems ) // everything
                        }).then ( function ( results ) {
                            $scope._cards  = angular.copy(results.data);
                            sortCards();
                            $scope.pagination._totalItems = results.count;
                            var originalItems = angular.copy(results.data);
                        });
                    } else {
                        $scope._cards = angular.copy($scope.cards);
                        sortCards($scope._cards);

                        // Use data in the same way as the asynchronous method
                        // Requires slicing the data up into pages then setting the _totalItems property
                        // to allow dir-paginate to work correctly
                        startIndex = ( $scope.pagination.currentPage - 1 ) * $scope.pagination.perPage;
                        if ( $scope.pagination.perPage ) {
                            $scope._cards = $scope._cards.splice(startIndex, $scope.pagination.perPage);
                        }

                        $scope.pagination._totalItems = $scope.cards.length;
                        var originalItems = angular.copy($scope._cards);
                    }
                }

                $scope._addClick = function () {
                    if ( $scope.actions && $scope.actions.length > 1 ) {
                        var group = $scope.actions[1];
                        if ( group.length > 0 ) {
                            var click = group[0];
                            if ( click.if != null ) {
                                if ( typeof click.if == 'function' && click.if() ) {
                                    click.action();
                                } else if ( typeof click.if == 'boolean' && click.if ) {
                                    click.action();
                                } else {
                                    // do nothing...
                                }
                            } else {
                                click.action();
                            }
                        }
                    }
                }

                $scope._cardClick = function ( model ) {
                    if ( !model.loading && $scope.actions && $scope.actions.length > 0 ) {
                        var group = $scope.actions[0];
                        if ( group.length > 0 ) {
                            var click = group[0];
                            if ( click.if != null ) {
                                if ( typeof click.if == 'function' && click.if( model ) ) {
                                    click.action( model );
                                } else if ( typeof click.if == 'boolean' && click.if ) {
                                    click.action( model );
                                } else {
                                    // do nothing...
                                }
                            } else {
                                click.action( model );
                            }
                        }
                    }
                }

                // watch cards, refresh data on pull
                $scope.$watch('cards', function () {
                    getData();
                });

                $scope.$watch('pagerOptions.perPage', function( ) {
                    $scope.pagination.perPage = $scope.pagerOptions.perPage;
                });

                $scope.$watch('orderBy', function(newVal, oldVal) {
                    if (newVal && newVal !== oldVal) {
                        getData();
                    }
                })
            }
        };
}]);
