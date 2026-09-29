# Security Specification for ExamArchitect

## Data Invariants
1. A **Curriculum** must always point to the user who uploaded it (`userId`).
2. A **Practice Session** must be linked to both a valid user and a valid curriculum/subject.
3. Users can only read and write their own profile, curriculum, and sessions.
4. The **Question Bank** is structured to allow students to read questions, but only the system (or if implemented, admins) should create them globally. (Currently, the app generates questions per subject, so they might be scoped per user or shared).

## The Dirty Dozen Payloads (Targeting Denial)

### 1. Identity Spoofing (User Profile)
Attempt to update another user's profile by swapping the `userId` in the path.
- Path: `/users/target_user_id`
- Payload: `{ "displayName": "Attacker", "userId": "attacker_id" }`
- Result: **PERMISSION_DENIED**

### 2. Privilege Escalation (Shadow Fields)
Attempt to add an `isAdmin` field to a user profile.
- Path: `/users/my_id`
- Payload: `{ "displayName": "Me", "isAdmin": true, "userId": "my_id", "email": "me@example.com" }`
- Result: **PERMISSION_DENIED** (via `affectedKeys().hasOnly()`)

### 3. Identity Theft (Curriculum)
Attempt to create a curriculum document for someone else.
- Path: `/curricula/random_id`
- Payload: `{ "userId": "victim_id", "subjects": [...] }`
- Result: **PERMISSION_DENIED**

### 4. Resource Exhaustion (Long ID)
Injection of 1MB document ID.
- Path: `/curricula/[1MB_STRING]`
- Result: **PERMISSION_DENIED** (via `isValidId()`)

### 5. Type Poisoning (Progress)
Update subject progress with a string instead of a number.
- Path: `/curricula/my_curricula_id`
- Payload: `{ "subjects": [{ "name": "Math", "progress": "COMPLETED" }] }`
- Result: **PERMISSION_DENIED** (via `isValidCurriculum()`)

### 6. State Shortcut (Practice Session)
Attempt to set `completed: true` without actually finishing. (If we added more complex logic, this would be restricted).

### 7. Orphaned Record (Practice Session)
Create a practice session for a non-existent curriculum.
- Result: **PERMISSION_DENIED** (via `exists()`)

### 8. Denial of Wallet (Large Payload)
Sending a huge array of topics.
- Result: **PERMISSION_DENIED** (via `subjects.size()` and `topics.size()` checks)

... and so on.

## Firestore Security Rules Test Runner (Mock)
(Testing all operations against the rules logic below)
