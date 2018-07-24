app.service('httpErrors', ['$q', '$http', function ($q, $http) {
    return {
        handleError: function (error, reject) {
            var message = {
                "title": "",
                "text": "",
                "mode": "error"
            };
            if (error.status == 401) {
                // Unauthorised...
                message.title = "Unauthenticated";
                message.text = "You must be authenticated to access that resource, please log in.";
                window.location.href = "/?message=" + JSON.stringify(message);
            } else {
                reject(error); // default...
            }
        }
    }
}]);
