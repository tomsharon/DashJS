app.directive('createLinechart', function(WidgetFactory) {
    return {
        restrict: "E",
        templateUrl: 'js/common/directives/create-linechart/create-linechart.html',
        scope: {
            lineChartCollapsed: '=',
            form: '=',
            axisDropdowns: '=',
            colorOptions: '=',
            graphGroups: '=',
            currentChart: '='
        },
        link: function(scope, element, attrs) {
            scope.addGraphGroup = function() {
                var newGroup = 'Group' + (scope.graphGroups.options.length + 1);
                WidgetFactory.addGraphGroup(newGroup);
                scope.form.graphGroup = newGroup;
                scope.graphGroups.options = WidgetFactory.getGraphGroups();
            };

            if(scope.currentChart){
                scope.form.labelY = {key: scope.currentChart.yAxis};
                scope.form.labelX = {key: scope.currentChart.xAxis};
            }
        }
    }
})
