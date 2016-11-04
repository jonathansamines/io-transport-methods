'use strict';

const debug = require('debug')('main');
const Joi = require('joi');
const Hoek = require('hoek');
const transportMatrixBuilder = require('./src/transport-matrix');
const transbordModelBuilder = require('./src/transbord-model');

const internals = {};

internals.routeSchema = Joi.object().keys({
  from: Joi.string().required(),
  to: Joi.array()
    .items(Joi.object().keys({
      destination: Joi.string().required(),
      cost: Joi.number().required(),
    }))
    .required(),
});

internals.transbordNodeSchema = Joi.object().keys({
  name: Joi.string().required(),
  type: Joi.string()
    .allow(['origin', 'destination', 'intermediary'])
    .required(),
  input: Joi.number().default(0),
  output: Joi.number().default(0),
  next: Joi.array()
    .items({
      reference: Joi.string().required(),
      cost: Joi.number().default(0),
    })
    .min(0),
});

internals.transbordSchema = Joi.object().keys({
  nodes: Joi.array()
    .items(internals.transbordNodeSchema)
    .required(),
});

internals.transportSchema = Joi.object().keys({
  originations: Joi.array()
    .items(Joi.object().keys({
      name: Joi.string().required(),
      supply: Joi.number().required(),
    }))
    .required(),
  destinations: Joi.array()
    .items(Joi.object().keys({
      name: Joi.string().required(),
      demand: Joi.number().required(),
    }))
    .required(),
  routes: Joi
    .array()
    .items(internals.routeSchema)
    .required(),
});

/**
 * Creates a validator, against which we can determine wether
 * the specified routes list has valid originations and destinations
 * @param  {Array} routes List of valid routes
 */
internals.createRoutesValidator = (routes) => {
  debug('creating routes validator (originations, destinations)');

  return (originations, destinations) => {
    const originationNames = originations.map((orig) => orig.name);
    const destinationNames = destinations.map((dest) => dest.name);

    routes.forEach((route, index) => {
      const origination = originations.find((orig) => orig.name === route.from);

      Hoek.assert(
        origination,
        `The origination specified at [routes[${index}].from=${route.from}] is not valid. Valid originations are [${originationNames.join(', ')}]`
      );

      route.to.forEach((dest) => {
        const destination = destinations.find((d) => d.name === dest.destination);

        Hoek.assert(
          destination,
          `The destination specified at [routes[${index}].to=${dest.destination}] is not valid. Valid destinations are [${destinationNames.join(', ')}]`
        );
      });
    });
  };
};

module.exports = {

  /**
   * Creates a valid transport matrix options object
   * @param  {Object} options
   * @return {Object}
   */
  transbordModel: (options) => {
    const opts = Joi.attempt(options, internals.transbordSchema, 'Invalid options provided');

    return transbordModelBuilder.create(opts);
  },

  /**
   * Create the transport matrix logic structure,
   * capable of resolve for the best distribution.
   * @params {Object} options
   * @return {TransportMatrix} The transport matrix associated
   */
  transportMatrix: (options) => {
    const opts = Joi.attempt(options || {}, internals.transportSchema, 'Invalid options provided');
    const validateRoutes = internals.createRoutesValidator(opts.routes);

    validateRoutes(opts.originations, opts.destinations);
    debug('routes validated, all originations/destinations references are valid.');

    return transportMatrixBuilder.create(opts);
  },
};
