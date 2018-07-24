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
