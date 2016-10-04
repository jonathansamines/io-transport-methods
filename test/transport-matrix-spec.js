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

      describe('if all arguments are ok', () => {
        const scenarios = [
          {
            transportMethod: 'minimumCost',
            context: 'when the supply is equal to the demand',
            transportOptions: {
              originations: [
                {
                  name: 'origination-1',
                  supply: 15,
                },
                {
                  name: 'origination-2',
                  supply: 25,
                },
                {
                  name: 'origination-3',
                  supply: 5,
                },
              ],
              destinations: [
                {
                  name: 'destination-1',
                  demand: 5,
                },
                {
                  name: 'destination-2',
                  demand: 15,
                },
                {
                  name: 'destination-3',
                  demand: 15,
                },
                {
                  name: 'destination-4',
                  demand: 10,
                },
              ],
              routes: [
                {
                  from: 'origination-1',
                  to: [
                    {
                      destination: 'destination-1',
                      cost: 10,
                    },
                    {
                      destination: 'destination-2',
                      cost: 1,
                    },
                    {
                      destination: 'destination-3',
                      cost: 20,
                    },
                    {
                      destination: 'destination-4',
                      cost: 11,
                    },
                  ],
                },
                {
                  from: 'origination-2',
                  to: [
                    {
                      destination: 'destination-1',
                      cost: 12,
                    },
                    {
                      destination: 'destination-2',
                      cost: 7,
                    },
                    {
                      destination: 'destination-3',
                      cost: 9,
                    },
                    {
                      destination: 'destination-4',
                      cost: 20,
                    },
                  ],
                },
                {
                  from: 'origination-3',
                  to: [
                    {
                      destination: 'destination-1',
                      cost: 5,
                    },
                    {
                      destination: 'destination-2',
                      cost: 14,
                    },
                    {
                      destination: 'destination-3',
                      cost: 16,
                    },
                    {
                      destination: 'destination-4',
                      cost: 18,
                    },
                  ],
                },
              ],
            },
            expectedResult: {
              iterations: [
                [
                  {
                    summary: 360,
                    distribution: [
                      [
                        {
                          from: 'origination-1',
                          to: [
                            {
                              destination: 'destination-1',
                              units: 0,
                            },
                            {
                              destination: 'destination-2',
                              units: 15,
                            },
                            {
                              destination: 'destination-3',
                              units: 0,
                            },
                            {
                              destination: 'destination-4',
                              units: 0,
                            },
                          ],
                        },
                      ],
                      [
                        {
                          from: 'origination-2',
                          to: [
                            {
                              destination: 'destination-1',
                              units: 0,
                            },
                            {
                              destination: 'destination-2',
                              units: 0,
                            },
                            {
                              destination: 'destination-3',
                              units: 15,
                            },
                            {
                              destination: 'destination-4',
                              units: 10,
                            },
                          ],
                        },
                      ],
                      [
                        {
                          from: 'origination-3',
                          to: [
                            {
                              destination: 'destination-1',
                              units: 5,
                            },
                            {
                              destination: 'destination-2',
                              units: 0,
                            },
                            {
                              destination: 'destination-3',
                              units: 0,
                            },
                            {
                              destination: 'destination-4',
                              units: 0,
                            },
                          ],
                        },
                      ],
                    ],
                  },
                ],
              ],
              result: {
                summary: 360,
              },
            },
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
