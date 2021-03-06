'use strict'

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var Dashboard = mongoose.model('Dashboard');
var Widget = mongoose.model('Widget');
var router = require('express').Router();
module.exports = router;
var routeUtility = require('../route-utilities.js');
var phantomSecret = process.env.PHANTOM_SECRET;


var phantomAuthenticated = function(req){
    return req.phantom === phantomSecret;
}

var ensureAuthenticated = function (req, res, next) {
    if (req.isAuthenticated() || phantomAuthenticated(req)) {
        next();
    } else {
        res.status(401).send("You are not authenticated");
    }
};


// /api/dashboards/?filterCriteria=XYZ
router.get("/", function (req, res, next) {
	return Dashboard.find(req.query).deepPopulate("user dataset originalDashboard originalDashboard.user")
	.then(allDashboards => {
        var respArr = allDashboards.filter(dashboard => dashboard.isPublic);
        if(req.user) {
            respArr.concat(allDashboards.filter(dashboard => dashboard.user._id.toString() === req.user._id.toString()));
        }
		//send the dashboard if it is public OR if it belongs to the user requesting it
        res.status(200).send(respArr)
    })
	.then(null, function(err) {
        console.error(err);
        err.message = "^ Something went wrong when trying to access these dashboards";
        next(err);
    });
});

// /api/dashboards/id
router.get("/:id", function(req, res, next) {
	Dashboard.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('dataset', 'title lastUpdated fileType')
		.then(function(dashboard){
            if (req.headers['user-agent'].includes("PhantomJS")) {
                dashboard.getWidgets()
                .then(function(widgets){
                    var myDash = dashboard.toJSON();
                    myDash['widgets'] = widgets;
                    res.status(201).send(myDash);
                });
            }
            else {
                var giveAccess = false;
                if (req.user) {
                     if(dashboard.user._id.toString() === req.user._id.toString()) giveAccess = true;
                }
                if (dashboard.isPublic || giveAccess){
                    dashboard.getWidgets()
                    .then(function(widgets){
                        var myDash = dashboard.toJSON();
                        myDash['widgets'] = widgets;
                        res.status(201).send(myDash);
                    });
                }
                else res.status(401).send("You are not authorized to view this dashboard");
            }
        })
		.then(null, function(err) {
            console.error(err);
            err.message = "Something went wrong when trying to access this dashboard";
            next(err);
        });
});

// Route to create a new dashboard in MongoDB
// POST /api/dashboards
router.post("/", ensureAuthenticated, function(req, res, next) {
    Dashboard.create(req.body)
    .then(createdDashboard => res.status(201).send(createdDashboard))
    .then(null, function(err) {
        err.message = "Something went wrong when trying to create this dashboard";
        next(err);
    });
});

// Route to udpate an existing dashboard in MongoDB
// PUT /api/dashboards/:dashboardId
router.put("/:id", ensureAuthenticated, function(req, res, next) {
    Dashboard.findByIdAndUpdate(req.params.id, req.body)
    .then(originalDashboard => {
        return Dashboard.findById(originalDashboard._id);
    })
    .then(updatedDashboard => {
        res.status(200).json(updatedDashboard);
    })
    .then(null, function(err) {
        err.message = "Something went wrong when trying to update this dashboard";
        next(err);
    });
});

// Route to delete an existing dashboard in MongoDB
// DELETE /api/dashboards/:dashboardId
router.delete("/:id", ensureAuthenticated, function(req, res, next) {
    Dashboard.findById(req.params.id)
    .then(dashboard => {
        if (!routeUtility.searchUserEqualsRequestUser(dashboard.user, req.user)) res.status(401).send("You are not authorized to access this dashboard");
        return dashboard.remove();
    })
    .then(dashboard => {
        res.status(200).send(dashboard);
    })
    .then(null, function(err) {
        err.message = "Something went wrong when trying to delete this dashboard";
        next(err);
    });
});

// /api/dashboards/id/widgets
router.get("/:id/widgets", function (req, res, next) {
    Widget.find({ dashboard: req.params.id })
    .then(widgets => res.status(201).send(widgets))
    .then(null, function(err) {
        err.message = "Something went wrong when trying to access this widget";
        next(err);
    });
});

// Route to fork another user's dashboard
// POST /api/dashboards/:dashboardId/fork
router.post("/:dashboardId/fork", ensureAuthenticated, function(req, res, next) {
    // Create a dashboard for the new user
    var dashboardToFork = req.body,
    dashboardToForkId = dashboardToFork._id,
    forkedDashboard,
    clonedWidgets = [];

    // Make sure the dashboard being forked is public
    if (!dashboardToFork.isPublic) res.status(401).send("You are not authorized to access this dashboard");

    // Cleanse the original dashboard so a fresh one can be created in Mongo
    delete dashboardToFork._id;
    delete dashboardToFork.__v;
    dashboardToFork.user = req.user._id;

    // Create a new dashboard in mongo
    Dashboard.create(dashboardToFork)
    .then(forkedDashboardFromMongo => {
        forkedDashboard = forkedDashboardFromMongo;
        // Find the widgets associated with the forked dashboard
        return Widget.find({ dashboard: dashboardToForkId });
    })
    .then(widgetsToClone => {
        // Create "cleansed" copies of all associated widgets
        widgetsToClone.forEach(widgetToClone => {
            let clonedWidget = Object.assign({}, widgetToClone.toJSON());
            delete clonedWidget._id;
            delete clonedWidget.__v;
            clonedWidget.user = req.user._id;
            clonedWidget.dashboard = forkedDashboard._id;
            clonedWidgets.push(clonedWidget);
        });
        return Widget.create(clonedWidgets);
    })
    .then(forkedWidgets => {
        res.status(201).json(forkedDashboard);
    })
    .then(null, function(err) {
        err.message = "Something went wrong when trying to fork this dashboard";
        next(err);
    });
});
