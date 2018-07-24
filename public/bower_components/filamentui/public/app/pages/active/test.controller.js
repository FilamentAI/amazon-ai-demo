angular.module('filamentuiDemo')
  .controller('TestCtrl', TestCtrl);

function TestCtrl($scope, $q) {

  var basicRawData = [
    {
      'id': 1,
      'firstName': 'Anna',
      'surname': 'Thomas',
      'count': 25
    },
    {
      'id': 2,
      'firstName': 'Bobby',
      'surname': 'Doe',
      'count': 12
    },
    {
      'id': 3,
      'firstName': 'Ash',
      'surname': 'Ketchum',
      'count': 300
    }
  ];

  var longSubRawData = [
    {
      'id': 1,
      'firstName': 'Anna',
      'surname': 'Thomas',
      'count': 25
    },
    {
      'id': 2,
      'firstName': 'Bobby',
      'surname': 'Doe',
      'count': 12
    },
    {
      'id': 3,
      'firstName': 'Ash',
      'surname': 'Ketchum',
      'count': 300
    },
    {
      'id': 11,
      'firstName': 'Anna',
      'surname': 'Thomas',
      'count': 25
    },
    {
      'id': 21,
      'firstName': 'Bobby',
      'surname': 'Doe',
      'count': 12
    },
    {
      'id': 31,
      'firstName': 'Ash',
      'surname': 'Ketchum',
      'count': 300
    },
    {
      'id': 12,
      'firstName': 'Anna',
      'surname': 'Thomas',
      'count': 25
    },
    {
      'id': 22,
      'firstName': 'Bobby',
      'surname': 'Doe',
      'count': 12
    },
    {
      'id': 32,
      'firstName': 'Ash',
      'surname': 'Ketchum',
      'count': 300
    },
    {
      'id': 13,
      'firstName': 'Anna',
      'surname': 'Thomas',
      'count': 25
    },
    {
      'id': 23,
      'firstName': 'Bobby',
      'surname': 'Doe',
      'count': 12
    },
    {
      'id': 33,
      'firstName': 'Ash',
      'surname': 'Ketchum',
      'count': 300
    }
  ];

  var basicRawCols = [
    {
      'title': 'First Name',
      'width': '200px',
      'key': 'firstName'
    },
    {
      'title': 'Surname',
      'width': 'auto',
      'key': 'surname'
    },
    {
      'title': 'Count',
      'width': '100px',
      'key': 'count'
    }
  ];

  // Basic expandable table
  $scope.basicExpandableTable = {
    'rows': angular.copy(basicRawData),
    'cols': angular.copy(basicRawCols),
    'options': {
      'expandable': true
    }
  };
  $scope.basicExpandableTable.rows.forEach(function(row) {
    row.expandedContent = 'hello world';
  });

  // Async SubTable
  // Subtable table
  $scope.subtableTableTest = angular.copy($scope.basicExpandableTable);
  $scope.subtableTableTest.rows.forEach(function(row) {
    row.expandedContent = {
      'type': 'filamentui-table',
      'data': {
        'rows': asyncGetRowsTest,
        'cols': angular.copy(basicRawCols),
        'options': {
          'hideHeaders': false,
          'hidePager': false
        }
      }
    };
  });
  $scope.subtableTableTest.rows[0].expanded = true;
  $scope.subtableTableTest.options.perPage = 2;

  function asyncGetRowsTest(params) {
    return $q(function(resolve, reject) {
      setTimeout(function() {
        var items = angular.copy(longSubRawData);
        var count = items.length;
        items = items.splice(params.skip, params.top);
        resolve({
          items: items,
          count: count
        });
      }, 1000);
    });
  }

  // Sync SubTable
  // Subtable table
  $scope.subtableTableTestTwo = angular.copy($scope.basicExpandableTable);
  $scope.subtableTableTestTwo.rows.forEach(function(row) {
    row.expandedContent = {
      'type': 'filamentui-table',
      'data': {
        'rows': angular.copy(longSubRawData),
        'cols': angular.copy(basicRawCols),
        'options': {
          'hideHeaders': false,
          'hidePager': false
        }
      }
    };
  });
  $scope.subtableTableTestTwo.rows[0].expanded = true;
  $scope.subtableTableTestTwo.options.perPage = 2;

}
