// Generates the onboarding "session context" a real verification flow
// would normally pick up automatically — a device fingerprint, whatever
// employer/address the platform already has on file for this kind of
// signup, and (for a lending flow) the amount being requested — rather
// than asking a person filling in this demo form to type them by hand.
// The values are randomised per submission so repeated runs still produce
// a graph with variety, in the same spirit as the seeded demo dataset
// (src/mocks/identityMocks.js uses the same address/employer flavour).

const EMPLOYERS = [
  'Zenta Logistics Ltd',
  'Meridian Retail Group',
  'Coastline Freight Co',
  'Harborview Consulting',
  'Palmgrove Textiles',
  'Nordbay Shipping Agency',
  'Sunrise EdTech Ltd',
  'Craneworks Engineering',
  'Delta Pharma Distributors',
  'Brightline Media House',
  'Vantage Power Systems',
  'Goldcrest Insurance',
  'Ridgeway Auto Parts',
  'Lakeside Hospitality Group',
  'Kingsbridge Logistics',
  'Copperline Real Estate',
  null, // self-employed / not on file — a normal, common case
]

const ADDRESSES = [
  '14 Allen Ave, Ikeja',
  '5 Bode Thomas St, Surulere',
  '17 Admiralty Way, Lekki Phase 1',
  '9 Ajose Adeogun St, Victoria Island',
  '31 Wharf Rd, Apapa',
  '44 Ikorodu Rd, Maryland',
  '3 Iju Rd, Ogba',
  '26 Isolo Rd, Isolo',
  '12 Church St, Ikorodu',
  '8 Randle Ave, Surulere',
  '19 Oduduwa Cres, Ikeja GRA',
  '27 Egbeda Rd, Egbeda',
  "6 Alaba Int'l Market Rd, Alaba",
  '15 Diya St, Gbagada',
  '10 Oshodi-Apapa Expy, Oshodi',
  '21 Ojuelegba Rd, Mushin',
]

const AMOUNT_BUCKETS_NGN = [50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000]

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function randomDeviceId() {
  const hex = Math.random().toString(16).slice(2, 7).toUpperCase().padEnd(5, '0')
  return `DEV-${hex}`
}

function randomAmount() {
  // Not every verification is a loan application — leave it unset ~30%
  // of the time, same as roughly a third of the seeded demo identities.
  if (Math.random() < 0.3) return null
  return pick(AMOUNT_BUCKETS_NGN)
}

export function generateSessionContext() {
  return {
    device_id: randomDeviceId(),
    employer: pick(EMPLOYERS),
    address: pick(ADDRESSES),
    requested_amount_ngn: randomAmount(),
  }
}
