# Report and Audit Management checks

Run with a local Postman environment containing `owner_username`, `owner_password`, `admin_username`, `admin_password`, `cashier_username`, and `cashier_password`. Use credentials for seeded active accounts. Reports use the query interval `2026-01-01` through `2026-12-31`; change those dates in each request when the fixture dataset uses another period.

Run requests in folder order. The checks verify response shape and access rules. Calculation assertions requiring known sales, stock or cash data need the matching fixture values in the local dataset; the collection checks broad invariants and excludes voided transaction rows from active sales.
