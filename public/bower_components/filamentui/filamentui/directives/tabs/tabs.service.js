/**
 * @name service.tabs
 **/

(function () {
    angular
        .module('filamentui')
        .factory('tabService', TabService);

    function TabService() {
        _tabState = {
            openTabIndex: 0
        };

        function _init() {
            _tabState.openTabIndex = 0;
        }

        function setOpenTab(index) {
            _tabState.openTabIndex = index;
        }

        function getOpenTab(index) {
            return _tabState.openTabIndex;
        }

        return {
            _init: _init,
            setOpenTab: setOpenTab,
            getOpenTab: getOpenTab
        };
    }
}());
