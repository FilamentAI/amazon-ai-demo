var app = angular.module('filamentuiDemo', [
    'ui.router',
    'filamentui',
    'ngPrettyJson',
    'ngSanitize'
]);

app.constant('CONSTANTS', {
    'date': 'EEEE, d MMM, y'
});

app.config(function ($urlRouterProvider, $stateProvider, $locationProvider) {
    $locationProvider.html5Mode({
        enabled: true
    });

    $urlRouterProvider
        .otherwise('/home');

    $stateProvider
    // .state('home', {
    //     name: 'home',
    //     url: '/home',
    //     templateUrl: 'app/pages/home/home.html',
    //     controller: 'HomeCtrl'
    // })
    // .state('tables', {
    //     name: 'tables',
    //     url: '/tables',
    //     templateUrl: 'app/pages/tables/tables.html',
    //     controller: 'TablesCtrl'
    // })
    // .state('dashboard', {
    //     name: 'dashboard',
    //     url: '/dashboard',
    //     templateUrl: 'app/pages/dashboard/dashboard.html',
    //     controller: 'DashboardCtrl'
    // });

    .state('header', {
        views: {
            '' : {
                templateUrl: 'filamentui/layouts/page_header.html'
            }
        }
    })
    // .state('headerBar', {
    //     views: {
    //         '' : {
    //             templateUrl: 'filamentui/layouts/page_header_and_section_header.html'
    //         }
    //     }
    // })

    .state('home', {
        url: '/home',
        parent : 'header',
        views: {
            'headerContent' : {
                template: '<div>TODO: Stick public menu options in here</div>'
            },
            'pageContent' : {
                templateUrl: 'filamentui/layouts/content.html'
            },
            'title@home' : {
                template : '<h1>Engine/Filament UI Branding</h1>'
            },
            'content@home': {
                templateUrl: 'app/pages/home/home.html',
                controller: 'HomeCtrl'
            }
        }
    })

    .state('tables', {
        url: '/tables',
        parent : 'header',
        views: {
            'headerContent' : {
                template: '<div>TODO: Stick public menu options in here</div>'
            },
            'pageContent' : {
                templateUrl: 'filamentui/layouts/content.html'
            },
            'title@tables' : {
                template : '<h1>Tables</h1>'
            },
            'content@tables': {
                templateUrl: 'app/pages/tables/tables.html',
                controller: 'TablesCtrl'
            }
        }
    })

    .state('dashboards', {
        url: '/dashboards',
        parent : 'header',
        views: {
            'headerContent' : {
                template: '<div>TODO: Stick public menu options in here</div>'
            },
            'pageContent' : {
                templateUrl: 'filamentui/layouts/content.html'
            },
            'title@dashboards' : {
                template : '<h1>Dashboard Examples</h1>'
            },
            'content@dashboards': {
                templateUrl: 'app/pages/dashboards/dashboards.html',
                controller: 'DashboardCtrl'
            }
        }
    })
    .state('test', {
        url: '/test',
        parent : 'header',
        views: {
            'headerContent' : {
                template: '<div>TODO: Stick public menu options in here</div>'
            },
            'pageContent' : {
                templateUrl: 'filamentui/layouts/content.html'
            },
            'title@test' : {
                template : '<h1>Testing Console</h1>'
            },
            'content@test': {
                templateUrl: 'app/pages/active/test.html',
                controller: 'TestCtrl'
            }
        }
    })
    // .state('page1', {
    //     url: '/page1',
    //     parent : 'header',
    //     views: {
    //         'headerContent' : {
    //             templateUrl: 'app/pages/test/header.html'
    //         },
    //         'pageContent' : {
    //             templateUrl: 'filamentui/layouts/content_sidebar.html'
    //         },
    //         'title@page1' : {
    //             template : '<h1>Workspaces</h1><h4>Select or create workspaces</h4>'
    //         },
    //         'sidebar@page1': {
    //             templateUrl: 'app/pages/test/sidebar.html'
    //         },
    //         'content@page1': {
    //             templateUrl: 'app/pages/test/content.html'
    //         }
    //     }
    // })
    // .state('page2', {
    //     url: '/page2',
    //     parent : 'headerBar',
    //     views: {
    //         'headerContent' : {
    //             templateUrl: 'app/pages/test/header.html'
    //         },
    //         'headerBar' : {
    //             template : '<h1>Workspaces</h1><h4>Select or create workspaces</h4>'
    //         },
    //         'pageContent' : {
    //             templateUrl: 'filamentui/layouts/content_with_back.html'
    //         },
    //         'title@page2' : {
    //             template : '<h1>Specific Workspace</h1><h4>Select or create workspaces</h4>'
    //         },
    //         'back@page2': {
    //             template: '<filamentui-back title=\'"Back to previous page"\' back=\'navigateBack()\'></filamentui-back>'
    //         },
    //         'content@page2': {
    //             templateUrl: 'app/pages/test/sampleContent.html'
    //         }
    //     }
    // })
    // .state('page3', {
    //     url: '/page3',
    //     parent : 'header',
    //     views: {
    //         'headerContent' : {
    //             templateUrl: 'app/pages/test/header.html'
    //         },
    //         'pageContent' : {
    //             templateUrl: 'filamentui/layouts/content_with_back.html'
    //         },
    //         'back@page3': {
    //             template: '<filamentui-back title=\'"Back to previous page"\' back=\'navigateBack()\'></filamentui-back>'
    //         },
    //         'title@page3' : {
    //             template : '<h1>Workspaces</h1><h4>Select or create workspaces</h4>'
    //         },
    //         'content@page3': {
    //             templateUrl: 'app/pages/test/sampleContent.html'
    //         }
    //     }
    // });
});

// app.controller('MainCtrl', ['$scope', '$stateParams', '$state', '$rootScope', '$http',
//     function ($scope, $stateParams, $state, $rootScope, $http) {
// }]);
