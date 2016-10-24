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

        expect(resolveByFunction).to.throw(Error, 'No transport method was specified.');
      });

      it('throws an error if an invalid transportMethod is specified', () => {
        const resolveByFunction = () => transportMatrix.resolveBy('invalidMethod');

        expect(resolveByFunction).to.throw(Error, 'The transport method(invalidMethod) is invalid. Valid transport methods are [minimumCost, northwestCorner]');
      });

      describe('if all arguments are ok', () => {
        const scenarios = [
          {
            transportMethod: 'minimumCost',
            context: 'when all data is valid',
            transportOptions: require('./fixtures/original-matrix.json'),
            expectedResult: require('./fixtures/minimum-cost-result.json'),
          },
          {
            transportMethod: 'northwestCorner',
            context: 'when all data is valid',
            transportOptions: require('./fixtures/original-matrix.json'),
            expectedResult: require('./fixtures/northwest-corner-result.json'),
          },
        ];

        scenarios.forEach((scenario) => {
          it(`resolves the matrix by the "${scenario.transportMethod}" transport method ${scenario.context}`, () => {
            const matrix = transportMatrixBuilder.create(scenario.transportOptions);
            const output = matrix.resolveBy(scenario.transportMethod);

            expect(output).to.be.deep.equal(scenario.expectedResult);
          });
        });
      });
    });
  });
});
