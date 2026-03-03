const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchStats(email, year = 2026) {
  const res = await fetch(
    `${API_BASE}/stats?email=${encodeURIComponent(email)}&year=${year}`
  );
  return handleResponse(res);
}

export async function fetchAssignments(email, year = 2026) {
  const res = await fetch(
    `${API_BASE}/assignments?email=${encodeURIComponent(email)}&year=${year}`
  );
  return handleResponse(res);
}

export async function fetchPendingAssignments(email, year = 2026) {
  const res = await fetch(
    `${API_BASE}/assignments/pending?email=${encodeURIComponent(email)}&year=${year}`
  );
  return handleResponse(res);
}

export async function fetchAllAssignments(email, year = 2026) {
  const res = await fetch(
    `${API_BASE}/assignments/all?email=${encodeURIComponent(email)}&year=${year}`
  );
  return handleResponse(res);
}

export async function fetchSubmittedAssignments(email, year = 2026) {
  const res = await fetch(
    `${API_BASE}/assignments/submitted?email=${encodeURIComponent(email)}&year=${year}`
  );
  return handleResponse(res);
}

export async function fetchWhatsappStatus(email) {
  const res = await fetch(
    `${API_BASE}/user-whatsapp?email=${encodeURIComponent(email)}`
  );
  return handleResponse(res);
}

export async function toggleWhatsapp(email) {
  const res = await fetch(`${API_BASE}/toggle-whatsapp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function fetchTelegramStatus(email) {
  const res = await fetch(
    `${API_BASE}/user-telegram?email=${encodeURIComponent(email)}`
  );
  return handleResponse(res);
}

export async function toggleTelegram(email) {
  const res = await fetch(`${API_BASE}/toggle-telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function generateTelegramToken(email) {
  const res = await fetch(
    `${API_BASE}/generate-telegram-token?email=${encodeURIComponent(email)}`
  );
  return handleResponse(res);
}
