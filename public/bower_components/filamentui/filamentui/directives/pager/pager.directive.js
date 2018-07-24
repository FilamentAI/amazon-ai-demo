angular.module('filamentui')
    .directive('filamentuiPager', [function () {

        // Set defaults
        function preLink($scope, element, attrs) {
            if (!$scope.options) {
                $scope.options = {
                    perPage: 10
                };
            }

            // if ($scope.options.pagerId) {
            //     $scope.options.pagerId = $scope.options.pagerId + '_pgid';
            // }
        }

        function postLink($scope, element, attrs) {
            $scope.hideMenu = ( $scope.total && $scope.total > $scope.options.perPage );

            // default values as listed in dir-paginate docs
            // max-size (optional, default = 9, minimum = 5) - default css built to work with 9 items
            // direction-links (optional, default = true)
            // boundary-links (optional, default = false)
            // on-page-change (optional, default = null)
            // pagination-id (not optional in our project, provide as a string in template, eg 'demo_id')
            // template-url (cannot be set currently, default = filamentui/directives/pager/controls.html)
            // auto-hide (optional, default = true)

            $scope.perPageOptions = [ 5, 10, 50 ] // dropped 'all'
            $scope.perPageTitle = perPageTitle();

            $scope.perPageMenu = [ [] ];

            for ( p in $scope.perPageOptions ) {
                var pp = $scope.perPageOptions[p];
                $scope.perPageMenu[0].push ( {
                    "title": pp + ' per page',
                    "perpage": pp,
                    "action": function ( item ) {
                        // pass value back up through scope
                        $scope.options.perPage = item.perpage;
                        $scope.perPageTitle = perPageTitle();
                    }
                } );
            }

            function perPageTitle() {
                return $scope.options.perPage + ' per page';
            }
        }

        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/pager/pager.html',
            scope: {
                'options': '=',
                'total': '='
            },
            compile: function(element, attributes) {
                return {
                    pre: preLink,
                    post: postLink
                };
            }
        };
}]);
