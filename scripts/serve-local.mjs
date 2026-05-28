import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    if (url.pathname === "/api/catalog") {
      const upstream = await fetch("https://pyrimid.ai/api/v1/catalog", {
        headers: { accept: "application/json" },
      });
      response.writeHead(upstream.status, {
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
        "content-type": upstream.headers.get("content-type") || "application/json",
      });
      response.end(await upstream.text());
      return;
    }

    const safePath = path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(root, safePath === "/" ? "index.html" : safePath);
    const body = await fs.readFile(filePath);
    response.writeHead(200, {
      "content-type": types[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(body);
  } catch (error) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end(`Not found: ${error.message}`);
  }
});

server.listen(port, () => {
  console.log(`Local proof server listening on http://127.0.0.1:${port}`);
});
