angular.module('filamentui')

  .directive('filamentuiTags', [function () {
    return {
      restrict: 'AE',
      replace: true,
      transclude: true,
      templateUrl: 'filamentui/directives/tags/tags.html',
      scope: {
        'tags': '=',
        'top': '=?'
      },
      link: function ($scope, element, attrs, ngModel) {
        $scope.showAll = true;
        $scope.topTags = [];
        $scope.moreTags = [];
        $scope.showTags = false;
        
        function init () {
          if ($scope.top && typeof $scope.top === 'number') {
            $scope.showAll = false;
            $scope.topTags = $scope.tags.slice(0, $scope.top);
            $scope.moreTags = $scope.tags.slice($scope.top, $scope.tags.length);
          }
        }

        $scope._showMore = function () {
          $scope.showTags = true;
        }

        $scope._showLess = function () {
          $scope.showTags = false;
        }

        $scope.tagColour = function (tag) {
          // TODO: If no tag colour, generate a random colour
          var style = {
            background: tag.colour
          };

          return style;
        }

        init();
      }
    };
  }]);