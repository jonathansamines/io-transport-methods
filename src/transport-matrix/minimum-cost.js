'use strict';

const debug = require('debug')('transport-matrix/minimum-cost');
const Hoek = require('hoek');
const NorthWestCorner = require('./northwest-corner');
const Util = require('./../utils');

const internals = {};

internals.sortByCheaperDestination = (destinations) => {
  return destinations.sort((dest1, dest2) => (
    dest1.cost - dest2.cost
  ));
};

internals.sortByCheaperRoute = (routes) => {
  return routes.sort((route1, route2) => {
    const cheaperDest1 = internals.sortByCheaperDestination(route1.to);
    const cheaperDest2 = internals.sortByCheaperDestination(route2.to);

    return cheaperDest1[0].cost - cheaperDest2[0].cost;
  });
};

module.exports = {
  resolve: (opts) => {
    debug('resolving transport model by minimum-cost');

    const routes = Util.recordOrdering(opts.routes);
    const sortedRoutes = internals.sortByCheaperRoute(routes);
    const options = Hoek.applyToDefaults(opts, {
      routes: sortedRoutes,
    });

    // eslint-disable-next-line no-underscore-dangle
    const iteration = NorthWestCorner._resolve(options);

    iteration.distribution = Util.restoreOrdering(iteration.distribution);

    return {
      iterations: [
        [
          iteration,
        ],
      ],
      result: {
        summary: iteration.summary,
      },
    };
  },
};
