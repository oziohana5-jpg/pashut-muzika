/**
 * Stripe Test Cards
 * ==================
 * Use these card numbers in sandbox/test mode only.
 * All cards use: any future expiry date (e.g. 12/34), any 3-digit CVC (4-digit for Amex).
 *
 * Source: https://docs.stripe.com/testing
 */

// ─── Basic Successful Cards by Brand ────────────────────────────────────────

export const STRIPE_TEST_CARDS = {

  // ── Visa ──────────────────────────────────────────────────────────────────
  visa:                 { number: '4242 4242 4242 4242', cvc: 'any 3 digits', note: 'Standard Visa' },
  visaDebit:            { number: '4000 0566 5566 5556', cvc: 'any 3 digits', note: 'Visa Debit' },

  // ── Mastercard ────────────────────────────────────────────────────────────
  mastercard:           { number: '5555 5555 5555 4444', cvc: 'any 3 digits', note: 'Standard Mastercard' },
  mastercardSeries2:    { number: '2223 0031 2200 3222', cvc: 'any 3 digits', note: 'Mastercard (2 series)' },
  mastercardDebit:      { number: '5200 8282 8282 8210', cvc: 'any 3 digits', note: 'Mastercard Debit' },
  mastercardPrepaid:    { number: '5105 1051 0510 5100', cvc: 'any 3 digits', note: 'Mastercard Prepaid' },

  // ── American Express ──────────────────────────────────────────────────────
  amex1:                { number: '3782 822463 10005',   cvc: 'any 4 digits', note: 'Amex' },
  amex2:                { number: '3714 496353 98431',   cvc: 'any 4 digits', note: 'Amex (alternate)' },

  // ── Discover ──────────────────────────────────────────────────────────────
  discover1:            { number: '6011 1111 1111 1117', cvc: 'any 3 digits', note: 'Discover' },
  discover2:            { number: '6011 0009 9013 9424', cvc: 'any 3 digits', note: 'Discover (alternate)' },
  discoverDebit:        { number: '6011 9811 1111 1113', cvc: 'any 3 digits', note: 'Discover Debit' },

  // ── Diners Club ───────────────────────────────────────────────────────────
  dinersClub:           { number: '3056 9300 0902 0004', cvc: 'any 3 digits', note: 'Diners Club' },
  dinersClub14:         { number: '3622 7206 2716 67',   cvc: 'any 3 digits', note: 'Diners Club (14-digit)' },

  // ── JCB ───────────────────────────────────────────────────────────────────
  jcb:                  { number: '3566 0020 2036 0505', cvc: 'any 3 digits', note: 'JCB' },

  // ── UnionPay ──────────────────────────────────────────────────────────────
  unionPay:             { number: '6200 0000 0000 0005', cvc: 'any 3 digits', note: 'UnionPay' },
  unionPayDebit:        { number: '6200 0000 0000 0047', cvc: 'any 3 digits', note: 'UnionPay Debit' },

} as const;


// ─── Declined Cards ──────────────────────────────────────────────────────────

export const STRIPE_DECLINED_CARDS = {
  genericDecline:       { number: '4000 0000 0000 0002', error: 'card_declined',    decline: 'generic_decline' },
  insufficientFunds:    { number: '4000 0000 0000 9995', error: 'card_declined',    decline: 'insufficient_funds' },
  lostCard:             { number: '4000 0000 0000 9987', error: 'card_declined',    decline: 'lost_card' },
  stolenCard:           { number: '4000 0000 0000 9979', error: 'card_declined',    decline: 'stolen_card' },
  expiredCard:          { number: '4000 0000 0000 0069', error: 'expired_card',     decline: 'n/a' },
  incorrectCvc:         { number: '4000 0000 0000 0127', error: 'incorrect_cvc',    decline: 'n/a' },
  processingError:      { number: '4000 0000 0000 0119', error: 'processing_error', decline: 'n/a' },
  incorrectNumber:      { number: '4242 4242 4242 4241', error: 'incorrect_number', decline: 'n/a' },
  velocityLimit:        { number: '4000 0000 0000 6975', error: 'card_declined',    decline: 'card_velocity_exceeded' },
  /** Attaches to Customer OK, but charges fail */
  declineAfterAttach:   { number: '4000 0000 0000 0341', error: 'card_declined',    decline: 'generic_decline' },
} as const;


// ─── 3D Secure Cards ─────────────────────────────────────────────────────────

