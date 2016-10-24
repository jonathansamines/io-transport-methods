'use strict';

const internals = {};

internals.computeObjectiveValue = (iteration) => {
  let zValue = 0;

  iteration.distribution.forEach((route) => {
    route.to.forEach((dest) => {
      zValue += dest.cost * dest.units;
    });
  });

  return zValue;
};

internals.recordOriginalOrdering = (routes) => {
  return routes.map((route, index) => {
    route.index = index;

    route.to.forEach((dest, idx) => {
      dest.index = idx;
    });

    return route;
  });
};

internals.restoreOrdering = (routes) => {
  return routes
    .sort((route1, route2) => route1.index - route2.index)
    .map((route) => {
      route.to
        .sort((dest1, dest2) => dest1.index - dest2.index)
        .forEach((dest) => delete dest.index);

      delete route.index;

      return route;
    });
};

internals.sumByProperty = (items, propertyName) => {
  return (items || []).reduce((sum, item) => {
    sum += item[propertyName] || 0;

    return sum;
  }, 0);
};

module.exports = internals;
