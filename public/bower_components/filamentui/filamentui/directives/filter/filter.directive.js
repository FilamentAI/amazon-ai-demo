angular.module('filamentui')
    .directive('filamentuiFilter', ['$timeout', '$rootScope', function ($timeout, $rootScope) {

        // Set defaults
        function preLink($scope, element, attrs) {
        }

        function postLink($scope, element, attrs) {
            $scope.asc = $scope.activeSort && $scope.activeSort.asc || false;
            $scope.displayOptions = false;

            function init() {
                if ($scope.activeSort && $scope.activeSort.key === $scope.key) {
                    setActiveSort($scope.activeSort.key, $scope.activeSort.asc, false);
                }

                if ($scope.filters) {
                    $scope.filters.forEach(function(filter) {
                        if (!filter.title) {
                            filter.title = filter.value;
                        }
                    });
                }
            }

            $scope._toggleOptions = function () {
                $scope.displayOptions = !$scope.displayOptions;
            }

            /**
             * Called when filter is clicked
             * @param {Event} e
             * @param {Object} filter
             */
            $scope._filter = function ( e, filter ) {
                var title = filter.title;
                var key = $scope.key;
                var value = filter.value;

                if ( title === $scope.activeFilter ) {
                    // If filter is currently active, remove it
                    $scope.activeFilter = null;

                    // Complex match matches on any key, and matches on nested values
                    if (filter.complexMatch) {
                        delete $scope.activeFilters['$'];
                    } else {
                        delete $scope.activeFilters[key];
                    }
                } else {
                    // Else set the filter
                    $scope.activeFilter = title;

                    // Complex match matches on any key, and matches on nested values
                    if (filter.complexMatch) {
                        $scope.activeFilters['$'] = value;
                    } else {
                        $scope.activeFilters[key] = value;
                    }
                }

                // Emit event to inform other directives of update
                $rootScope.$emit($scope.event, filter.strict);
                $scope.displayOptions = false;
            }

            $scope._closeFilter = function () {
                $scope.displayOptions = false;
            }

            $scope._shouldHideFilter = function () {
                return !$scope.displayOptions;
            }

            /**
             * Called when a sort filter is clicked
             * @param {Event} e
             * @param {Boolean} asc
             */
            $scope._sort = function ( e, asc ) {
                // Is the filter already selected?
                var remove = $scope.activeSort.key === $scope.key && $scope.activeSort.asc === asc;

                $scope.asc = asc;
                $scope._toggleOptions(); // close the menu
                setActiveSort($scope.key, asc, remove);
            }

            /**
             * Set or remove activeSort value to Angular orderBy expression
             * @param {String} key
             * @param {Boolean} asc
             * @param {Boolean} remove
             */
            function setActiveSort ( key, asc, remove ) {
                if (remove) {
                    // Remove the sort
                    $scope.activeSort.sort = '';
                    delete $scope.activeSort.key;
                    delete $scope.activeSort.asc;
                } else {
                    if ($scope.sortFunction) {
                        // Use the provided sort function
                        $scope.activeSort.sort = $scope.sortFunction;
                    } else {
                        // Create orderBy expression
                        $scope.activeSort.sort = key;
                    }
                    $scope.activeSort.key = key;
                    $scope.activeSort.asc = asc;
                }

                $rootScope.$emit($scope.event);
                $scope.displayOptions = false;
                angular.element('h5', element).removeClass('active');
            }

            init();
        }

        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/filter/filter.html',
            scope: {
                'filterItems' : '=',
                'key': '=',
                'event': '=',
                'sorts': '=',
                'sortFunction': '=',
                'filters': '=',
                'activeFilters': '=',
                'activeSort': '='
            },
            compile: function(element, attributes) {
                return {
                    pre: preLink,
                    post: postLink
                };
            }
        };
}]);
