import type { Listing } from "../api/schemas";
import { CITIES } from "../domain/search";
import { createRandom } from "./random";

const LISTING_COUNT = 225;

const PRICE_RANGE: Record<(typeof CITIES)[number], [number, number]> = {
  Lisbon: [6000, 26000], // $60-$260 in cents
  Barcelona: [8000, 32000], // $80-$320 in cents
  "Mexico City": [3500, 18000], // $35-$180 in cents
  Austin: [9000, 40000], // $90-$400 in cents
  Kyoto: [7000, 35000], // $70-$350 in cents
};

const NEIGHBOURHOODS: Record<(typeof CITIES)[number], string[]> = {
  Lisbon: ["Alfama", "Baixa", "Príncipe Real", "Belém", "Graça"],
  Barcelona: ["Gràcia", "El Born", "Eixample", "Poblenou", "Barceloneta"],
  "Mexico City": ["Roma Norte", "Condesa", "Coyoacán", "Polanco", "Juárez"],
  Austin: [
    "South Congress",
    "East Austin",
    "Zilker",
    "Hyde Park",
    "Travis Heights",
  ],
  Kyoto: ["Gion", "Higashiyama", "Arashiyama", "Nakagyo", "Kamigyo"],
};

const ADJECTIVES = [
  "Sunny",
  "Quiet",
  "Bright",
  "Cosy",
  "Modern",
  "Charming",
  "Airy",
  "Restored",
];
const PLACE_TYPES = [
  "loft",
  "casita",
  "apartment",
  "townhouse",
  "cottage",
  "flat",
];
const HOST_NAMES = [
  "Ana",
  "Marc",
  "Lucía",
  "Kenji",
  "Sofia",
  "Diego",
  "Emma",
  "Yuki",
  "Tom",
];
const AMENITIES = [
  "Wifi",
  "Kitchen",
  "Air conditioning",
  "Washer",
  "Free parking",
  "Dedicated workspace",
  "Balcony",
  "Pool",
  "Pet friendly",
  "Coffee maker",
  "Self check-in",
  "Hot tub",
];

const image = (seed: string, width: number, height: number) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`;

function createListing(index: number, city: (typeof CITIES)[number]): Listing {
  const random = createRandom(index + 1);
  const id = `lst-${String(index + 1).padStart(3, "0")}`;
  const neighbourhood = random.pick(NEIGHBOURHOODS[city]);
  const bedrooms = random.int(0, 4);
  const placeType = bedrooms === 0 ? "studio" : random.pick(PLACE_TYPES);
  const [minPrice, maxPrice] = PRICE_RANGE[city];
  const hostName = random.pick(HOST_NAMES);

  return {
    id,
    title: `${random.pick(ADJECTIVES)} ${placeType} in ${neighbourhood}`,
    city,
    pricePerNight: random.int(minPrice, maxPrice),
    maxGuests: Math.min(10, Math.max(1, bedrooms * 2 + random.int(1, 2))),
    rating: Math.round((3.6 + random.next() * 1.4) * 10) / 10,
    thumbnailUrl: image(`casita-${id}-0`, 480, 360),
    bedrooms,
    description:
      `A ${placeType} in ${neighbourhood}, a short walk from cafés, markets and transport. ` +
      `${
        bedrooms === 0
          ? "The open-plan studio"
          : `With ${bedrooms} bedroom${bedrooms > 1 ? "s" : ""}, it`
      } ` +
      `suits ${
        bedrooms > 1
          ? "families and small groups"
          : "couples and solo travellers"
      }. ` +
      `Expect fast wifi, fresh linen and a host who knows the best local spots.`,
    photos: Array.from({ length: random.int(4, 7) }, (_, i) =>
      image(`casita-${id}-${i}`, 1200, 800)
    ),
    amenities: random.sample(AMENITIES, random.int(4, 9)),
    host: {
      name: hostName,
      avatarUrl: image(`host-${hostName}`, 96, 96),
      joinedYear: random.int(2014, 2024),
      isSuperhost: random.next() > 0.6,
    },
  };
}

export const listings: Listing[] = Array.from(
  { length: LISTING_COUNT },
  (_, i) =>
    createListing(i, CITIES[i % CITIES.length] as (typeof CITIES)[number])
);
