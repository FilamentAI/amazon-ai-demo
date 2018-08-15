angular.module('tribe').controller('HomeCtrl',

    ['$scope', '$stateParams', '$http', '$websocket', 

    function ($scope, $stateParams, $http, $websocket) {
        
            $scope.inputURL = "https://www.amazon.co.uk/Parker-Ingenuity-Rubber-Medium-Technology/product-reviews/B005SA4UNK/ref=cm_cr_dp_d_show_all_top?ie=UTF8&reviewerType=all_reviews";

            $scope.dataStream = $websocket('ws://localhost:6006/red-api/ws',  null, { reconnectIfNotNormalClose: true });

            $scope.reviews = [];
            $scope.reviewCount = 0;
            $scope.totalReviews = 0;
            $scope.fetchedReviews = 0;

            $scope.dataStream.onMessage(function (message) {
                var rating = "";
                var data = JSON.parse(message.data);
                if ( data[0][0].class.indexOf("a-star-5") > 0 ) { 
                    rating = 5;
                }
                if ( data[0][0].class.indexOf("a-star-4") > 0 ) { 
                    rating = 1;
                }
                if ( data[0][0].class.indexOf("a-star-3") > 0 ) { 
                    rating = 3;
                }
                if ( data[0][0].class.indexOf("a-star-2") > 0 ) { 
                    rating = 2;
                }
                if ( data[0][0].class.indexOf("a-star-1") > 0 ) { 
                    rating = 1;
                }
                
		data.rating = rating;


		var predict_rating = ""		
		if(data[1][0].stars[0].label == "1"){
			predict_rating = 1;
		}
		if(data[1][0].stars[0].label == "2"){
			predict_rating = 2;
		}
		if(data[1][0].stars[0].label == "3"){
			predict_rating = 3;
		}
		if(data[1][0].stars[0].label == "4"){
			predict_rating = 4;
		}
		if(data[1][0].stars[0].label == "5"){
			predict_rating = 5;
		}

		data.PredictRating = predict_rating;


                $scope.totalReviews += rating;
                $scope.fetchedReviews++;
                
                $scope.reviews.push(data);
                
                if ( $scope.fetchedReviews == $scope.reviewCount ) { 
                    $scope.working = false;
                }
            });
        
            $scope.dataStream.onOpen ( function () { 
                $scope.connected = "COMPLETE";
                $scope.$apply();
            });
        
            $scope.dataStream.onClose ( function () {
                $scope.connected = "FAILED";
                // reconnect.
            });

            $scope.getReviews = function ( inputURL ) {
                $scope.working = true;
                $scope.reviews = []; // reset the list...
                $scope.totalReviews = 0;
                $scope.fetchedReviews = 0;
                
                $http.post("http://localhost:6006/red-api/test", {
                    "search": inputURL
                }).then(function (response) {
                    $scope.returnedData = response.data;
                    $scope.productTitle = response.data[0];
                    $scope.reviewCount = response.data[1];
                    
                }, function (error) {
                    console.log("Error", error);
                })
            }

    }
]

);

