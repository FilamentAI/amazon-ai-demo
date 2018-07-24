angular.module('filamentui')
    .directive('filamentuiItemGenerator', function($compile, $rootScope) {
    return {
        scope: {
            type: '=',
            data: '=',
            event: '='
        },
        link: function(scope, element) {
            var generatedTemplate = '';
            $rootScope.$on ( scope.event, function () {
                compile();
            });

            scope.$watch('data', function(newVal, oldVal) {
                if (newVal && newVal !== oldVal) {
                    compile();
                }
            });

            function compileJSON(data) {
                var jsonString = JSON.stringify(data);
                var escapedJSONString = jsonString.replace(/\\n/g, "\\n")
                    .replace(/\'/g, "&#39;")
                    .replace(/\\"/g, '\\"')
                    .replace(/\\&/g, "\\&")
                    .replace(/\\r/g, "\\r")
                    .replace(/\\t/g, "\\t")
                    .replace(/\\b/g, "\\b")
                    .replace(/\\f/g, "\\f");

                return escapedJSONString;
            }

            function compile() {
                generatedTemplate = '<div class="generated-class" ' + scope.type;

                for ( key in scope.data ) {
                    var d = scope.data[key];
                    var escapedJSONString = compileJSON(d);
                    generatedTemplate += ' ' + key + '=\'' + escapedJSONString + '\' ';
                }

                generatedTemplate += '></div>';

                angular.element('.generated-class', element).remove();
                element.append($compile(generatedTemplate)(scope));
            }

            compile();
        }
    };
});
