twClickOutside.$inject = ['$window', '$parse'];

function twClickOutside ($window, $parse) {
  return {
    link: function(scope, el, attr) {
      if (!attr.twClickOutside) {
        return;
      }

      var ignore;
      if (attr.ignoreIf) {
        ignore = $parse(attr.ignoreIf);
      }

      var nakedEl = el[0];
      var fn = $parse(attr.twClickOutside);

      var handler = function(e) {
        if (nakedEl === e.target || nakedEl.contains(e.target) || (ignore && ignore(scope))) {
          return;
        }

        scope.$apply(fn);
      };

      $window.addEventListener('click', handler, true);

      scope.$on('$destroy', function(e) {
        $window.removeEventListener('click', handler);
      });
    }
  };
}

angular.module('tw.directives.clickOutside', []).directive('twClickOutside', twClickOutside);

/**
 * dirPagination - AngularJS module for paginating (almost) anything.
 *
 *
 * Credits
 * =======
 *
 * Daniel Tabuenca: https://groups.google.com/d/msg/angular/an9QpzqIYiM/r8v-3W1X5vcJ
 * for the idea on how to dynamically invoke the ng-repeat directive.
 *
 * I borrowed a couple of lines and a few attribute names from the AngularUI Bootstrap project:
 * https://github.com/angular-ui/bootstrap/blob/master/src/pagination/pagination.js
 *
 * Copyright 2014 Michael Bromley <michael@michaelbromley.co.uk>
 * https://github.com/michaelbromley/angularUtils
 */

