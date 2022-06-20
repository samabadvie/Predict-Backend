# Predict-Backend

This repository create for implemented predict price of crypto currencies.

Features:
* Access to APIs just with API-KEY
* SignUp/ Login/ Forget password of users
* Get profile info / update profile/ upload profile image/ Delete profile
* Users communications: Follow/ Unfollow/ Block/ Unblock
* Submit predictions/ Copy predictions from other users
* Get Real-Time price from messari websocket.
* Check predictions meet conditions and change status (success or fail)
* User statistics info(like playing time - corrects predicts - ...)
* Notification implemented with Firebase Cloud Messaging(FCM)

## Prerequisites

* mysql 8+
* node 12+
* npm 6+
* git
* a database named with `_test` prefixed to main db.


## Installation

```bash
> git clone https://gitlab.com/samabadvie/c
> cd predict-backend
> cp .env.example .env (update to meet your environment specific values)
> npm ci
> npm run build
> node dist/main.js 
```

## Documentation

Make sure `ENABLE_SWAGGER` env is set to `true`. Now point your browser to [URL:PORT/api](URL:PORT/api)
