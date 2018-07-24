angular.module('filamentuiDemo')
  .controller('TablesCtrl', TablesController);

function TablesController($scope, $rootScope, $q) {

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

  var asyncRawData = [
    {
      'id': 1,
      'firstName': 'Anna',
      'surname': 'Thomas',
      'count': 25,
      'date': 1509550743211
    },
    {
      'id': 2,
      'firstName': 'Bobby',
      'surname': 'Doe',
      'count': 12,
      'date': 1509550743211
    },
    {
      'id': 3,
      'firstName': 'Ash',
      'surname': 'Ketchum',
      'count': 300,
      'date': 1509550743211
    }
  ];

  var tagRawData = [
    {
      'id': 1,
      'firstName': 'Anna',
      'surname': 'Thomas',
      'tag': {
        'type': 'filamentui-tags',
        'data': {
          'tags': [],
          'top': 3
        }
      }
    },
    {
      'id': 2,
      'firstName': 'Bobby',
      'surname': 'Doe',
      'tag': {
        'type': 'filamentui-tags',
        'data': {
          'tags': [],
          'top': 3
        }
      }
    },
    {
      'id': 3,
      'firstName': 'Ash',
      'surname': 'Ketchum',
      'tag': {
        'type': 'filamentui-tags',
        'data': {
          'tags': [],
          'top': 3
        }
      }
    }
  ];

  var rawData = [
    {
      'id': 1,
      'title': {
        'type': 'filamentui-dataset',
        'data': {
          'title': 'Dataset Sample',
          'description': 'This is a description of my dataset.'
        }
      },
      'timestamp': {
        'type': 'filamentui-datetime',
        'data': {
          'timestamp': 1511451509795
        }
      },
      'progress': {
        'type': 'filamentui-progress',
        'data': {
          'title': 'X / Y Completed',
          'progress': 62
        }
      }
    },
    {
      'id': 2,
      'title': {
        'type': 'filamentui-tagger',
        'data': {
          'title': 'Tagger name',
          'description': 'This is a description of your tagger.'
        }
      },
      'timestamp': {
        'type': 'filamentui-date',
        'data': {
          'timestamp': 1509550743211
        }
      },
      'progress': {
        'type': 'filamentui-progress',
        'data': {
          'title': 'X / Y Completed',
          'progress': 12
        }
      }
    },
    {
      'id': 3,
      'title': {
        'type': 'filamentui-tag',
        'data': {
          'title': 'Tag name',
          'description': 'This is a tag and some description of it.'
        }
      },
      'timestamp': {
        'type': 'filamentui-date',
        'data': {
          'timestamp': 1512315473053
        }
      },
      'progress': {
        'type': 'filamentui-progress',
        'data': {
          'title': 'X / Y Completed',
          'progress': 79
        }
      }
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

  var asyncRawCols = [
    {
      'title': 'First Name',
      'width': '200px',
      'key': 'firstName'
    },
    {
      'title': 'Surname',
      'width': '200px',
      'key': 'surname'
    },
    {
      'title': 'Count',
      'width': '100px',
      'key': 'count'
    },
    {
      'title': 'Date',
      'width': 'auto',
      'key': 'date',
      'type': 'datetime'
    }
  ];

  var tagRowCols = [
    {
      'title': 'First Name',
      'width': '200px',
      'key': 'firstName'
    },
    {
      'title': 'Surname',
      'width': '200px',
      'key': 'surname'
    },
    {
      'title': 'Tags',
      'width': 'auto',
      'key': 'tag'
    }
  ]

  // Basic table
  $scope.basicTable = {
    'rows': angular.copy(basicRawData),
    'cols': angular.copy(basicRawCols)
  };

  // Basic table with tags
  for (var i = 0; i < 15; i++) {
    var tag = {'name': 'tag', 'colour': 'blue'};
    tagRawData[0].tag.data.tags.push(tag);
  }

  tagRawData[1].tag.data.tags.push({'name': 'hello', 'colour': 'green'});
  tagRawData[1].tag.data.tags.push({'name': 'world', 'colour': 'purple'});

  // Basic table with tags
  for (var i = 0; i < 5; i++) {
    var tag = {'name': 'more tag', 'colour': 'red'};
    tagRawData[2].tag.data.tags.push(tag);
  }

  $scope.tagTable = {
    'rows': angular.copy(tagRawData),
    'cols': angular.copy(tagRowCols)
  };

  // Sorted table
  $scope.sortedTable = {
    'rows': angular.copy(basicRawData),
    'cols': angular.copy(basicRawCols),
    'options': {
      defaultSort: {
        key: 'count',
        asc: false
      }
    }
  };
  $scope.sortedTable.cols[0].sorts = ['A - Z', 'Z - A'];
  $scope.sortedTable.cols[1].sorts = ['A - Z', 'Z - A'];
  $scope.sortedTable.cols[2].sorts = ['Decreasing', 'Increasing'];
  $scope.sortedTable.cols[2].sortFunction = function (item) {
    return -item.count;
  };

  // Filtered table
  $scope.filteredTable = {
    'rows': angular.copy(basicRawData),
    'cols': angular.copy(basicRawCols)
  };
  $scope.filteredTable.cols[0].filters = [{
    'value': 'Anna'
  }, {
    'value': 'Ash',
    'strict': true
  }];
  $scope.filteredTable.cols[1].filters = [{
    'title': 'All Thomas\'s',
    'value': 'Thomas'
  }, {
    'title': 'All Ketchum\'s',
    'value': 'Ketchum'
  }];
  $scope.filteredTableJson = angular.copy($scope.filteredTable);

  // Generated Items Table
  $scope.generatedItemsTable = {
    'rows': angular.copy(rawData),
    'cols': [
      {
        'title': 'Description',
        'width': 'auto',
        'key': 'title',
        'sorts': ['A - Z', 'Z - A'],
        'sortFunction': function(item) {
          return item.title.data.title;
        },
        'filters': [
          {
            'title': 'Datasets',
            'value': 'filamentui-dataset',
            'complexMatch': true,
            'strict': true
          },
          {
            'title': 'Tags',
            'value': 'filamentui-tag',
            'complexMatch': true,
            'strict': true
          },
          {
            'title': 'Taggers',
            'value': 'filamentui-tagger',
            'complexMatch': true,
            'strict': true
          }
        ]
      },
      {
        'title': 'Modified',
        'width': '100px',
        'key': 'timestamp'
      },
      {
        'title': 'Progress',
        'width': '200px',
        'key': 'progress'
      }
    ],
    'options': {
      'defaultSort': {
        'key': 'title',
        'asc': true
      }
    }
  };

  // Selectable table
  $scope.selectableTable = {
    'rows': angular.copy(basicRawData),
    'cols': angular.copy(basicRawCols),
    'options': {
      'selectable': true,
      'perPage': 2
    }
  };

  // Multiple selectable table
  $scope.multipleTable = {
    'rows': angular.copy(basicRawData),
    'cols': angular.copy(basicRawCols),
    'options': {
      'selectable': true,
      'multiple': true,
      'perPage': 2
    }
  };

  // Preselected multiple selectable table
  $scope.preselectedTable = angular.copy($scope.multipleTable);
  $scope.preselectedTable.rows.forEach(function(row) {
    row._meta = {
      checked: true
    };
  })

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

  // Expandable table
  $scope.expandableTable = angular.copy($scope.basicExpandableTable);
  $scope.expandableTable.rows.forEach(function(row) {
    row.expandedContent = {
      'type': 'filamentui-json',
      'data': {
        'json': { 'hello': 'world' }
      }
    };
  });

  // Subtable table
  $scope.subtableTable = angular.copy($scope.basicExpandableTable);
  $scope.subtableTable.rows.forEach(function(row) {
    row.expandedContent = {
      'type': 'filamentui-table',
      'data': {
        'rows': angular.copy(basicRawData),
        'cols': angular.copy(basicRawCols),
        'options': {
          'hideHeaders': true,
          'hidePager': true
        }
      }
    };
  });
  $scope.subtableTable.rows[0].expanded = true;

  // Selectable subtable table
  $scope.selectableSubtableTable = angular.copy($scope.subtableTable);
  $scope.selectableSubtableTable.options.selectable = true;
  $scope.selectableSubtableTable.options.multiple = true;
  $scope.selectableSubtableTable.rows.forEach(function(row) {
    row.expandedContent.data.options.selectable = true;
    row.expandedContent.data.options.multiple = true;
  });

  // No headers table
  $scope.noHeadersTable = {
    'rows': angular.copy(basicRawData),
    'cols': angular.copy(basicRawCols),
    'options': {
      'hideHeaders': true
    }
  };

  // Actions table
  $scope.actionsTable = {
    'rows': angular.copy(basicRawData),
    'cols': angular.copy(basicRawCols),
    'options': {
      'clickActionIndex': 0
    },
    'actions': [
      [
        {
          'title': 'First action',
          'icon': 'fa-edit',
          'action': function (item) {
            alert('You clicked on the first action.');
          },
          'if': function (item) {
            return true;
          }
        },
        {
          'title': 'Second action',
          'icon': 'fa-edit',
          'action': function (item) {
            alert('You clicked on the second action.');
          },
          'if': function (item) {
            return true;
          }
        }
      ], [
        {
          'title': 'Last action',
          'icon': 'fa-edit',
          'action': function (item) {
            alert('You clicked on the last action.');
          },
          'if': function (item) {
            return true;
          }
        }
      ]
    ]
  };

  // Asynchronously Loaded Table
  $scope.asynchronousTable = {
    'rows': [],
    'cols': angular.copy(asyncRawCols)
  };

  function asyncGetRows() {
    return $q(function(resolve, reject) {
      setTimeout(function() {
        resolve({
          items: angular.copy(asyncRawData)
        });
      }, 1000);
    });
  }

  $scope.getRows = function() {
    $scope.asynchronousTable.rows = asyncGetRows;
    $rootScope.$emit('refresh_table');
  }
}