(function() {

    /**
     * Config
     */
    var moduleName = 'angularUtils.directives.dirPagination';
    var DEFAULT_ID = '__default';

    /**
     * Module
     */
    angular.module(moduleName, [])
        .directive('dirPaginate', ['$compile', '$parse', 'paginationService', dirPaginateDirective])
        .directive('dirPaginateNoCompile', noCompileDirective)
        .directive('dirPaginationControls', ['paginationService', 'paginationTemplate', dirPaginationControlsDirective])
        .filter('itemsPerPage', ['paginationService', itemsPerPageFilter])
        .service('paginationService', paginationService)
        .provider('paginationTemplate', paginationTemplateProvider)
        .run(['$templateCache',dirPaginationControlsTemplateInstaller]);

    function dirPaginateDirective($compile, $parse, paginationService) {

        return  {
            terminal: true,
            multiElement: true,
            priority: 100,
            compile: dirPaginationCompileFn
        };

        function dirPaginationCompileFn(tElement, tAttrs){

            var expression = tAttrs.dirPaginate;
            // regex taken directly from https://github.com/angular/angular.js/blob/v1.4.x/src/ng/directive/ngRepeat.js#L339
            var match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);

            var filterPattern = /\|\s*itemsPerPage\s*:\s*(.*\(\s*\w*\)|([^\)]*?(?=\s+as\s+))|[^\)]*)/;
            if (match[2].match(filterPattern) === null) {
                throw 'pagination directive: the \'itemsPerPage\' filter must be set.';
            }
            var itemsPerPageFilterRemoved = match[2].replace(filterPattern, '');
            var collectionGetter = $parse(itemsPerPageFilterRemoved);

            addNoCompileAttributes(tElement);

            // If any value is specified for paginationId, we register the un-evaluated expression at this stage for the benefit of any
            // dir-pagination-controls directives that may be looking for this ID.
            var rawId = tAttrs.paginationId || DEFAULT_ID;
            paginationService.registerInstance(rawId);

            return function dirPaginationLinkFn(scope, element, attrs){

                // Now that we have access to the `scope` we can interpolate any expression given in the paginationId attribute and
                // potentially register a new ID if it evaluates to a different value than the rawId.
                var paginationId = $parse(attrs.paginationId)(scope) || attrs.paginationId || DEFAULT_ID;
                // (TODO: this seems sound, but I'm reverting as many bug reports followed it's introduction in 0.11.0.
                // Needs more investigation.)
                // In case rawId != paginationId we deregister using rawId for the sake of general cleanliness
                // before registering using paginationId
                // paginationService.deregisterInstance(rawId);
                paginationService.registerInstance(paginationId);

                var repeatExpression = getRepeatExpression(expression, paginationId);
                addNgRepeatToElement(element, attrs, repeatExpression);

                removeTemporaryAttributes(element);
                var compiled =  $compile(element);

                var currentPageGetter = makeCurrentPageGetterFn(scope, attrs, paginationId);
                paginationService.setCurrentPageParser(paginationId, currentPageGetter, scope);

                if (typeof attrs.totalItems !== 'undefined') {
                    paginationService.setAsyncModeTrue(paginationId);
                    scope.$watch(function() {
                        return $parse(attrs.totalItems)(scope);
                    }, function (result) {
                        if (0 <= result) {
                            paginationService.setCollectionLength(paginationId, result);
                        }
                    });
                } else {
                    paginationService.setAsyncModeFalse(paginationId);
                    scope.$watchCollection(function() {
                        return collectionGetter(scope);
                    }, function(collection) {
                        if (collection) {
                            var collectionLength = (collection instanceof Array) ? collection.length : Object.keys(collection).length;
                            paginationService.setCollectionLength(paginationId, collectionLength);
                        }
                    });
                }

                // Delegate to the link function returned by the new compilation of the ng-repeat
                compiled(scope);

                // (TODO: Reverting this due to many bug reports in v 0.11.0. Needs investigation as the
                // principle is sound)
                // When the scope is destroyed, we make sure to remove the reference to it in paginationService
                // so that it can be properly garbage collected
                // scope.$on('$destroy', function destroyDirPagination() {
                //     paginationService.deregisterInstance(paginationId);
                // });
            };
        }

        /**
         * If a pagination id has been specified, we need to check that it is present as the second argument passed to
         * the itemsPerPage filter. If it is not there, we add it and return the modified expression.
         *
         * @param expression
         * @param paginationId
         * @returns {*}
         */
        function getRepeatExpression(expression, paginationId) {
            var repeatExpression,
                idDefinedInFilter = !!expression.match(/(\|\s*itemsPerPage\s*:[^|]*:[^|]*)/);

            if (paginationId !== DEFAULT_ID && !idDefinedInFilter) {
                repeatExpression = expression.replace(/(\|\s*itemsPerPage\s*:\s*[^|\s]*)/, "$1 : '" + paginationId + "'");
            } else {
                repeatExpression = expression;
            }

            return repeatExpression;
        }

        /**
         * Adds the ng-repeat directive to the element. In the case of multi-element (-start, -end) it adds the
         * appropriate multi-element ng-repeat to the first and last element in the range.
         * @param element
         * @param attrs
         * @param repeatExpression
         */
        function addNgRepeatToElement(element, attrs, repeatExpression) {
            if (element[0].hasAttribute('dir-paginate-start') || element[0].hasAttribute('data-dir-paginate-start')) {
                // using multiElement mode (dir-paginate-start, dir-paginate-end)
                attrs.$set('ngRepeatStart', repeatExpression);
                element.eq(element.length - 1).attr('ng-repeat-end', true);
            } else {
                attrs.$set('ngRepeat', repeatExpression);
            }
        }

        /**
         * Adds the dir-paginate-no-compile directive to each element in the tElement range.
         * @param tElement
         */
        function addNoCompileAttributes(tElement) {
            angular.forEach(tElement, function(el) {
                if (el.nodeType === 1) {
                    angular.element(el).attr('dir-paginate-no-compile', true);
                }
            });
        }

        /**
         * Removes the variations on dir-paginate (data-, -start, -end) and the dir-paginate-no-compile directives.
         * @param element
         */
        function removeTemporaryAttributes(element) {
            angular.forEach(element, function(el) {
                if (el.nodeType === 1) {
                    angular.element(el).removeAttr('dir-paginate-no-compile');
                }
            });
            element.eq(0).removeAttr('dir-paginate-start').removeAttr('dir-paginate').removeAttr('data-dir-paginate-start').removeAttr('data-dir-paginate');
            element.eq(element.length - 1).removeAttr('dir-paginate-end').removeAttr('data-dir-paginate-end');
        }

        /**
         * Creates a getter function for the current-page attribute, using the expression provided or a default value if
         * no current-page expression was specified.
         *
         * @param scope
         * @param attrs
         * @param paginationId
         * @returns {*}
         */
        function makeCurrentPageGetterFn(scope, attrs, paginationId) {
            var currentPageGetter;
            if (attrs.currentPage) {
                currentPageGetter = $parse(attrs.currentPage);
            } else {
                // If the current-page attribute was not set, we'll make our own.
                // Replace any non-alphanumeric characters which might confuse
                // the $parse service and give unexpected results.
                // See https://github.com/michaelbromley/angularUtils/issues/233
                var defaultCurrentPage = (paginationId + '__currentPage').replace(/\W/g, '_');
                scope[defaultCurrentPage] = 1;
                currentPageGetter = $parse(defaultCurrentPage);
            }
            return currentPageGetter;
        }
    }

    /**
     * This is a helper directive that allows correct compilation when in multi-element mode (ie dir-paginate-start, dir-paginate-end).
     * It is dynamically added to all elements in the dir-paginate compile function, and it prevents further compilation of
     * any inner directives. It is then removed in the link function, and all inner directives are then manually compiled.
     */
    function noCompileDirective() {
        return {
            priority: 5000,
            terminal: true
        };
    }

    function dirPaginationControlsTemplateInstaller($templateCache) {
        $templateCache.put('angularUtils.directives.dirPagination.template', '<ul class="pagination" ng-if="1 < pages.length || !autoHide"><li ng-if="boundaryLinks" ng-class="{ disabled : pagination.current == 1 }"><a href="" ng-click="setCurrent(1)">&laquo;</a></li><li ng-if="directionLinks" ng-class="{ disabled : pagination.current == 1 }"><a href="" ng-click="setCurrent(pagination.current - 1)">&lsaquo;</a></li><li ng-repeat="pageNumber in pages track by tracker(pageNumber, $index)" ng-class="{ active : pagination.current == pageNumber, disabled : pageNumber == \'...\' || ( ! autoHide && pages.length === 1 ) }"><a href="" ng-click="setCurrent(pageNumber)">{{ pageNumber }}</a></li><li ng-if="directionLinks" ng-class="{ disabled : pagination.current == pagination.last }"><a href="" ng-click="setCurrent(pagination.current + 1)">&rsaquo;</a></li><li ng-if="boundaryLinks"  ng-class="{ disabled : pagination.current == pagination.last }"><a href="" ng-click="setCurrent(pagination.last)">&raquo;</a></li></ul>');
    }

    function dirPaginationControlsDirective(paginationService, paginationTemplate) {

        var numberRegex = /^\d+$/;

        var DDO = {
            restrict: 'AE',
            scope: {
                maxSize: '=?',
                onPageChange: '&?',
                paginationId: '=?',
                autoHide: '=?'
            },
            link: dirPaginationControlsLinkFn
        };

        // We need to check the paginationTemplate service to see whether a template path or
        // string has been specified, and add the `template` or `templateUrl` property to
        // the DDO as appropriate. The order of priority to decide which template to use is
        // (highest priority first):
        // 1. paginationTemplate.getString()
        // 2. attrs.templateUrl
        // 3. paginationTemplate.getPath()
        var templateString = paginationTemplate.getString();
        if (templateString !== undefined) {
            DDO.template = templateString;
        } else {
            DDO.templateUrl = function(elem, attrs) {
                return attrs.templateUrl || paginationTemplate.getPath();
            };
        }
        return DDO;

        function dirPaginationControlsLinkFn(scope, element, attrs) {

            // rawId is the un-interpolated value of the pagination-id attribute. This is only important when the corresponding dir-paginate directive has
            // not yet been linked (e.g. if it is inside an ng-if block), and in that case it prevents this controls directive from assuming that there is
            // no corresponding dir-paginate directive and wrongly throwing an exception.
            var rawId = attrs.paginationId ||  DEFAULT_ID;
            var paginationId = scope.paginationId || attrs.paginationId ||  DEFAULT_ID;

            if (!paginationService.isRegistered(paginationId) && !paginationService.isRegistered(rawId)) {
                var idMessage = (paginationId !== DEFAULT_ID) ? ' (id: ' + paginationId + ') ' : ' ';
                if (window.console) {
                    console.warn('Pagination directive: the pagination controls' + idMessage + 'cannot be used without the corresponding pagination directive, which was not found at link time.');
                }
            }

            if (!scope.maxSize) { scope.maxSize = 9; }
            scope.autoHide = scope.autoHide === undefined ? true : scope.autoHide;
            scope.directionLinks = angular.isDefined(attrs.directionLinks) ? scope.$parent.$eval(attrs.directionLinks) : true;
            scope.boundaryLinks = angular.isDefined(attrs.boundaryLinks) ? scope.$parent.$eval(attrs.boundaryLinks) : false;

            var paginationRange = Math.max(scope.maxSize, 5);
            scope.pages = [];
            scope.pagination = {
                last: 1,
                current: 1
            };
            scope.range = {
                lower: 1,
                upper: 1,
                total: 1
            };

            scope.$watch('maxSize', function(val) {
                if (val) {
                    paginationRange = Math.max(scope.maxSize, 5);
                    generatePagination();
                }
            });

            scope.$watch(function() {
                if (paginationService.isRegistered(paginationId)) {
                    return (paginationService.getCollectionLength(paginationId) + 1) * paginationService.getItemsPerPage(paginationId);
                }
            }, function(length) {
                if (0 < length) {
                    generatePagination();
                }
            });

            scope.$watch(function() {
                if (paginationService.isRegistered(paginationId)) {
                    return (paginationService.getItemsPerPage(paginationId));
                }
            }, function(current, previous) {
                if (current != previous && typeof previous !== 'undefined') {
                    goToPage(scope.pagination.current);
                }
            });

            scope.$watch(function() {
                if (paginationService.isRegistered(paginationId)) {
                    return paginationService.getCurrentPage(paginationId);
                }
            }, function(currentPage, previousPage) {
                if (currentPage != previousPage) {
                    goToPage(currentPage);
                }
            });

            scope.setCurrent = function(num) {
                if (paginationService.isRegistered(paginationId) && isValidPageNumber(num)) {
                    num = parseInt(num, 10);
                    paginationService.setCurrentPage(paginationId, num);
                }
            };

            /**
             * Custom "track by" function which allows for duplicate "..." entries on long lists,
             * yet fixes the problem of wrongly-highlighted links which happens when using
             * "track by $index" - see https://github.com/michaelbromley/angularUtils/issues/153
             * @param id
             * @param index
             * @returns {string}
             */
            scope.tracker = function(id, index) {
                return id + '_' + index;
            };

            function goToPage(num) {
                if (paginationService.isRegistered(paginationId) && isValidPageNumber(num)) {
                    var oldPageNumber = scope.pagination.current;

                    scope.pages = generatePagesArray(num, paginationService.getCollectionLength(paginationId), paginationService.getItemsPerPage(paginationId), paginationRange);
                    scope.pagination.current = num;
                    updateRangeValues();

                    // if a callback has been set, then call it with the page number as the first argument
                    // and the previous page number as a second argument
                    if (scope.onPageChange) {
                        scope.onPageChange({
                            newPageNumber : num,
                            oldPageNumber : oldPageNumber
                        });
                    }
                }
            }

            function generatePagination() {
                if (paginationService.isRegistered(paginationId)) {
                    var page = parseInt(paginationService.getCurrentPage(paginationId)) || 1;
                    scope.pages = generatePagesArray(page, paginationService.getCollectionLength(paginationId), paginationService.getItemsPerPage(paginationId), paginationRange);
                    scope.pagination.current = page;
                    scope.pagination.last = scope.pages[scope.pages.length - 1];
                    if (scope.pagination.last < scope.pagination.current) {
                        scope.setCurrent(scope.pagination.last);
                    } else {
                        updateRangeValues();
                    }
                }
            }

            /**
             * This function updates the values (lower, upper, total) of the `scope.range` object, which can be used in the pagination
             * template to display the current page range, e.g. "showing 21 - 40 of 144 results";
             */
            function updateRangeValues() {
                if (paginationService.isRegistered(paginationId)) {
                    var currentPage = paginationService.getCurrentPage(paginationId),
                        itemsPerPage = paginationService.getItemsPerPage(paginationId),
                        totalItems = paginationService.getCollectionLength(paginationId);

                    scope.range.lower = (currentPage - 1) * itemsPerPage + 1;
                    scope.range.upper = Math.min(currentPage * itemsPerPage, totalItems);
                    scope.range.total = totalItems;
                }
            }
            function isValidPageNumber(num) {
                return (numberRegex.test(num) && (0 < num && num <= scope.pagination.last));
            }
        }

        /**
         * Generate an array of page numbers (or the '...' string) which is used in an ng-repeat to generate the
         * links used in pagination
         *
         * @param currentPage
         * @param rowsPerPage
         * @param paginationRange
         * @param collectionLength
         * @returns {Array}
         */
        function generatePagesArray(currentPage, collectionLength, rowsPerPage, paginationRange) {
            var pages = [];
            var totalPages = Math.ceil(collectionLength / rowsPerPage);
            var halfWay = Math.ceil(paginationRange / 2);
            var position;

            if (currentPage <= halfWay) {
                position = 'start';
            } else if (totalPages - halfWay < currentPage) {
                position = 'end';
            } else {
                position = 'middle';
            }

            var ellipsesNeeded = paginationRange < totalPages;
            var i = 1;
            while (i <= totalPages && i <= paginationRange) {
                var pageNumber = calculatePageNumber(i, currentPage, paginationRange, totalPages);

                var openingEllipsesNeeded = (i === 2 && (position === 'middle' || position === 'end'));
                var closingEllipsesNeeded = (i === paginationRange - 1 && (position === 'middle' || position === 'start'));
                if (ellipsesNeeded && (openingEllipsesNeeded || closingEllipsesNeeded)) {
                    pages.push('...');
                } else {
                    pages.push(pageNumber);
                }
                i ++;
            }
            return pages;
        }

        /**
         * Given the position in the sequence of pagination links [i], figure out what page number corresponds to that position.
         *
         * @param i
         * @param currentPage
         * @param paginationRange
         * @param totalPages
         * @returns {*}
         */
        function calculatePageNumber(i, currentPage, paginationRange, totalPages) {
            var halfWay = Math.ceil(paginationRange/2);
            if (i === paginationRange) {
                return totalPages;
            } else if (i === 1) {
                return i;
            } else if (paginationRange < totalPages) {
                if (totalPages - halfWay < currentPage) {
                    return totalPages - paginationRange + i;
                } else if (halfWay < currentPage) {
                    return currentPage - halfWay + i;
                } else {
                    return i;
                }
            } else {
                return i;
            }
        }
    }

    /**
     * This filter slices the collection into pages based on the current page number and number of items per page.
     * @param paginationService
     * @returns {Function}
     */
    function itemsPerPageFilter(paginationService) {

        return function(collection, itemsPerPage, paginationId) {
            if (typeof (paginationId) === 'undefined') {
                paginationId = DEFAULT_ID;
            }
            if (!paginationService.isRegistered(paginationId)) {
                throw 'pagination directive: the itemsPerPage id argument (id: ' + paginationId + ') does not match a registered pagination-id.';
            }
            var end;
            var start;
            if (angular.isObject(collection)) {
                itemsPerPage = parseInt(itemsPerPage) || 9999999999;
                if (paginationService.isAsyncMode(paginationId)) {
                    start = 0;
                } else {
                    start = (paginationService.getCurrentPage(paginationId) - 1) * itemsPerPage;
                }
                end = start + itemsPerPage;
                paginationService.setItemsPerPage(paginationId, itemsPerPage);

                if (collection instanceof Array) {
                    // the array just needs to be sliced
                    return collection.slice(start, end);
                } else {
                    // in the case of an object, we need to get an array of keys, slice that, then map back to
                    // the original object.
                    var slicedObject = {};
                    angular.forEach(keys(collection).slice(start, end), function(key) {
                        slicedObject[key] = collection[key];
                    });
                    return slicedObject;
                }
            } else {
                return collection;
            }
        };
    }

    /**
     * Shim for the Object.keys() method which does not exist in IE < 9
     * @param obj
     * @returns {Array}
     */
    function keys(obj) {
        if (!Object.keys) {
            var objKeys = [];
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    objKeys.push(i);
                }
            }
            return objKeys;
        } else {
            return Object.keys(obj);
        }
    }

    /**
     * This service allows the various parts of the module to communicate and stay in sync.
     */
    function paginationService() {

        var instances = {};
        var lastRegisteredInstance;

        this.registerInstance = function(instanceId) {
            if (typeof instances[instanceId] === 'undefined') {
                instances[instanceId] = {
                    asyncMode: false
                };
                lastRegisteredInstance = instanceId;
            }
        };

        this.deregisterInstance = function(instanceId) {
            delete instances[instanceId];
        };

        this.isRegistered = function(instanceId) {
            return (typeof instances[instanceId] !== 'undefined');
        };

        this.getLastInstanceId = function() {
            return lastRegisteredInstance;
        };

        this.setCurrentPageParser = function(instanceId, val, scope) {
            instances[instanceId].currentPageParser = val;
            instances[instanceId].context = scope;
        };
        this.setCurrentPage = function(instanceId, val) {
            instances[instanceId].currentPageParser.assign(instances[instanceId].context, val);
        };
        this.getCurrentPage = function(instanceId) {
            var parser = instances[instanceId].currentPageParser;
            return parser ? parser(instances[instanceId].context) : 1;
        };

        this.setItemsPerPage = function(instanceId, val) {
            instances[instanceId].itemsPerPage = val;
        };
        this.getItemsPerPage = function(instanceId) {
            return instances[instanceId].itemsPerPage;
        };

        this.setCollectionLength = function(instanceId, val) {
            instances[instanceId].collectionLength = val;
        };
        this.getCollectionLength = function(instanceId) {
            return instances[instanceId].collectionLength;
        };

        this.setAsyncModeTrue = function(instanceId) {
            instances[instanceId].asyncMode = true;
        };

        this.setAsyncModeFalse = function(instanceId) {
            instances[instanceId].asyncMode = false;
        };

        this.isAsyncMode = function(instanceId) {
            return instances[instanceId].asyncMode;
        };
    }

    /**
     * This provider allows global configuration of the template path used by the dir-pagination-controls directive.
     */
    function paginationTemplateProvider() {

        var templatePath = 'angularUtils.directives.dirPagination.template';
        var templateString;

        /**
         * Set a templateUrl to be used by all instances of <dir-pagination-controls>
         * @param {String} path
         */
        this.setPath = function(path) {
            templatePath = path;
        };

        /**
         * Set a string of HTML to be used as a template by all instances
         * of <dir-pagination-controls>. If both a path *and* a string have been set,
         * the string takes precedence.
         * @param {String} str
         */
        this.setString = function(str) {
            templateString = str;
        };

        this.$get = function() {
            return {
                getPath: function() {
                    return templatePath;
                },
                getString: function() {
                    return templateString;
                }
            };
        };
    }
})();


