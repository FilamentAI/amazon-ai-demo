angular
    .module('filamentui')
    .directive('filamentuiCard', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/card/card.html',
            scope: {
                'model': '=',
                'showRatings': '=',
                'flip': '=?'
            },
            link: function ($scope, element, attrs) {
                // looks odd but flip might be null
                $scope.flip = $scope.flip ? $scope.flip : false;

                $scope._imgSrc = function () {
                    var imgTemplate = '';
                    if ( $scope.model.imageName ) {
                        imgTemplate += 'filamentui/assets/img/' + $scope.model.imageName;
                    }
                    return imgTemplate;
                }
            }
        };
    }])
    .filter('concat', function () {
        function concatFilter ( list ) {
            if ( list ) {
                return list.split(',').join(', ');
            } else {
                return 'None';
            }
        }
        return concatFilter;
    })
    .filter('currency', function() {
        function currencyFilter ( value ) {
            if ( value === 0 || value === '0' ) {
                return 'FREE';
            } else {
                return '£' + value;
            }
        }
        return currencyFilter;
    })
    .filter('modelTaggingType', function() {
        function modelTaggingTypeFilter( value ) {
            if ( value === 'DOCUMENT' || value === 'SENTENCE' || value === 'WORD' ) {
                return 'NLP ' + value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() + ' Model';
            } else {
                return value;
            }
        }

        function isArrayFilter ( array ) {
            if ( Array.isArray(array) ) {
                return array.map(modelTaggingTypeFilter);
            } else {
                return modelTaggingTypeFilter(array);
            }
        }
        return isArrayFilter;
});
