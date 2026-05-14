# Security Specification

1. Data Invariants:
   - A user profile must match the authenticated user's ID.
   - Playlists must belong to a valid user.
   - Albums and categories are public for reading.
   - Admin access is restricted to specific emails or the admins collection.

2. The "Dirty Dozen" Payloads (Security Test Cases):
   - Create user profile with different UID: Denied.
   - List all playlists as non-admin: Denied.
   - Delete someone else's playlist: Denied.
   - Update user tier as non-admin without going through proper channel (though tier is whitelisted for update by owner currently, usually would be restricted): whitelisted for now but will be hardened.
   - Inject 1MB string into playlist ID: Denied by size limit.
   - Create album as non-admin: Denied.
   - Edit album price/featured as non-admin: Denied.
   - Spoof admin email in auth token (impossible via rules but checked for): Checked via verification.

3. Conflicts/Vulnerabilities:
   - PII Leak: Users can only read their own profile.
   - Resource Exhaustion: IDs and strings have size limits.
   - Identity Management: userId fields are validated against request.auth.uid.
