# Authorization ACL

This collection verifies role-based access for POS endpoints currently
implemented by the API. It covers forbidden shift and transaction operations,
cashier access boundaries, and cashier product catalog access.

## Setup

Select a private Postman environment with these variables:

- `base_url`
- `owner_username`, `owner_password`
- `admin_username`, `admin_password`
- `cashier_username`, `cashier_password`

Keep passwords in local secret variables. Run the collection in request order;
each login stores its access token in collection variables. Create active test
accounts for all three roles before running it.

The denied mutation requests are checked by permission guards before their
payloads or resource identifiers can affect persisted data.
