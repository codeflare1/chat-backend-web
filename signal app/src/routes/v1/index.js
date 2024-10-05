const express = require('express');
const bookingRoute = require('./booking.route');
const roomRoute = require('./room.route');
const propertyRoute = require('./property.route');
const businessRoute = require('./business.route');
const commonRoute = require('./common.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/booking',
    route: bookingRoute,
  },
  {
    path: '/business',
    route: businessRoute,
  },
  {
    path: '/room',
    route: roomRoute,
  },
  {
    path: '/property',
    route: propertyRoute,
  },
  {
    path: '/common',
    route: commonRoute,
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
