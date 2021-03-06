app.service('ChartUtilsService', function() {
    var _ndx, _dataset;

    //c = user selected options

    var chartDefaults = {
        barChart: {
            margins: {
                top: 5,
                left: 20,
                right: 10,
                bottom: 60
            },
            centerBar: false, //'boolean'
            x: d3.scale.ordinal(),
            xUnits: dc.units.ordinal,
            title: function(d) { //{ /*Default to both, give option for either*/ }
                return [d.key, d.value].join(' : ');
            },
            // yAxisLabel: c.yAxis, // 'value'
            // xAxisLabel: c.xAxis, //'value'
            elasticY: true, //'value'
            gap: 5,
            renderHorizontalGridLines: true,
            renderlet: function(chart) {
                chart.selectAll('g.x text')
                    .attr('transform', 'translate(-15, 60)', 'rotate(270)')
            }
        },
        pieChart: {
            innerRadius: 0,
            slicesCap: 20,
            renderLabel: true,
            label: function(d) { //defaults to Key
                return d.key;
            },
            title: function(d) { //defaults to key : value
                return [d.key, d.value].join(' : ');
            }
        },
        lineChart: {
            transitionDuration: 500,
            mouseZoomable: false, //need to better understand
            margins: {
                top: 5,
                left: 20,
                right: 10,
                bottom: 10
            },
            elasticY: true,
            brushOn: false,
            title: function(d) { //{ /*Default to both, give option for either*/ }
                return [d.key, d.value].join(' : ');
            }
        },
        rowChart: {
            title: function(d) { //defaults to key : value
                return [d.key, d.value].join(' : ');
            },
            elasticX: true,
            gap: 10,
            margins: {
                top: 5,
                left: 10,
                right: 10,
                bottom: 20
            }
        },
        dataTable : {
            order: d3.ascending, //can be ascending and descending
            size: 500    //how many rows to display
        },
        dataCount : {
            html: {
                some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
                    ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'\'>Reset All</a>',
                all: 'All <strong>%total-count</strong> records selected.'
            }
        }
    }


    var configurePieChart = function(c) {
        let _currentDim = _createDimensionFromXAxisLabel(c)
        var pieOptions = _overWriteDefaults(c,'pieChart');

        pieOptions.dimension = _currentDim;
        pieOptions.group = _createGroup(c,_currentDim)

        pieOptions.radius = c.width < c.height ? c.width / 2 : c.height / 2,

        delete pieOptions.yAxis
        delete pieOptions.xAxis //xAxis and yAxis will break bar chart

        return pieOptions;
    };

    var configureBarChart = function(c) {
        var barOptions = _overWriteDefaults(c, 'barChart')

        let _currentDim = _createDimensionFromXAxisLabel(c, barOptions);
        let _currentGrp = _createGroup(c,_currentDim);

        barOptions.dimension = _currentDim;
        barOptions.group = _currentGrp; //<--- UGLY

        barOptions.xAxisLabel = c.xAxis;
        barOptions.yAxisLabel = c.yAxis;

        var maxXLength = _getMaxXAxisLabelLength(c,barOptions);
        var maxYLength = _getMaxYAxisLabelLength(c,barOptions);

        barOptions.renderlet = function(chart) {
            if(!barOptions.xAxisIsNumber) {
                //if is text/ ordinal
                chart.selectAll('g.x text')
                    .attr('transform', 'translate(-15,'+maxXLength*4.3+'), rotate(270)')
            } else {
                //if is numeric/ linear
                chart.selectAll('g.x text')
                    .attr('transform', 'translate(0,'+maxXLength*4.3+')')
                }
        }

        if (barOptions.xAxisIsNumber) barOptions.margins.bottom = maxXLength*20
        else barOptions.margins.bottom = maxXLength*10;
        barOptions.margins.left = maxYLength*15;

        barOptions = _configureXAxis(barOptions, _currentDim)
        barOptions = _configureGap(barOptions,_currentDim,'barChart')
        barOptions = _setColors(barOptions,_currentGrp);

        delete barOptions.yAxis
        delete barOptions.xAxis //xAxis and yAxis will break bar chart

        return barOptions;
    };

    var configureLineChart = function(c){
        var lineOptions = _overWriteDefaults(c,'lineChart')
        let _currentDim = _createDimensionFromXAxisLabel(c,lineOptions);

        lineOptions.dimension = _currentDim;
        lineOptions.group = _createGroup(c,_currentDim);
        lineOptions = _configureXAxis(lineOptions,_currentDim);
        lineOptions = _setColors(lineOptions);

        var maxXLength = _getMaxXAxisLabelLength(c,lineOptions);
        var maxYLength = _getMaxYAxisLabelLength(c,lineOptions);

        lineOptions.renderlet = function(chart) {
            if(!lineOptions.xAxisIsNumber) {
                //if is text/ ordinal
                chart.selectAll('g.x text')
                    .attr('transform', 'translate(-15,'+maxXLength*4.3+'), rotate(270)')
            } else {
                //if is numeric/ linear
                chart.selectAll('g.x text')
                    .attr('transform', 'translate(0,'+maxXLength*4.3+')')
                }
        }

        if (lineOptions.xAxisIsNumber) lineOptions.margins.bottom = maxXLength*20
        else lineOptions.margins.bottom = maxXLength*10;
        lineOptions.margins.left = maxYLength*15;

        delete lineOptions.yAxis;
        delete lineOptions.xAxis; //xAxis and yAxis will break bar chart
        return lineOptions;
    };

    var configureRowChart = function(c){
        var rowOptions = _overWriteDefaults(c,'rowChart')
        let _currentDim = _createDimensionFromXAxisLabel(c,rowOptions);

        rowOptions.dimension = _currentDim;
        rowOptions.group = _createGroup(c,_currentDim);
        rowOptions = _configureXAxis(rowOptions,_currentDim);
        rowOptions = _configureGap(rowOptions,_currentDim,'rowChart')
        rowOptions = _setColors(rowOptions);

        var maxXLength = _getMaxXAxisLabelLength(c,rowOptions);
        var maxYLength = _getMaxYAxisLabelLength(c,rowOptions);

        rowOptions.renderlet = function(chart) {
            if(!rowOptions.xAxisIsNumber) {
                //if is text/ ordinal
                chart.selectAll('g.x text')
                    .attr('transform', 'translate(-15,'+maxXLength*4.3+'), rotate(270)')
            } else {
                //if is numeric/ linear
                chart.selectAll('g.x text')
                    .attr('transform', 'translate(0,'+maxXLength*4.3+')')
                }
        }

        if (rowOptions.xAxisIsNumber) rowOptions.margins.bottom = maxXLength*20
        else rowOptions.margins.bottom = maxXLength*10;
        rowOptions.margins.left = maxYLength*15;

        delete rowOptions.yAxis;
        delete rowOptions.xAxis; //xAxis and yAxis will break bar chart
        return rowOptions;
    };

    var configureDataTable = function(c) {
        var chartOptions = _overWriteDefaults(c,'dataTable');
        let _currentDim = _createDimensionFromXAxisLabel(c,chartOptions);
        chartOptions.dimension = _currentDim;
        chartOptions.sortBy = function(d) {
            return d[c.yAxis];
        };

        chartOptions.group = function(d) {
            return d[c.xAxis]; //create a new header for grouped values
        };
        if (!chartOptions.columns) chartOptions.columns = Object.keys(_dataset[0]);

        //modify css:
        var tableContainer = d3.select(chartOptions.container)
            .attr('style', 'overflow: auto')
            .append('table')
                .attr('class', 'table table-hover table-condensed')  //http://getbootstrap.com/css/#tables-responsive
                .attr('id', 'dataTable-'+chartOptions.id)

        chartOptions.container = $('#dataTable-' + chartOptions.id)[0];

        delete chartOptions.yAxis;
        delete chartOptions.xAxis;
        return chartOptions;
    };

    var configureDataCount = function(c) {
        var chartOptions = _overWriteDefaults(c,'dataCount');
        chartOptions.group= _ndx.groupAll();
        chartOptions.dimension= _ndx;
        return chartOptions;
    };

    //REUSABLE HELPER METHODS:
    var _createGroup = function(c, _dim) {
        let grp;

        if (c.groupType === "sum") {
            grp = _dim.group().reduceSum(function(d) {
                if (_filterInt(d[c.yAxis]) !== -1) d[c.yAxis] = _filterInt(d[c.yAxis]);
                return Number(d[c.yAxis]);
            });
        } else if (c.groupType === "count") {
            grp = _dim.group().reduceCount(function(d) {
                if (_filterInt(d[c.yAxis]) !== -1) d[c.yAxis] = _filterInt(d[c.yAxis]);
                return d[c.yAxis];
            });
        }
        return grp;
    };

    var _filterInt = function (value) {
      if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
        return Number(value);
      return -1;
    };

    var _createDimensionFromXAxisLabel = function(c, chartOptions) {
        let xAxisIsNumber = false;
        var _dim = _ndx.dimension(function(d) {
            if (_filterInt(d[c.xAxis]) !==-1) {
                d[c.xAxis] = _filterInt(d[c.xAxis]);
                xAxisIsNumber = true;
            }
            return d[c.xAxis];
        });
        if (chartOptions) chartOptions.xAxisIsNumber = xAxisIsNumber;
        return _dim;
    };

    var _getMaxXAxisLabelLength = function(c,chartOptions){
        let maxLength = 0;
        _dataset.forEach(function(d) {
            if(d[c.xAxis].toString().length > maxLength) maxLength = d[c.xAxis].toString().length;
            return d[c.xAxis];
        });
        return maxLength;
    }

    var _getMaxYAxisLabelLength = function(c,chartOptions){
        let maxLength = 0;
        _dataset.forEach(function(d) {
            if(d[c.yAxis].toString().length > maxLength) maxLength = d[c.yAxis].toString().length;
            return d[c.yAxis];
        });

        return maxLength;
    }

    var _overWriteDefaults = function(c, chartType) {
        let _newConfigObj = chartDefaults[chartType]    //set required defaults
        for (var key in c) {
            //then overwrite defaults
            _newConfigObj[key] = c[key];
        }

        return _newConfigObj;
    }

    var _configureXAxis = function(chartOptions, _currentDim) {
        if (chartOptions.xAxisIsNumber) {
            var min = _currentDim.bottom(1)[0][chartOptions.xAxis];
            var max = _currentDim.top(1)[0][chartOptions.xAxis];
            chartOptions.x = d3.scale.linear().domain([min, max]);
            chartOptions.xUnits = dc.units.integers;
        }
        else {
            chartOptions.x = d3.scale.ordinal()
            chartOptions.xUnits = dc.units.ordinal;
        }
        return chartOptions;
    };

    //This function makes sure the gap size is not too big for the chart width or height depending on chart type
    var _configureGap = function(chartOptions, _currentDim, chartType){

        var heightOrWidth = {
            'rowChart': 'height',
            'barChart': 'width'
        }
        var size = _currentDim.group().size();
        if (chartOptions.gap * size >= chartOptions[heightOrWidth[chartType]]) {
                chartOptions.gap = chartOptions[heightOrWidth[chartType]] * .5 / size;
            }

        return chartOptions;
    }

    //Set colors, needs to be fleshed out
    var _setColors = function(chartOptions,_grp){
        let c = chartOptions.colorSettings;
        if(c){
            if(c.style === "solid"){


                chartOptions.colors = c.color;
            }else if(c.style === "theme"){
                chartOptions.colorAccessor = function(d,i){
                    return i;
                }
            }else if(c.style === "gradient"){
                var idx = _grp.all().length;
                var max = _grp.top(1)[0].value;
                var min = _grp.top(idx)[idx-1].value;
                var scale = d3.scale.linear()
                            .domain([min,max])
                            .range(['#887C7A',c.color])

                chartOptions.colors = scale;
                chartOptions.colorAccessor = function(d,i){
                    return d.value;
                }
            }else if(c.style ==="breakPoint"){
                var max = _grp.top(1)[0].value;
                var scale = d3.scale.linear()
                            .domain([0,1])
                            .range(['#887C7A','red'])

                chartOptions.colors = scale;
                chartOptions.colorAccessor = function(d,i){
                    return d.value > max-20 ? 1 : 0;
                }
            }
        }

        return chartOptions;
    }

    //PUBLIC METHODS:
    this.createChartOptions = function(config, ndx, dataset) {
        _ndx = ndx;
        _dataset = dataset;
        if (config.chartType === 'barChart') return configureBarChart(config);
        if (config.chartType === 'pieChart') return configurePieChart(config);
        if (config.chartType === 'dataTable') return configureDataTable(config);
        if (config.chartType === 'lineChart') return configureLineChart(config);
        if (config.chartType === 'rowChart') return configureRowChart(config);
        if (config.chartType === 'dataCount') return configureDataCount(config);
    }
});
