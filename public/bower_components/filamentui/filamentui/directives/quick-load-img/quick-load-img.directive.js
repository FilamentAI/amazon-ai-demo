angular.module('filamentui')

  .directive('quickLoadImg', [function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var src = attrs.quickLoadImg;
        var backgroundElement = element[0];

        var img = new Image();
        img.src = src;
        img.onload = function () {
          var background = 'url("' + img.src + '"), -webkit-gradient(radial, 50% 15%, 20, 50% 15%, 1000, from(rgba(148, 78, 100, 0.952941)), to(rgba(0, 0, 0, 0.952941)))';

          backgroundElement.style.background = background;
          backgroundElement.style['background-size'] = 'cover';
          backgroundElement.classList.add('loaded');
        };
      }
    };
  }]);
