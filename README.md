# Clubhouse Gears

Gears is an extension to Clubhouse.io that enables automating common tasks in a WHEN-THEN pattern. Rules are written in plain Javascript and written directly in Clubhouse. 

<p align="center">
  <a href="http://www.youtube.com/watch?v=SpzzbbauKRA" title="Introduction to Clubhouse Gears">
  <img width="460" height="300" src="assets/youtube.png">
  </a>
</p>

Here's a taste:


- Every third wednesday of the month, create a new story in project "Company maintenance" named "Send invoices". Set due date 7 days later.
- When a story in project "Design" is completed, create a new story in project "Engineering" with the same name and with a relationship to the design story.
- When a story is moved to "Release" column, send an e-mail using Sendgrid.
- For every story created, search Wikipedia for information about name and comment an excerpt. (why would you want this?)

Possibilities really are endless. Also see [Recipes](#Recipes) for code.

# Preparation

1. You need to run Gears somewhere publicly available. For example DigitalOcean, or a home server (with port forwarding). An idea might also be to create a tunnel to your local computer (for local testing).
2. Create a Clubhouse Webhook. Go to clubhouse.io, click your profile picture, Integrations, Webhooks, Add New Webhook. Pick a secret and point it to your publicly available port.

# Installation

**Note of caution:** Code written in Clubhouse stories is executed on the server, meaning Clubhouse members _will be able to run malicious code_. It is recommended to run Gears in an isolated environment such as Docker or a VM on a network that shares no sensitive resources.

## Run locally
```
npm add -g clubhouse-gears

CLUBHOUSE="insert clubhouse API token here" PORT="1337" SECRET="insert clubhouse secret here" gears
```

## Run using Docker

This repository is built at Docker Hub using semver tags. I'd suggest sticking with the major version, unless you're feeling adventurous. See all versions here: https://hub.docker.com/repository/docker/mikabytes/clubhouse-gears/tags

You can also use tag `:latest` for the master branch. Thas is, however, not guaranteed to be stable.

```
sudo docker run -e CLUBHOUSE="insert clubhouse API token here" -e SECRET="insert clubhouse secret here" -p 1337:80 mikabytes/clubhouse-gears:1
```

# How to use

Gears fetches rules from Clubhouse. Any story that has the label "gears" set on it and a name that is formatted like "when (some code goes here)" will be used. See [Recipes](#Recipes) for examples.

When the trigger fires, Gears executes code blocks in the story description (as plain javascript). **Note**: only code blocks are used, so you are free to document your gear as you wish.

# API

When executing code the `action` and `metadata` variables are always available. The `action` object has two origins:
1. From [Webhooks](https://clubhouse.io/api/webhook/v1/) API.
2. From internal Time module. 

`metadata` is all data available, and depends on the nature of the action.

Gears do provide a few convenience variables to the action object, just to ease the strain on your fingers:

| variable | origin | meaning |
| - | - | - |
| id | `action.id` | ID of story, epic, comment, etc. |
| entity_type | `action.entity_type` | "story", "epic", "time" |
| action_type | `action.action`, i.e.  "create", "update" |
| name | `action.name`, the name of the story or the epic in question |
| app_url | `action.appUrl`, the public url |
| changes | `action.changes`, the changes involved in this action, i.e. tags being changed, description updated, etc. |
| author_id | `action.author_id`, ID of the user who created a comment |


## Webhook API

This is prone to change, so not detailed here. See Clubhouse site for information: https://clubhouse.io/api/webhook/v1/

Whenever `references` key is set, Gears will automatically copy the referenced object into the action itself. Again, this is a convenience thing.

## Time API

This is an internal module that submits actions when time has passed various criterias. This is especially suitable when automating the creation of stories that are recurring in nature. Time module always set `entity_type = "time"` and `action = "update"`. The `changes` variable holds one key for each criteria met

| criteria name | possible values | meaning |
| - | - | - |
| minute | 0 to 59 | A new minute |
| hour | 0 to 23 | A new hour |
| day | 1 to 31 | A new calendar day |
| dayOfWeek | 0 to 6 | A new week day, 0 = monday, 6 = sunday |
| week | 1 to 53 | A new calendar week (ISO-8601) |
| daysOfMonth | 1 to 5 | New number of week days in month. I.e. if today is a thursday and daysOfMonth = 3, then today is the third thursday this month |
| month | 1 to 12 | A new month |
| quarter | 1 to 4 | A new quarter |
| year | 1 to 12 | A new year |

These criterias are always present in `metadata` variable. However `action.changes` will only include the ones that are relevant for the current action.

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

Try these examples as a great way to understand how this all comes together.

## Create story for invoicing every first and third wednesday of each month

```
when (changes.dayOfWeek === 2 && [1, 3].includes(changes.daysOfMonth))
```

```javascript
// could also fetch customers from some external API
const customers = [`BigAppleInc`, `DarknessInc`] 
const projects = await api.listProjects()
const deadline = new Date(new Date().getTime() + 60000 * 60 * 24 * 7)
const story = await api.createStory({
  name: `Send invoices`,
  description: `Some desctiption goes here`, `)}`,
  project_id: projects.find((it) => it.name === `Abstrakt`).id,
  deadline: deadline.toISOString(),
})

for (const customer of customers) {
  await createTask(story.id, { description: customer })
}

console.log(`I created ch${story.id}`)
```

## Add information from Wikipedia

This comments on a newly created story with an excerpt from Wikipedia.

```
when (entity_type === `story` && action_type === `create`)
```

```javascript
url = `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exsentences=1&titles=${name.split(` `)[0]}`

json = await (fetch(url).then(res => res.json()))

api.createStoryComment(id, Object.values(json.query.pages)[0].extract)
```

## When story is completed, create related story

```
// `new` is true if the `new` state is completed, otherwise it is false. There is also `old`.
when (changes.completed && changes.completed.new)
```

```javascript
const whenFinishedProjectName = `design`
const thenCreateProjectName = `engineering`

const projects = await api.listProjects()
const project_id = projects.find(it => it.name === whenFinishedProjectName).id
const story = await api.getStory(id)

if (story.project_id === project_id) {
  const newStory = await api.createStory({ 
    name: story.name,
    description: `See linked story for design.`,
    project_id: projects.find(it => it.name === thenCreateProjectName).id,
    epic_id: story.epic_id,
  })

  await api.createStoryLink({
    object_id: story.id,
    subject_id: newStory.id,
    verb: `relates to`, // can also be 'blocks' or 'duplicates'
  })
}

console.log(`I just created this story ch${newStory.id}`)
```

## Add a command to clear all comments on a story

When anyone writes a comment with text `/clear`, all comments is deleted on that story. I find this especially useful when clearing error messages in a Gears story.

```
when (entity_type === `story-comment` && action_type === `create`)
```

```javascript
if (action.text === `/clear`) {
  storyId = action.app_url.match(/story\/(\d+)/)[1]
  story = await api.getStory(storyId)
  for (const comment of story.comments) {
    try {
      await api.deleteStoryComment(storyId, comment.id)
    } catch(e) {
      // api always throws error here, even if the call was successful. There's a request to fix that: https://github.com/clubhouse/clubhouse-lib/pull/98
    }
  }
}
```

# Roadmap

- Custom external triggers: When, or if, there's interest, I'll add a feature to provide additional triggers. This would enable external integration in some ways that are currently limited. It can still be done with some form of polling (based on the `minutes` event from `time` module).