/*!
 * Angular Datepicker v2.1.10
 *
 * Released by 720kb.net under the MIT license
 * www.opensource.org/licenses/MIT
 *
 * 2017-01-17
 */

!function(a,b){"use strict";var c=864e5,d=function(){if(b.userAgent&&(b.userAgent.match(/Android/i)||b.userAgent.match(/webOS/i)||b.userAgent.match(/iPhone/i)||b.userAgent.match(/iPad/i)||b.userAgent.match(/iPod/i)||b.userAgent.match(/BlackBerry/i)||b.userAgent.match(/Windows Phone/i)))return!0}(),e=function(a,b,c){return c&&(d=!1),d?['<div class="_720kb-datepicker-calendar-header">','<div class="_720kb-datepicker-calendar-header-middle _720kb-datepicker-mobile-item _720kb-datepicker-calendar-month">','<select ng-model="month" title="{{ dateMonthTitle }}" ng-change="selectedMonthHandle(month)">','<option ng-repeat="item in months" ng-selected="item === month" ng-disabled=\'!isSelectableMaxDate(item + " " + day + ", " + year) || !isSelectableMinDate(item + " " + day + ", " + year)\' ng-value="$index + 1" value="$index + 1">',"{{ item }}","</option>","</select>","</div>","</div>",'<div class="_720kb-datepicker-calendar-header">','<div class="_720kb-datepicker-calendar-header-middle _720kb-datepicker-mobile-item _720kb-datepicker-calendar-month">','<select ng-model="mobileYear" title="{{ dateYearTitle }}" ng-change="setNewYear(mobileYear)">','<option ng-repeat="item in paginationYears track by $index" ng-selected="year === item" ng-disabled="!isSelectableMinYear(item) || !isSelectableMaxYear(item)" ng-value="item" value="item">',"{{ item }}","</option>","</select>","</div>","</div>"]:['<div class="_720kb-datepicker-calendar-header">','<div class="_720kb-datepicker-calendar-header-left">','<a class="_720kb-datepicker-calendar-month-button" href="javascript:void(0)" ng-class="{\'_720kb-datepicker-item-hidden\': !willPrevMonthBeSelectable()}" ng-click="prevMonth()" title="{{ buttonPrevTitle }}">',a,"</a>","</div>",'<div class="_720kb-datepicker-calendar-header-middle _720kb-datepicker-calendar-month">',"{{month}}&nbsp;",'<a href="javascript:void(0)" ng-click="paginateYears(year); showYearsPagination = !showYearsPagination;">',"<span>","{{year}}","<i ng-class=\"{'_720kb-datepicker-calendar-header-closed-pagination': !showYearsPagination, '_720kb-datepicker-calendar-header-opened-pagination': showYearsPagination}\"></i>","</span>","</a>","</div>",'<div class="_720kb-datepicker-calendar-header-right">','<a class="_720kb-datepicker-calendar-month-button" ng-class="{\'_720kb-datepicker-item-hidden\': !willNextMonthBeSelectable()}" href="javascript:void(0)" ng-click="nextMonth()" title="{{ buttonNextTitle }}">',b,"</a>","</div>","</div>"]},f=function(a,b){return['<div class="_720kb-datepicker-calendar-header" ng-show="showYearsPagination">','<div class="_720kb-datepicker-calendar-years-pagination">','<a ng-class="{\'_720kb-datepicker-active\': y === year, \'_720kb-datepicker-disabled\': !isSelectableMaxYear(y) || !isSelectableMinYear(y)}" href="javascript:void(0)" ng-click="setNewYear(y)" ng-repeat="y in paginationYears track by $index">',"{{y}}","</a>","</div>",'<div class="_720kb-datepicker-calendar-years-pagination-pages">','<a href="javascript:void(0)" ng-click="paginateYears(paginationYears[0])" ng-class="{\'_720kb-datepicker-item-hidden\': paginationYearsPrevDisabled}">',a,"</a>",'<a href="javascript:void(0)" ng-click="paginateYears(paginationYears[paginationYears.length -1 ])" ng-class="{\'_720kb-datepicker-item-hidden\': paginationYearsNextDisabled}">',b,"</a>","</div>","</div>"]},g=function(){return['<div class="_720kb-datepicker-calendar-days-header">','<div ng-repeat="d in daysInString">',"{{d}}","</div>","</div>"]},h=function(){return['<div class="_720kb-datepicker-calendar-body">','<a href="javascript:void(0)" ng-repeat="px in prevMonthDays" class="_720kb-datepicker-calendar-day _720kb-datepicker-disabled">',"{{px}}","</a>","<a href=\"javascript:void(0)\" ng-repeat=\"item in days\" ng-click=\"setDatepickerDay(item)\" ng-class=\"{'_720kb-datepicker-active': selectedDay === item && selectedMonth === monthNumber && selectedYear === year, '_720kb-datepicker-disabled': !isSelectableMinDate(year + '/' + monthNumber + '/' + item ) || !isSelectableMaxDate(year + '/' + monthNumber + '/' + item) || !isSelectableDate(monthNumber, year, item)}\" class=\"_720kb-datepicker-calendar-day\">","{{item}}","</a>",'<a href="javascript:void(0)" ng-repeat="nx in nextMonthDays" class="_720kb-datepicker-calendar-day _720kb-datepicker-disabled">',"{{nx}}","</a>","</div>"]},i=function(a,b,c){var d=['<div class="_720kb-datepicker-calendar {{datepickerClass}} {{datepickerID}}" ng-class="{\'_720kb-datepicker-forced-to-open\': checkVisibility()}" ng-blur="hideCalendar()">',"</div>"],i=e(a,b,c),j=f(a,b),k=g(),l=h(),m=function(a){d.splice(d.length-1,0,a)};return i.forEach(m),j.forEach(m),k.forEach(m),l.forEach(m),d.join("")},j=function(b,e,f,g,h,j){var k=function(k,l,m){var n,o,p,q=m.selector,r=a.element(q?l[0].querySelector("."+q):l[0].children[0]),s='<b class="_720kb-datepicker-default-button">&lang;</b>',t='<b class="_720kb-datepicker-default-button">&rang;</b>',u=m.buttonPrev||s,v=m.buttonNext||t,w=m.dateFormat,x=k.$eval(k.dateDisabledDates),y=new Date,z=!1,A=!1,B="undefined"!=typeof m.datepickerMobile&&"false"!==m.datepickerMobile,C=f.DATETIME_FORMATS,D=864e5,E=i(u,v,B),F=function(){z||A||!n||k.hideCalendar()},G=function(a,b){var c,d,e,f,g,h=new Date(b,a,0).getDate(),i=new Date(b+"/"+a+"/1").getDay(),j=new Date(b+"/"+a+"/"+h).getDay(),l=[],m=[];for(k.days=[],k.dateWeekStartDay=k.validateWeekDay(k.dateWeekStartDay),g=(k.dateWeekStartDay+6)%7,c=1;c<=h;c+=1)k.days.push(c);if(i===k.dateWeekStartDay)k.prevMonthDays=[];else{for(e=i-k.dateWeekStartDay,i<k.dateWeekStartDay&&(e+=7),f=1===Number(a)?12:a-1,c=1;c<=new Date(b,f,0).getDate();c+=1)l.push(c);k.prevMonthDays=l.slice(-e)}if(j===g)k.nextMonthDays=[];else{for(d=6-j+k.dateWeekStartDay,j<k.dateWeekStartDay&&(d-=7),c=1;c<=d;c+=1)m.push(c);k.nextMonthDays=m}},H=function(){k.month=g("date")(new Date(k.dateMinLimit),"MMMM"),k.monthNumber=Number(g("date")(new Date(k.dateMinLimit),"MM")),k.day=Number(g("date")(new Date(k.dateMinLimit),"dd")),k.year=Number(g("date")(new Date(k.dateMinLimit),"yyyy")),G(k.monthNumber,k.year)},I=function(){k.month=g("date")(new Date(k.dateMaxLimit),"MMMM"),k.monthNumber=Number(g("date")(new Date(k.dateMaxLimit),"MM")),k.day=Number(g("date")(new Date(k.dateMaxLimit),"dd")),k.year=Number(g("date")(new Date(k.dateMaxLimit),"yyyy")),G(k.monthNumber,k.year)},J=function(){k.year=Number(k.year)-1},K=function(){k.year=Number(k.year)+1},L=function(){if(!k.isSelectableMinDate(k.year+"/"+k.monthNumber+"/"+k.day)||!k.isSelectableMaxDate(k.year+"/"+k.monthNumber+"/"+k.day))return!1;var a=new Date(k.year+"/"+k.monthNumber+"/"+k.day);m.dateFormat?r.val(g("date")(a,w)):r.val(a),r.triggerHandler("input"),r.triggerHandler("change")},M={add:function(a,b){var c;a.className.indexOf(b)>-1||(c=a.className.split(" "),c.push(b),a.className=c.join(" "))},remove:function(a,b){var c,d;if(a.className.indexOf(b)!==-1){for(d=a.className.split(" "),c=0;c<d.length;c+=1)if(d[c]===b){d=d.slice(0,c).concat(d.slice(c+1));break}a.className=d.join(" ")}}},N=function(){o=b.document.getElementsByClassName("_720kb-datepicker-calendar"),a.forEach(o,function(a,b){o[b].classList?o[b].classList.remove("_720kb-datepicker-open"):M.remove(o[b],"_720kb-datepicker-open")}),n.classList?n.classList.add("_720kb-datepicker-open"):M.add(n,"_720kb-datepicker-open")},O=function(){return!k.datepickerToggle||k.$eval(k.datepickerToggle)},P=function(){return!!k.datepickerShow&&k.$eval(k.datepickerShow)},Q=k.$watch("dateSet",function(a){a&&(y=new Date(a),k.month=g("date")(y,"MMMM"),k.monthNumber=Number(g("date")(y,"MM")),k.day=Number(g("date")(y,"dd")),k.year=Number(g("date")(y,"yyyy")),G(k.monthNumber,k.year),"true"!==k.dateSetHidden&&L())}),R=k.$watch("dateMinLimit",function(a){a&&H()}),S=k.$watch("dateMaxLimit",function(a){a&&I()}),T=k.$watch("dateFormat",function(a){a&&L()});for(k.nextMonth=function(){12===k.monthNumber?(k.monthNumber=1,K()):k.monthNumber+=1,k.dateMaxLimit&&(k.isSelectableMaxDate(k.year+"/"+k.monthNumber+"/"+k.days[0])||I()),k.month=g("date")(new Date(k.year,k.monthNumber-1),"MMMM"),G(k.monthNumber,k.year),k.day=void 0},k.willPrevMonthBeSelectable=function(){var a=k.monthNumber,b=k.year,c=g("date")(new Date(new Date(b+"/"+a+"/01").getTime()-D),"dd");return 1===a?(a=12,b-=1):a-=1,!(k.dateMinLimit&&!k.isSelectableMinDate(b+"/"+a+"/"+c))},k.willNextMonthBeSelectable=function(){var a=k.monthNumber,b=k.year;return 12===a?(a=1,b+=1):a+=1,!(k.dateMaxLimit&&!k.isSelectableMaxDate(b+"/"+a+"/01"))},k.prevMonth=function(){1===k.monthNumber?(k.monthNumber=12,J()):k.monthNumber-=1,k.dateMinLimit&&(k.isSelectableMinDate(k.year+"/"+k.monthNumber+"/"+k.days[k.days.length-1])||H()),k.month=g("date")(new Date(k.year,k.monthNumber-1),"MMMM"),G(k.monthNumber,k.year),k.day=void 0},k.selectedMonthHandle=function(a){k.monthNumber=Number(g("date")(new Date(a+"/01/2000"),"MM")),G(k.monthNumber,k.year),L()},k.setNewYear=function(a){if(d||(k.day=void 0),k.dateMaxLimit&&k.year<Number(a)){if(!k.isSelectableMaxYear(a))return}else if(k.dateMinLimit&&k.year>Number(a)&&!k.isSelectableMinYear(a))return;k.paginateYears(a),k.showYearsPagination=!1,j(function(){k.year=Number(a),G(k.monthNumber,k.year)},0)},k.hideCalendar=function(){n.classList?n.classList.remove("_720kb-datepicker-open"):M.remove(n,"_720kb-datepicker-open")},k.setDatepickerDay=function(a){k.isSelectableDate(k.monthNumber,k.year,a)&&k.isSelectableMaxDate(k.year+"/"+k.monthNumber+"/"+a)&&k.isSelectableMinDate(k.year+"/"+k.monthNumber+"/"+a)&&(k.day=Number(a),k.selectedDay=k.day,k.selectedMonth=k.monthNumber,k.selectedYear=k.year,L(),m.hasOwnProperty("dateRefocus")&&r[0].focus(),k.hideCalendar())},k.paginateYears=function(a){var b,c=[],e=10,f=10;for(k.paginationYears=[],d&&(e=50,f=50,k.dateMinLimit&&k.dateMaxLimit&&(a=new Date(k.dateMaxLimit).getFullYear(),e=a-new Date(k.dateMinLimit).getFullYear(),f=1)),b=e;b>0;b-=1)c.push(Number(a)-b);for(b=0;b<f;b+=1)c.push(Number(a)+b);"true"===k.dateTyper&&r.on("keyup blur",function(){if(r[0].value&&r[0].value.length&&r[0].value.length>0)try{y=w?new Date(g("date")(r[0].value.toString(),w)):new Date(r[0].value.toString()),y.getFullYear()&&!isNaN(y.getDay())&&!isNaN(y.getMonth())&&k.isSelectableDate(y)&&k.isSelectableMaxDate(y)&&k.isSelectableMinDate(y)&&k.$apply(function(){k.month=g("date")(y,"MMMM"),k.monthNumber=Number(g("date")(y,"MM")),k.day=Number(g("date")(y,"dd")),4===y.getFullYear().toString().length&&(k.year=Number(g("date")(y,"yyyy"))),G(k.monthNumber,k.year)})}catch(a){return a}}),k.dateMaxLimit&&c&&c.length&&!k.isSelectableMaxYear(Number(c[c.length-1])+1)?k.paginationYearsNextDisabled=!0:k.paginationYearsNextDisabled=!1,k.dateMinLimit&&c&&c.length&&!k.isSelectableMinYear(Number(c[0])-1)?k.paginationYearsPrevDisabled=!0:k.paginationYearsPrevDisabled=!1,k.paginationYears=c},k.isSelectableDate=function(a,b,c){var d=0;if(x&&x.length>0)for(d;d<=x.length;d+=1)if(new Date(x[d]).getTime()===new Date(a+"/"+c+"/"+b).getTime())return!1;return!0},k.isSelectableMinDate=function(a){return!(k.dateMinLimit&&new Date(k.dateMinLimit)&&new Date(a).getTime()<new Date(k.dateMinLimit).getTime())},k.isSelectableMaxDate=function(a){return!(k.dateMaxLimit&&new Date(k.dateMaxLimit)&&new Date(a).getTime()>new Date(k.dateMaxLimit).getTime())},k.isSelectableMaxYear=function(a){return!(k.dateMaxLimit&&a>new Date(k.dateMaxLimit).getFullYear())},k.isSelectableMinYear=function(a){return!(k.dateMinLimit&&a<new Date(k.dateMinLimit).getFullYear())},k.validateWeekDay=function(a){var b=Number(a,10);return(!b||b<0||b>6)&&(b=0),b},E=E.replace(/{{/g,h.startSymbol()).replace(/}}/g,h.endSymbol()),k.dateMonthTitle=k.dateMonthTitle||"Select month",k.dateYearTitle=k.dateYearTitle||"Select year",k.buttonNextTitle=k.buttonNextTitle||"Next",k.buttonPrevTitle=k.buttonPrevTitle||"Prev",k.month=g("date")(y,"MMMM"),k.monthNumber=Number(g("date")(y,"MM")),k.day=Number(g("date")(y,"dd")),k.dateWeekStartDay=k.validateWeekDay(k.dateWeekStartDay),k.dateMaxLimit?k.year=Number(g("date")(new Date(k.dateMaxLimit),"yyyy")):k.year=Number(g("date")(y,"yyyy")),k.months=C.MONTH,k.daysInString=[],p=k.dateWeekStartDay;p<=k.dateWeekStartDay+6;p+=1)k.daysInString.push(p%7);k.daysInString=k.daysInString.map(function(a){return g("date")(new Date(new Date("06/08/2014").valueOf()+c*a),"EEE")}),k.datepickerAppendTo&&k.datepickerAppendTo.indexOf(".")!==-1?(k.datepickerID="datepicker-id-"+(new Date).getTime()+(Math.floor(6*Math.random())+8),a.element(document.getElementsByClassName(k.datepickerAppendTo.replace(".",""))[0]).append(e(a.element(E))(k,function(b){n=a.element(b)[0]}))):k.datepickerAppendTo&&k.datepickerAppendTo.indexOf("#")!==-1?(k.datepickerID="datepicker-id-"+(new Date).getTime()+(Math.floor(6*Math.random())+8),a.element(document.getElementById(k.datepickerAppendTo.replace("#",""))).append(e(a.element(E))(k,function(b){n=a.element(b)[0]}))):k.datepickerAppendTo&&"body"===k.datepickerAppendTo?(k.datepickerID="datepicker-id-"+((new Date).getTime()+(Math.floor(6*Math.random())+8)),a.element(document).find("body").append(e(a.element(E))(k,function(b){n=a.element(b)[0]}))):(r.after(e(a.element(E))(k)),n=l[0].querySelector("._720kb-datepicker-calendar")),O()&&r.on("focus click focusin",function(){A=!0,z||A||!n?N():k.hideCalendar()}),r.on("focusout blur",function(){A=!1}),a.element(n).on("mouseenter",function(){z=!0}),a.element(n).on("mouseleave",function(){z=!1}),a.element(n).on("focusin",function(){z=!0}),a.element(b).on("click focus focusin",F),(k.dateMinLimit&&!k.isSelectableMinYear(k.year)||!k.isSelectableMinDate(k.year+"/"+k.monthNumber+"/"+k.day))&&H(),(k.dateMaxLimit&&!k.isSelectableMaxYear(k.year)||!k.isSelectableMaxDate(k.year+"/"+k.monthNumber+"/"+k.day))&&I(),k.paginateYears(k.year),G(k.monthNumber,k.year),k.checkVisibility=P,k.$on("$destroy",function(){Q(),R(),S(),T(),r.off("focus click focusout blur"),a.element(n).off("mouseenter mouseleave focusin"),a.element(b).off("click focus focusin",F)})};return{restrict:"AEC",scope:{dateSet:"@",dateMinLimit:"@",dateMaxLimit:"@",dateMonthTitle:"@",dateYearTitle:"@",buttonNextTitle:"@",buttonPrevTitle:"@",dateDisabledDates:"@",dateSetHidden:"@",dateTyper:"@",dateWeekStartDay:"@",datepickerAppendTo:"@",datepickerToggle:"@",datepickerClass:"@",datepickerShow:"@"},link:k}};a.module("720kb.datepicker",[]).directive("datepicker",["$window","$compile","$locale","$filter","$interpolate","$timeout",j])}(angular,navigator);

