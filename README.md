# Clubhouse Gears - beta

_This has not been thoroughly tested_

Gears is a convenience library for automating tasks at Clubhouse.io. It has support for webhooks as well as time-based events.

## Get started

```
npm add mikabytes/clubhouse-gears
```

Default port is 80. Default secret is 'oh-so-secret' (secret is optional). Head on over to https://app.clubhouse.io/<your-organization-id>/settings/integrations/outgoing-webhook to set your URL and secret.

You may modify the port and secret using environment variables PORT and SECRET.

Then write your APP:

```
import {when} from "clubhouse-gears"

when(change => change.action === `delete`).then(async (action) => {
  console.log(`Oh no! Someone deleted story with title ${action.name}`)
})
```


