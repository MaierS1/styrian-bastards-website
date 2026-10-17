# SumUp public client release dependency

Draft candidate only. Do not merge/deploy before manager PR #15 has complete provider acceptance and its forward migration is installed in production.

The client now calls `create_public_abo_ticket_order_with_payment_token`. There is no fallback to the legacy order RPC after an error: a fallback can create a duplicate order after an unknown response. Non-production hostnames default to staging; the two production hostnames retain the production backend unless explicit sandbox mode is selected.

Persist order/token state before checkout creation. An ambiguous checkout request stays locked across refresh; a known hosted checkout URL resumes without another creation request. Only HTTPS `checkout.sumup.com` URLs are accepted. Unknown order responses also block another submission. Token state remains in sessionStorage, never in the URL.

Validation: eight offline DOM/HTTP contract tests cover backend selection, token RPC, duplicate order prevention, known-checkout resume, ambiguous checkout across reload, missing storage, untrusted redirect and paid-return verification. These do not replace a live provider payment/refund test.

The approved manager sandbox refund attempt remains needs_review: requested EUR 30, authoritative transaction and identity-verified receipt both report EUR 0.30. No second refund submission or provider history reset is part of this website candidate. Manager production release remains blocked.
