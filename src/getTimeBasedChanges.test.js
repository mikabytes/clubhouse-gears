import assert from "assert"
import getTimeBasedChanges from "./getTimeBasedChanges.js"

describe(`getTimeBasedChanges`, () => {
  it(`should always include minute as change, and rest in reference`, () => {
    const [changes, reference] = getTimeBasedChanges(
      new Date(2021, 2, 11, 17, 20)
    )
    assert.equal(changes.minute, 20)
    assert.equal(reference.minute, 20)
    assert.equal(reference.hour, 17)
    assert.equal(reference.dayOfWeek, 3)
    assert.equal(reference.day, 11)
    assert.equal(reference.week, 10)
    assert.equal(reference.daysOfMonth, 2) // 2nd thursday of month
    assert.equal(reference.month, 2)
    assert.equal(reference.year, 2021)
  })

  it(`should include new hour`, () => {
    const [changes] = getTimeBasedChanges(new Date(2021, 0, 1, 10, 0))
    assert.deepEqual(changes, { minute: 0, hour: 10 })
  })

  it(`should include new day, dayOfWeek`, () => {
    const [changes] = getTimeBasedChanges(new Date(2021, 2, 11, 0, 0))
    assert.deepEqual(changes, { minute: 0, hour: 0, day: 11, dayOfWeek: 3 })
  })

  it(`should include new week`, () => {
    const [changes] = getTimeBasedChanges(new Date(2021, 2, 15, 0, 0))
    assert.deepEqual(changes, {
      minute: 0,
      hour: 0,
      day: 15,
      dayOfWeek: 0,
      week: 11,
    })
  })

  it(`should include Q1`, () => {
    let [changes] = getTimeBasedChanges(new Date(2021, 0, 1, 0, 0))
    assert.equal(changes.quarter, 1)
  })

  it(`should include Q2`, () => {
    let [changes] = getTimeBasedChanges(new Date(2021, 3, 1, 0, 0))
    assert.equal(changes.quarter, 2)
  })
  it(`should include Q3`, () => {
    let [changes] = getTimeBasedChanges(new Date(2021, 6, 1, 0, 0))
    assert.equal(changes.quarter, 3)
  })
  it(`should include Q4`, () => {
    let [changes] = getTimeBasedChanges(new Date(2021, 9, 1, 0, 0))
    assert.equal(changes.quarter, 4)
  })

  it(`should include new month`, () => {
    const [changes] = getTimeBasedChanges(new Date(2021, 2, 1, 0, 0))
    assert.deepEqual(changes, {
      minute: 0,
      hour: 0,
      day: 1,
      dayOfWeek: 0,
      week: 9,
      month: 2,
    })
  })

  it(`should include new year`, () => {
    const [changes] = getTimeBasedChanges(new Date(2021, 0, 1, 0, 0))
    assert.deepEqual(changes, {
      minute: 0,
      hour: 0,
      day: 1,
      dayOfWeek: 4,
      month: 0,
      quarter: 1,
      year: 2021,
    })
  })
})
