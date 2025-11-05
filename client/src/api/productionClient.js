const API_URL = import.meta.env.VITE_API_URL;

export class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

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
    Topic: {
      list: async (orderBy) => fetchAPI(`/topics?orderBy=${orderBy || ''}`),
      create: async (data) => fetchAPI('/topics', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      update: async (id, data) => fetchAPI(`/topics/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      delete: async (id) => fetchAPI(`/topics/${id}`, {
        method: 'DELETE',
      }),
      filter: async (query) => fetchAPI(`/topics/search?q=${query.search || ''}`),
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