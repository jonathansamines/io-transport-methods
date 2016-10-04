# IO Transport Methods
A simple algorithmic implementation of some of the most common IO transport methods.

```bash
  $ npm install --save io-transport-methods
```

## API
The public API is as follows:

### `io.transportMatrix(options)`
Describes the complete transport matrix, as specified by the *IO transport methods* specification. The generated matrix can be computed by any of the allowed transport methods. Returns a **TransportMatrix**

+ `options`
  - `originations` - an array of originations, each origination is an *object* with the following schema.
    - `name` - the origination name. **Required**
    - `supply` - the supply units available. **Required**
  - `destinations` - an array of destinations, each destination is an *object* with the following schema.
    - `name` - the destination name. **Required**
    - `demand` - the demand units. **Required**
  - `routes` - an array of items which identify the cost of a given route (**from** a `origination` **to** a `destination`).
    - `from` - a valid origination name. Any string previously specified at the `originations` array. **Required**
    - `to` - an array with valid destinations.
      - `destination` - a valid destination name. Any string previously specified at the `destinations` array. **Required**
      - `cost` - a valid number specifying the route cost. **Required**

#### About the model
If the transport model is not considered complete (the overall supply is different from the overall demand), additional destinations or originations are added as needed.

### TransportMatrix
It represents the logic form of the transport method. Has the ability to compute the best supply/demand distribution based on the **transport method** specified.

#### `transportMatrix.resolveBy(transportMethod, options)`

+ `transportMethod` - any of the allowed transport methods: [`minimumCost`, `northwestCorner`]

### Usage

```js
  'use strict';

  const io = require('io-transport-methods');

  const matrix = io.transportMatrix({
    originations: [
      {
        name: 'origination-1',
        supply: 10,
      },
      {
        name: 'origination-2',
        supply: 20,
      },
    ],
    destinations: [
      {
        name: 'destination-1',,
        demand: 15,
      },
      {
        name: 'destination-2',
        demand: 5,
      },
    ],
    routes: [
      {
        from: 'origination-1',
        to: [
          {
            destination: 'destination-1',
            cost: 20,
          }
        ]
      },
      {
        from: 'origination-1',
        to: [
          {
            destination: 'destination-2',
            cost: 10,
          },
        ]
      }
    ],
  });

  matrix
    .resolveBy('minimumCost', {
      completeMode: 'complete',
    })
    .resolveBy('northwestCorner', {
      completeMode: 'throw',
    });

  // =>
  // {
  //   iterations: [
  //     [
  //       {
  //         from: 'origination-1',
  //         to: 'destination-1',
  //         cost: 20,
  //         units: 5
  //       },
  //       {
  //         from: 'origination-1',
  //         to: 'destination-2',
  //         cost: 10,
  //         units: 10
  //       }
  //     ],
  //     [
  //       {
  //         from: 'origination-2',
  //         to: 'destination-1',
  //         cost: 20,
  //         units: 0
  //       },
  //       {
  //         from: 'origination-2',
  //         to: 'destination-2',
  //         cost: 10,
  //         units: 0
  //       }
  //     ]
  //   ],
  //   result: {
  //     summary: 15.0,
  //     matrix: [
  //       // resulting matrix
  //     ]
  //   }
  // }
```
