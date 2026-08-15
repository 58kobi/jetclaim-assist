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
