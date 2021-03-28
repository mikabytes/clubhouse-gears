#!/usr/bin/env node

import { addExtension, run } from "clubhouse-gears"

function kaboom(date, warningMessage) {
  robotArm.initiateSelfDestruct(date)
  speakers.tts(warningMessage)
}

addExtension(`kaboom`, kaboom)
run()

const customers = [`BigAppleInc`, `DarknessInc`] // or fetch this from some external API
const projects = await api.listProjects()
api.createStory({
  name: "Send invoices",
  description: `Send invoices to ${customers.join(`, `)}`,
  projectId: projects.find((it) => it.name === `Abstrakt`).id,
  deadline: new Date().getTime() + 60000 * 60 * 24 * 7,
})
