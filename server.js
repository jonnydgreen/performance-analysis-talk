import { context, trace } from '@opentelemetry/api'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import { Resource } from '@opentelemetry/resources'
import { BasicTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql'
import opentelemetry from '@autotelic/fastify-opentelemetry'

import Fastify from 'fastify'
import mercurius from 'mercurius'
import { readFile } from 'node:fs/promises'

const exporter = new OTLPTraceExporter()
const serviceName = 'slow-server'
const provider = new BasicTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName
  })
})
const graphQLInstrumentation = new GraphQLInstrumentation()
graphQLInstrumentation.setTracerProvider(provider)
graphQLInstrumentation.enable()
context.setGlobalContextManager(new AsyncLocalStorageContextManager())
provider.addSpanProcessor(new SimpleSpanProcessor(exporter))
provider.register()
const tracer = trace.getTracer('slow-server')

const app = Fastify()
app.register(opentelemetry, { serviceName })

const raw = await readFile('data.json', 'utf-8')

const schema = await readFile('schema.graphql', 'utf-8')

const resolvers = {
  Query: {
    async getEntities() {
      const span = tracer.startSpan('getEntities')
      const ctx = trace.setSpan(context.active(), span)
      try {
        return await context.with(ctx, () => JSON.parse(raw))
      } finally {
        span.end()
      }
    }
  }
}

app.addHook('onRoute', (route) => {
  const { handler } = route
  route.handler = async (req, res) => {
    const { context: ctx } = req.openTelemetry()
    return context.with(ctx, () => handler(req, res))
  }
})

app.register(mercurius, {
  schema,
  resolvers
})

await app.listen({ port: 3000 })
