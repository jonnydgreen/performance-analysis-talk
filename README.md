# performance-analysis-talk

This talk covers the following:

- How to diagnose performance issues in your application
- How to load (and smoke) test your application
- How to generate flame graphs
- An example of a performance issue
- An example fixing a performance

## The problem

- Seeing latency of ~1.5s in requests in production
- Getting close to exceeding our SLA - i.e. out of budget
- What are SLAs, SLOs, SLIs?
  - SLA: Agreement between provider and client about measurables (e.g. service
    will be available 99% of the time)
  - SLO: Agreement within an SLA about a specific metric (e.g. 99 uptime)
  - SLI: Measures compliance with an SLO (e.g. measurement of uptime)
- Individually requests seemed fine but under load, they started to slow down as
  indicated by OpenTelemetry
  - Only noticeable under large amounts of data
  - Usually this is a sign of the event loop being blocked in Node.js

So let's go through an example:

### Server

- Identify key bits

```bash
npm run start
```

### OTEL

- Showcase at: http://localhost:16686

```bash
npm run start:collector
```

### Smoke

- Quickly go through the smoke test

```bash
npm run smoke
```

Navigate to http://localhost:16686

### Load

 - Go through the load test

```bash
npm run load
```

Navigate to http://localhost:16686

Ruh roh!(Hopefully!)

## The diagnosis

- Identify that there is a problem through OTEL
  - This is usually the starting point for most things
  - Not something we have in the Cove yet but we're working on implementing it
    soon
- Needed a performance issue analysis using a flamegraph and work out if
  anything was affecting the Node.js event loop
- What is a flamegraph?
  - A flamegraph is a visualization of stack traces
    - The width of the stack trace is proportional to the amount of time spent
      in that function
    - The y-axis is the stack trace
    - The x-axis is the time spent in that function
  - Great for quickly detecting slow functions and pin-pointing bottlenecks

### Flamegraph 1 (recommended by Node.js)

 - Can use a single command but better for production servers

```bash
npx 0x --collect-only server.js
```

```bash
npm run load
```

```bash
npx 0x --visualize-only <pid.0x>
open <pid.0x>/flamegraph.html
```

### Flamegraph 2

```bash
node --prof server.js
```

```bash
npm run load
```

```bash
node --prof-process --preprocess -j isolate-0xblahblahblah-v8/log | npx flamebearer
```


- The issue was in
  [`graphql-js`](https://github.com/graphql/graphql-js/issues/723) when large
  amounts of data need to be returned

## The fix

- Several options:
  - Reduce the amount of data: wasn't possible for the client
  - Fix in OS - looked like a very hard problem
  - Fix in our server - not perfect but would offer significant improvements
- Solution:
  - Cache selected operations where we were seeing performance issues
  - Skip `graphql-js` processing
  - Return the response immediately

### Flamegraph

```bash
npx 0x --collect-only server-fixed.js
```

```bash
npm run load
```

```bash
npx 0x --visualize-only <pid.0x>
open <pid.0x>/flamegraph.html
```

- Future:
  - Bought time to fix in OS
  - Could ignore `fastify` sanitisation as well
  - Look into other GraphQL servers (e.g. rust version - incidentally, this had
    the same issue)
