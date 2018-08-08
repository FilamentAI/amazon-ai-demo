angular.module('tribe').controller('HomeCtrl',

    ['$scope', '$stateParams', '$http', '$websocket',

    function ($scope, $stateParams, $http, $websocket) {

			$scope.inputURL = "https://www.amazon.co.uk/Parker-Ingenuity-Rubber-Medium-Technology/product-reviews/B005SA4UNK/ref=cm_cr_dp_d_show_all_top?ie=UTF8&reviewerType=all_reviews";

			$scope.dataStream = $websocket('ws://localhost:7007/red-api/ws', null, {
				reconnectIfNotNormalClose: true
			});

			$scope.reviews = [];
			$scope.reviewCount = 0;
			$scope.totalReviews = 0;
			$scope.fetchedReviews = 0;

			$scope.dataStream.onMessage(function (message, test) {
				var rating = "";
				var data = JSON.parse(message.data);
				console.log(data);
				if (data.starInfo.class.indexOf("a-star-5") > 0) {
					rating = 5;
				}
				if (data.starInfo.class.indexOf("a-star-4") > 0) {
					rating = 1;
				}
				if (data.starInfo.class.indexOf("a-star-3") > 0) {
					rating = 3;
				}
				if (data.starInfo.class.indexOf("a-star-2") > 0) {
					rating = 2;
				}
				if (data.starInfo.class.indexOf("a-star-1") > 0) {
					rating = 1;
				}
				data.rating = rating;
				$scope.totalReviews += rating;
				$scope.fetchedReviews++;

				$scope.reviews.push(data);

				if ($scope.fetchedReviews == $scope.reviewCount) {
					$scope.working = false;
				}
			});

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
				$scope.fetchedReviews = 0;

				$http.post("http://localhost:7007/red-api/test", {
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
