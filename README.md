# Clubhouse Gears

Make anything happen automically. Define your rules directly as Clubhouse Stories. 

To give you a taste, check out these few examples. However, possibilities really are endless. See the [recipies](#Recipies) for code.

- Every third wednesday of the month, create a new story in project "Company maintenance" named "Send invoices". Set due date 7 days later.
- When a story in project "Design" is completed, create a new story in project "Engineering" with the same name and with a relationship to the design story.
- When a story is moved to "Release" column, send an e-mail using Sendgrid.
- For every story created, search Wikipedia for information about name and comment an excerpt. (why would you want this?)

# Installation

**Note of caution:** All code provided in Clubhouse stories is executed on the server. This means that all members of Clubhouse will be able to run any code wherever this is deployed. It is recommended to run Gears in an isolated environment such as Docker or a VM on a network that shares no sensitive resources.

## Running locally
```
npm install mikabytes/clubhouse-gears

CLUBHOUSE="insert clubhouse API token here" PORT="1337" SECRET="insert clubhouse secret here" gears
```

## Run in docker

```
git clone git@github.com:mikabytes/clubhouse-gears

cd clubhouse-gears

sudo docker build -t gears .
sudo docker run -e CLUBHOUSE="insert clubhouse API token here" -e SECRET="insert clubhouse secret here" -p 1337:80 -it gears
```

# Recipies

# API

When executing code the `action` and `metadata` variables are always available. The `action` object has two origins:
1. From [Webhooks](https://clubhouse.io/api/webhook/v1/) API.
2. From internal Time module. 

`metadata` is all data available, and depends on the nature of the action.

Gears do provide a few convenience variables to the action object, just to ease the strain on your fingers:

| variable | origin | meaning
|-|-
| id | `action.id` | ID of story, epic, comment, etc.
| entity_type | `action.entity_type` | "story", "epic", "time"
| action_type | `action.action`, i.e.  "create", "update"
| name | `action.name`, the name of the story or the epic in question
| app_url | `action.appUrl`, the public url
| changes | `action.changes`, the changes involved in this action, i.e. tags being changed, description updated, etc.
| author_id | `action.author_id`, ID of the user who created a comment


## Webhook API

This is prone to change, so not detailed here. See Clubhouse site for information: https://clubhouse.io/api/webhook/v1/

Whenever `references` key is set, Gears will automatically copy the referenced object into the action itself. Again, this is a convenience thing.

## Time API

This is an internal module that submits actions when time has passed various criterias. This is especially suitable when automating the creation of stories that are recurring in nature. Time module always set `entity_type = "time"` and `action = "update"`. The `changes` variable holds one key for each criteria met

| criteria name | possible values | meaning
| - | - |
| minute | 0 to 59 | A new minute
| hour | 0 to 23 | A new hour
| day | 1 to 31 | A new calendar day
| dayOfWeek | 0 to 6 | A new week day, 0 = monday, 6 = sunday
| week | 1 to 53 | A new calendar week (ISO-8601)
| daysOfMonth | 1 to 5 | New number of week days in month. I.e. if today is a thursday and daysOfMonth = 3, then today is the third thursday this month
| month | 1 to 12 | A new month
| quarter | 1 to 4 | A new quarter
| year | 1 to 12 | A new year

Note that all these criterias are always present in `metadata` variable. However `action.changes` will only include the ones that are relevant for the current action.

# Extensions

Gears includes two extensions by default:

## `api`

This is an instance of [Clubhouse official API](https://github.com/clubhouse/clubhouse-lib). As it is prone to change, it is not detailed here. 

At the time of this writing they have no documentation either. However, the code is pretty self-explanatory [here](https://github.com/clubhouse/clubhouse-lib/blob/main/src/index.ts)

## `fetch`

This is an implementation of WHATWG fetch for node. Use it as you would normally use `fetch` in the browser.

## Custom

You may add your custom extensions. To do so, create your own NPM package and instantiate Gears this way:

```
npm add mikabytes/clubhouse-gears
```

```
import { addExtension, run } from "clubhouse-gears"

function kaboom(date, warningMessage) {
  robotArm.initiateSelfDestruct(date)
  speakers.tts(warningMessage)
}

addExtension(`kaboom`, kaboom)
run()
```

Your stories can now have code like: `kaboom(new Date().getTime() + 60000, "Self-destruct in T minus 60 seconds")`

# Recipes

See these examples as a great way to understand how this all comes together.

## Create story for invoicing every first and third wednesday of each month

```
when ([1, 3].includes(changes.dayOfWeek))
```

```javascript

```

## Add information from Wikipedia

This comments on a newly created story with an excerpt from Wikipedia.

```
when (entity_type === `story` && action_type === `create`)
```

```

```javascript
url = `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exsentences=1&titles=${name.split(` `)[0]}`

json = await (fetch(url).then(res => res.json()))

api.createStoryComment(id, Object.values(json.query.pages)[0].extract)
```
```
