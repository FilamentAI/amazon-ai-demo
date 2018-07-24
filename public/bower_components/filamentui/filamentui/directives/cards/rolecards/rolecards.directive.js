angular
    .module('filamentui')
    .directive('filamentuiRoleCardContainer', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'filamentui/directives/cards/rolecards/rolecards.html',
            scope: {
                "cards": "=",
                "information": "=?"
            },
            require: "ngModel",
            link: function ($scope, element, attr, ngModel) {
                $scope._updateSelected = function ( card ) {
                    ngModel.$setViewValue(card);
                    ngModel.$render();
                }

                ngModel.$render = function () {
                    if (ngModel.$viewValue) {
                        $scope.selected = ngModel.$viewValue.id;
                    }
                }

            }
        }
}]);