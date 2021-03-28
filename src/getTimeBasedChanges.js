export default function getTimeBasedChanges(date) {
  const reference = {
    minute: date.getMinutes(),
    hour: date.getHours(),
    dayOfWeek: (7 + date.getDay() - 1) % 7, // day of week, starting monday,
    day: date.getDate(), // note: this is the only one that's not zero-based
    week: getWeekNumber(date),
    daysOfMonth: getDaysOfMonth(date),
    month: date.getMonth(),
    year: date.getFullYear(),
  }

  const changes = {
    minute: reference.minute,
  }

  if (reference.minute === 0) {
    changes.hour = reference.hour

    if (reference.hour === 0) {
      changes.day = reference.day
      changes.dayOfWeek = reference.dayOfWeek

      if (reference.dayOfWeek === 0) {
        changes.week = reference.week
      }

      if (reference.day === 1) {
        changes.month = reference.month

        if (reference.month === 0) {
          changes.year = reference.year
        }
      }
    }
  }

  return [changes, reference]
}

// from https://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
function getWeekNumber(d) {
  // Copy date so don't modify original
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  // Get first day of year
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  // Calculate full weeks to nearest Thursday
  var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return weekNo
}

function getDaysOfMonth(d) {
  let count = 0
  const month = d.getMonth()

  while (d.getMonth() === month) {
    count += 1
    d = new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000)
  }

  return count
}
