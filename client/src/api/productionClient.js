const API_URL = import.meta.env.VITE_API_URL;

export class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  // Debugging: log requests so we can see what the client is calling in the browser console
  try {
    console.debug('[fetchAPI] ', options.method || 'GET', url, options);
  } catch (e) {
    // ignore console failures in non-browser envs
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (err) {
    // Network-level failure (DNS, refused connection, CORS preflight failure can surface here)
    throw new APIError(err.message || 'Network error', 0);
  }

  // Attempt to parse JSON; if parsing fails, provide text body for debugging
  let data;
  try {
    data = await response.json();
  } catch (err) {
    const text = await response.text().catch(() => '<<unreadable body>>');
    throw new APIError('Invalid JSON response: ' + text, response.status);
  }

  if (!response.ok) {
    throw new APIError(data.message || 'API Error', response.status);
  }

  return data;
}

export const base44 = {
  auth: {
    me: async () => fetchAPI('/auth/me'),
  },
  entities: {
    ToolCategory: {
      list: async () => fetchAPI('/api/tool-categories'),
      create: async (data) => fetchAPI('/api/tool-categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      update: async (id, data) => fetchAPI(`/api/tool-categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      delete: async (id) => fetchAPI(`/api/tool-categories/${id}`, {
        method: 'DELETE',
      }),
    },
    Tool: {
      list: async (categoryId) => fetchAPI(
        categoryId ? `/api/tools?categoryId=${categoryId}` : '/api/tools'
      ),
      create: async (data) => fetchAPI('/api/tools', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      update: async (id, data) => fetchAPI(`/api/tools/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      delete: async (id) => fetchAPI(`/api/tools/${id}`, {
        method: 'DELETE',
      }),
    },
    Topic: {
      list: async (orderBy) => fetchAPI(`/api/topics?orderBy=${orderBy || ''}`),
      create: async (data) => fetchAPI('/api/topics', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      update: async (id, data) => fetchAPI(`/api/topics/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      delete: async (id) => fetchAPI(`/api/topics/${id}`, {
        method: 'DELETE',
      }),
      filter: async (query) => fetchAPI(`/api/topics/search?q=${query.search || ''}`),
    },
    Material: {
      list: async () => fetchAPI('/materials'),
      create: async (data) => fetchAPI('/materials', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      update: async (id, data) => fetchAPI(`/materials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      delete: async (id) => fetchAPI(`/materials/${id}`, {
        method: 'DELETE',
      }),
      filter: async (query, orderBy) => 
        fetchAPI(`/materials/filter?topicId=${query.topic_id}&orderBy=${orderBy || ''}`),
    },
    // Add other entities following the same pattern...
  },
};