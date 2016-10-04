'use strict';

const Hoek = require('hoek');

const internals = {};

internals.sortByCheaperDestination = (destinations) => {
  return destinations.sort((dest1, dest2) => {
    return dest1.cost - dest2.cost;
  });
};

internals.sortByCheaperRoute = (routes) => {
  return routes.sort((route1, route2) => {
    const cheaperDest1 = internals.sortByCheaperDestination(route1.to);
    const cheaperDest2 = internals.sortByCheaperDestination(route2.to);

    return cheaperDest1[0].cost - cheaperDest2[0].cost;
  });
};

internals.resolveByMinimumCost = (options) => {
  const iterations = [];
  const destinations = options.destinations;
  const originations = options.originations;
  const routes = internals.completeTransportModel(
    Hoek.clone(options.routes)
  );
  const sortedRoutes = internals.sortByCheaperRoute(routes);

  let cheaperRoute = sortedRoutes[0];

  while (cheaperRoute !== undefined) {
    const iteration = {
      distribution: [],
      summary: 0,
    };

    const cheaperOrigination = cheaperRoute.from;
    let cheaperDestination = cheaperRoute.to[0];

    let route = iteration.distribution
      .find((r) => r.from === cheaperOrigination);

    if (route === undefined) {
      route = {
        from: cheaperOrigination,
        to: [],
      };

      iteration.distribution.push(route);
    }

    while (cheaperDestination !== undefined) {
      let unitsToAssign = 0;
      const origination = originations.find((orig) => orig.name === cheaperOrigination);
      const destination = destinations.find((dest) => dest.name === cheaperDestination.destination);

      const isEmptyOrigination = origination.supply <= 0;
      const isFulfilledDestination = destination.demand <= 0;

      if (isEmptyOrigination) {
        route.to.push({
          destination: destination.name,
          cost: cheaperDestination.cost,
          units: 0,
        });
      }

      if (isFulfilledDestination) {
        route.to.push({
          destination: destination.name,
          cost: cheaperDestination.cost,
          units: 0,
        });
      }

      if (origination.supply > destination.demand) {
        unitsToAssign = destination.demand;
        destination.demand = 0;
        origination.supply -= unitsToAssign;
      } else if (destination.demand >= origination.supply) {
        unitsToAssign = origination.supply;
        origination.supply = 0;
        destination.demand -= unitsToAssign;
      }

      route.to.push({
        destination: destination.name,
        cost: cheaperDestination.cost,
        units: unitsToAssign,
      });

      cheaperDestination = cheaperRoute.to.splice(0, 1)[0];
    }

    iterations.push(iteration);

    cheaperRoute = sortedRoutes.splice(0, 1)[0];
  }
};

module.exports = {
  resolve: internals.resolveByMinimumCost,
};
