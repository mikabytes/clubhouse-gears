import express from "express"
import crypto from "crypto"
import bodyParser from "body-parser"
import getTimeBasedChanges from "./getTimeBasedChanges.js"
import morgan from "morgan"
import Clubhouse from "clubhouse-lib"
import fetch from "node-fetch"
import storiesToRules from "./storiesToRules.js"
import util from "util"

const extensions = []

export function addExtension(name, implementation) {
  extensions.push([name, implementation])
}

const api = Clubhouse.create(process.env.CLUBHOUSE_API_TOKEN)

addExtension(`fetch`, fetch)
addExtension(`api`, api)

const port = process.env.PORT || 80
const defaultSecret = `oh-so-secret`
const secret = process.env.SECRET || defaultSecret

let rules = new Map()

async function setupRules() {
  rules.clear()

  const localVariables = `
    const id = action.id
    const entity_type = action.entity_type
    const action_type = action.action
    const story_type = action.story_type
    const name = action.name
    const app_url = action.appUrl
    const changes = action.changes || {}
    const author_id = action.author_id
  `

  for await (const [whenCode, thenCode, story] of storiesToRules(
    downloadStories()
  )) {
    const c = createConsole({story})

    try {
      const whenFunc = new Function(
        `action`,
        `metadata`,
        `console`,
        ...extensions.map(([it]) => it),
        `
          ${localVariables}

          return (${whenCode})
        `
      )
      whenFunc.story = story
      whenFunc.code = whenCode

      const thenFunc = new Function(
        `action`,
        `metadata`,
        `console`,
        ...extensions.map(([it]) => it),
        `
          ${localVariables}

          return (async function(){ ${thenCode} })()
        `
      )
      thenFunc.story = story
      thenFunc.code = thenCode

      when(whenFunc).then(thenFunc)
    } catch(e) {
      c.error(e)
    }
  }

  // add our own hook to update scripts whenever a matching gears rule is updated
  when(
    (action) =>
      action.entity_type === `story` &&
      action.name.match(/^when ?\([^)]+\)$/i) &&
      (action.changes.name ||
        action.changes.description ||
        action.changes.label_ids)
  ).then(({ name }) => {
    setupRules()
    console.log(`=== Updated rules because a change was detected to: ${name}`)
  })
}

async function* downloadStories() {
  let res = await api.searchStories(`!is:archived label:"gears"`)

  yield* res.data.values()

  while (res.next) {
    res = await res.fetchNext()
    yield* res.data.values()
  }
}

const app = express()
app.use(morgan(`dev`))
app.use(bodyParser.text({ type: `application/json` }))

if (secret === defaultSecret) {
  console.warn(
    `Secret isn't configured, so we are not protected from malicious otters.`
  )
}

app.post(`/`, async (req, res) => {
  const signature = req.get(`Clubhouse-Signature`)

  if (!signature || !correctDigest(req.body, signature)) {
    console.log(`Invalid signature ${signature}`)
    return res.status(401).json({ message: `You are unauthorized.` })
  }

  let json
  try {
    json = JSON.parse(req.body)
  } catch (e) {
    console.error(`Could not parse:\n${req.body}`)
    return res.status(400).json({ message: `You sent an invalid body.` })
  }

  if (!json.references) {
    json.references = []
  }

  for (const action of json.actions) {
    if (action && action.changes) {
      let changes = action.changes
      for (const key in changes) {
        if (
          changes[key] &&
          changes[key].new !== undefined &&
          changes[key].old !== undefined
        ) {
          // this is a reference, automatically copy it from references
          const newRef = json.references.find(
            (it) => it.id === changes[key].new
          )
          const oldRef = json.references.find(
            (it) => it.id === changes[key].old
          )

          if (newRef && oldRef) {
            changes[key].new = newRef
            changes[key].old = oldRef
          }
        }
      }
    }
  }

  console.log(JSON.stringify(json, null, 4))

  await broadcast(json.actions, json)
})

function createConsole(source) {
  const id = source.story && source.story.id

  const c = {
    async log(...stuff) {
      console.log(source.code, source.action, ...stuff)
      if (id) {
        await api.createStoryComment(
          id,
          stuff
            .map((it) =>
              typeof it === `string` ? it : "```\n" + stringify(it) + "\n```"
            )
            .join(`\n\n`)
        )
      }
    },
    async error(...stuff) {
      console.error(source.code, source.action, ...stuff)

      if (id) {
        await api.createStoryComment(
          id,
          `:bangbang:` +
            stuff
              .map((it) =>
                typeof it === `string` ? it : "```\n" + stringify(it) + "\n```"
              )
              .join(`\n\n`)
        )
      }
    },
  }
  c.info = c.log
  return c
}

async function broadcast(actions, metadata) {
  for (const [when, thens] of rules) {
    for (const action of actions) {
      let pass
      const c = createConsole(when)
      try {
        pass = when(action, metadata, c, ...extensions.map(([_, it]) => it))
      } catch (e) {
        c.error(e)
        continue
      }

      if (pass) {
        for (const then of thens) {
          const c = createConsole(then)
          try {
            await then(action, metadata, c, ...extensions.map(([_, it]) => it))
          } catch (e) {
            c.error(e)
          }
        }
      }
    }
  }
}

function correctDigest(body, signature) {
  const hmac = crypto.createHmac(`sha256`, secret, { encoding: `utf8` })
  hmac.update(body)
  const expectedSignature = hmac.digest(`hex`)

  return expectedSignature === signature
}

export function when(predicate) {
  if (!rules.has(predicate)) {
    rules.set(predicate, new Set())
  }
  return {
    then(action) {
      rules.get(predicate).add(action)
    },
  }
}

function broadcastTimeBasedActions() {
  const date = new Date()
  const [changes, reference] = getTimeBasedChanges(date)
  broadcast(
    [{ id: date.getTime(), entity_type: `time`, action: `update`, changes }],
    reference
  )
}

async function run() {
  try {
    setInterval(broadcastTimeBasedActions, 60000)

    app.listen(port)

    await setupRules()
  } catch (e) {
    console.error(e)
  }
}

function stringify(obj) {
  return util.inspect(obj)
  // JSON.stringify(
  //   obj,
  //   function replacer(key, value) {
  //     const type = typeof value
  //     if (value === undefined) {
  //       return `undefined`
  //     }
  //     if (value === null) {
  //       return `null`
  //     }
  //     if ([`symbol`, `function`].includes(type)) {
  //       return value.toString()
  //     }
  //     if (value instanceof Error) {
  //       return value.stack
  //     }
  //     if (value instanceof WeakMap) {
  //       return value.toString()
  //     }
  //     if (value instanceof Map) {
  //       const ret = {}
  //       for (const k of value.keys()) {
  //         ret[k] = value.get(k)
  //       }

  //       return ret
  //     }
  //     if (value instanceof Set) {
  //       return [...value.values()]
  //     }
  //     return value
  //   },
  //   4
  // )
}

run()
