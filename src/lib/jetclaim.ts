export const ISSUE_TYPES = [
  "Delay",
  "Cancellation",
  "Denied Boarding",
  "Lost Baggage",
  "Damaged Baggage",
  "Booking Issue",
  "Other",
] as const;

export type IssueType = (typeof ISSUE_TYPES)[number];

export const CLAIM_STATUSES = [
  "Submitted",
  "Under Review",
  "Forwarded to Airline",
  "Fee Pending",
  "Awaiting Payout",
  "Resolved",
  "Closed",
] as const;

export const REFUNDABLE_TIMELINE = [
  "Submitted",
  "Under Review",
  "Approved",
  "Fee Settlement",
  "Bank Details",
  "Forwarded to Airline",
  "Payout Received",
] as const;

export const COMPLAINT_TIMELINE = [
  "Submitted",
  "Under Review",
  "Forwarded to Airline",
  "Resolved",
] as const;

export function statusTone(status: string): string {
  switch (status) {
    case "Resolved":
      return "bg-success/10 text-success border-success/30";
    case "Closed":
      return "bg-muted text-muted-foreground border-border";
    case "Fee Pending":
    case "Awaiting Payout":
      return "bg-warning/15 text-warning border-warning/30";
    case "Under Review":
    case "Forwarded to Airline":
      return "bg-brand-blue/10 text-brand-blue border-brand-blue/30";
    default:
      return "bg-navy/10 text-navy border-navy/20";
  }
}

export const AIRLINE_GROUPS = [
  {
    label: "United States — US DOT",
    airlines: [
      { name: "American Airlines", iata: "AA" },
      { name: "Delta Air Lines", iata: "DL" },
      { name: "United Airlines", iata: "UA" },
      { name: "Southwest Airlines", iata: "WN" },
      { name: "JetBlue", iata: "B6" },
      { name: "Alaska Airlines", iata: "AS" },
    ],
  },
  {
    label: "Europe — EU261",
    airlines: [
      { name: "Lufthansa", iata: "LH" },
      { name: "Air France", iata: "AF" },
      { name: "KLM", iata: "KL" },
      { name: "Ryanair", iata: "FR" },
      { name: "easyJet", iata: "U2" },
      { name: "Turkish Airlines", iata: "TK" },
      { name: "Iberia", iata: "IB" },
    ],
  },
  {
    label: "United Kingdom — UK261",
    airlines: [
      { name: "British Airways", iata: "BA" },
      { name: "Virgin Atlantic", iata: "VS" },
    ],
  },
  {
    label: "Canada — APPR",
    airlines: [
      { name: "Air Canada", iata: "AC" },
      { name: "WestJet", iata: "WS" },
    ],
  },
  {
    label: "India — DGCA",
    airlines: [
      { name: "IndiGo", iata: "6E" },
      { name: "Air India", iata: "AI" },
      { name: "SpiceJet", iata: "SG" },
    ],
  },
  {
    label: "Middle East / Gulf",
    airlines: [
      { name: "Qatar Airways", iata: "QR" },
      { name: "Emirates", iata: "EK" },
      { name: "Etihad Airways", iata: "EY" },
    ],
  },
  {
    label: "Asia-Pacific",
    airlines: [
      { name: "Singapore Airlines", iata: "SQ" },
      { name: "Cathay Pacific", iata: "CX" },
      { name: "ANA (All Nippon Airways)", iata: "NH" },
      { name: "AirAsia", iata: "AK" },
    ],
  },
  {
    label: "Africa",
    airlines: [
      { name: "Kenya Airways", iata: "KQ" },
      { name: "Ethiopian Airlines", iata: "ET" },
      { name: "South African Airways", iata: "SA" },
    ],
  },
  {
    label: "South America — ANAC",
    airlines: [
      { name: "LATAM Airlines", iata: "LA" },
      { name: "GOL", iata: "G3" },
      { name: "Azul", iata: "AD" },
    ],
  },
];

export const REGULATION_BADGES = [
  { code: "EU261", flag: "🇪🇺", label: "EU261", detail: "Up to €600 — EU Regulation EC 261/2004" },
  { code: "UK261", flag: "🇬🇧", label: "UK261", detail: "Up to £520 — UK Regulation" },
  { code: "USDOT", flag: "🇺🇸", label: "US DOT Rules", detail: "Refunds & up to $2,150 — US Department of Transportation" },
  { code: "APPR", flag: "🇨🇦", label: "Canada APPR", detail: "Up to C$1,000 — Air Passenger Protection Regulations" },
  { code: "DGCA", flag: "🇮🇳", label: "India DGCA", detail: "Up to ₹20,000 — DGCA Passenger Charter" },
  { code: "ANAC", flag: "🇧🇷", label: "Brazil ANAC", detail: "Passenger Rights Under ANAC Rules" },
  { code: "MONTREAL", flag: "🌍", label: "Montreal Convention", detail: "Baggage loss, damage and delay worldwide" },
  { code: "SHY", flag: "🇹🇷", label: "Turkey SHY", detail: "Up to €600 — Turkish passenger rights" },
];

