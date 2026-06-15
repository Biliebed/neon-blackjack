// API calls go through Next.js rewrites → proxied to VPS backend
export async function apiPost(endpoint: string, body: object) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiGet(endpoint: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${endpoint}?${query}` : endpoint;
  const res = await fetch(url);
  return res.json();
}
