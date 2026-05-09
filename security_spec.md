# Security Specification - Music App

## 1. Data Invariants
- A User profile must have a valid `uid` matching the document ID and the `request.auth.uid`.
- A Favorite must belong to the user who created it (`userId` field).
- Albums and Categories are read-only for public/regular users and only manageable by Admins.
- Users cannot upgrade themselves to `premium` tier or `isAdmin` status directly.

## 2. The "Dirty Dozen" Payloads

### P1: Identity Theft (User Profile)
Attempt to create/update a user profile with a `uid` that does not match `request.auth.uid`.
```json
{
  "uid": "victim_uid",
  "email": "attacker@example.com"
}
```
**Expected: PERMISSION_DENIED**

### P2: Privilege Escalation (Tier)
Attempt to set `tier` to `premium` during creation/update.
```json
{
  "tier": "premium"
}
```
**Expected: PERMISSION_DENIED** (unless handled by server/admin)

### P3: Privilege Escalation (Admin)
Attempt to set `isAdmin` to `true`.
```json
{
  "isAdmin": true
}
```
**Expected: PERMISSION_DENIED**

### P4: Shadow Updating (Add unknown fields)
Attempt to update a user with a non-existent field like `isVerified`.
```json
{
  "isVerified": true
}
```
**Expected: PERMISSION_DENIED**

### P5: Orphaned Favorite
Attempt to create a favorite for a non-existent album.
```json
{
  "userId": "my_uid",
  "albumId": "fake_album"
}
```
**Expected: PERMISSION_DENIED** (via `exists()`)

### P6: Spoofing Favorite Owner
Attempt to create a favorite with someone else's `userId`.
```json
{
  "userId": "victim_uid",
  "albumId": "real_album"
}
```
**Expected: PERMISSION_DENIED**

### P7: Admin Override Attempt
Regular user attempting to delete an album.
**Expected: PERMISSION_DENIED**

### P8: Public Category Write
Unauthenticated user attempting to create a category.
**Expected: PERMISSION_DENIED**

### P9: Large Payload Attack
Attempt to write a string field exceeding 1KB.
**Expected: PERMISSION_DENIED**

### P10: Terminal State Change
Updating a profile's immutable `uid` after creation.
**Expected: PERMISSION_DENIED**

### P11: Query Scraping
Attempting to list all users without a filter on `uid`.
**Expected: PERMISSION_DENIED**

### P12: ID Poisoning
Using a 2KB string as a document ID.
**Expected: PERMISSION_DENIED**
