# Clubhouse Gears

Make anything happen automically. Define your rules directly as Clubhouse Stories. 

To give you a taste, check out these few examples. However, possibilities really are endless. See the [recipies](#Recipies) for code.

- Every third wednesday of the month, create a new story in project "Company maintenance" named "Send invoices". Set due date 7 days later.
- When a story in project "Design" is completed, create a new story in project "Engineering" with the same name and with a relationship to the design story.
- When a story is moved to "Release" column, send an e-mail using Sendgrid.
- For every story created, search Wikipedia for information about name and comment an excerpt. (why would you want this?)

## Installation

**Note of caution:** All code provided in Clubhouse stories is executed on the server. This means that all members of Clubhouse will be able to run any code wherever this is deployed. It is recommended to run Gears in an isolated environment such as Docker or a VM on a network that shares no sensitive resources.

```
npm install mikabytes/clubhouse-gears
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


