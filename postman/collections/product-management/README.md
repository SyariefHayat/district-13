# Product Management API checks

This collection verifies the product catalog contract against a running local backend. It uses the owner login and creates temporary category, add-on, and product records with a unique run suffix. It deactivates those records after the checks.

## Run locally

1. Start the backend and apply pending migrations.
2. Copy `postman/environments/local.example.environment.yaml` to `postman/environments/local.environment.yaml` and set the local owner password in that private file.
3. Run the collection:

```sh
postman collection lint postman/collections/product-management
postman collection run postman/collections/product-management \
  --environment postman/environments/local.environment.yaml \
  --no-report-events
```

The run checks unauthenticated access, category and add-on detail routes, case-insensitive category uniqueness, string decimal prices, product availability, atomic add-on replacement validation, category lifecycle rules, and soft deactivation. Tokens and generated IDs stay in run-local variables.
