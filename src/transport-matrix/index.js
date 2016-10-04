'use strict';

const Joi = require('joi');
const Hoek = require('hoek');
const minimumCost = require('./minimum-cost');

const internals = {
  transportMethods: ['minimumCost', 'northwestCorner'],
  matrixSchema: Joi.object().keys({
    completeMode: Joi.string()
      .allow('error', 'complete')
      .default('complete'),
  }),
};

internals.completeTransportModel = (routes, destinations, originations) => {
  const demandSum = internals.sumByProperty(destinations, 'demand');
  const supplySum = internals.sumByProperty(originations, 'supply');

  if (demandSum > supplySum) {
    // add missing origination
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
    // add missing destinations to each origination
    routes.forEach((route) => {
      route.to.push({
        destination: 'destination-added',
        cost: supplySum - demandSum,
      });
    });
  }

  return routes;
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

        return minimumCost.resolve(transportParams, opts);
      },
    };
  },
};
