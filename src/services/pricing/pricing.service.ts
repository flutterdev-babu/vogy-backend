export const calculateFare = (params: {
  basePrice: number;
  extraKm: number;
  pricePerKm: number;
  taxes: number;
  tollCharges: number;
  additionalCharges: number;
}) => {
  const {
    basePrice,
    extraKm,
    pricePerKm,
    taxes,
    tollCharges,
    additionalCharges,
  } = params;

  // extraKmCharges = extraKm * pricePerKm
  const extraKmCharges = Math.max(0, extraKm * pricePerKm);

  // taxableAmount = basePrice + extraKmCharges
  const taxableAmount = Math.max(0, basePrice + extraKmCharges);

  // GST = 5% of taxableAmount ONLY
  const gst = taxableAmount * 0.05;

  // total = basePrice + extraKmCharges + GST + taxes + tollCharges + additionalCharges
  const total = basePrice + extraKmCharges + gst + taxes + tollCharges + additionalCharges;

  return {
    basePrice,
    extraKmCharges,
    gst,
    taxes,
    tollCharges,
    additionalCharges,
    total,
  };
};
