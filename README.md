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
  - `originations` - an array of originations, each origination is a *string*. **Required**
  - `destinations` - an array of destinations, each destination is a *string* **Required**
  - `supply` - an array of supply units. The number of items, has to be equal to the items number defined in `originations`. An error is throw if that condition is not accomplished. **Required**
  - `demand` - an array of overall demand. The number of items, has to be equal to the items number defined in `destinations`. An error is throw if that condition is not accomplished. **Required**
  - `routes` - an array of items which identify the cost of a given route (**from** a `origination` **to** a `destination`). **Required**
    - `from` - a valid origination name. Any string previously specified at the `originations` array. **Required**
    - `to` - a valid destination name. Any string previously specified at the `destinations` array. **Required**
    - `cost` - a valid number specifying the route cost.

### TransportMatrix
It represents the logic form of the transport method. Has the ability to compute the best supply/demand distribution based on the *transport method** specified.

#### `transportMatrix.resolveBy(transportMethod, options)`

+ `transportMethod` - any of the allowed transport methods: [`minimumCost`, `northwestCorner`]
+ `options`
  - `completeMode` - any of the following values: `error` to throw if the destinations/originations array have not the same length. `complete` to indicate the matrix to compute the missing values on either the destination or origination with the remaining units. Default to `complete`.

### Usage

```js
  'use strict';

  const io = require('io-transport-methods');

  const matrix = io.transportMatrix({
    originations: [
      'origination-1',
      'origination-2'
    ],
    destinations: [
      'destination-1',
      'destination-2'
    ],
    supply: [10, 20],
    demand: [15, 5],
    costMatrix: [
      {
        from: 'origination-1',
        to: 'destination-1',
        cost: 20
      },
      {
        from: 'origination-1',
        to: 'destination-2',
        cost: 10
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
