import express from "express"
import crypto from "crypto"
import bodyParser from "body-parser"
import getTimeBasedChanges from "./getTimeBasedChanges.js"
import morgan from "morgan"

const port = process.env.PORT || 80
const defaultSecret = `oh-so-secret`
const secret = process.env.SECRET || defaultSecret

let rules = new Map()

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
    if (action) {
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

app.listen(port)

async function broadcast(actions, metadata) {
  for (const [when, thens] of rules) {
    for (const action of actions) {
      let pass
      try {
        pass = when(action, json)
      } catch (e) {
        console.error(
          `\n====There was an error when(${when.toString()}(${JSON.stringify(
            action
          )})\n`
        )
        console.error(e)
        console.error(``)
        continue
      }

      if (pass) {
        for (const then of thens) {
          try {
            await then(action, json)
          } catch (e) {
            console.error(
              `\n====There was an error when(${then.toString()}(${JSON.stringify(
                action
              )})\n`
            )
            console.error(e)
            console.error(``)
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
  const [changes, reference] = getTimeBasedChanges(new Date())
  broadcast(changes, reference)
}

setInterval(broadcastTimeBasedActions, 60)
