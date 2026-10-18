# Authentication Postman checks

The `District 13 Authentication` collection covers login, protected API access,
CSRF rejection, refresh rotation, replay rejection, logout, session revocation,
invalid credentials, and invalid access tokens.

## Run against local backend

1. Apply the backend migrations and start the API (`http://localhost:3000` by
   default).
2. Copy `postman/environments/local.example.environment.yaml` to
   `postman/environments/local.environment.yaml` and import the private copy in
   Postman. The private path is ignored by Git.
3. Set `username` and `password` in that private environment to an active local
   test user. Do not commit the private environment file.
4. Select **District 13 Local** and run the **District 13 Authentication**
   collection in order.

With Postman CLI, run:

```bash
postman collection run postman/collections/authentication \
  --environment postman/environments/local.environment.yaml
```

The session lifecycle sends real requests and maintains the Postman cookie jar.
It ends with logout and verifies that the access token from the revoked session
is rejected. The negative login request adds one failed-attempt record for the
selected username and IP.

The separate `District 13 Authentication Rate Limit` collection deliberately
sends five incorrect logins and checks that the sixth receives `429`. Run it
only when it is safe to lock the caller IP and selected username for 15 minutes.
Run it after a clean 15-minute window, since the limiter counts all failed
logins from that IP, including the single negative-login check in the main
collection.

```bash
postman collection run postman/collections/authentication-rate-limit \
  --environment postman/environments/local.environment.yaml
```

The collection linter validates the saved request schema; a successful live run
against the backend is required to verify runtime behavior.
