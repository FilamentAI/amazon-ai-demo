angular.module('tribe').controller('HomeCtrl',

    ['$scope', '$stateParams', '$http', '$websocket',

    function ($scope, $stateParams, $http, $websocket) {

			$scope.inputURL = "https://www.amazon.co.uk/Parker-Ingenuity-Rubber-Medium-Technology/product-reviews/B005SA4UNK/ref=cm_cr_dp_d_show_all_top?ie=UTF8&reviewerType=all_reviews";

			$scope.dataStream = $websocket('ws://localhost:7007/red-api/ws', null, {
				reconnectIfNotNormalClose: true
			});


			$scope.dataStream.onMessage(function (message) {
				$scope.accuracy = 0
				var rating = "";
				var data = JSON.parse(message.data);
				$scope.totalReviews += data.rating.actual.value;
				$scope.totalPredicted += data.rating.predicted.value; //isNaN = False
				//				console.log(isNaN($scope.totalPredicted))
				$scope.fetchedReviews++;

				$scope.reviews.push(data);

				if ($scope.fetchedReviews == $scope.reviewCount) {
					$scope.working = false;
				}
			});


			$scope.submitReview = function (text) {
				$http.post("http://localhost:7007/red-api/submitReviews", {
					"input": text
				}).then(function (response) {
					console.log(response.data)
					$scope.sentimentVal = response.data[0].label;
					$scope.sentimentCon = response.data[0].confidence;
					$scope.ratingVal = response.data[1].label;
					$scope.ratingCon = response.data[1].confidence
				}, function (error) {
					console.log("Error", error);
				})
			}



			$scope.dataStream.onOpen(function () {
				$scope.connected = "COMPLETE";
				$scope.$apply();
			});

			$scope.dataStream.onClose(function () {
				$scope.connected = "FAILED";
				// reconnect.
			});

			$scope.getReviews = function (inputURL) {
				$scope.working = true;
				$scope.reviews = []; // reset the list...
				$scope.totalReviews = 0;
				$scope.totalPredicted = 0;
				$scope.fetchedReviews = 0;

				$http.post("http://localhost:7007/red-api/fetch", {
					"search": inputURL
				}).then(function (response) {
					$scope.returnedData = response.data;
					$scope.productTitle = response.data[0];
					$scope.reviewCount = response.data[1];
					if ($scope.reviewCount > 100) {
						$scope.reviewCount = "100+"
					} else {
						$scope.reviewCount = "0" + $scope.reviewCount[0]
					}


				}, function (error) {
					console.log("Error", error);
				})
			}

    }
]

);
