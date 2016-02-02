//https://github.com/ManifestWebDesign/angular-gridster/blob/master/demo/dashboard/script.js
app.controller('DashboardCtrl', function (loggedInUser, $scope, $timeout, GraphService, DashboardFactory, WidgetFactory){
    $scope.user = loggedInUser;

    $scope.dashboard = {};

    console.log($scope.dashboard);
    $scope.editMode = false;

    //TODO: MAke this dynamic, for now hardcoded:
    $scope.datasetId = "56af8e3b8c6e223906e3e12c";


    //tons of options: https://github.com/ManifestWebDesign/angular-gridster
    $scope.gridsterOptions = {
        margins: [12, 12],  //spacing between widgets
        columns: 12,        // min widget size
        draggable: {
            handle: '.box-header',    // optional if you only want a specific element to be the drag handle
            enabled: false
        },
        resizable:{
            enabled: false,
            stop: function(a,b,c){  //On resize stop, this call back fires (relabel a,b,c)
                GraphService.resize(c.id);
            }
            //handles: ['n', 'e', 's', 'w', 'se', 'sw']
        },
        maxSizeX: 6, // maximum column width of an item
        minSizeX: 2, // minimum column width of an item
        minSizeY: 2, // minimum column width of an item
        minRows: 2, // the minimum height of the grid, in rows

        mobileBreakPoint: 600, // if the screen is not wider that this, remove the grid layout and stack the items
        mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
    };

    $scope.data = GraphService.data;


    $scope.toggleEditMode = function() {
        $scope.editMode = !$scope.editMode;
        $scope.gridsterOptions.resizable.enabled = !$scope.gridsterOptions.resizable.enabled;
        $scope.gridsterOptions.draggable.enabled = !$scope.gridsterOptions.draggable.enabled;
    };

    // $scope.clear = function() {
    //     $scope.dashboard.widgets = [];
    // };

    $scope.addWidgetPlaceholder = function(widgetType) {
        console.dir($scope.dashboard);
        var newWidget = {
            //default widget settings
            id: $scope.dashboard.nextWidgetId,
            title: "New " + widgetType,
            type: widgetType,
            sizeX: widgetType === 'widget' ? 2 : 4,
            sizeY: widgetType === 'widget' ? 2 : widgetType === 'text' ? 1 : 4
        };
        $scope.dashboard.widgets.push(newWidget);
        $scope.dashboard.nextWidgetId = $scope.dashboard.nextWidgetId + 1;
        createWidget(newWidget);
    };

    var createWidget = function(newWidget) {
        newWidget.dashboard = $scope.dashboard._id;
        WidgetFactory.create(newWidget)
        .then(function(createdWidget){
            for(var i = 0; i < $scope.dashboard.widgets.length; i++) {
                if ($scope.dashboard.widgets[i].id === newWidget.id) {
                    $scope.dashboard.widgets[i] = createdWidget;
                }
            }

            console.log($scope.dashboard.widgets);
        });
    }

    $scope.updateDashboard = function() {
        DashboardFactory.update($scope.dashboard);
    }

    $scope.loadDashboard = function(){
        //temporary hardcoded. Should fetch it from Server:
        $scope.dashboard = {
            _id: '56af9be19b297822070ecfc4',
            dataset: '56af8e3b8c6e223906e3e12c',
            user: loggedInUser._id,
            title: 'My First Dashboard',
            widgets: [{
                id: 1,
                dashboard: '56af9be19b297822070ecfc4',
                // col: 0,
                // row: 0,
                sizeY: 2,
                sizeX: 2,
                title: "Widget 1",
                type: 'widget'
            }, {
                id: 2,
                dashboard: '56af9be19b297822070ecfc4',
                // col: 2,
                // row: 1,
                sizeY: 4,
                sizeX: 4,
                title: "Graph 2",
                type: 'graph'
            }]
        };
        $scope.dashboard.nextWidgetId = Math.max.apply(Math, $scope.dashboard.widgets.map(function(w){return w.id; }))+1;
    };


    // $scope.$watch('selectedDashboardId', function(newVal, oldVal) {
    //     if (newVal !== oldVal) {
    //         $scope.dashboard = $scope.dashboards[newVal];
    //     } else {
    //         $scope.dashboard = $scope.dashboards[1];
    //     }
    // });

    var loadDataset = function(datasetId) {

    }

    $scope.loadDashboard();

});
