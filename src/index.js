'use strict';

const Joi = require('joi');
const Hoek = require('hoek');
const transportMatrixBuilder = require('./transport-matrix');

const internals = {};

internals.transportSchema = Joi.object().keys({
  originations: Joi.array().items(Joi.string()).required(),
  destinations: Joi.array().items(Joi.string()).required(),
  supply: Joi.array().required(),
  demand: Joi.array().required(),
  routes: Joi
    .array()
    .items(
      Joi.object().keys({
        from: Joi.string().required(),
        to: Joi.string().required(),
        cost: Joi.number().required(),
      })
    )
    .required(),
});

/**
 * Creates a validator, against which we can determine wether
 * the specified routes list has valid originations and destinations
 * @param  {Array} routes List of valid routes
 */
internals.createRoutesValidator = (routes) => {
  return (originations, destinations) => {
    routes.forEach((route, index) => {
      const origination = originations.find((orig) => orig === route.from);
      const destination = destinations.find((dest) => dest === route.to);

      Hoek.assert(
        origination,
        `The origination specified at [routes[${index}].from=${route.from}] is not valid. Valid originations are [${originations.join(', ')}]`
      );

      Hoek.assert(
        destination,
        `The destination specified at [routes[${index}].to=${route.to}] is not valid. Valid destinations are [${destinations.join(', ')}]`
      );
    });
  };
};

module.exports = {

  /**
   * Create the transport matrix logic structure,
   * capable of resolve for the best distribution.
   * @params {Object} options
   * @return {TransportMatrix} The transport matrix associated
   */
  transportMatrix: (options) => {
    const opts = Joi.attempt(options || {}, internals.transportSchema, 'Invalid options provided');
    const validateRoutes = internals.createRoutesValidator(opts.routes);

    Hoek.assert(opts.originations.length === opts.supply.length, `The number of supply items is different than the originations provided. [supply=${opts.supply.length}, originations=${opts.originations.length}]`);
    Hoek.assert(opts.destinations.length === options.demand.length, `The number of demand items is different than the destinations provided. [demand=${opts.demand.length}], destinations=${opts.destinations.length}]`);

    validateRoutes(opts.originations, opts.destinations);

    return transportMatrixBuilder.create(opts);
  },
};