var filamentui = angular.module('filamentui', ['filamentuiTemplates', 'tw.directives.clickOutside', 'angularUtils.directives.dirPagination', '720kb.datepicker']);

angular.module('filamentui')
    .directive('filamentuiItemGenerator', ["$compile", "$rootScope", function($compile, $rootScope) {
    return {
        scope: {
            type: '=',
            data: '=',
            event: '='
        },
        link: function(scope, element) {
            var generatedTemplate = '';
            $rootScope.$on ( scope.event, function () {
                compile();
            });

            scope.$watch('data', function(newVal, oldVal) {
                if (newVal && newVal !== oldVal) {
                    compile();
                }
            });

            function compileJSON(data) {
                var jsonString = JSON.stringify(data);
                var escapedJSONString = jsonString.replace(/\\n/g, "\\n")
                    .replace(/\'/g, "&#39;")
                    .replace(/\\"/g, '\\"')
                    .replace(/\\&/g, "\\&")
                    .replace(/\\r/g, "\\r")
                    .replace(/\\t/g, "\\t")
                    .replace(/\\b/g, "\\b")
                    .replace(/\\f/g, "\\f");

                return escapedJSONString;
            }

            function compile() {
                generatedTemplate = '<div class="generated-class" ' + scope.type;

                for ( key in scope.data ) {
                    var d = scope.data[key];
                    var escapedJSONString = compileJSON(d);
                    generatedTemplate += ' ' + key + '=\'' + escapedJSONString + '\' ';
                }

                generatedTemplate += '></div>';

                angular.element('.generated-class', element).remove();
                element.append($compile(generatedTemplate)(scope));
            }

            compile();
        }
    };
}]);

angular.module('filamentui')

    .directive('filamentuiActivity', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/activity/activity.html',
            scope: {
                'activities' : '='
            },
            link: function ($scope, element, attrs, ngModel) {
                $scope.showAll = false;
                $scope.updateEvent = 'activity_' + new Date().getTime()+"_" + Math.ceil(Math.random()*100);
                $scope.orderDescriptionKeys = [ 'A - Z', 'Z - A' ];
                $scope.orderTimestampKeys = [ 'Most Recent', 'Oldest' ];

                $scope._fromNow = function ( timestamp ) {
                    return moment ( timestamp ).fromNow();
                }

                $scope._toggleViewMore = function ( ) {
                    $scope.showAll = !$scope.showAll;
                }

                $scope._click = function ( ) {
                    if ($scope.activities.action) {
                        if (typeof $scope.activities.action.click === 'function') {
                            $scope.activities.action.click();
                        }
                    }
                }

                $rootScope.$on($scope.updateEvent, function ( event, filterItems ) {
                    $scope.activities = filterItems;
                } );
            }
        };
}]);

