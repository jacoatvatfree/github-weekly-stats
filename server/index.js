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

try {
  await fastify.listen({ port: 80, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
