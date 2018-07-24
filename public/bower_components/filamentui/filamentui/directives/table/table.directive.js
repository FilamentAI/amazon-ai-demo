/**
 *  Table directive
 *  Options:
 *      - selectable: is the row selectable, this adds hover status and means you can click on the full row
 *      - multiple: if the row is selectable, can you select multiple options
 *      - expandable: is the row expandable, this adds hover status and means the row will expand on click
 *      - perPage: number of items per page
 *      - defaultSort: default sort object, eg. {key: 'timestamp', asc: true}
 *      - clickActionIndex: action index to trigger on select/click
 *      - autoHide: automatically hide the pager if there are less than perPage items in table
 *      - hideHeaders: hide the header row
 *      - hidePager: hide the pager row
 */
angular.module('filamentui')
    .directive('filamentuiTable', ['$rootScope', '$timeout', function ($rootScope, $timeout) {

        // Set defaults
        function preLink($scope, element, attrs) {
            if (!$scope.options) {
                $scope.options = {
                    perPage: 10,
                };
            }

            // avoid setting 'undefined' on an id name
            // used for tracking pagination ids on subtables as they must all be unique
            $scope._tableRowIndex = $scope.tableRowIndex || $scope.tableRowIndex >= 0 ? '_' + $scope.tableRowIndex : '';
            $scope.pagerId = $scope.pagerId + $scope._tableRowIndex;
        }

        function postLink($scope, element, attrs, ngModel) {

            /*
             * Private Variables
             */

            // selection mapping
            var _map = {}; 
            // stores what is selected on each page
            var _pageStore = []; 

            /*
             * Bindable Variables
             */

            $scope.activeFilters = {};
            $scope.activeSort = ( $scope.options.defaultSort ? $scope.options.defaultSort : {} );
            $scope.clickActionIndex = $scope.options.clickActionIndex;
            $scope.tableId    = $scope.$id;
            $scope.selected   = [];
            $scope.selectedCount = 0;

            $scope.event = 'table_' + guidGenerator();
            $scope.igEvent = 'table_' + guidGenerator();

            $scope.allChecked = false;

            $scope.pagination = {
                currentPage: 1,
                _totalItems: 0,
                perPage: ( $scope.options.perPage ? $scope.options.perPage : 10 )
            };

            // see pager.directive.js for details
            $scope.pagerOptions = {
                perPage: $scope.pagination.perPage,
                directionLinks: true,
                boundaryLinks: true,
                onPageChange: pageChanged,
                pagerId: $scope.pagerId + '_pgid',
                autoHide: ( typeof $scope.options.autoHide === 'boolean' ? $scope.options.autoHide : true )
            }

            function guidGenerator() {
                var S4 = function() {
                   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
                };
                return S4()+S4();
            }

            /*
             * Scoped methods
             */

            // table formatting functions
            $scope.showActions       = showActions;
            $scope._clickClass       = _clickClass;
            $scope._clickAction      = _clickAction;
            $scope._tableDimensions  = _tableDimensions;

            $scope._filterProperties = _filterProperties;

            // trigger sub-table updates
            $scope._updatedSubTable = _updatedSubTable;

            // selection methods
            $scope._updateSelected  = _updateSelected;
            $scope._radioUpdated    = _radioUpdated;
            $scope._checkAll        = _checkAll;

            /*
             * Init
             */

            // Set up watchers and get initial data
            function init() {
                // was set by filters to trigger data changes
                $rootScope.$on( $scope.event, function ( e, strict ) {
                    if (strict) {
                        $scope.strictFilter = strict;
                    }
                    getData();
                });

                // exposes table to let external actions refresh the data
                $rootScope.$on( 'refresh_table', function () {
                    getData();
                })

                // Deep watch original rows object, so we can update the _rows array when it is changed
                $scope.$watch( 'rows', function (newVal, oldVal) {
                    if (newVal && newVal !== oldVal) {
                        getData();
                    }
                }, true);

                $scope.$watch( 'pagerOptions.perPage', function (newVal, oldVal) {
                    if (newVal && newVal !== oldVal) {
                        $scope.pagination.perPage = $scope.pagerOptions.perPage;
                    }
                });

                // Watch options to reset checked options
                $scope.$watch( 'options', function (newVal, oldVal) {
                    if (newVal && newVal !== oldVal) {
                        $scope.selected = [];
                        setModelView(); // reset this if the value changes...

                        if ($scope._rows) {
                            for ( var i = 0; i < $scope._rows.length; i++ ) {
                                if ( $scope._rows[i]._meta != null && $scope._rows[i]._meta.checked ) {
                                    $scope._rows[i]._meta.checked = false; // uncheck it...
                                }
                            }
                        }
                    }
                });
                getData();
            }

            function initSelected ( rows ) {
                // runs only when nothing has been selected yet
                if ($scope.selected.length == 0) {
                    $scope.selected = rows.filter(function(row) {
                        return row._meta && row._meta.checked;
                    });

                    setModelView();
                }
            }

            /*
             * Private functions
             */

            function getData () {
                var startIndex = ($scope.pagination.currentPage - 1) * $scope.pagination.perPage;
                if ( typeof $scope.rows == 'function' ) {
                    params = {
                        top: $scope.pagination.perPage,
                        skip: startIndex,
                        orderBy: $scope.activeSort.key,
                        orderType: $scope.activeSort.asc ? 'asc' : 'desc'
                    };

                    $scope.rows(params).then ( function ( results ) {
                        $scope._rows  = angular.copy(results.items);
                        $scope.pagination._totalItems = results.count;

                        // check cols for data formats
                        var _colTypes = [];
                        $scope.cols.forEach(function (col) {
                            if (col.type) {
                                _colTypes.push({type: col.type, key: col.key});
                            }
                        });

                        $scope._rows.forEach(function(row, i) {
                            row._filamentui_id = i;
                            // process the column types and apply formatting changes
                            if (_colTypes.length > 0) {
                                _colTypes.forEach(function (col) {
                                    if (typeof row[col.key] !== 'undefined') {
                                        var obj = {};
                                        switch (col.type) {
                                            case 'date':
                                                obj = {
                                                    'type': 'filamentui-date',
                                                    'data': {
                                                        'timestamp': row[col.key]
                                                    }
                                                };
                                                break;
                                            case 'datetime':
                                                obj = {
                                                    'type': 'filamentui-datetime',
                                                    'data': {
                                                        'timestamp': row[col.key]
                                                    }
                                                };
                                                break;
                                            default:
                                                break;
                                        };
                                        row[col.key] = obj;
                                    }
                                });
                            }
                        });
                        initSelected($scope._rows);
                    });
                } else {
                    $scope._rows = angular.copy($scope.rows);
                    $scope._rows.forEach(function(row, i) {
                        row._meta = row._meta ? row._meta : {};
                        if (typeof _map[row.id] !== 'undefined' && _map[row.id] !== null) {
                            row._meta.checked = _map[row.id];
                        }
                        row._filamentui_id = i;
                    });
                    sortData();
                    // Filter data before data is split for paging
                    filterData();
                    // Set total items based on filtered data
                    $scope.pagination._totalItems = $scope._rows.length;
                    // Minus 1 required as dir-paginate indexing starts at 1
                    startIndex = ( $scope.pagination.currentPage - 1 ) * $scope.pagination.perPage;
                    // Page data manually to make it work the same as asynchronous data
                    $scope._rows = $scope._rows.splice(startIndex, $scope.pagination.perPage);
                    initSelected($scope._rows);
                }
            }

            // Filter data using activeFilters and strictFilter
            function filterData() {
                $scope._rows = $scope._rows.filter(function(row) {
                    var filtersExist = false;

                    // Recursively check properties for matching value
                    var checkProperties = function(object, value) {
                        for (var prop in object) {
                            if (object.hasOwnProperty(prop)) {
                                var objectValue = object[prop];
                                if (typeof objectValue === 'object') {
                                    if (checkProperties(objectValue, value)) {
                                        return true;
                                    }
                                } else {
                                    if (objectValue === value) {
                                        return true;
                                    }
                                }
                            }
                        }
                        return false;
                    }

                    // '$' means match on any property
                    if ($scope.activeFilters['$']) {
                        filtersExist = true;
                        if (checkProperties(row, $scope.activeFilters['$'])) {
                            return true;
                        }
                    } else {
                        for (var filter in $scope.activeFilters) {
                            if ($scope.activeFilters.hasOwnProperty(filter)) {
                                filtersExist = true;
                                var value = $scope.activeFilters[filter];

                                if (row[filter] === value) {
                                    return true;
                                }
                            }
                        }
                    }

                    return !filtersExist || false;
                });
            }

            function pageChanged ( newPageNum, oldPageNum ) {
                // before loading any data changes, if this is a selectable table, save selections
                if ($scope.options.multiple) {
                    if ($scope.selected.length > 0) {
                        // is copy right? will internal references still work?
                        // shallow copy versus deep copy
                        _pageStore[oldPageNum] = angular.copy($scope.selected);
                    }

                    // then need to load the new selections, if such a thing exists
                    // arrays index from 0, pages start at 1, hence weird maths on this test
                    if (newPageNum <= _pageStore.length + 1) {
                        if (_pageStore[newPageNum]) {
                            $scope.selected = _pageStore[newPageNum];
                        } else {
                            $scope.selected = [];
                        }

                        setModelView();
                    }
                }
                getData();
            }

            // Count number of actions whose if statements evaluate to true
            function showActions ( item ) {
                var numActions = 0;
                if ($scope.actions) {
                    $scope.actions.forEach(function(actionGroup) {
                        actionGroup.forEach(function(action) {
                            if (!action.if || action.if(item)) {
                                numActions++;
                            }
                        });
                    });
                }
                return numActions > 0;
            }

            // Sort row data using either the activeSort key or sortFunction
            var sortData = function() {
                // Sort rows using activeSort property
                $scope._rows = $scope._rows.sort(function(a, b) {
                    var val1, val2;

                    if ($scope.activeSort.sort && typeof $scope.activeSort.sort === 'function') {
                        val1 = $scope.activeSort.sort(a);
                        val2 = $scope.activeSort.sort(b);
                    } else {
                        val1 = a[$scope.activeSort.key];
                        val2 = b[$scope.activeSort.key];
                    }

                    if (val1 < val2) {
                        return $scope.activeSort.asc ? -1 : 1;
                    } else if (val1 > val2) {
                        return $scope.activeSort.asc ? 1 : -1;
                    } else {
                        return 0;
                    }
                });
            }

            // Is the row clickable
            function _isClickable ( row ) {
                var output = false;
                var clickIndex = $scope.clickActionIndex;
                if ( clickIndex != null && $scope.actions && $scope.actions.length > 0 ) {
                    var group = $scope.actions[0];
                    if ( group.length > 0 ) {
                        var menu = group[clickIndex];
                        if ( menu.if != null ) {
                            output = ( typeof menu.if == 'function' && menu.if ( row ) ) ||
                                     ( typeof menu.if == 'boolean' && menu.if )
                        } else {
                            output = true;
                        }
                    }
                }
                return output;
            }

            // Is the row expandable
            function _isExpandable ( row ) {
                return $scope.options && $scope.options.expandable;
            }

            // Is the row selectable
            function _isSelectable ( row ) {
                return $scope.options && $scope.options.selectable;
            }

            // Is the table multi-select
            function _isMultiple ( row ) {
                return $scope.options && $scope.options.multiple;
            }

            function checkRow( row, checked ) {
                if ( checked ) {
                    row._meta = {
                        checked: checked
                    }
                } else {
                    delete row._meta;
                }
            }

            function hasSubtable( row ) {
                return row.expandedContent && row.expandedContent.type === 'filamentui-table';
            }

            // Return class name for row
            function _clickClass ( row ) {
                if ( _isClickable ( row ) ) {
                    return 'clickable';
                } else if ( _isExpandable ( row ) ) {
                    return 'expandable';
                }
            }

            // Called on row click
            function _clickAction ( row ) {
                if ( _isClickable ( row ) ) {
                    // can access these immediately as _isClickable has verified they exist
                    var group = $scope.actions[0]
                    var menu  = group[$scope.clickActionIndex]
                    menu.action ( row )
                } else if ( _isExpandable ( row ) ) {
                    row.expanded = !row.expanded;
                } else if ( _isMultiple ( row ) ) {
                    checkRow(row, row._meta ? !row._meta.checked : true);
                    $scope._updateSelected( row );
                } else if ( _isSelectable ( row ) ) {
                    $scope._radioUpdated( row );
                }
            }

            function _tableDimensions () {
                var rtn = '';
                if ( $scope.options && $scope.options.selectable ) {
                    rtn += '50px ';
                }
                for ( var i = 0; i < $scope.cols.length; i++ ) {
                    rtn += $scope.cols[i].width + ' ';
                }
                if ( $scope.actions || $scope.options.expandable ) {
                    // add column if we have actions..
                    rtn += '50px ';
                }
                return rtn;
            }

            // Called when subtable is updated
            function _updatedSubTable ( rows, id ) {
                var hasCheckedRows = false;
                var row;

                // Find parent row to update
                $scope._rows.forEach(function(r) {
                    if (r._filamentui_id === id) {
                        row = r;
                    }
                })

                // If subtable has checked rows, check the outer table row
                if (hasSubtable(row)) {
                    hasCheckedRows = row.expandedContent.data.selected && row.expandedContent.data.selected.length > 0;

                    if (hasCheckedRows) {
                        checkRow(row, true);
                    }
                }

                // Update inner rows to new _rows from subtable
                row.expandedContent.data.rows = rows;
                // Update selected list on outer row
                $scope._updateSelected(row, true);
            }

            // Loops through rows and checks them and any nested items
            var checkAllNestedItems = function ( rows, checked ) {
                var selected = [];

                rows.forEach(function(row) {
                    if (checked) {
                        row._meta = row._meta ? row._meta : {};
                        row._meta.checked = checked;
                    } else {
                        delete row._meta;
                    }

                    if ( hasSubtable(row) ) {
                        var subtableSelected = checkAllNestedItems(row.expandedContent.data.rows, checked);
                        row.expandedContent.data.selected = subtableSelected;
                    }

                    if (checked) {
                        selected.push(row);
                    }
                });

                return selected;
            }

            // Called when a checkbox is checked/unchecked
            // Sets ng-model to list of selected rows
            function _updateSelected ( row, ignoreSubtable ) {
                var checked = row._meta && row._meta.checked;
                if (!ignoreSubtable && hasSubtable(row)) {
                    checkAllNestedItems([row], checked);
                }

                // to maintain data across multiple pages
                // we must collect all the checked items from the current page and push to the selected array
                $scope.selected = $scope._rows.filter(function( row ) {
                    var _checked = row._meta && row._meta.checked;
                    _map[row.id] = _checked;
                    return _checked;
                });

                setModelView();

                // sub-table function
                if ($scope.onChange) {
                    $scope.onChange($scope._rows, $scope.parentRowIndex);
                }
            }

            // Called when a radio is selected
            // Sets ng-model to a singular selected row
            function _radioUpdated ( row ) {
                var checked = row._meta && row._meta.checked;
                $scope.selected = checked ? [row] : [];

                // deselect previous row and reset map
                $scope._rows.forEach(function ( r ) {
                    if ( r.id !== row.id ) {
                        delete r._meta;
                    }
                });
                _map = {};
                _map[row.id] = checked;

                setModelView();
            }

            function _checkAll () {
                $scope.allChecked = !$scope.allChecked;
                $scope.selected = [];
                $scope.selected = checkAllNestedItems($scope._rows, $scope.allChecked);
                setModelView();
            }

            function _filterProperties ( obj ) {
                var rtn = {};
                for ( var i = 0; i < $scope.cols.length; i++ ) {
                    rtn[$scope.cols[i].key] = obj[$scope.cols[i].key];
                }
                return rtn;
            }

            function setModelView () {
                if (ngModel) {
                    if ($scope.options.multiple) {
                        // update the current pageStore value
                        _pageStore[$scope.pagination.currentPage] = $scope.selected;
                        // flatten array
                        var flatArr = _pageStore.reduce(function ( acc, val ) {
                            return acc.concat(val);}
                        , []);
                        $scope.selectedCount = flatArr.length;
                        // expose model
                        ngModel.$setViewValue(flatArr);
                    } else {
                        $scope.selectedCount = $scope.selected.length;
                        // single selection, expose current value
                        ngModel.$setViewValue($scope.selected);
                    }
                }
            }

            // hoist init function
            init();
        }

        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'filamentui/directives/table/table.html',
            scope: {
                'rows' : '=',
                'cols' : '=',
                'actions' : '=?',
                'options' : '=?',
                'pagerId': '=?',
                'onChange': '=?',
                'parentRowIndex': '=?',
                'tableRowIndex': '=?',
                'required': '=?',
                'errorMessage': '=?'
            },
            require: '?ngModel',
            compile: function(element, attributes) {
                return {
                    pre: preLink,
                    post: postLink
                };
            }
        };
}]);
