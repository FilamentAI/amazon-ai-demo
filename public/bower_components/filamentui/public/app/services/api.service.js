angular.module('filamentuiDemo')
    .service('apiService',

    [ '$http', '$q',

    function ( $http, $q ) {

        var _this = this;
        var filterData = null;
        var _rows = null;

        // technically working with static file data in this app
        // array splice used on 'api' results with offset correction


        this.queryTable = function ( data ) {
            var deferred = $q.defer();

            console.log('query the table');

            $http
                .get('app/data/table.json')
                .then(function( response ) {
                    console.log(response);
                    filterData = response.data;
                    _rows = filterData;

                    Object.keys(data).forEach(function ( key ) {
                        if ( key == 'title' ) {
                            _filterData(key, data[key]);
                        } else if ( key == 'timestamp' || key == 'progress' || key == 'title' ) {
                            _sortData(key, data[key] == 'asc');
                        }
                    });

                    _pageData(data["start"], data["perpage"]);

                    response.items  = _rows;
                    response.count = filterData.length;

                    deferred.resolve(response);
            });

            return deferred.promise;
        }

        this.queryCards = function ( data ) {
            var deferred = $q.defer();

            console.log('query the cards');

            $http
                .get('app/data/cards.json')
                .then(function (response ) {
                    var originalData = response.data;
                    var cards = null;
                    if (data.perpage ) {
                        var start = ( data.start - data.perpage ) < 0 ? 0 : data.start - data.perpage;
                        cards = angular.copy(response.data).splice(start, data.perpage);
                    } else {
                        cards = angular.copy(response.data);
                    }
                    response.data  = cards;
                    response.count = originalData.length;

                    deferred.resolve(response);
            });

            return deferred.promise;
        }

        function _pageData ( start, perpage ) {
            var _r = null;
            if ( perpage ) {
                var s = ( start - perpage ) < 0 ? 0 : start - perpage;
                _r = angular.copy(_rows).splice(s, perpage);
            } else {
                _r = angular.copy(_rows);
            }
            _rows = _r;
        }

        function _filterData ( key, value ) {
            console.log('filtering...');
            var toFilter = angular.copy(_rows);
            console.log(toFilter);
            var output = toFilter.filter(function( item ) {
                var result = false;
                if ( item[key] != null ) {
                    if ( typeof value == "function" ) {
                        // untested
                        result = value(item);
                    } else {
                        result = ( item[key].type == value );
                    }
                }
                return result;
            });

            filterData = output;
            _rows = output;
        }

        function _sortData ( key, asc ) {
            var gt = 1;
            var lt = -1;
            if ( asc ) {
                gt = -1;
                lt = 1;
            }
            // filter the data..
            var toSort = angular.copy(_rows);

            toSort.sort ( function ( objA, objB ) {
                if ( !isNaN(objA[key]) ) {
                    if ( objA[key] > objB[key] ) {
                        return gt;
                    }
                    if ( objA[key] < objB[key] ) {
                        return lt;
                    }
                    return 0;
                } else if ( typeof objA[key] == "string" ) {
                    var rtn = objA[key].localeCompare( objB[key] );
                    if ( !asc && rtn !== 0 ) {
                        return -rtn;
                    } else {
                        return rtn;
                    }
                } else {
                    // object comparison...
                    var valA = objA[key].data[key];
                    var valB = objB[key].data[key];
                    if ( !isNaN(valA) ) {
                        // number field...
                        if ( valA > valB ) {
                            return gt;
                        }
                        if ( valA < valB ) {
                            return lt;
                        }
                        return 0;
                    } else {
                        var rtn = valA.localeCompare( valB );
                        if ( !asc && rtn !== 0 ) {
                            return -rtn;
                        } else {
                            return rtn;
                        }
                    }
                }
            } );

            _rows = toSort;
        }

        this.getTable = this.queryTable;
        this.getCards = this.queryCards;

}]);