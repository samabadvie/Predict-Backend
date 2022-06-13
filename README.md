# Predict-Backend

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
