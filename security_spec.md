# Security Specification: Business Pro RBAC

## Data Invariants
1. A Business Profile belongs to an Owner.
2. A Business Schedule belongs to a Business.
3. A Business Device belongs to a Business.
4. User roles are immutable by the user (only via Server/Admin).
5. Consumers cannot read business data.
6. Business users can only read/write their own business data.
7. Admin users have global read/write access.

## The "Dirty Dozen" Payloads (Attack Vectors)

1. **Role Escalation**: User `u1` attempts to update their own `role` to `admin`.
2. **Business Hijack**: User `u2` (business_pro) attempts to set `ownerId` to themselves on a business they don't own.
3. **Cross-Tenant Schedule Injection**: User `u2` attempts to create a schedule for `business_Y` while belonging to `business_X`.
4. **Device Spoofing**: User `u3` attempts to register a device to `business_Z`.
5. **Unauthorized Analytics Read**: Consumer user `u4` attempts to read `business_analytics/business_X`.
6. **Shadow Field Injection**: User `u2` updates business profile with a hidden `isVerified: true` field.
7. **PII Leak**: Consumer `u4` attempts to read another user's `stripeCustomerId`.
8. **Invalid ID Poisoning**: Attacker sends a 1MB string as a `deviceId`.
9. **Creation Timestamp Spoof**: User sets `createdAt` to a date in the past.
10. **Role Change via Update**: User `u2` updates their `tier` without going through Stripe system.
11. **Scene Injection**: User `u2` creates an `ambience_scene` for another business.
12. **Zombie Device Update**: User `u2` updates `lastActive` on a device they don't own.

## Test Strategy
All the above must return `PERMISSION_DENIED`.
