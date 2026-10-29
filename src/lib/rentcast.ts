export interface RentcastValue {
  price: number;
  priceRangeLow: number | null;
  priceRangeHigh: number | null;
  subject: Record<string, unknown> | null;
}

/** Look up RentCast's automated value estimate for one address. */
export async function fetchHomeValue(address: string): Promise<RentcastValue> {
  const key = process.env.RENTCAST_API_KEY;
  if (!key) throw new Error("Home values aren't set up yet: add RENTCAST_API_KEY to the environment.");

  const url = new URL("https://api.rentcast.io/v1/avm/value");
  url.searchParams.set("address", address);
  url.searchParams.set("compCount", "10");

  const res = await fetch(url, {
    headers: { "X-Api-Key": key, Accept: "application/json" },
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) throw new Error("RentCast rejected the API key. Check RENTCAST_API_KEY.");
    if (res.status === 404) throw new Error("RentCast couldn't find that address. Check it's written as street, city, state, ZIP.");
    if (res.status === 429) throw new Error("RentCast's monthly lookup limit is used up. Try again next month.");
    throw new Error(body?.message || `RentCast lookup failed (${res.status}).`);
  }
  if (typeof body?.price !== "number") throw new Error("RentCast didn't return a value for that address.");

  return {
    price: body.price,
    priceRangeLow: body.priceRangeLow ?? null,
    priceRangeHigh: body.priceRangeHigh ?? null,
    subject: body.subjectProperty ?? null,
  };
}
