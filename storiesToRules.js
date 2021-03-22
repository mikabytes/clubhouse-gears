export default async function* storiesToRules(stories) {
  for await (const story of stories) {
    const match = story.name.match(/^when ?\(([^)]*)\)$/i)
    if (match) {
      yield [
        match[1],
        story.description
          .split("```")
          .filter((it, i) => i % 2 === 1)
          .map((it) => it.replace(/^.*\n/, ``)) // remove code block type, if any
          .join(`\n`),
        story,
      ]
    }
  }
}
