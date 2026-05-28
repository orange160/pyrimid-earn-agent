export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("allow", "GET");
    response.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const upstream = await fetch("https://pyrimid.ai/api/v1/catalog", {
    headers: { accept: "application/json" },
  });

  const body = await upstream.text();
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("cache-control", "s-maxage=60, stale-while-revalidate=300");
  response.setHeader("content-type", upstream.headers.get("content-type") || "application/json");
  response.status(upstream.status).send(body);
}