angular
    .module('filamentui')
    .directive('filamentuiBack', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/back/back.html',
            scope: {
                "label": "=",
                "back": "&?"
            },
            link: function ($scope, element, attrs, ngModel) {
                $scope._back = function () {
                    if ( $scope.back != null ) {
                        $scope.back();
                    }
                }
            }
        };
}]);

angular
    .module('filamentui')
    .directive('filamentuiButton', ['$timeout', '$q', function ($timeout, $q) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/button/button.html',
            scope: {
                click: '&?',
                options: '=',
                openOnSelectOption: '=',
                position: '=',
                size: '=?'
            },
            link: function ($scope, element, attrs) {
                $scope._isPlus = element.hasClass('plus');

                $scope.selectedMenu = null;
                $scope.menuIcon = null;

                $scope.lastClick = null;
                $scope.processing = false;

                $scope.disabledClass = '';

                $scope.loadingIconColour = '#fff';
                if (element.hasClass('delete')) {
                    $scope.loadingIconColour = '#d0021b';
                } else if (element.hasClass('info')) {
                    $scope.loadingIconColour = '#31708F';
                }

                attrs.$observe('disabled', function(newVal, oldVal) {
                    if (newVal !== undefined && newVal !== oldVal) {
                        if (newVal) {
                            $scope.disabledClass = 'disabled';
                        } else {
                            $scope.disabledClass = '';
                        }
                    }
                });

                function setSelectedOption() {
                    var found = false;
                    if ($scope.options && $scope.options[0]) {
                        for ( var i = 0; i < $scope.options[0].length; i++ ) {
                            var m = $scope.options[0][i];
                            if ( m.if == null && !found ) {
                                $scope.selectedMenu = m;
                                $scope.selectedOption = $scope.selectedMenu.title;
                                $scope.menuIcon = $scope.selectedMenu.icon;
                                found = true;
                                break;
                            } else if ( m.if != null && m.if () ) {
                                $scope.selectedMenu = m;
                                $scope.selectedOption = $scope.selectedMenu.title;
                                $scope.menuIcon = $scope.selectedMenu.icon;
                                found = true;
                                break;
                            } else {
                                // iterate....
                            }
                        }
                    }
                }

                $scope._toggleOptions = function ( $event ) {
                    if ( $event ) {
                        $event.stopPropagation();
                        $event.preventDefault();
                    }

                    if (!$scope._disabled()) {
                        $scope.displayOptions = !$scope.displayOptions;
                    }
                }

                $scope._closeOptions = function () {
                    $scope.displayOptions = false;
                }

                $scope._clickMenu = function ( menu ) {
                    $scope.selectedMenu = menu;
                    $scope.menuIcon = $scope.selectedMenu.icon;
                    $scope.selectedOption = $scope.selectedMenu.title;
                    $scope.displayOptions = false;

                    if ( $scope._isPlus || ( $scope.openOnSelectOption && $scope.openOnSelectOption ) ) {
                        menu.action();
                    }
                }

                $scope._click = function () {
                    function executePromise (promise) {
                        if (promise) {
                            $scope.processing = true;
                            $q.when(promise).then(function(resolved) {
                                $scope.processing = false;
                            }, function() {
                                $scope.processing = false;
                            });
                        }
                    }

                    function executeClick () {
                        if (!$scope.processing) {
                            if ( $scope.selectedMenu ) {
                                var promise = $scope.selectedMenu.action(); // do the thing selected...
                                executePromise(promise);
                            } else if (!$scope.selectedOption && $scope.options) {
                                $scope._toggleOptions();
                            } else {
                                if ($scope.click) {
                                    $timeout ( function () {
                                        var promise = $scope.click();
                                        executePromise(promise);
                                    }, 100);
                                }
                            }
                        }
                    }

                    if (!$scope._disabled()) {
                        executeClick();
                    }
                }

                $scope._disabled = function () {
                    return element.hasClass('disabled');
                }
            }
        };
}]);

angular
    .module('filamentui')
    .directive('filamentuiCard', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/card/card.html',
            scope: {
                'model': '=',
                'showRatings': '=',
                'flip': '=?'
            },
            link: function ($scope, element, attrs) {
                // looks odd but flip might be null
                $scope.flip = $scope.flip ? $scope.flip : false;

                $scope._imgSrc = function () {
                    var imgTemplate = '';
                    if ( $scope.model.imageName ) {
                        imgTemplate += 'filamentui/assets/img/' + $scope.model.imageName;
                    }
                    return imgTemplate;
                }
            }
        };
    }])
    .filter('concat', function () {
        function concatFilter ( list ) {
            if ( list ) {
                return list.split(',').join(', ');
            } else {
                return 'None';
            }
        }
        return concatFilter;
    })
    .filter('currency', function() {
        function currencyFilter ( value ) {
            if ( value === 0 || value === '0' ) {
                return 'FREE';
            } else {
                return '£' + value;
            }
        }
        return currencyFilter;
    })
    .filter('modelTaggingType', function() {
        function modelTaggingTypeFilter( value ) {
            if ( value === 'DOCUMENT' || value === 'SENTENCE' || value === 'WORD' ) {
                return 'NLP ' + value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() + ' Model';
            } else {
                return value;
            }
        }

        function isArrayFilter ( array ) {
            if ( Array.isArray(array) ) {
                return array.map(modelTaggingTypeFilter);
            } else {
                return modelTaggingTypeFilter(array);
            }
        }
        return isArrayFilter;
});

