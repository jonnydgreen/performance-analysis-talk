import autocannon from "autocannon";
import { readFile } from "node:fs/promises";

const query = await readFile("getEntities.graphql", "utf-8");

const instance = autocannon(
  {
    url: "http://localhost:3000/graphql",
    connections: 100,
    title: "",
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ query }),
  },
  (err) => {
    if (err) {
      console.error(err);
    }
  },
);

process.once("SIGINT", () => {
  instance.stop();
});

autocannon.track(instance, { renderProgressBar: true });
