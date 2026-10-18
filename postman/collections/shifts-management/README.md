# Shifts Management Postman checks

This collection runs one cashier shift from authorization checks through
reconciliation and supervisor close. It also creates a completed cash sale, a
QRIS sale, and cash movements to verify only physical cash affects expected
cash.

## Run against local backend

1. Apply backend migrations and start the API at `http://localhost:3000`.
2. Copy `postman/environments/local-shifts.example.environment.yaml` to
   `postman/environments/local-shifts.environment.yaml` and import the private
   copy into Postman.
3. Set the cashier and owner usernames/passwords to active local test accounts.
   The collection creates persistent transactions, cash movements, and a
   closed shift. Use a cashier account with no active shift.
4. Run the **District 13 Shifts Management** collection in order.

With Postman CLI:

```bash
postman collection run postman/collections/shifts-management \
  --environment postman/environments/local-shifts.environment.yaml
```

The collection scripts assert HTTP status, ownership/lifecycle behavior, and
the expected cash arithmetic. Collection lint verifies the saved request
structure; only a live run against a configured backend verifies runtime
behavior.
