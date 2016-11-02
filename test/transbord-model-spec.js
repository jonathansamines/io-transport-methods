'use strict';

const expect = require('chai').expect;
const io = require('../src/index');
const transbordModelResult = require('./fixtures/transbord-model-result.json');

const options = {
  nodes: [
    {
      name: 'node-1',
      type: 'origin',
      input: 40,
      output: 0,
      next: [
        {
          reference: 'node-2',
          cost: 3,
        },
        {
          reference: 'node-3',
          cost: 5,
        },
        {
          reference: 'node-5',
          cost: 8,
        },
      ],
    },
    {
      name: 'node-2',
      type: 'intermediary',
      input: 0,
      output: 0,
      next: [
        {
          reference: 'node-4',
          cost: 3,
        },
      ],
    },
    {
      name: 'node-3',
      type: 'intermediary',
      input: 20,
      output: 0,
      next: [
        {
          reference: 'node-5',
          cost: 2,
        },
        {
          reference: 'node-4',
          cost: 2,
        },
      ],
    },
    {
      name: 'node-4',
      type: 'intermediary',
      input: 0,
      output: 10,
      next: [
        {
          reference: 'node-5',
          cost: 4,
        },
      ],
    },
    {
      name: 'node-5',
      type: 'destination',
      input: 0,
      output: 50,
      next: [],
    },
  ],
};

describe.only('the transbord model', () => {
  it('works as expected', () => {
    const result = io.transbordModel(options);
    console.log(JSON.stringify(result));

    const matrix = io.transportMatrix(result);

    const resulting = matrix.resolveBy('northwestCorner');

    console.log('');
    console.log(JSON.stringify(resulting));

    expect(resulting).to.be.deep.equal(transbordModelResult);
  });
});
