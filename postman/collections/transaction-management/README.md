# Transaction Management Postman checks

The collection runs a cashier sale against a product with DISPLAY stock, checks
cash totals and idempotent retries, verifies an insufficient-stock request does
not change stock, then has an OWNER void the sale and verifies the stock return.
The successful sale is voided at the end, so it does not remain in valid cash
sales. The cashier shift remains open.

## Run locally

1. Start the backend and apply migrations. Ensure the database has active OWNER
   and CASHIER accounts, and at least one active, available product with
   positive DISPLAY stock.
2. Copy `postman/environments/local-transactions.example.environment.yaml` to
   `postman/environments/local-transactions.environment.yaml`, then set the
   local cashier and owner passwords in the private copy.
3. Run the **District 13 Transaction Management** collection in order:

```bash
postman collection run postman/collections/transaction-management \
  --environment postman/environments/local-transactions.environment.yaml
```

The run creates one transaction and voids it. A cashier with an existing active
shift can be used; otherwise the collection opens one and leaves it open. It
does not create catalog records or adjust stock outside the sale/void pair.
