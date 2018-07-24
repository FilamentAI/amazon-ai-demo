angular.module('filamentuiDemo')
    .controller('HomeCtrl',

    [ '$rootScope', '$scope', '$stateParams', '$q', '$sce', 'apiService',

    function ( $rootScope, $scope, $stateParams, $q, $sce, apiService ) {

        $scope.information = function (data) {
            console.log('informative data: ', data);
        };

        $scope.hide  = true;
        $scope.stars = 3;

        $scope.test = {
            basicInput: null,
            helpInput: null,
            search: null,
            textarea: null,
            dateInput: null
        };

        var _currentDate = moment();

        $scope.date = {
            format: 'yyyy-MM-dd',
            max: _currentDate.add(1, 'month').format('YYYY-MM-DD'),
            set: _currentDate.format('YYYY-MM-DD')
        };

        $scope.selectOptions = [ 
            { 
                value: 'Something',
                title: 'Something'
            }, 
            { 
                value: 'Something else',
                title: 'Something else'
            }, 
            { 
                value: 'another one',
                title: 'another one'
            } 
        ];

        $scope.selectedOption = null;
        $scope.testCheckbox   = false;

        $scope.isNumber = function (input) {
            return !isNaN(input);
        }

        $scope.$watch ( "testRadio1", function () {
            console.log("updated");
        });

        $scope.testRadio1 = "first";

        $scope.clickMe = function () {
            console.log("You clicked me");
        }

        $scope.clickMePromise = function() {
            console.log('clicked');
            return $q(function(resolve, reject) {
                setTimeout(function() {
                    resolve('Resolved promise!');
                }, 2000);
            });
        }

        $scope.labelData = {
            "text" : "Owner",
            "class": "success"
        };

        // $scope.pill  = null;
        $scope.pills = [
            {
                "text" : "Tags",
                "pillClass" : "success",
                "value": "test"
            },
            {
                "text" : "Taggers",
                "pillClass" : "success",
                "disabled" : function ( item ) {
                    return true;
                }
            },
            {
                "text" : "Hover",
                "pillClass" : "success"
            },
            {
                "text" : "Datasets",
                "pillClass" : "success"
            }
        ];
        $scope.pill = $scope.pills[0];

        $scope.buttonsDisabled = true;
        $scope.disableButton = function () {
            //return $scope.buttonsDisabled;
            //return $scope.selectedRows.length == 0;
        }

        $scope.buttonOptions = [
            [
                {
                    "title" : "Train",
                    "icon" : "fa-edit",
                    "class" : "",
                    "action" : function ( ) {
                        console.log("train")
                    }
                }
            ], [
                {
                    "title" : "Quick Train",
                    "icon" : "fa-times",
                    "class" : "warning",
                    "action" : function ( ) {
                        console.log("quick train")
                    }
                }
            ]
        ];

        $scope.promiseButtonOptions = [
            [
                {
                    "title" : "Option 1",
                    "action" : $scope.clickMePromise
                }
            ], [
                {
                    "title" : "Option 2",
                    "action" : $scope.clickMePromise
                }
            ]
        ];

        $scope.plusOptions = [
            [
                {
                    "title" : "G1 Option 1",
                    "icon" : "fa-edit",
                    "class" : "",
                    "action" : function ( ) {
                        console.log("g1 option")
                    }
                }
            ], [
                {
                    "title" : "G2 Option 1",
                    "icon" : "",
                    "class" : "",
                    "action" : function ( ) {
                        console.log("option 1")
                    }
                }, {
                    "title" : "G2 Option 2",
                    "class" : "",
                    "action" : function ( ) {
                        console.log("option 2")
                    }
                }, {
                    "title" : "G2 Option 3",
                    "class" : "",
                    "action" : function ( ) {
                        console.log("option 3")
                    }
                }
            ], [
                {
                    "title" : "G3 Option",
                    "class" : "",
                    "action" : function ( ) {
                        console.log("g3 option")
                    }
                }
            ]
        ];

        $scope.displayHelp = function () {
            alert("You have asked for help");
        }

        $scope.navigateBack = function () {
            alert("Can't go back. I'm going to keep you here.");
        }

        $scope.progress = 20;
        var rand = Math.round(Math.random() * 100);
        $scope.progressFunction = function() {
            return rand;
        }

        setTimeout(function() {
            $scope.progress = 100;
            $scope.$apply();
        }, 2500);

        setTimeout(function() {
            $scope.progress = 50;
            $scope.$apply();
        }, 5000);

        $scope.progressOptions = {
            stripe: true,
            animate: true
        };

        $scope.backgroundDynamic = function ( progress ) {
            if ( progress < 10 ) {
                return "#e84096";
            } else if ( progress < 50 ) {
                return "#31708F";
            } else {
                return "#61d4cf";
            }
        }

        $scope.activities = {
            items: [
                {
                    "description" : "Dataset Activity",
                    "timestamp" : 1512315473053,
                    "type" : "green"
                },
                {
                    "description" : "Tag activity Item",
                    "timestamp" : 1512229086187,
                    "type" : "pink"
                },
                {
                    "description" : "Tagger Activity",
                    "timestamp" : 1511883498051,
                    "type" : "yellow"
                },
                {
                    "description" : "Training Activity",
                    "timestamp" : 1511451509795,
                    "type" : "blue"
                },
                {
                    "description" : "Published Activity",
                    "timestamp" : 1511192318151,
                    "type" : "purple"
                },
                {
                    "description" : "Published Activity",
                    "timestamp" : 1511105927055,
                    "type" : "purple"
                },
                {
                    "description" : "Published Activity",
                    "timestamp" : 1510414734627,
                    "type" : "purple"
                },
                {
                    "description" : "Published Activity",
                    "timestamp" : 1509550743211,
                    "type" : "purple"
                }
            ],
            action: {
                "title": 'SHOW ALL',
                "click": function () {
                    console.log('I have been clicked');
                }
            }
        };

        $scope.menu = [
            [
                {
                    "title" : "Something",
                    "icon" : "fa-edit",
                    "class" : "",
                    "action" : function ( item ) {
                        alert("clicked on something\n." + JSON.stringify(item));
                    },
                    "if" : function ( item ) {
                        return false;
                    }
                },
                {
                    "title" : "Edit",
                    "icon" : "fa-edit",
                    "class" : "",
                    "action" : function ( item ) {
                        alert("clicked on edit\n." + JSON.stringify(item));
                    },
                }
            ], [
                {
                    "title" : "Delete",
                    "icon" : "fa-times",
                    "class" : "warning",
                    "action" : function ( item ) {
                        alert("clicked on edit\n." + JSON.stringify(item));
                    },
                    "disabled" : function () {
                        return !$scope.allowDeleteMenu;
                    }
                }
            ]
        ]

        function switchDataSet ( pillType, action ) {
            console.log('firing switch dataset');
            if ( pillType == 'table' ) {
                if ( action == 'static' ) {
                    $scope.table.rows = rawData;
                } else if ( action == 'async' ) {
                    $scope.table.rows = apiService.getTable
                }
            } else if ( pillType == 'cards' ) {
                if ( action == 'static' ) {
                    $scope.cards.data = cardData;
                } else if ( action == 'async' ) {
                    $scope.cards.data = apiService.getCards
                }
            } else {
                // do nothing...
            }
        }

        /* TABLE DATA */

        $scope.tablePill  = null;
        $scope.tablePills = [
            {
                "text": "Static",
                "click": function () {
                    switchDataSet( 'table', 'static' )
                }
            },
            {
                "text": "Async",
                "click": function () {
                    switchDataSet( 'table', 'async' )
                }
            }
        ];

        $scope.selectedRows = [];

        var rawData = [
            {
                "title" : {
                    "type" : "filamentui-dataset",
                    "data" : {
                        "title" : "Dataset Sample",
                        "description" : "This is a description of my dataset."
                    }
                },
                "timestamp" : {
                    "type" : "filamentui-date",
                    "data" : {
                        "timestamp" : 1511451509795
                    }
                },
                "progress" : {
                    "type" : "filamentui-progress",
                    "data" : {
                        "title": "X / Y Completed",
                        "progress" : 62
                    }
                }
            }
            // {
            //     "title" : {
            //         "type" : "filamentui-tagger",
            //         "data" : {
            //             "title" : "Tagger name",
            //             "description" : "This is a description of your tagger."
            //         }
            //     },
            //     "timestamp" : {
            //         "type" : "filamentui-date",
            //         "data" : {
            //             "timestamp" : 1509550743211
            //         }
            //     },
            //     "progress" : {
            //         "type" : "filamentui-progress",
            //         "data" : {
            //             "title": "X / Y Completed",
            //             "progress" : 12
            //         }
            //     }
            // },
            // {
            //     "title" : {
            //         "type" : "filamentui-tag",
            //         "data" : {
            //             "title" : "Tag name",
            //             "description" : "This is a tag and some description of it."
            //         }
            //     },
            //     "timestamp" : {
            //         "type" : "filamentui-date",
            //         "data" : {
            //             "timestamp" : 1512315473053
            //         }
            //     },
            //     "progress" : {
            //         "type" : "filamentui-progress",
            //         "data" : {
            //             "title": "X / Y Completed",
            //             "progress" : 79
            //         }
            //     }
            // },
            // {
            //     "title" : {
            //         "type" : "filamentui-dataset",
            //         "data" : {
            //             "title" : "Dataset Sample",
            //             "description" : "This is a description of my dataset."
            //         }
            //     },
            //     "timestamp" : {
            //         "type" : "filamentui-date",
            //         "data" : {
            //             "timestamp" : 1511152809795
            //         }
            //     },
            //     "progress" : {
            //         "type" : "filamentui-progress",
            //         "data" : {
            //             "title": "X / Y Completed",
            //             "progress" : 62
            //         }
            //     }
            // },
            // {
            //     "title" : {
            //         "type" : "filamentui-tagger",
            //         "data" : {
            //             "title" : "Tagger name",
            //             "description" : "This is a description of your tagger."
            //         }
            //     },
            //     "timestamp" : {
            //         "type" : "filamentui-date",
            //         "data" : {
            //             "timestamp" : 1600000000211
            //         }
            //     },
            //     "progress" : {
            //         "type" : "filamentui-progress",
            //         "data" : {
            //             "title": "X / Y Completed",
            //             "progress" : 12
            //         }
            //     }
            // },
            // {
            //     "title" : {
            //         "type" : "filamentui-tag",
            //         "data" : {
            //             "title" : "Tag name",
            //             "description" : "This is a tag and some description of it."
            //         }
            //     },
            //     "timestamp" : {
            //         "type" : "filamentui-date",
            //         "data" : {
            //             "timestamp" : 1600181110211
            //         }
            //     },
            //     "progress" : {
            //         "type" : "filamentui-progress",
            //         "data" : {
            //             "title": "X / Y Completed",
            //             "progress" : 79
            //         }
            //     }
            // },
            // {
            //     "title" : {
            //         "type" : "filamentui-tag",
            //         "data" : {
            //             "title" : "Tag name",
            //             "description" : "This is a tag and some description of it."
            //         }
            //     },
            //     "timestamp" : {
            //         "type" : "filamentui-date",
            //         "data" : {
            //             "timestamp" : 1512315473053
            //         }
            //     },
            //     "progress" : {
            //         "type" : "filamentui-progress",
            //         "data" : {
            //             "title": "X / Y Completed",
            //             "progress" : 79
            //         }
            //     }
            // },
            // {
            //     "title" : {
            //         "type" : "filamentui-dataset",
            //         "data" : {
            //             "title" : "Dataset Sample",
            //             "description" : "This is a description of my dataset."
            //         }
            //     },
            //     "timestamp" : {
            //         "type" : "filamentui-date",
            //         "data" : {
            //             "timestamp" : 1511152809795
            //         }
            //     },
            //     "progress" : {
            //         "type" : "filamentui-progress",
            //         "data" : {
            //             "title": "X / Y Completed",
            //             "progress" : 62
            //         }
            //     }
            // },
            // {
            //     "title" : {
            //         "type" : "filamentui-tagger",
            //         "data" : {
            //             "title" : "Tagger name",
            //             "description" : "This is a description of your tagger."
            //         }
            //     },
            //     "timestamp" : {
            //         "type" : "filamentui-date",
            //         "data" : {
            //             "timestamp" : 1600000000211
            //         }
            //     },
            //     "progress" : {
            //         "type" : "filamentui-progress",
            //         "data" : {
            //             "title": "X / Y Completed",
            //             "progress" : 12
            //         }
            //     }
            // },
            // {
            //     "title" : {
            //         "type" : "filamentui-tag",
            //         "data" : {
            //             "title" : "Tag name",
            //             "description" : "This is a tag and some description of it."
            //         }
            //     },
            //     "timestamp" : {
            //         "type" : "filamentui-date",
            //         "data" : {
            //             "timestamp" : 1600181110211
            //         }
            //     },
            //     "progress" : {
            //         "type" : "filamentui-progress",
            //         "data" : {
            //             "title": "X / Y Completed",
            //             "progress" : 79
            //         }
            //     }
            // }
        ];

        $scope.addRow = function () {
            console.log("adding row...");
            rawData.push (
                {
                    "title" : {
                        "type" : "filamentui-tag",
                        "data" : {
                            "title" : "Tag name " + new Date(),
                            "description" : "This is a tag and some description of it."
                        }
                    },
                    "timestamp" : {
                        "type" : "filamentui-date",
                        "data" : {
                            "timestamp" : 1512315473053
                        }
                    },
                    "progress" : {
                        "type" : "filamentui-progress",
                        "data" : {
                            "title": "X / Y Completed",
                            "progress" : 79
                        }
                    }
                }
            );
            $rootScope.$emit('refresh_table');
        }

        $scope.table = {
            "rows" : rawData,
            "cols" : [
                {
                    "title": "Description",
                    "width": "auto",
                    "key": "title",
                    "sorts": [ "A - Z", "Z - A" ],
                    "filters": [
                        {
                            "title": "Datasets",
                            "filter": {
                                "key": "title",
                                "value": "filamentui-dataset"
                            }
                        }
                    ]
                },
                {
                    "title": "Modified",
                    "width": "100px",
                    "key": "timestamp",
                    "sorts" : [ "Most Recent", "Oldest"]
                },
                {
                    "title": "Progress",
                    "width": "200px",
                    "key": "progress"
                    // "sorts" : [ "Most Complete", "Least Complete"]
                }
            ],
            "options": {
                "selectable" : true,
                "clickActionIndex" : 2
            },
            "actions" : [
                [
                    {
                        "title" : "Something",
                        "icon" : "fa-edit",
                        "class" : "",
                        "action" : function ( item ) {
                            alert("clicked on something\n." + JSON.stringify(item));
                        },
                        "if" : function ( item ) {
                            return false;
                        }
                    },
                    {
                        "title" : "Edit",
                        "icon" : "fa-edit",
                        "class" : "",
                        "action" : function ( item ) {
                            console.log("clicked on edit");
                            console.log(item);
                        },
                        "if" : function ( row ) {
                            return row.timestamp.data.timestamp > 1511395200000;
                        }
                    },
                    {
                        "title" : "Overview",
                        "icon" : "fa-edit",
                        "class" : "",
                        "action" : function ( item ) {
                            console.log("clicked on overview");
                            console.log(item);
                        }
                    },
                    {
                        "title" : "Edit Title",
                        "icon" : "fa-edit",
                        "class" : "",
                        "action" : function ( item ) {
                            console.log("clicked on edit title");
                            console.log(item);
                            item.title.data.title = 'rawr';
                            console.log(item);
                        }
                    }
                ], [
                    {
                        "title" : "Delete",
                        "icon" : "fa-times",
                        "class" : "warning",
                        "action" : function ( item ) {
                            console.log("clicked on delete");
                            console.log(item);
                        },
                        "disabled" : function ( row ) {
                            return row.timestamp.data.timestamp < 1511395200000;
                        }
                    }
                ]
            ]
        }

        $scope.expandableTable = {
          'rows': [],
          'cols': [
            {
              'title': 'Input',
              'width': 'auto',
              'key': 'input',
              'sorts': ['A - Z', 'Z - A']
            },
            {
              'title': 'Tags',
              'width': '300px',
              'key': 'tags',
              'sorts': ['A - Z', 'Z - A'],
              'sortFunction': function(item) {
                if (item.tags.data.tags.length) {
                  return item.tags.data.tags[0].name;
                } else {
                  return;
                }
              }
            },
            {
              'title': 'Timestamp',
              'width': '150px',
              'key': 'timestamp',
              'sorts': ['Most Recent', 'Oldest'],
              'sortFunction': function(item) {
                return -item.timestamp.data.timestamp; // the minus reverses the order
              }
            }
          ],
          'options': {
              expandable: true,
              selectable: true,
              multiple: true
            },
          'actions': [
            [
              {
                'title': 'Delete',
                'class': 'warning'
              }
            ]
          ]
        };

        var expandableTableData = [{"id":35,"trainedOn":false,"input":"hello world","createdAt":1522751470000,"deletedAt":null},{"id":36,"trainedOn":false,"input":"hello world","createdAt":1522854088,"deletedAt":null},{"id":37,"trainedOn":false,"input":"my name is anna","createdAt":1522759240000,"deletedAt":null}];

        $scope.expandableTable.rows = expandableTableData.map(function(d, i) {
            d.timestamp = {
              'type': 'filamentui-date',
              'data': {
                'timestamp': d.createdAt
              }
            };

            d.tags = {
              'type': 'filamentui-tags',
              'data': {
                'tags': [{
                  'name': i + ' todo',
                  'colour': '#f0ad4e'
                }]
              }
            };

            d.expandedContent = {
                'type': 'filamentui-table',
                'data': {
                    'rows': [
                        {'model': 'model 1'},
                        {'model': 'model 2'},
                        {'model': 'model 3'}
                    ],
                    'cols': [
                        {
                            'title': 'Model',
                            'width': 'auto',
                            'key': 'model'
                        }
                    ],
                    'options': {
                        'selectable': true,
                        'multiple': true,
                        'hideHeaders': true,
                        'hidePager': true
                    }
                }
            }

            return d;
        });

        $scope.disabledTableButton = function () {
            if ( $scope.selectedRows.length == 0 ) {
                return true;
            } else {
                return false;
            }
        }

        /* CARD DATA */

        $scope.cardPill  = null;
        $scope.cardPills = [
            {
                "text": "Static",
                "click": function () {
                    switchDataSet( 'cards', 'static' );
                }
            },
            {
                "text": "Async",
                "click": function () {
                    switchDataSet( 'cards', 'async' );
                }
            }
        ];

        var description = "This is a card description. This is a card description. This is a slightly different line. This is a card description. This is a card description. This is a card description.";

        var cardData = [
            {
                "name": "name text",
                "category": "api",
                "description": "This is a short description.",
                "modelTaggingType": null,
                "userFor": "Something",
                "averageRating": 5,
                "date": ( new Date().getSeconds() / 60 ) * 100,
                "inputNodes": "?",
                "modelNodes": "rawr",
                "outputNodes": "also ?",
                "calls": "testing",
                "numberOfNodes": 5,
                "cost": "234",
                "buttonText": "Use Card"
            },{
                "name": "name text",
                "category": "workflow",
                "description": description,
                "modelTaggingType": "SENTENCE",
                "userFor": "Something",
                "averageRating": 5,
                "date": ( new Date().getSeconds() / 60 ) * 100,
                "inputNodes": "?",
                "modelNodes": "rawr",
                "outputNodes": "also ?",
                "calls": "testing",
                "numberOfNodes": 5,
                "cost": "234",
                "buttonText": "Use Card"
            },
            {
                "name": "name text 2",
                "category": "workflow",
                "description": description,
                "modelTaggingType": "WORD",
                "userFor": "Something",
                "averageRating": 5,
                "date": ( new Date().getSeconds() / 60 ) * 100,
                "inputNodes": "?",
                "modelNodes": "rawr",
                "outputNodes": "also ?",
                "calls": "testing",
                "numberOfNodes": 5,
                "cost": "234",
                "buttonText": "Use Card"
            },{
                "name": "name text 2",
                "category": "workflow",
                "description": description,
                "modelTaggingType": "DOCUMENT",
                "userFor": "Something",
                "averageRating": 5,
                "date": ( new Date().getSeconds() / 60 ) * 100,
                "inputNodes": "?",
                "modelNodes": "rawr",
                "outputNodes": "also ?",
                "calls": "testing",
                "numberOfNodes": 5,
                "cost": "234",
                "buttonText": "Use Card"
            },
            {
                "name": "name text 2",
                "category": "workflow",
                "description": description,
                "modelTaggingType": "WORD",
                "userFor": "Something",
                "averageRating": 5,
                "date": ( new Date().getSeconds() / 60 ) * 100,
                "inputNodes": "?",
                "modelNodes": "rawr",
                "outputNodes": "also ?",
                "calls": "testing",
                "numberOfNodes": 5,
                "cost": "234",
                "buttonText": "Use Card"
            },{
                "name": "name text 2",
                "category": "workflow",
                "description": description,
                "modelTaggingType": "DOCUMENT",
                "userFor": "Something",
                "averageRating": 5,
                "date": ( new Date().getSeconds() / 60 ) * 100,
                "inputNodes": "?",
                "modelNodes": "rawr",
                "outputNodes": "also ?",
                "calls": "testing",
                "numberOfNodes": 5,
                "cost": "234",
                "buttonText": "Use Card"
            },
            {
                "name": "name text 2",
                "category": "workflow",
                "description": description,
                "modelTaggingType": "WORD",
                "userFor": "Something",
                "averageRating": 5,
                "date": ( new Date().getSeconds() / 60 ) * 100,
                "inputNodes": "?",
                "modelNodes": "rawr",
                "outputNodes": "also ?",
                "calls": "testing",
                "numberOfNodes": 5,
                "cost": "234",
                "buttonText": "Use Card"
            }
        ];

        $scope.cards = {
            "data": cardData,
            "actions": [
                [
                    {
                        "type": "card",
                        "action": function( model ) {
                            console.log('I am a card action');
                            console.log(model);
                        }
                    }
                ],
                [
                    {
                        "type": "add",
                        "action": function() {
                            console.log('I am an add action');
                        }
                    }
                ]
            ]
        }

        $scope.unpublishedCard = {
            "name": "name text",
            "category": "api",
            "description": "This is a short description.",
            "modelTaggingType": null,
            "userFor": "Something",
            "averageRating": 5,
            "date": ( new Date().getSeconds() / 60 ) * 100,
            "inputNodes": "?",
            "modelNodes": "rawr",
            "outputNodes": "also ?",
            "calls": "testing",
            "numberOfNodes": 5,
            "cost": "234",
            "buttonText": "Use Card"
        };

        $scope.wDocumentCard = {
            "name": "name text",
            "category": "workflow",
            "description": "This is a short description.",
            "modelTaggingType": "DOCUMENT",
            "userFor": "Something",
            "averageRating": 5,
            "date": ( new Date().getSeconds() / 60 ) * 100,
            "inputNodes": "?",
            "modelNodes": "rawr",
            "outputNodes": "also ?",
            "calls": "testing",
            "numberOfNodes": 5,
            "cost": "234",
            "buttonText": "Use Card"
        };

        $scope.wSentenceCard = {
            "name": "name text",
            "category": "workflow",
            "description": "This is a short description.",
            "modelTaggingType": "SENTENCE",
            "userFor": "Something",
            "averageRating": 5,
            "date": ( new Date().getSeconds() / 60 ) * 100,
            "inputNodes": "?",
            "modelNodes": "rawr",
            "outputNodes": "also ?",
            "calls": "testing",
            "numberOfNodes": 5,
            "cost": "234",
            "buttonText": "Use Card"
        };

        $scope.wWordCard = {
            "name": "name text",
            "category": "workflow",
            "description": "This is a short description.",
            "modelTaggingType": "WORD",
            "userFor": "Something",
            "averageRating": 5,
            "date": ( new Date().getSeconds() / 60 ) * 100,
            "inputNodes": "?",
            "modelNodes": "rawr",
            "outputNodes": "also ?",
            "calls": "testing",
            "numberOfNodes": 5,
            "cost": "234",
            "buttonText": "Use Card"
        };

        $scope.addCard = {
            "category": "add",
            "description": "New Placeholder Card"
        }

        $scope.roleCards = [
            {
                "createdAt": null,
                "deleted": false,
                "deletedAt": null,
                "description": "AnomalyDetection level",
                "id": 8,
                "name": "AnomalyDetection",
                "tag": "",
                "updatedAt": null,
                "heading": "THIS IS A HEADING",
                "cardText": "this is a description"
            },
            {
                "createdAt": null,
                "deleted": false,
                "deletedAt": null,
                "description": "Word level",
                "id": 9,
                "name": "Word Detection",
                "tag": "Word",
                "updatedAt": null,
                "heading": "THIS IS A HEADING",
                "cardText": "this is a description"
            },
            {
                "createdAt": null,
                "deleted": false,
                "deletedAt": null,
                "description": "Document level",
                "id": 10,
                "name": "Document Detection",
                "tag": "Document",
                "updatedAt": null,
                "heading": "THIS IS A HEADING",
                "cardText": "this is a description"
            }
        ];

        $scope.rcUnpublishedModel = {
            "createdAt": null,
            "deleted": false,
            "deletedAt": null,
            "description": "AnomalyDetection level",
            "id": 8,
            "name": "AnomalyDetection",
            "tag": "",
            "updatedAt": null,
            "heading": "THIS IS A HEADING",
            "cardText": "this is a description"
        };

        $scope.rcWordModel = {
            "createdAt": null,
            "deleted": false,
            "deletedAt": null,
            "description": "Word level",
            "id": 9,
            "name": "Word Detection",
            "tag": "Word",
            "updatedAt": null,
            "heading": "THIS IS A HEADING",
            "cardText": "this is a description"
        };

        $scope.rcDocumentModel = {
            "createdAt": null,
            "deleted": false,
            "deletedAt": null,
            "description": "Document level",
            "id": 10,
            "name": "Document Detection",
            "tag": "Document",
            "updatedAt": null,
            "heading": "THIS IS A HEADING",
            "cardText": "this is a description"
        };

        $scope.rcSentenceModel = {
            "createdAt": null,
            "deleted": false,
            "deletedAt": null,
            "description": "Sentence level",
            "id": 9,
            "name": "Sentence Detection",
            "tag": "Sentence",
            "updatedAt": null,
            "heading": "THIS IS A SENTENCE HEADING",
            "cardText": "this is a description, promise"
        };

        $scope.selectedRoleCard = [];
    }
]

);
