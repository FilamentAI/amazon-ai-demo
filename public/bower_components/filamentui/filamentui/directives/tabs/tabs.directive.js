/**
 * @name directives.tabs
 **/

(function () {
    angular
        .module('filamentui')
        .directive('filamentuiTabs', Tabs)
        .controller('TabsController', TabsController);

    function Tabs(tabService) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/tabs/tabs.html',
            scope: {
                position: '='
            },
            link: function ($scope, element, attrs) {
                $scope.switch = function (tab) {
                    tabService.setOpenTab(tab.index);
                };
            },
            controller: TabsController
        };
    }

    function TabsController($scope, tabService) {
        $scope.tabs = [];

        function init() {
            tabService._init();
        }

        this.register = function(tab) {
            $scope.tabs.push(tab);
        };

        this.isActive = function(index) {
            return (tabService.getOpenTab() == index);
        };

        $scope.isActive = this.isActive;

        init();
    }
}());