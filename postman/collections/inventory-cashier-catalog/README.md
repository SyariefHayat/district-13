# Cashier inventory catalog checks

This collection verifies that a logged-in cashier sees display stock in product list and detail responses, never receives warehouse stock, and cannot access the inventory dashboard.

## Run locally

1. Start the backend and ensure at least one active product exists.
2. Copy `postman/environments/local-cashier.example.environment.yaml` to `postman/environments/local-cashier.environment.yaml`.
3. Set `cashier_username` and `cashier_password` to an active local cashier account. Keep the private environment file out of Git.
4. Run the collection:

```bash
postman collection run postman/collections/inventory-cashier-catalog \
  --environment postman/environments/local-cashier.environment.yaml
```

The login token and product ID are run-local Postman variables; the scripts do not persist or log the token.
