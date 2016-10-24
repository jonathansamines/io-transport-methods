'use strict';

const debug = require('debug')('transport-matrix');
const Hoek = require('hoek');
const Util = require('./../utils');
const minimumCost = require('./minimum-cost');
const northwestCorner = require('./northwest-corner');

const internals = {
  transportResolvers: {
    minimumCost,
    northwestCorner,
  },
};

/**
 * Given a set of routes, destinations and originations
 * completes the transport model by adding the missing destinations or originations
 * based on the demand/supply requirements
 * @param  {Array} model.routes
 * @param  {Array} model.destinations
 * @param  {Array} model.originations
 * @return {Array} The array of routes, with either the missing destinations or originations added
 */
internals.completeTransportModel = (model) => {
  debug('transport model completion process started');

  const demandSum = Util.sumByProperty(model.destinations, 'demand');
  const supplySum = Util.sumByProperty(model.originations, 'supply');

  if (demandSum > supplySum) {
    debug('the demand is higher than the supply capacity (demand=%s, supply%s)', demandSum, supplySum);
    debug('adding an additional origination');

    const originationName = 'origination-added';

    model.originations.push({
      name: originationName,
      supply: demandSum - supplySum,
    });

    model.routes.push({
      from: originationName,
      to: model.destinations.map((dest) => {
        return {
          destination: dest.name,
          cost: 0,
        };
      }),
    });
  } else if (supplySum > demandSum) {
    debug('the supply is higher than the total demand (demand=%s, supply%s)', demandSum, supplySum);
    debug('adding an additional destination');

    const destinationName = 'destination-added';

    model.destinations.push({
      name: destinationName,
      demand: supplySum - demandSum,
    });

    model.routes.forEach((route) => {
      route.to.push({
        destination: 'destination-added',
        cost: 0,
      });
    });
  }

  return {
    destinations: model.destinations,
    originations: model.originations,
    routes: model.routes,
  };
};

module.exports = {

  /**
   * Creates a new transport-matrix using valid options from the transport-matrix factory
   */
  create(options) {
    debug('creating transport-matrix with options: ', options);

    /**
     * Resolve a given matrix options
     * @param {String} transportMethod One of the following (northwestCorner, minimumCost)
     */
    return {
      resolveBy(transportMethod) {
        const transportMethods = Object.keys(internals.transportResolvers);
        Hoek.assert(transportMethod, 'No transportMethod was specified.');
        Hoek.assert(
          transportMethods.indexOf(transportMethod) !== -1,
          `The transportMethod(${transportMethod}) is invalid. Valid transport methods are [${transportMethods.join(', ')}]`
        );

        const resolver = internals.transportResolvers[transportMethod];
        const transportOptions = internals.completeTransportModel(
          Hoek.clone(options)
        );

        return resolver.resolve(transportOptions);
      },
    };
  },
};
