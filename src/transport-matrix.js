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
      },
    };
  },
};
