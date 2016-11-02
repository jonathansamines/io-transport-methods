'use strict';

const debug = require('debug')('transport-matrix/northwest-corner');
const Hoek = require('hoek');
const Util = require('./../utils');

const internals = {};

internals.resolveByNorthwestCorner = (options) => {
  const destinations = options.destinations;
  const originations = options.originations;
  const routes = options.routes;

  const iteration = {
    distribution: [],
    summary: 0,
  };

  let cheaperRoute = routes.splice(0, 1)[0];

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
          index: cheaperRoute.index,
          from: origination.name,
          to: [],
        };

        iteration.distribution.push(assignedRoute);
      }

      if (isEmptyOrigination) {
        debug('the origination (%s) is empty. no units can be assigned to destination (%s).', origination.name, destination.name);

        assignedRoute.to.push({
          index: cheaperDestination.index,
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
            return;
          }

          r.to.push({
            index: cheaperDestination.index,
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
        index: cheaperDestination.index,
        destination: destination.name,
        cost: cheaperDestination.cost,
        units: unitsToAssign,
      });

      cheaperDestination = cheaperRoute.to.splice(0, 1)[0];
    }

    cheaperRoute = routes.splice(0, 1)[0];
  }

  iteration.summary = Util.computeObjectiveValue(iteration.distribution);

  return iteration;
};

module.exports = {
  _resolve: (options) => {
    const opts = Hoek.clone(options);

    return internals.resolveByNorthwestCorner(opts);
  },

  resolve(options) {
    debug('resolving by northwest-corner method');

    const opts = Hoek.clone(options);
    const iteration = internals.resolveByNorthwestCorner(opts);

    iteration.distribution = Util.clearOrdering(iteration.distribution);

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
