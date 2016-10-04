'use strict';

const debug = require('debug')('transport-matrix/minimum-cost');

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

internals.computeObjectiveValue = (iteration) => {
  let zValue = 0;

  iteration.distribution.forEach((route) => {
    route.to.forEach((dest) => {
      zValue += dest.cost * dest.units;
    });
  });

  return zValue;
};

internals.resolveByMinimumCost = (options) => {
  debug('resolving transport model by minimum-cost');

  const iterations = [];
  const destinations = options.destinations;
  const originations = options.originations;
  const sortedRoutes = internals.sortByCheaperRoute(options.routes);

  let cheaperRoute = sortedRoutes.splice(0, 1)[0];
  const iteration = {
    distribution: [],
    summary: 0,
  };

  while (cheaperRoute !== undefined) {
    let cheaperDestination = cheaperRoute.to.splice(0, 1)[0];
    const cheaperOrigination = cheaperRoute.from;

    while (cheaperDestination !== undefined) {
      let unitsToAssign = 0;
      const origination = originations.find((orig) => orig.name === cheaperOrigination);
      const destination = destinations.find((dest) => dest.name === cheaperDestination.destination);

      // we need to verify if the current row still have assignable routes
      const isEmptyOrigination = origination.supply <= 0;
      const isFulfilledDestination = destination.demand <= 0;

      let assignedRoute = iteration
        .distribution
        .find((r) => r.from === origination.name);

      if (assignedRoute === undefined) {
        assignedRoute = {
          from: origination.name,
          to: [],
        };
        iteration.distribution.push(assignedRoute);
      }

      if (isEmptyOrigination) {
        debug('the origination (%s) is empty. no units can be assigned to destination (%s).', origination.name, destination.name);

        assignedRoute.to.push({
          destination: destination.name,
          cost: cheaperDestination.cost,
          units: 0,
        });

        cheaperDestination = cheaperRoute.to.splice(0, 1)[0];

        continue;
      }

      if (isFulfilledDestination) {
        debug('the destination (%s) has already been fulfilled. Not units can be assigned to origination (%s)', destination.name, origination.name);

        iteration.distribution.forEach((r) => {
          const dest = r.to.find((d) => d.destination === destination.name);

          if (dest) {
            // dest.cost = cheaperDestination.cost;
            // dest.units = 0;

            return;
          }

          r.to.push({
            destination: destination.name,
            cost: cheaperDestination.cost,
            units: 0,
          });
        });

        cheaperDestination = cheaperRoute.to.splice(0, 1)[0];
        continue;
      }

      debug('preparing the route units assignation for (origination=%s, destination=%s)', origination.name, destination.name);

      // assign the maximum amount of units to the current
      // route allowed by the origination/destination limitations
      if (origination.supply > destination.demand) {
        debug('the supply is higher than the demand. Supplying the overall demand.');

        unitsToAssign = destination.demand;
        destination.demand = 0;
        origination.supply -= unitsToAssign;
      } else if (destination.demand >= origination.supply) {
        debug('the demand is higher or equal than the supply. Supplying the overall capacity.');

        unitsToAssign = origination.supply;
        origination.supply = 0;
        destination.demand -= unitsToAssign;
      }

      assignedRoute.to.push({
        destination: destination.name,
        cost: cheaperDestination.cost,
        units: unitsToAssign,
      });

      cheaperDestination = cheaperRoute.to.splice(0, 1)[0];
    }

    iterations.push(iteration);

    cheaperRoute = sortedRoutes.splice(0, 1)[0];
  }

  iteration.summary = internals.computeObjectiveValue(iteration);

  console.log(JSON.stringify(iteration));

  return {
    iterations: [
      iteration,
    ],
    result: {
      summary: 0,
    },
  };
};

module.exports = {
  resolve: internals.resolveByMinimumCost,
};
