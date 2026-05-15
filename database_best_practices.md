# Firestore & Database Best Practices for DsquareGee

This document outlines the performance, safety, and scalability configurations applied to the DsquareGee universe.

## 1. Performance: Composite Indexes

Firestore requires composite indexes for complex queries (multiple filters or filter + sort). To maintain peak performance as your universe expands, ensure the following indexes are created in your [Firebase Console](https://console.firebase.google.com/project/_/firestore/indexes).

### Required Composite Indexes

| Collection | Fields | Query Patterns |
|------------|--------|----------------|
| `albums` | `categoryId` (ASC), `createdAt` (DESC) | Exploring categories sorted by newest release |
| `listening_sessions` | `userId` (ASC), `startTime` (DESC) | Fetching user-specific listening history |

### How to Create
1. Go to the Firestore **Indexes** tab.
2. Click **Create Index**.
3. Enter the collection ID (e.g., `albums`).
4. Add the fields with the matching directions.
5. Save and wait for "Building" to complete.

---

## 2. Safety: Automatic Backups

Firestore supports automated daily backups for projects on the **Blaze (Pay-as-you-go)** or **Enterprise** plans.

### Implementation Guide
Backups are managed via the Google Cloud SDK or Console. 

**Via Google Cloud Shell:**
```bash
gcloud firestore backups schedules create \
    --database='ai-studio-b13617d8-a958-45af-b868-fa5ff1f1aea0' \
    --retention=30d \
    --recurrence=daily
```

**Retention Strategy:**
- Critical Data: 30 days retention.
- Sync: Historical sessions are protected by TTL (see below) to keep the primary database lean.

---

## 3. Database Hygiene: Time-To-Live (TTL)

We have implemented an `expireAt` field in the `listening_sessions` collection. This prevents the audit logs from growing indefinitely and increasing query costs.

### How to Activate TTL
1. Go to **Cloud Firestore** in the Firebase Console.
2. Select **TTL** from the sub-menu.
3. Click **Create Policy**.
4. Collection group: `listening_sessions`.
5. Timestamp field: `expireAt`.
6. Finalize. Firestore will now automatically prune sessions older than 90 days.

---

## 4. Scalability: Batch Operations

When performing bulk updates (e.g., system-wide recalibration), the application uses `writeBatch` (backend) or `WriteBatch` (frontend) to group up to 500 operations into a single atomic transaction. This is faster and more reliable than individual calls.

---

## 5. Security: Relational Guards

Our `firestore.rules` use a **Relational Sync** pattern. Every sub-component (like a stream) validates the parent's state before allowing access. This ensures that a "Free" user cannot bypass security by knowing a "Premium" album ID.
