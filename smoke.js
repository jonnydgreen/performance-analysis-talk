import { readFile } from "node:fs/promises";
import { fetch } from "undici";

const query = await readFile("getEntities.graphql", "utf-8");

const start = process.hrtime();
const response = await fetch("http://localhost:3000/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query,
  }),
});
// ... processing
const end = process.hrtime(start);
const duration = Number.parseInt((end[0] * 1000) + (end[1] / 1000000));

console.log("Got response:", response.status, response.statusText);
console.log(`Time taken: ${duration}ms`);
const json = await response.json();
console.log(json);