angular
    .module('filamentui')
    .directive('filamentuiCardContainer', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/cards/cards.html',
            scope: {
                'cards': '=',
                'actions': '=',
                'heading': '=',
                'showRatings': '=',
                'onPageChange': '=',
                'options': '=',
                'pagerId': '=',
                'filterBy': '=',
                'orderBy': '=',
                'addTitle': '=?'
            },
            link: function ($scope, element, attrs) {
                $scope.showAdd = !( $scope.addTitle == null );

                $scope.addCard = {
                    'category': 'add',
                    'description': $scope.addTitle
                }

                $scope.pagination = {
                    currentPage: 1,
                    _totalItems: 0,
                    perPage: ( $scope.options && $scope.options.perpage ? $scope.options.perpage : 10 )
                };

                // see pager.directive.js for details
                $scope.pagerOptions = {
                    perPage: $scope.pagination.perPage,
                    directionLinks: true,
                    boundaryLinks: true,
                    onPageChange: pageChanged,
                    pagerId: $scope.pagerId,
                    autoHide: $scope.options.autoHide
                }

                function pageChanged ( newPageNum, oldPageNum ) {
                    getData();
                }

                var sortCards = function() {
                    if ($scope.orderBy) {
                        var reverse = $scope.orderBy.charAt(0) === '-';
                        var sortProperty;

                        if (reverse) {
                            sortProperty = $scope.orderBy.slice(1);
                        } else {
                            sortProperty = $scope.orderBy;
                        }

                        // Sort cards using orderBy property
                        $scope._cards = $scope._cards.sort(function(a, b) {
                            // Reverse sort
                            if (reverse) {
                                return a[sortProperty] < b[sortProperty] ? 1 : -1;
                            } else {
                                return a[sortProperty] > b[sortProperty] ? 1 : -1;
                            }
                        });
                    }
                }

                function getData () {
                    var startIndex = $scope.pagination.currentPage * $scope.pagination.perPage;
                    if ( typeof $scope.cards == 'function' ) {
                        // Get data asynchronously
                        $scope.cards({
                            'start' : startIndex,
                            'perpage' : ( $scope.pagination.perPage ? $scope.pagination.perPage : $scope.pagination._totalItems ) // everything
                        }).then ( function ( results ) {
                            $scope._cards  = angular.copy(results.data);
                            sortCards();
                            $scope.pagination._totalItems = results.count;
                            var originalItems = angular.copy(results.data);
                        });
                    } else {
                        $scope._cards = angular.copy($scope.cards);
                        sortCards($scope._cards);

                        // Use data in the same way as the asynchronous method
                        // Requires slicing the data up into pages then setting the _totalItems property
                        // to allow dir-paginate to work correctly
                        startIndex = ( $scope.pagination.currentPage - 1 ) * $scope.pagination.perPage;
                        if ( $scope.pagination.perPage ) {
                            $scope._cards = $scope._cards.splice(startIndex, $scope.pagination.perPage);
                        }

                        $scope.pagination._totalItems = $scope.cards.length;
                        var originalItems = angular.copy($scope._cards);
                    }
                }

                $scope._addClick = function () {
                    if ( $scope.actions && $scope.actions.length > 1 ) {
                        var group = $scope.actions[1];
                        if ( group.length > 0 ) {
                            var click = group[0];
                            if ( click.if != null ) {
                                if ( typeof click.if == 'function' && click.if() ) {
                                    click.action();
                                } else if ( typeof click.if == 'boolean' && click.if ) {
                                    click.action();
                                } else {
                                    // do nothing...
                                }
                            } else {
                                click.action();
                            }
                        }
                    }
                }

                $scope._cardClick = function ( model ) {
                    if ( !model.loading && $scope.actions && $scope.actions.length > 0 ) {
                        var group = $scope.actions[0];
                        if ( group.length > 0 ) {
                            var click = group[0];
                            if ( click.if != null ) {
                                if ( typeof click.if == 'function' && click.if( model ) ) {
                                    click.action( model );
                                } else if ( typeof click.if == 'boolean' && click.if ) {
                                    click.action( model );
                                } else {
                                    // do nothing...
                                }
                            } else {
                                click.action( model );
                            }
                        }
                    }
                }

                // watch cards, refresh data on pull
                $scope.$watch('cards', function () {
                    getData();
                });

                $scope.$watch('pagerOptions.perPage', function( ) {
                    $scope.pagination.perPage = $scope.pagerOptions.perPage;
                });

                $scope.$watch('orderBy', function(newVal, oldVal) {
                    if (newVal && newVal !== oldVal) {
                        getData();
                    }
                })
            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiCheckbox', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'filamentui/directives/checkbox/checkbox.html',
            require: 'ngModel',
            scope: {
                'label': '='
            },
            link: function ($scope, element, attrs, ngModel) {
                $scope._click = function (e) {
                    e.stopPropagation();
                    $scope._checked = !$scope._checked;

                    if (ngModel) {
                        ngModel.$setViewValue($scope._checked);
                    }
                }

                // when angular detects a change to the model,
                // we update our widget
                if (ngModel) {
                    ngModel.$render = function() {
                        $scope._checked = ngModel.$viewValue;
                    }
                }
            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiDate', [function () {
        return {
            restrict: 'AE',
            replace: true,
            template: '<span class="filamentuiDate">{{ fromNow || timestamp | date : "dd/MM/yyyy" }}</span>',
            scope: {
                timestamp: '=',
                fromNow: '=?'
            },
            link: function (scope, element, attrs) {
            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiDatetime', [function () {
        return {
            restrict: 'AE',
            replace: true,
            template: '<span class="filamentuiDatetime">{{ fromNow || timestamp | date : "dd/MM/yyyy hh:mm" }}</span>',
            scope: {
                timestamp: '=',
                fromNow: '=?'
            },
            link: function (scope, element, attrs) {
            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiHelp', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/help/help.html',
            scope: {
                "help": "&?"
            },
            link: function ($scope, element, attrs, ngModel) {
                $scope._help = function () {
                    $scope.selected = !$scope.selected;
                    if ( $scope.help != null ) {
                        $scope.help();
                    }
                }
            }
        };
}]);

angular.module('filamentui')
    .directive('filamentuiFilter', ['$timeout', '$rootScope', function ($timeout, $rootScope) {

        // Set defaults
        function preLink($scope, element, attrs) {
        }

        function postLink($scope, element, attrs) {
            $scope.asc = $scope.activeSort && $scope.activeSort.asc || false;
            $scope.displayOptions = false;

            function init() {
                if ($scope.activeSort && $scope.activeSort.key === $scope.key) {
                    setActiveSort($scope.activeSort.key, $scope.activeSort.asc, false);
                }

                if ($scope.filters) {
                    $scope.filters.forEach(function(filter) {
                        if (!filter.title) {
                            filter.title = filter.value;
                        }
                    });
                }
            }

            $scope._toggleOptions = function () {
                $scope.displayOptions = !$scope.displayOptions;
            }

            /**
             * Called when filter is clicked
             * @param {Event} e
             * @param {Object} filter
             */
            $scope._filter = function ( e, filter ) {
                var title = filter.title;
                var key = $scope.key;
                var value = filter.value;

                if ( title === $scope.activeFilter ) {
                    // If filter is currently active, remove it
                    $scope.activeFilter = null;

                    // Complex match matches on any key, and matches on nested values
                    if (filter.complexMatch) {
                        delete $scope.activeFilters['$'];
                    } else {
                        delete $scope.activeFilters[key];
                    }
                } else {
                    // Else set the filter
                    $scope.activeFilter = title;

                    // Complex match matches on any key, and matches on nested values
                    if (filter.complexMatch) {
                        $scope.activeFilters['$'] = value;
                    } else {
                        $scope.activeFilters[key] = value;
                    }
                }

                // Emit event to inform other directives of update
                $rootScope.$emit($scope.event, filter.strict);
                $scope.displayOptions = false;
            }

            $scope._closeFilter = function () {
                $scope.displayOptions = false;
            }

            $scope._shouldHideFilter = function () {
                return !$scope.displayOptions;
            }

            /**
             * Called when a sort filter is clicked
             * @param {Event} e
             * @param {Boolean} asc
             */
            $scope._sort = function ( e, asc ) {
                // Is the filter already selected?
                var remove = $scope.activeSort.key === $scope.key && $scope.activeSort.asc === asc;

                $scope.asc = asc;
                $scope._toggleOptions(); // close the menu
                setActiveSort($scope.key, asc, remove);
            }

            /**
             * Set or remove activeSort value to Angular orderBy expression
             * @param {String} key
             * @param {Boolean} asc
             * @param {Boolean} remove
             */
            function setActiveSort ( key, asc, remove ) {
                if (remove) {
                    // Remove the sort
                    $scope.activeSort.sort = '';
                    delete $scope.activeSort.key;
                    delete $scope.activeSort.asc;
                } else {
                    if ($scope.sortFunction) {
                        // Use the provided sort function
                        $scope.activeSort.sort = $scope.sortFunction;
                    } else {
                        // Create orderBy expression
                        $scope.activeSort.sort = key;
                    }
                    $scope.activeSort.key = key;
                    $scope.activeSort.asc = asc;
                }

                $rootScope.$emit($scope.event);
                $scope.displayOptions = false;
                angular.element('h5', element).removeClass('active');
            }

            init();
        }

        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/filter/filter.html',
            scope: {
                'filterItems' : '=',
                'key': '=',
                'event': '=',
                'sorts': '=',
                'sortFunction': '=',
                'filters': '=',
                'activeFilters': '=',
                'activeSort': '='
            },
            compile: function(element, attributes) {
                return {
                    pre: preLink,
                    post: postLink
                };
            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiHeroBanner', [function ( ) {
      return {
        restrict: 'E',
        replace: true,
        transclude: {
            'one': '?paneOne',
            'two': '?paneTwo',
            'three': '?paneThree'
        },
        scope: {
            layout: '=',
            position: '=?',
            backImg: '=',
            backGrad: '=',
            
            title: '=',
            status: '=',
            description: '=',
            lastUpdated: '=?'
        },
        templateUrl: function(elem, attrs) {
            var layout = attrs.layout;
            // fix commas for attrs use in template
            if (layout) {
                var split = attrs.layout.split('\'');
                layout = split[1];
            }
            var url = layout ? 'filamentui/directives/herobanner/layout/' + layout + '.html' : 'filamentui/directives/herobanner/layout/basic.html';
            return url;
        },
        link: function ($scope, element, attrs) {
            if ($scope.layout == 'two_column' && !$scope.position) {
                $scope.position = 'right';
            }

            $scope.hidePane = hidePane;

            function init() {
                setBackground();
            }

            function setBackground() {
                var url = attrs.backImg || '_img/hero-banner.jpg';

                if (attrs.backGrad || !attrs.backImg) {
                    element.css({
                        'background': 'linear-gradient(rgba(255, 255, 255, 0.85),rgba(255, 255, 255, 0.85)), url(' + url + ')',
                        'background-size': 'cover',
                        'background-position': 'center'
                    });
                } else {
                    element.css({
                        'background': 'url(' + url + ')',
                        'background-size': 'cover',
                        'background-position': 'center'
                    });       
                }
            }

            function hidePane(position) {
                return !(position == $scope.position);
            }

            init();
        }
    };
}]);
angular.module('filamentui')

    .directive('filamentuiIcon', [function () {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/icon/icon.html',
            scope: {
                'status': '='
            },
            link: function (scope, element, attrs) {}
        };
}]);

angular.module('filamentui')

    .directive('filamentuiInput', [function ( ) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/input/input.html',
            scope: {
                'name': '=',
                'required': '=',

                'label': '=',
                'placeholder': '=',
                'errorMessage': '=',
                'infoMessage': '=',
                'helpMessage': '=',

                'rows': '=',
                'options': '=',
                'date': '=',

                'readonly': '=',
                'password': '=',
                'disabled': '=',
                'help': '&?',
                'valid': '&?',
                'size': '=?'
            },
            require: 'ngModel',
            link: function ($scope, element, attrs, ngModel) {
                $scope.input = {
                    value: null
                };

                $scope_showHelpMessage = false;
                $scope.originalValue = null;

                $scope.inputType = 'text';
                if ( $scope.password != null && $scope.password ) {
                    $scope.inputType = 'password';
                }

                $scope.readonlyClass = '';
                $scope.readonlyState = false;
                $scope.disabledClass = '';
                $scope.disabledState = false;

                attrs.$observe('readonly', function(newVal, oldVal) {
                    if (newVal !== undefined && newVal !== oldVal) {
                        if (newVal) {
                            $scope.readonlyClass = 'readonly';
                            $scope.readonlyState = true;
                        } else {
                            $scope.readonlyClass = '';
                        }
                    }
                });

                attrs.$observe('disabled', function(newVal, oldVal) {
                    if (newVal !== undefined && newVal !== oldVal) {
                        if (newVal) {
                            $scope.disabledClass = 'disabled';
                            $scope.disabledState = true;
                        } else {
                            $scope.disabledClass = '';
                        }
                    }
                });

                // when angular detects a change to the model,
                // we update our widget
                ngModel.$render = function model2view() {
                    if (ngModel.$viewValue != undefined) {
                        $scope.input.value = ngModel.$viewValue;
                        if ( $scope.originalValue == null ) {
                            // hopefully only do this once.
                            $scope.originalValue = angular.copy($scope.input.value);
                        }
                    }
                }

                $scope.onInputChange = function ()  {
                    ngModel.$setViewValue($scope.input.value);
                }

                $scope.clearInput = function () {
                    $scope.input.value = null;
                    ngModel.$setViewValue($scope.input.value);
                }

                $scope._hasChanged = function () {
                    return $scope.input.value && $scope.input.value !== '';
                }

                $scope._valid = function () {
                    if ( $scope.valid != null ) {
                        if ( typeof $scope.valid == 'function' ) {
                            return $scope.valid();
                        } else {
                            return $scope.valid;
                        }
                    } else {
                        return true;
                    }
                }
            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiJson', [function () {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/json/json.html',
            scope: {
                'json' : '='
            },
            link: function ($scope, element, attrs, ngModel) {
            //   console.log($scope.json);
            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiLabel', [function () {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/label/label.html',
            scope: {
                "text" : "=",
                "labelclass" : "="
            },
            link: function (scope, element, attrs) {
            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiMenu', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'filamentui/directives/menu/menu.html',
            scope: {
                'options' : '=',
                'position' : '=',
                'scope' : '=',
                'text' : '='
            },
            link: function ($scope, element, attrs) {
                $scope.displayOptions = false;

                $scope._toggleOptions = function ( $event ) {
                    $event.preventDefault();
                    $event.stopImmediatePropagation();
                    $scope.displayOptions = !$scope.displayOptions;
                    if ( angular.element('.menuButton', element).hasClass('active') ) {
                        angular.element('.menuButton', element).removeClass('active');
                    } else {
                        angular.element('.menuButton', element).addClass('active');
                    }
                }

                $scope._clickMenu = function ( $event, menu ) {
                    $event.preventDefault();
                    $event.stopImmediatePropagation();

                    $scope.displayOptions = false;

                    var params = menu;
                    if ( $scope.scope ) {
                        params = $scope.scope;
                    }

                    if ( menu.disabled ) {
                        // has a disabled function.. .
                        if ( !menu.disabled( $scope.scope ) ) {
                            if ( menu.action ) {
                                menu.action( params );
                            }
                        }
                    } else {
                        if ( menu.action ) {
                            menu.action( params );
                        }
                    }

                }

                $scope._showMenu = function ( menu, row ) {
                    if ( !menu.if ) {
                        return true;
                    } else {
                        return menu.if(row);
                    }
                }

                $scope._showMenuGroup = function( group, row ) {
                    var result = false;
                    group.forEach(function( menu ) {
                        result = result || $scope._showMenu(menu, row);
                    });
                    return result;
                }

                $scope._disableMenu = function (menu, row) {
                    if ( !menu.disabled ) {
                        return false;
                    } else {
                        return menu.disabled(row);
                    }
                }

                $scope._closeMenu = function () {
                    $scope.displayOptions = false;
                    angular.element('.menuButton', element).removeClass('active');
                }

                $scope._shouldHideMenu = function () {
                    return !$scope.displayOptions;
                }
            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiLoader', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'filamentui/directives/loader/loader.html',
            scope: {
                'type': '=?',
                'colour': '=?'
            },
            link: function ($scope, element, attrs) {
                // default type == spinner
                $scope.type = ( typeof $scope.type === 'undefined' ) ? 'wave' : $scope.type;
            }
        };
}]);

angular.module('filamentui')
    .directive('filamentuiPager', [function () {

        // Set defaults
        function preLink($scope, element, attrs) {
            if (!$scope.options) {
                $scope.options = {
                    perPage: 10
                };
            }

            // if ($scope.options.pagerId) {
            //     $scope.options.pagerId = $scope.options.pagerId + '_pgid';
            // }
        }

        function postLink($scope, element, attrs) {
            $scope.hideMenu = ( $scope.total && $scope.total > $scope.options.perPage );

            // default values as listed in dir-paginate docs
            // max-size (optional, default = 9, minimum = 5) - default css built to work with 9 items
            // direction-links (optional, default = true)
            // boundary-links (optional, default = false)
            // on-page-change (optional, default = null)
            // pagination-id (not optional in our project, provide as a string in template, eg 'demo_id')
            // template-url (cannot be set currently, default = filamentui/directives/pager/controls.html)
            // auto-hide (optional, default = true)

            $scope.perPageOptions = [ 5, 10, 50 ] // dropped 'all'
            $scope.perPageTitle = perPageTitle();

            $scope.perPageMenu = [ [] ];

            for ( p in $scope.perPageOptions ) {
                var pp = $scope.perPageOptions[p];
                $scope.perPageMenu[0].push ( {
                    "title": pp + ' per page',
                    "perpage": pp,
                    "action": function ( item ) {
                        // pass value back up through scope
                        $scope.options.perPage = item.perpage;
                        $scope.perPageTitle = perPageTitle();
                    }
                } );
            }

            function perPageTitle() {
                return $scope.options.perPage + ' per page';
            }
        }

        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/pager/pager.html',
            scope: {
                'options': '=',
                'total': '='
            },
            compile: function(element, attributes) {
                return {
                    pre: preLink,
                    post: postLink
                };
            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiPills', [function () {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/pills/pills.html',
            scope: {
                'options': '='
            },
            require: 'ngModel',
            link: function ($scope, element, attrs, ngModel) {
                $scope.selectedPill = null;

                ngModel.$render = function () {
                    if ( ngModel.$viewValue ) {
                        for ( var i = 0; i < $scope.options.length; i++ ) {
                            if ( $scope.options[i] == ngModel.$viewValue ) {
                                $scope.selectedPill = $scope.options[i];
                            }
                        }
                    }
                }

                ngModel.$render();

                $scope._click = function ( pill ) {
                    if ( pill.click && typeof pill.click == "function" ) {
                        if ( pill.disabled != null && typeof pill.disabled == "function" ) {
                            if ( !pill.disabled( pill ) ) {
                                $scope.selectedPill = pill;
                                pill.click ( pill );
                                ngModel.$setViewValue($scope.selectedPill);
                            }
                            // can't click on it if disabled...
                        } else {
                            $scope.selectedPill = pill;
                            pill.click ( pill );
                            ngModel.$setViewValue($scope.selectedPill);
                        }
                    } else {
                        if ( pill.disabled != null && typeof pill.disabled == "function" ) {
                            if ( !pill.disabled( pill ) ) {
                                $scope.selectedPill = pill;
                                ngModel.$setViewValue($scope.selectedPill);
                            }
                            // can't click on it if disabled...
                        } else {
                            $scope.selectedPill = pill;
                            ngModel.$setViewValue($scope.selectedPill);
                        }
                    }
                }
            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiProgress', [function () {
        return {
            restrict: 'AE',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/progress/progress.html',
            scope: {
                'label' : '=',
                'progress': '=',
                'background': '=?',
                'options': '=?'
            },
            link: function ($scope, element, attrs, ngModel) {

                $scope.currentProgress = 0;

                $scope._calcStyle = function() {
                    var progress = _progress();

                    progress = progress > 100 ? 100 : progress;
                    progress = progress < 0 ? 0 : progress;

                    var style = {
                        width: progress + '%',
                        background: _background(progress)
                    };

                    return style;
                }

                var _progress = function () {
                    if ( $scope.progress ) {
                        if (typeof $scope.progress === 'function') {
                            $scope.currentProgress = $scope.progress();
                        } else {
                            $scope.currentProgress = $scope.progress;
                        }
                    }

                    return $scope.currentProgress;
                }

                var _background = function () {
                    if ( $scope.background ) {
                        if ( typeof $scope.background === 'function' ) {
                            if ( $scope.currentProgress ) {
                                return $scope.background( $scope.currentProgress );
                            } else {
                                return $scope.background( 0 );
                            }
                        } else {
                            return $scope.background;
                        }
                    } else {
                        return '#27ae60';
                    }
                }
            }
        };
}]);

angular.module('filamentui')

  .directive('quickLoadImg', [function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var src = attrs.quickLoadImg;
        var backgroundElement = element[0];

        var img = new Image();
        img.src = src;
        img.onload = function () {
          var background = 'url("' + img.src + '"), -webkit-gradient(radial, 50% 15%, 20, 50% 15%, 1000, from(rgba(148, 78, 100, 0.952941)), to(rgba(0, 0, 0, 0.952941)))';

          backgroundElement.style.background = background;
          backgroundElement.style['background-size'] = 'cover';
          backgroundElement.classList.add('loaded');
        };
      }
    };
  }]);

angular.module('filamentui')

    .directive('filamentuiRadio', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'filamentui/directives/radio/radio.html',
            scope: {
                'label': '='
            },
            require: 'ngModel',
            link: function ($scope, element, attrs, ngModel) {
                $scope._click = function (e) {
                    e.stopPropagation();
                    $scope._checked = !$scope._checked;

                    if (ngModel) {
                        ngModel.$setViewValue($scope._checked);
                    }
                }

                // when angular detects a change to the model,
                // we update our widget
                if (ngModel) {
                    ngModel.$render = function() {
                        $scope._checked = ngModel.$viewValue;
                    }
                }
            }
        };
    }]);

angular.module('filamentui')

    .directive('filamentuiStarRating', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/starrating/starrating.html',
            scope: {
                disabled: '=?'
            },
            require: "ngModel",
            link: function ($scope, element, attrs, ngModel) {
                $scope.stars = 0;

                $scope._select = function ( newValue ) {
                    // console.log("new value = " + newValue);
                    if ( $scope.disabled ) {
                        return; // do nothing
                    }
                    // set the value here?
                    ngModel.$setViewValue(newValue);
                    $scope.stars = newValue;
                }

                // when angular detects a change to the model,
                // we update our widget
                ngModel.$render = function model2view() {
                    if (ngModel.$viewValue != undefined) {
                        $scope.stars = ngModel.$viewValue;
                    }
                }
            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiSettings', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/settings/settings.html',
            scope: {
                "settings": "&?"
            },
            link: function ($scope, element, attrs) {
                $scope._settings = function () {
                    if ( $scope.settings != null ) {
                        $scope.settings();
                    }
                }
            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiStatistic', [function () {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                title: '=',
                value: '=',
                colour: '='
            },
            templateUrl: 'filamentui/directives/statistic/statistic.html'
        }
}]);

