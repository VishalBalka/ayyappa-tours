const CAB_COSTS = { sedan: 1500, suv: 3000, none: 0 };

const calculatePrice = (tripPrice, persons, cabType) => {
  const cab = CAB_COSTS[cabType] || 0;
  return Number(tripPrice) * Number(persons) + cab;
};

module.exports = calculatePrice;
