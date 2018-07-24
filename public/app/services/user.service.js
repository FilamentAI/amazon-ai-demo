app.service('user', ['$q', '$http', '$localStorage', function ($q, $http, $localStorage) {

    var userObject = {};
    var userRoles = [];
    var loggedIn = false;

    function checkUser() {
        $http({
            method: 'GET',
            url: '/auth/check'
        }).then(function (response) {
            console.log("Check user..");
            console.log(response.data);

            if (response.data.email != null) {
                userObject = response.data;
                loggedIn = true;
            }
        });
    }

    checkUser();

    var rtn = {
        login: function () {
            window.location.href = "/auth/login";
        },
        isLoggedIn: function () {
            return loggedIn;
        },
        setLoggedIn: function (isLoggedIn) {
            loggedIn = isLoggedIn;
        },
        getUser: function () {
            return userObject;
        },
        getUsername: function () {
            return $localStorage.user_email || userObject.USER_EMAIL;
        },
        getName: function () {
            var name = "";
            name = userObject.displayName;
            if (name == "") {
                name = userObject.email.substring(0, userObject.email.indexOf("@"));;
            }
            return name;
        },
        getImage: function () {
            if (userObject != null) {
                return userObject._json.image.url;
            } else {
                return "";
            }
        }
    };

    return rtn;
}])