/**
 * @name directives.tab
 **/

(function () {
    angular
        .module('filamentui')
        .directive('filamentuiTab', Tab);

    function Tab() {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/tab/tab.html',
            scope: {},
            require: '^filamentuiTabs',
            link: function ($scope, element, attrs, tabsCtrl) {
                var _data = {
                    name: attrs.name,
                    index: attrs.index
                };

                tabsCtrl.register(_data);

                $scope.isVisible = function () {
                    return tabsCtrl.isActive(_data.index);
                };
            }
        };
    }

}());
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

angular.module('filamentui')

  .directive('filamentuiTags', [function () {
    return {
      restrict: 'AE',
      replace: true,
      transclude: true,
      templateUrl: 'filamentui/directives/tags/tags.html',
      scope: {
        'tags': '=',
        'top': '=?'
      },
      link: function ($scope, element, attrs, ngModel) {
        $scope.showAll = true;
        $scope.topTags = [];
        $scope.moreTags = [];
        $scope.showTags = false;
        
        function init () {
          if ($scope.top && typeof $scope.top === 'number') {
            $scope.showAll = false;
            $scope.topTags = $scope.tags.slice(0, $scope.top);
            $scope.moreTags = $scope.tags.slice($scope.top, $scope.tags.length);
          }
        }

        $scope._showMore = function () {
          $scope.showTags = true;
        }

        $scope._showLess = function () {
          $scope.showTags = false;
        }

        $scope.tagColour = function (tag) {
          // TODO: If no tag colour, generate a random colour
          var style = {
            background: tag.colour
          };

          return style;
        }

        init();
      }
    };
  }]);
