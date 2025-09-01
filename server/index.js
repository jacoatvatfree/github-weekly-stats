import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true,
});

// Enable CORS
await fastify.register(cors, {
  origin: true,
});

// Serve static files
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, "..", "dist"),
  prefix: "/",
});

// Proxy endpoint for GitHub images
fastify.get("/api/proxy-image", async (request, reply) => {
  const { url, token } = request.query;

  if (!url || !token) {
    return reply.code(400).send({ error: "Missing url or token parameter" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    const buffer = await response.arrayBuffer();

    reply.header("Content-Type", contentType).send(Buffer.from(buffer));
  } catch (error) {
    request.log.error("Failed to proxy image:", error);
    return reply.code(500).send({ error: "Failed to proxy image" });
  }
});

// Proxy endpoint for Linear GraphQL API
fastify.post("/api/linear-proxy", async (request, reply) => {
  const { query, variables, apiKey } = request.body;

  if (!query || !apiKey) {
    return reply.code(400).send({ error: "Missing query or apiKey in request body" });
  }

  const isDebug = process.env.LOG_LEVEL === 'debug';
  
  if (isDebug) {
    request.log.info(`Linear API request - Query: ${query.substring(0, 100)}...`);
    request.log.info(`Linear API request - Variables: ${JSON.stringify(variables)}`);
    request.log.info(`Linear API request - API Key starts with: ${apiKey.substring(0, 10)}...`);
    request.log.info(`Linear API request - Full Authorization header: ${apiKey}`);
  }

  try {
    const response = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": apiKey,
      },
      body: JSON.stringify({
        query,
        variables: variables || {},
      }),
    });

    const responseText = await response.text();
    
    if (isDebug) {
      request.log.info(`Linear API response status: ${response.status}`);
      request.log.info(`Linear API response body: ${responseText}`);
    }

    if (!response.ok) {
      request.log.error(`Linear API error: ${response.status} ${response.statusText}`, responseText);
      return reply.code(response.status).send({ 
        error: `Linear API error: ${response.statusText}`,
        details: responseText 
      });
    }

    const data = JSON.parse(responseText);
    return reply.send(data);
  } catch (error) {
    request.log.error("Failed to proxy Linear request:", error);
    return reply.code(500).send({ error: "Failed to proxy Linear request" });
  }
});

try {
  await fastify.listen({ port: process.env.VITE_API_PORT || process.env.PORT || 3000, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
