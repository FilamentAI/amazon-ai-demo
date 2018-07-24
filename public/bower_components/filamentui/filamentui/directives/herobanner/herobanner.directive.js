angular.module('filamentui')

    .directive('filamentuiHeroBanner', [function ( ) {
      return {
        restrict: 'E',
        replace: true,
        transclude: {
            'one': '?paneOne',
            'two': '?paneTwo',
            'three': '?paneThree'
        },
        scope: {
            layout: '=',
            position: '=?',
            backImg: '=',
            backGrad: '=',
            
            title: '=',
            status: '=',
            description: '=',
            lastUpdated: '=?'
        },
        templateUrl: function(elem, attrs) {
            var layout = attrs.layout;
            // fix commas for attrs use in template
            if (layout) {
                var split = attrs.layout.split('\'');
                layout = split[1];
            }
            var url = layout ? 'filamentui/directives/herobanner/layout/' + layout + '.html' : 'filamentui/directives/herobanner/layout/basic.html';
            return url;
        },
        link: function ($scope, element, attrs) {
            if ($scope.layout == 'two_column' && !$scope.position) {
                $scope.position = 'right';
            }

            $scope.hidePane = hidePane;

            function init() {
                setBackground();
            }

            function setBackground() {
                var url = attrs.backImg || '_img/hero-banner.jpg';

                if (attrs.backGrad || !attrs.backImg) {
                    element.css({
                        'background': 'linear-gradient(rgba(255, 255, 255, 0.85),rgba(255, 255, 255, 0.85)), url(' + url + ')',
                        'background-size': 'cover',
                        'background-position': 'center'
                    });
                } else {
                    element.css({
                        'background': 'url(' + url + ')',
                        'background-size': 'cover',
                        'background-position': 'center'
                    });       
                }
            }

            function hidePane(position) {
                return !(position == $scope.position);
            }

            init();
        }
    };
}]);