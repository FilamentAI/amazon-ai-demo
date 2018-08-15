angular.module('tribe').controller('TestCtrl',

    ['$scope', '$stateParams', '$http', '$websocket', 

    function ($scope, $stateParams, $http, $websocket) {
        
            $scope.testText = null;
        
            $scope.testReview = function ( inputURL ) {
                $scope.working = true;
                
                $http.post("http://localhost:6006/red-api/test", {
                    "text": $scope.testText
                }).then(function (response) {
                    console.log(response.data);
                    var rtn = response.data;
                }, function (error) {
                    console.log("Error", error);
                })
            }
            
            $scope.isValid = function () { 
                return $scope.testText != null;
            }

    }
]

);
