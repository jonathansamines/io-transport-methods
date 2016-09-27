'use strict';

const expect = require('chai').expect;
const transportMatrixBuilder = require('./../src/transport-matrix');

describe('the transport-matrix module', () => {
  describe('has its expected public api', () => {
    it('has the create method', () => {
      expect(transportMatrixBuilder).to.be.an('object');
      expect(transportMatrixBuilder.create).to.be.a('function');
    });

    it('creates a new matrix when called', () => {
      const matrix = transportMatrixBuilder.create();
      expect(matrix).to.be.an('object');
    });
  });

  describe('for the .resolveBy method', () => {
    let transportMatrix;

    beforeEach(() => {
      transportMatrix = transportMatrixBuilder.create({
        originations: ['origination-1'],
        destinations: ['destination-1'],
        supply: [10],
        demand: [10],
        routes: [
          {
            from: 'origination-1',
            to: 'destination-1',
            cost: 100,
          },
        ],
      });
    });

    describe('when called', () => {
      it('throws an error if no tranportMethod is specified', () => {
        const resolveByFunction = () => transportMatrix.resolveBy();

        expect(resolveByFunction).to.throw(Error, 'No transportMethod was specified.');
      });

      it('throws an error if an invalid transportMethod is specified', () => {
        const resolveByFunction = () => transportMatrix.resolveBy('invalidMethod');

        expect(resolveByFunction).to.throw(Error, 'The transportMethod(invalidMethod) is invalid. Valid transport methods are [minimumCost, northwestCorner]');
      });

      it('options are optional, completeMode set to "complete" when is not defined', () => {
        const resolveByFunction = () => transportMatrix.resolveBy('minimumCost');

        expect(resolveByFunction).to.not.throw(Error, 'The transport options are invalid.');
      });
    });
  });
});
