import Fastify from "fastify";
import mercurius from "mercurius";
import { readFile } from "node:fs/promises";

const app = Fastify();

const raw = await readFile("data.json", "utf-8");

const schema = await readFile("schema.graphql", "utf-8");

const resolvers = {
  Query: {
    getEntities() {
      return JSON.parse(raw)
    }
  }
};

app.register(mercurius, {
  schema,
  resolvers,
});

const cache = new Map();

app.addHook("preHandler", async (request, reply) => {
  const hash = request.body.query;
  const cacheValue = cache.get(hash);
  if (cacheValue) {
    reply.send(cacheValue);
    return reply
  }
})

app.addHook('onSend', async (request, reply, payload) => {
  const hash = request.body.query;
  cache.set(hash, payload);
  return payload
})

await app.listen({ port: 3000 });
