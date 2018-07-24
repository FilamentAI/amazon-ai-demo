/**
 * @name directives.tab
 **/

(function () {
    angular
        .module('filamentui')
        .directive('filamentuiTab', Tab);

    function Tab() {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/tab/tab.html',
            scope: {},
            require: '^filamentuiTabs',
            link: function ($scope, element, attrs, tabsCtrl) {
                var _data = {
                    name: attrs.name,
                    index: attrs.index
                };

                tabsCtrl.register(_data);

                $scope.isVisible = function () {
                    return tabsCtrl.isActive(_data.index);
                };
            }
        };
    }

}());