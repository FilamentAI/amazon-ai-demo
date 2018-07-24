angular.module('filamentui')

    .directive('filamentuiDataset', [function () {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/types/dataset.html',
            scope: {
                "title" : "=",
                "description" : "="
            },
            link: function (scope, element, attrs) {

            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiTag', [function () {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/types/tag.html',
            scope: {
                "title" : "=",
                "description" : "="
            },
            link: function (scope, element, attrs) {

            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiTagger', [function () {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/types/tagger.html',
            scope: {
                "title" : "=",
                "description" : "="
            },
            link: function (scope, element, attrs) {

            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiVersion', [function () {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/types/version.html',
            scope: {
                "title" : "=",
                "description" : "="
            },
            link: function (scope, element, attrs) {

            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiWorkspace', [function () {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/types/workspace.html',
            scope: {
                "title" : "=",
                "description" : "="
            },
            link: function (scope, element, attrs) {

            }
        };
}]);
