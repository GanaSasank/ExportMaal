const quantityUnitKg = Object.freeze({ kg: 1, quintal: 100, tonne: 1000 });
const priceUnitKg = Object.freeze({ kg: 1, tonne: 1000 });

const calculateTotalPrice = ({ quantity, quantityUnit, price, priceUnit }) => {
  const quantityInKg = quantity * quantityUnitKg[quantityUnit];
  const priceBasisInKg = priceUnitKg[priceUnit];
  return Math.round((price * quantityInKg / priceBasisInKg) * 100) / 100;
};

module.exports = { calculateTotalPrice, quantityUnitKg, priceUnitKg };