export const STRIPE_3DS_CARDS = {
  /** Always requires 3DS authentication */
  alwaysAuthenticate:   { number: '4000 0027 6000 3184', note: 'Always requires 3DS' },
  /** Requires 3DS for off-session unless set up */
  authenticateIfNeeded: { number: '4000 0025 0000 3155', note: '3DS required off-session unless set up' },
  /** Already set up, requires 3DS only on-session */
  alreadySetUp:         { number: '4000 0038 0000 0446', note: 'Already set up for off-session' },
  /** 3DS required, payment declined with insufficient_funds after auth */
  insufficientFunds3ds: { number: '4000 0082 6000 3178', note: '3DS required, then declined: insufficient_funds' },
  /** 3DS frictionless (no challenge prompt) */
  frictionless:         { number: '4000 0000 3220 0000', note: '3DS frictionless flow' },
} as const;


// ─── Fraud / Radar Cards ─────────────────────────────────────────────────────

export const STRIPE_RADAR_CARDS = {
  alwaysBlocked:        { number: '4100 0000 0000 0019', note: 'Risk: highest — always blocked by Radar' },
  highestRisk:          { number: '4000 0000 0000 4954', note: 'Risk: highest — blocked depending on settings' },
  elevatedRisk:         { number: '4000 0000 0000 9235', note: 'Risk: elevated — might be queued for review' },
  cvcFails:             { number: '4000 0000 0000 0101', note: 'CVC check fails' },
  postalFails:          { number: '4000 0000 0000 0036', note: 'Postal code check fails' },
} as const;


// ─── Dispute Cards ───────────────────────────────────────────────────────────

export const STRIPE_DISPUTE_CARDS = {
  fraudulent:           { number: '4000 0000 0000 0259', note: 'Disputed as fraudulent' },
  notReceived:          { number: '4000 0000 0000 2685', note: 'Disputed as product not received' },
  inquiry:              { number: '4000 0000 0000 1976', note: 'Disputed as inquiry' },
} as const;

/** Evidence strings for winning/losing simulated disputes */
export const STRIPE_DISPUTE_EVIDENCE = {
  win:  'winning_evidence',
  lose: 'losing_evidence',
} as const;


// ─── Country Cards (sample) ──────────────────────────────────────────────────

export const STRIPE_COUNTRY_CARDS = {
  us:  { number: '4242 4242 4242 4242', country: 'United States' },
  gb:  { number: '4000 0082 6000 0000', country: 'United Kingdom' },
  de:  { number: '4000 0027 6000 0016', country: 'Germany' },
  fr:  { number: '4000 0025 0000 0003', country: 'France' },
  il:  { number: '4242 4242 4242 4242', country: 'Israel (no specific test card — use US card)' },
  au:  { number: '4000 0003 6000 0006', country: 'Australia' },
  ca:  { number: '4000 0012 4000 0000', country: 'Canada' },
  br:  { number: '4000 0007 6000 0002', country: 'Brazil' },
  in:  { number: '4000 0035 6000 0008', country: 'India' },
  jp:  { number: '4000 0039 2000 0003', country: 'Japan' },
} as const;


// ─── PaymentMethod tokens (for server-side API calls) ────────────────────────

/**
 * Use these in API calls instead of raw card numbers to stay PCI-compliant.
 * Pass as `payment_method` in a PaymentIntent create call.
 *
 * Example:
 *   curl https://api.stripe.com/v1/payment_intents \
 *     -u sk_test_... \
 *     -d amount=1000 -d currency=usd \
 *     -d payment_method=pm_card_visa
 */
export const STRIPE_PM_TOKENS = {
  visa:              'pm_card_visa',
  visaDebit:         'pm_card_visa_debit',
  mastercard:        'pm_card_mastercard',
  amex:              'pm_card_amex',
  discover:          'pm_card_discover',
  jcb:               'pm_card_jcb',
  unionPay:          'pm_card_unionpay',
  threeDSecure:      'pm_card_threeDSecure2Required',
  declined:          'pm_card_visa_chargeDeclined',
  insufficientFunds: 'pm_card_visa_chargeDeclinedInsufficientFunds',
} as const;


// ─── Quick-access helpers ─────────────────────────────────────────────────────

/** Returns the simplest successful test card number (Visa) */
export const DEFAULT_TEST_CARD = STRIPE_TEST_CARDS.visa.number;

/** Returns a card number guaranteed to decline */
export const DEFAULT_DECLINE_CARD = STRIPE_DECLINED_CARDS.genericDecline.number;

/** Standard test expiry date */
export const TEST_EXPIRY = '12/34';

/** Any valid 3-digit test CVC */
export const TEST_CVC = '123';
