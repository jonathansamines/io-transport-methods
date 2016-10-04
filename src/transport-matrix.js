'use strict';

const Joi = require('joi');
const Hoek = require('hoek');

const internals = {
  transportMethods: ['minimumCost', 'northwestCorner'],
  matrixSchema: Joi.object().keys({
    completeMode: Joi.string()
      .allow('error', 'complete')
      .default('complete'),
  }),
};

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

internals.sumByProperty = (items, propertyName) => {
  return (items || []).reduce((sum, item) => {
    sum += item[propertyName] || 0;

    return sum;
  }, 0);
};

internals.completeTransportModel = (routes, destinations, originations) => {
  const demandSum = internals.sumByProperty(destinations, 'demand');
  const supplySum = internals.sumByProperty(originations, 'supply');

  // complete the missing supplies or demands
  if (demandSum > supplySum) {
    routes.push({
      from: 'origination-added',
      to: destinations.map((dest) => {
        return {
          destination: dest.name,
          cost: demandSum - supplySum,
        };
      }),
    });
  } else if (supplySum > demandSum) {
    routes.forEach((route) => {
      route.to.push({
        destination: 'destination-added',
        cost: supplySum - demandSum,
      });
    });
  }

  return routes;
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

  console.log(JSON.stringify(iterations));
};

module.exports = {

  /**
   * Creates a new transport-matrix using valid options from the transport-matrix factory
   */
  create(transportOptions) {
    /**
     * Resolve a given matrix options
     */
    return {
      resolveBy(transportMethod, options) {
        Hoek.assert(transportMethod, 'No transportMethod was specified.');
        Hoek.assert(
          internals.transportMethods.indexOf(transportMethod) !== -1,
          `The transportMethod(${transportMethod}) is invalid. Valid transport methods are [${internals.transportMethods.join(', ')}]`
        );

        const opts = Joi.attempt(options || {}, internals.matrixSchema, 'The transport options are invalid.');
        const transportParams = Hoek.clone(transportOptions);

        return internals.resolveByMinimumCost(transportParams, opts);
      },
    };
  },
};