export function formatMoney(amount: number | null | undefined, currency = "EUR") {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export type RegulationDetail = {
  code: string;
  chip: string;
  name: string;
  region: string;
  appliesTo: string;
  covers: string;
  compensation: string;
  deadline: string;
};

export const REGULATION_DETAILS: RegulationDetail[] = [
  {
    code: "EU261",
    chip: "EU",
    name: "EU261 (EC 261/2004)",
    region: "European Union",
    appliesTo: "Flights departing any EU airport, or landing in the EU on an EU-based carrier.",
    covers: "Delay of 3+ hours, cancellation with under 14 days' notice, denied boarding.",
    compensation: "€250 (up to 1,500 km) · €400 (1,500–3,500 km) · €600 (3,500 km+)",
    deadline: "Varies by member state — 1 to 6 years",
  },
  {
    code: "UK261",
    chip: "UK",
    name: "UK261",
    region: "United Kingdom",
    appliesTo: "Flights departing the UK, or landing in the UK on a British carrier.",
    covers: "Same triggers as EU261 — delay, cancellation, denied boarding.",
    compensation: "£220 – £520 depending on distance",
    deadline: "Up to 6 years (England & Wales)",
  },
  {
    code: "USDOT",
    chip: "US",
    name: "US DOT Rules",
    region: "United States",
    appliesTo: "US domestic and US-departing international flights.",
    covers:
      "Automatic refunds for delays over 3 hrs domestic / 6 hrs international, denied boarding compensation, tarmac delay rights.",
    compensation: "Refunds, plus denied boarding compensation up to $2,150",
    deadline: "No fixed federal deadline — file as soon as possible",
  },
  {
    code: "APPR",
    chip: "CA",
    name: "Canada APPR",
    region: "Air Passenger Protection Regulations",
    appliesTo: "Flights to, from, or within Canada.",
    covers: "Disruptions within the airline's control, cancellations notified inside 14 days.",
    compensation: "Up to C$1,000 (large carriers), lower fixed tiers for small carriers",
    deadline: "1 year",
  },
  {
    code: "DGCA",
    chip: "IN",
    name: "India DGCA — Passenger Charter",
    region: "India",
    appliesTo: "Flights to, from, or within India.",
    covers:
      "Delays (meals, rebooking or refund past 6 hrs — no cash for delay alone), cancellations, denied boarding.",
    compensation: "Cancellations up to ₹10,000 · Denied boarding 200–400% of fare, capped around ₹20,000",
    deadline: "File promptly — airline complaint windows are short",
  },
  {
    code: "ANAC",
    chip: "BR",
    name: "Brazil ANAC",
    region: "Brazil",
    appliesTo: "Flights to, from, or within Brazil.",
    covers:
      "Delay 2–4 hrs (meal vouchers), delay 4+ hrs (communication, meals, accommodation if overnight).",
    compensation: "Assistance and re-routing or refund; damages assessed case by case",
    deadline: "Generally 5 years for consumer claims",
  },
  {
    code: "SHY",
    chip: "TR",
    name: "Turkey SHY — Passenger Regulation",
    region: "Türkiye",
    appliesTo: "Flights departing Turkish airports, or flights to Turkey on Turkish carriers.",
    covers: "Delay 2+ hrs (domestic), 3–4+ hrs (international), cancellation and denied boarding.",
    compensation: "Domestic from €100 · International €250 – €600",
    deadline: "1.5 years",
  },
  {
    code: "MONTREAL",
    chip: "GLOBAL",
    name: "Montreal Convention — Global Baggage Coverage",
    region: "140+ member states worldwide",
    appliesTo:
      "Most international flights worldwide, regardless of which regional regulation also applies to the route.",
    covers: "Lost, delayed or damaged baggage; passenger injury or death.",
    compensation: "Up to approximately $1,300 – $1,545 for baggage; higher limits for injury or death claims",
    deadline: "2 years from arrival (7–21 days to report baggage)",
  },
];

