# Lineal Programming Transport Methods
A simple algorithmic implementation of some of the most common lineal programming transport methods and transportation models.

```bash
  $ npm install --save transport-methods
```

## API
The public API is as follows:

### `io.transbordModel(options)`
Describes a transbord model from which a valid equivalent transport model can be computed. Returns a valid configuration for **transport matrix**.

#### Options
- `nodes[]` - a node array composing the transbord network.
  - `name` - identifier to reference to when linking nodes. **Required**
  - `type` - any of the following (`origin`, `destination`, `intermediary`). **Required**
  - `input` - the whole throughput coming to this node. **Required**
  - `output` - the whole throughput coming out from this node. **Required**
  - `next[]` - an array of references to other nodes
    - `reference` another node identifier to reference. **Required**
    - `cost` the cost of transbording the current node output to the referenced node input. **Required**

### `io.transportMatrix(options)`
Describes the complete transport matrix, as specified by the *lineal programming transport methods* specification. The generated matrix can be computed by any of the allowed transport methods. Returns a **TransportMatrix**

#### `options`
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

#### `transportMatrix.resolveBy(transportMethod)`

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
    .resolveBy('minimumCost');

    // {
    //   "summary":360,
    //   "distribution":[
    //     {
    //       "from":"origination-1",
    //       "to":[
    //         {
    //           "destination":"destination-1",
    //           "cost":10,
    //           "units":0
    //         },
    //         {
    //           "destination":"destination-2",
    //           "cost":1,
    //           "units":15
    //         },
    //         {
    //           "destination":"destination-3",
    //           "cost":20,
    //           "units":0
    //         },
    //         {
    //           "destination":"destination-4",
    //           "cost":11,
    //           "units":0
    //         }
    //       ]
    //     },
    //     {
    //       "from":"origination-2",
    //       "to":[
    //         {
    //           "destination":"destination-1",
    //           "cost":12,
    //           "units":0
    //         },
    //         {
    //           "destination":"destination-2",
    //           "cost":7,
    //           "units":0
    //         },
    //         {
    //           "destination":"destination-3",
    //           "cost":9,
    //           "units":15
    //         },
    //         {
    //           "destination":"destination-4",
    //           "cost":20,
    //           "units":10
    //         }
    //       ]
    //     },
    //     {
    //       "from":"origination-3",
    //       "to":[
    //         {
    //           "destination":"destination-1",
    //           "cost":2,
    //           "units":5
    //         },
    //         {
    //           "destination":"destination-2",
    //           "cost":14,
    //           "units":0
    //         },
    //         {
    //           "destination":"destination-3",
    //           "cost":16,
    //           "units":0
    //         },
    //         {
    //           "destination":"destination-4",
    //           "cost":18,
    //           "units":0
    //         }
    //       ]
    //     }
    //   ]
    // }

  ```
