const fc = require('fast-check');

const { subtotal } = require('../../src/subtotal');
const { discounts } = require('../../src/discounts');
const { total } = require('../../src/total');
const { tax } = require('../../src/tax');
const { delivery } = require('../../src/delivery');

// These arbitrary generators provide primitive building blocks for constructing orders and contexts in property-based tests
//
// To learn more about primitives: https://fast-check.dev/docs/core-blocks/arbitraries/primitives
// To learn more about combiners: https://fast-check.dev/docs/core-blocks/arbitraries/combiners
const skuArb = fc.constantFrom('P6-POTATO', 'P12-POTATO', 'P24-POTATO', 'P6-SAUER', 'P12-SAUER');
const addOnArb = fc.constantFrom('sour-cream', 'fried-onion', 'bacon-bits');
const fillingArb = fc.constantFrom('potato', 'sauerkraut', 'sweet-cheese', 'mushroom');
const kindArb = fc.constantFrom('hot', 'frozen');
const tierArb = fc.constantFrom('guest', 'regular', 'vip');
const zoneArb = fc.constantFrom('local', 'outer');
const couponCodeArb = fc.constantFrom('PIEROGI-BOGO', 'FIRST10', null);

const orderItemArb = fc.record({
  kind: kindArb,
  sku: skuArb,
  title: fc.string(),
  filling: fillingArb,
  qty: fc.constantFrom(6, 12, 24),
  unitPriceCents: fc.integer({ min: 500, max: 3000 }),
  addOns: fc.array(addOnArb, { maxLength: 3 })
});

const orderArb = fc.record({ items: fc.array(orderItemArb, { minLength: 1, maxLength: 5 }) });
const profileArb = fc.record({ tier: tierArb });

// ------------------------------------------------------------------------------
// To test discounts, tax, delivery and total, you will need to add more
// arbitraries to represent the context in which an order is placed.
//
// You will find the following building blocks helpful:
//
// fc.boolean() - to represent true/false flags
// fc.constantFrom(...) - to represent enumerated values
// fc.record({ ... }) - to build composite objects
// fc.optional(...) - to represent optional fields
// ------------------------------------------------------------------------------


describe('Property-Based Tests for Orders', () => {
  describe('Invariants', () => {
    it('subtotal should always be non-negative integer', () => {
      fc.assert(
        fc.property(orderArb, (order) => {
          const result = subtotal(order);
          return result >= 0 && Number.isInteger(result);
        })
      );
    });

    it('applied discount should always be non-negative integer', () => {
      fc.assert(
        fc.property(orderArb, profileArb, couponCodeArb, (order, profile, coupon) => {
          const result = discounts(order, profile, coupon);
          return result >= 0 && Number.isInteger(result);
        })
      )
    });

    it('empty order should always result in subtotal of zero', () => {
      fc.assert(
        fc.property(profileArb, couponCodeArb, (profile, coupon) => {
          const result = discounts({items: []}, profile, coupon);
          console.log(profile, coupon)
          return result == 0 && Number.isInteger(result);
        })
      );
    });
  });
});
