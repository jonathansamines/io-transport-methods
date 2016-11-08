'use strict';

const Hoek = require('hoek');
const Utils = require('./../utils');

const internals = {};

internals.removeEmptyDestinationRoutes = (route) => {
  return route.to.length > 0;
};

internals.routesCreation = (transportOptions, nodes) => {
  transportOptions.buffer = {
    destinations: [],
    originations: [],
  };

  return function createRoute(node) {
    const route = internals.lookupNodeReferences(nodes, node, null);
    let origination = null;
    let destination = null;

    if (route.isOrigination) {
      const isBufferApplied = route.from.input === 0;

      origination = {
        name: route.from.name,
        supply: route.from.input,
      };

      if (isBufferApplied) {
        transportOptions.buffer.originations.push(origination);
      }

      transportOptions.originations.push(origination);
    }

    if (route.isDestination) {
      const isBufferApplied = route.from.output === 0;

      destination = {
        name: route.from.name,
        demand: route.from.output,
      };

      if (isBufferApplied) {
        transportOptions.buffer.destinations.push(destination);
      }

      transportOptions.destinations.push(destination);
    }

    return {
      from: route.from.name,
      to: route.to,
    };
  };
};

internals.completeRoutes = (transportOptions) => {
  return function completeModel(route) {
    const destinations = [];

    for (const destination of transportOptions.destinations) {
      const foundDestination = route.to.find((d) => d.destination === destination.name);

      if (foundDestination) {
        destinations.push(foundDestination);
        continue;
      }

      destinations.push({
        destination: destination.name,
        cost: 0,
      });
    }

    route.to = destinations;

    return route;
  };
};

internals.lookupNodeReferences = (nodes, node, parent) => {
  const route = parent || {
    from: {
      name: node.name,
      output: node.output,
      input: node.input,
    },
    to: [],
    isOrigination: node.type === 'origin',
    isDestination: node.type === 'destination' || node.type === 'intermediary',
  };

  const referenced = route.to.filter((r) => r.destination === node.name);

  if (!parent && referenced.length > 0) {
    route.isDestination = true;
  }

  node.next.forEach((transbord) => {
    const reference = nodes.find((n) => n.name === transbord.reference);

    Hoek.assert(reference, `Node reference (${transbord.reference}) not found`);

    if (!parent) {
      route.to.push({
        destination: transbord.reference,
        cost: transbord.cost,
      });

      route.isOrigination = true;
    }

    internals.lookupNodeReferences(nodes, reference, route);
  });

  return route;
};

internals.lookupReferences = (nodes) => {
  const transportOptions = {
    originations: [], // all nodes which have links to other nodes or if type=origination
    destinations: [], // all nodes which are linked from another nodes or if type=destination
    routes: [], // all links
  };

  const totalOriginationAmount = Utils.sumByProperty(nodes, 'output');
  const totalDestinationAmount = Utils.sumByProperty(nodes, 'input');

  transportOptions.routes = nodes
    .map(internals.routesCreation(transportOptions, nodes))
    .filter(internals.removeEmptyDestinationRoutes)
    .map(internals.completeRoutes(transportOptions));

  const buffer = transportOptions.buffer;
  const bufferNumberDiff = buffer.destinations.length - buffer.originations.length;

  delete transportOptions.buffer;

  // more destinations than originations
  if (bufferNumberDiff >= 0) {
    buffer
      .originations
      .forEach((origination, index) => {
        const destination = buffer.destinations[index];

        destination.demand += totalDestinationAmount;
        origination.supply += totalOriginationAmount;
      });

    // compute the buffer values for the difference
    for (let idx = buffer.originations.length; idx < buffer.destinations.length; idx += 1) {
      // assign to any origination, since all originations are already covered
      const origination = buffer.originations[0] || transportOptions.originations[0];
      const destination = buffer.destinations[idx];

      destination.demand += totalDestinationAmount;
      origination.supply += totalOriginationAmount;
    }

  // more originations than destinations
  } else if (bufferNumberDiff < 0) {
    buffer
      .destinations
      .forEach((destination, index) => {
        const origination = buffer.originations[index];

        destination.demand += totalDestinationAmount;
        origination.supply += totalOriginationAmount;
      });

    // compute the buffer values for the difference
    for (let idx = buffer.destinations.length; idx < buffer.originations.length; idx += 1) {
      // assign to any destination, since all destinations are already covered
      const destination = buffer.destinations[0] || transportOptions.destinations[0];
      const origination = buffer.originations[idx];

      destination.demand += totalDestinationAmount;
      origination.supply += totalOriginationAmount;
    }
  }

  return transportOptions;
};

module.exports = {

  /**
   * Creates a valid transport model from the transbord model provided
   * @param  {Object} options
   * @return {Object}
   */
  create(options) {
    return internals.lookupReferences(options.nodes);
  },
};
