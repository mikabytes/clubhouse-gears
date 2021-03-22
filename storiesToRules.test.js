import assert from "assert"
import _storiesToRules from "./storiesToRules.js"

// convenience function for the stories as values are already known, not await'd to be fetched over network
async function storiesToRules(stories) {
  let all = []

  for await (const story of _storiesToRules(stories)) {
    all.push(story)
  }

  return all
}

describe(`storiesToRules`, async () => {
  it(`should not include stories whose title doesn't start with 'when'`, async () => {
    const rules = await storiesToRules([
      { name: `Not starting with 'when'`, description: `` },
    ])

    assert.equal(rules.length, 0)
  })

  it(`should include stories that starts with 'when'`, async () => {
    const rules = await storiesToRules([
      { name: `when()`, description: `` },
      { name: `wHEN()`, description: `` },
      { name: `when ()`, description: `` },
      { name: `wHEN ()`, description: `` },
    ])

    assert.equal(rules.length, 4)
  })

  it(`should include story as third argument`, async () => {
    const rules = await storiesToRules([
      { id: 3, name: `when()`, description: `` },
    ])

    assert.equal(rules[0][2].id, 3)
  })

  it(`should return an array with condition as first entry`, async () => {
    const rules = await storiesToRules([
      { name: `when (some javascript here)`, description: `` },
    ])

    assert.equal(rules[0][0], `some javascript here`)
  })

  it(`should return an array with any markdown code blocks as WHEN`, async () => {
    const rules = await storiesToRules([
      {
        name: `when (condition)`,
        description:
          "Not here\n```javascript\nthis is\ncode\n\nmultiline\n```\nbut this is not included\n```though this is``` and again not",
      },
    ])

    assert.equal(rules[0][1], `this is\ncode\n\nmultiline\n\nthough this is`)
  })
})