/**
 * @name directives.tabs
 **/

(function () {
    Tabs.$inject = ["tabService"];
    TabsController.$inject = ["$scope", "tabService"];
    angular
        .module('filamentui')
        .directive('filamentuiTabs', Tabs)
        .controller('TabsController', TabsController);

    function Tabs(tabService) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/tabs/tabs.html',
            scope: {
                position: '='
            },
            link: function ($scope, element, attrs) {
                $scope.switch = function (tab) {
                    tabService.setOpenTab(tab.index);
                };
            },
            controller: TabsController
        };
    }

    function TabsController($scope, tabService) {
        $scope.tabs = [];

        function init() {
            tabService._init();
        }

        this.register = function(tab) {
            $scope.tabs.push(tab);
        };

        this.isActive = function(index) {
            return (tabService.getOpenTab() == index);
        };

        $scope.isActive = this.isActive;

        init();
    }
}());
/**
 * @name service.tabs
 **/

(function () {
    angular
        .module('filamentui')
        .factory('tabService', TabService);

    function TabService() {
        _tabState = {
            openTabIndex: 0
        };

        function _init() {
            _tabState.openTabIndex = 0;
        }

        function setOpenTab(index) {
            _tabState.openTabIndex = index;
        }

        function getOpenTab(index) {
            return _tabState.openTabIndex;
        }

        return {
            _init: _init,
            setOpenTab: setOpenTab,
            getOpenTab: getOpenTab
        };
    }
}());

angular.module('filamentui')

    .directive('filamentuiDataset', [function () {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/types/dataset.html',
            scope: {
                "title" : "=",
                "description" : "="
            },
            link: function (scope, element, attrs) {

            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiTag', [function () {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/types/tag.html',
            scope: {
                "title" : "=",
                "description" : "="
            },
            link: function (scope, element, attrs) {

            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiTagger', [function () {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/types/tagger.html',
            scope: {
                "title" : "=",
                "description" : "="
            },
            link: function (scope, element, attrs) {

            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiVersion', [function () {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/types/version.html',
            scope: {
                "title" : "=",
                "description" : "="
            },
            link: function (scope, element, attrs) {

            }
        };
}]);

angular.module('filamentui')

    .directive('filamentuiWorkspace', [function () {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl : 'filamentui/directives/types/workspace.html',
            scope: {
                "title" : "=",
                "description" : "="
            },
            link: function (scope, element, attrs) {

            }
        };
}]);

angular
    .module('filamentui')
    .directive('filamentuiRoleCard', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'filamentui/directives/card/rolecard/rolecard.html',
            scope: {
                'card': '=',
                'click': '=',
                'selectedId': '=',
                'information': '=?'
            },
            link: function ($scope, element, attr) {
                $scope._click = function ( data ) {
                    if ( typeof $scope.click == 'function' ) {
                        $scope.click(data);
                    } else {
                        // do nothing...
                    }
                }

                $scope._information = function ( data ) {
                    if ($scope.information && typeof $scope.information === 'function') {
                        $scope.information(data);
                    }
                }

                $scope._cardClasses = function () {
                    var className = '';

                    if ($scope.card.tag) {
                        className += 'role-card-' + $scope.card.tag.toLowerCase();
                    }
                    if ($scope.selectedId === $scope.card.id) {
                        className += ' selected';
                    }

                    return className;
                }

                $scope._imgSrc = function () {
                    var imgTemplate = '';
                    if ( $scope.card.svg ) {
                        imgTemplate += 'filamentui/assets/img/' + $scope.card.svg;
                    } else if ($scope.card.img) {
                        imgTemplate += $scope.card.img;
                    }
                    return imgTemplate;
                }
            }
        }
}]);
angular
    .module('filamentui')
    .directive('filamentuiRoleCardContainer', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'filamentui/directives/cards/rolecards/rolecards.html',
            scope: {
                "cards": "=",
                "information": "=?"
            },
            require: "ngModel",
            link: function ($scope, element, attr, ngModel) {
                $scope._updateSelected = function ( card ) {
                    ngModel.$setViewValue(card);
                    ngModel.$render();
                }

                ngModel.$render = function () {
                    if (ngModel.$viewValue) {
                        $scope.selected = ngModel.$viewValue.id;
                    }
                }

            }
        }
}]);