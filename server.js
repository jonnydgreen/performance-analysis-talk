import Fastify from 'fastify'
import mercurius from 'mercurius'
import { readFile } from 'node:fs/promises'

const app = Fastify()

const raw = await readFile('data.json', 'utf-8')

const schema = await readFile('schema.graphql', 'utf-8')

const resolvers = {
  Query: {
    getEntities() {
      return JSON.parse(raw)
    }
  }
}

app.register(mercurius, {
  schema,
  resolvers
})

await app.listen({ port: 3000 })
