export const CLEANING_FEE_CENTS = 40_00;
export const SERVICE_FEE_RATE = 0.1;

export interface PriceBreakdown {
  nights: number;
  nightlyRate: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
}

export function calculatePrice(
  pricePerNightUsd: number,
  nights: number
): PriceBreakdown {
  if (!Number.isInteger(nights) || nights < 1) {
    throw new RangeError(`A stay needs at least one night, got ${nights}`);
  }
  if (!Number.isFinite(pricePerNightUsd) || pricePerNightUsd < 0) {
    throw new RangeError(`Invalid nightly price: ${pricePerNightUsd}`);
  }

  const nightlyRate = Math.round(pricePerNightUsd * 100);
  const subtotal = nightlyRate * nights;
  // The service fee applies to the nightly subtotal only, not the cleaning fee.
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);

  return {
    nights,
    nightlyRate,
    subtotal,
    cleaningFee: CLEANING_FEE_CENTS,
    serviceFee,
    total: subtotal + CLEANING_FEE_CENTS + serviceFee,
  };
}
