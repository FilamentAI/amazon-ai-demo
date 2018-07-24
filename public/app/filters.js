angular.module('tribe')

.filter('emailToPerson', function () {
    return function (input, delimiter) {
        return input;
        //
        //return (input || []).join(delimiter || ',');
    };
});