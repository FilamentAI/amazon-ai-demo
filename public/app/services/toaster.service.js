app.service('toasterService', ['$mdToast', function ($mdToast) {
    toasterService = {
        displayToast: function (message, theme) {
            $mdToast.show(
                $mdToast.simple()
                .textContent(message)
                .position("top right")
                .hideDelay(3000)
                .theme(theme)
            );
        },
        displayToastConfirmation: function (message, theme) {
            $mdToast.show(
                $mdToast.simple()
                .textContent(message)
                .action('OK')
                .position("top right")
                .theme(theme)
            );
        }

    }
    return toasterService;
}])