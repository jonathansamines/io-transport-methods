'use strict';

const expect = require('chai').expect;
const ioModule = require('./../src/index');

describe('the io module', () => {
  it('when imported has a single "transportMatrix" method', () => {
    expect(ioModule.transportMatrix).to.be.a.function;
  });

  describe('when the .transportMatrix method is called', () => {
    it('with no options, throws an error', () => {
      const transportFunction = () => ioModule.transportMatrix();

      expect(transportFunction).to.throw(Error, 'Invalid options provided');
    });

    it('with invalid options, throws an error', () => {
      const transportFunction = () => ioModule.transportMatrix({
        unknownProperty: 'any-thing',
      });

      expect(transportFunction).to.throw(Error, 'Invalid options provided');
    });

    it('with missing required options, throws an error', () => {
      const transportFunction = () => ioModule.transportMatrix({
        originations: [],
        destinations: [],
        supply: [],
        demand: [],
        // missing routes
      });

      expect(transportFunction).to.throw(Error, 'Invalid options provided');
    });

    it('with invalid routes options, throws an error', () => {
      const transportFunction = () => ioModule.transportMatrix({
        originations: [],
        destinations: [],
        supply: [],
        demand: [],
        routes: [
          {
            from: 'origination-1',
            to: 'destination',
            unknownProperty: 'hello',
          },
        ],
      });

      expect(transportFunction).to.throw(Error, 'Invalid options provided');
    });

    it('with a non-valid destination at routes.to, throws an error', () => {
      const transportFunction = () => ioModule.transportMatrix({
        originations: ['origination-1'],
        destinations: ['destination-1'],
        supply: [10],
        demand: [10],
        routes: [
          {
            from: 'origination-1',
            to: 'destination-2',
            cost: 200,
          },
        ],
      });

      expect(transportFunction).to.throw(Error, 'The destination specified at [routes[0].to=destination-2] is not valid. Valid destinations are [destination-1]');
    });

    it('with a non-valid origination at routes.from value, throws an error', () => {
      const transportFunction = () => ioModule.transportMatrix({
        originations: ['origination-1'],
        destinations: ['destination-1'],
        supply: [10],
        demand: [10],
        routes: [
          {
            from: 'origination-2',
            to: 'destination-1',
            cost: 200,
          },
        ],
      });

      expect(transportFunction).to.throw(Error, 'The origination specified at [routes[0].from=origination-2] is not valid. Valid originations are [origination-1]');
    });

    it('but the originations length is different than the supply length, throws an error', () => {
      const transportFunction = () => ioModule.transportMatrix({
        originations: ['origination-1'],
        destinations: ['destination-1'],
        supply: [10, 20],
        demand: [5],
        routes: [],
      });

      expect(transportFunction).to.throw(Error, 'The number of supply items is different than the originations provided.');
    });

    it('but the destinations length is different than the demand length, throws an error', () => {
      const transportFunction = () => ioModule.transportMatrix({
        originations: ['origination-1'],
        destinations: ['destination-1'],
        supply: [10],
        demand: [5, 10],
        routes: [],
      });

      expect(transportFunction).to.throw(Error, 'The number of demand items is different than the destinations provided.');
    });

    it('all options are correctly passed, returns a Transportmatrix object', () => {
      const matrix = ioModule.transportMatrix({
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

      expect(matrix).to.be.an('object');
      expect(matrix.resolveBy).to.be.a('function');
    });
  });
});
