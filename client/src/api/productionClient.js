const envApiUrl = import.meta.env.VITE_API_URL?.trim();
let resolvedApiUrl = envApiUrl;

if (!resolvedApiUrl) {
  const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  resolvedApiUrl = fallbackOrigin;
  console.warn('VITE_API_URL not set - falling back to window.location.origin', {
    fallbackOrigin,
  });
}

const API_URL = resolvedApiUrl ? resolvedApiUrl.replace(/\/$/, '') : '';

console.log('API Configuration:', {
  API_URL,
  nodeEnv: import.meta.env.NODE_ENV,
  isDev: import.meta.env.DEV,
  usedFallback: !envApiUrl,
});

const toIdString = (value) => {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  if (typeof value === 'object' && typeof value.toString === 'function') {
    const maybeString = value.toString();
    return typeof maybeString === 'string' ? maybeString : String(maybeString);
  }

  return String(value);
};

const normalizeEntity = (entity) => {
  if (Array.isArray(entity)) {
    return entity.map(normalizeEntity);
  }

  if (!entity || typeof entity !== 'object') {
    return entity;
  }

  const result = {};
  for (const [key, value] of Object.entries(entity)) {
    if (key === 'topic_id' || key === 'category_id') {
      continue;
    }
    result[key] = normalizeEntity(value);
  }

  const rawId = entity._id ?? entity.id;
  if (rawId !== undefined && rawId !== null) {
    const idString = toIdString(rawId);
    if (!result.id) {
      result.id = idString;
    }
    if (!result._id) {
      result._id = idString;
    }
  }

  if (entity.topic_id !== undefined) {
    if (entity.topic_id && typeof entity.topic_id === 'object') {
      const normalizedTopic = normalizeEntity(entity.topic_id);
      result.topic = normalizedTopic;
      result.topic_id = normalizedTopic?.id ?? normalizedTopic?._id ?? null;
    } else if (entity.topic_id !== null) {
      result.topic_id = toIdString(entity.topic_id);
    } else {
      result.topic_id = entity.topic_id;
    }
  }

  if (entity.category_id !== undefined) {
    if (entity.category_id && typeof entity.category_id === 'object') {
      const normalizedCategory = normalizeEntity(entity.category_id);
      result.category = normalizedCategory;
      result.category_id = normalizedCategory?.id ?? normalizedCategory?._id ?? null;
    } else if (entity.category_id !== null) {
      result.category_id = toIdString(entity.category_id);
    } else {
      result.category_id = entity.category_id;
    }
  }

  if (!result.created_date && entity.createdAt) {
    result.created_date = entity.createdAt;
  }

  if (!result.updated_date && entity.updatedAt) {
    result.updated_date = entity.updatedAt;
  }

  return result;
};

export class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    console.error('API Error:', { message, status });
  }
}

async function fetchAPI(endpoint, options = {}) {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = API_URL ? `${API_URL}${normalizedEndpoint}` : normalizedEndpoint;
  console.log('[fetchAPI] Starting request:', { url, method: options.method || 'GET' });
  
  const token = localStorage.getItem('token');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (isFormData && headers['Content-Type']) {
    delete headers['Content-Type'];
  }

  const requestOptions = {
    ...options,
    headers,
  };
  
  let response;
  try {
    console.log('[fetchAPI] Sending request with options:', { 
      url,
      method: requestOptions.method || 'GET',
      hasToken: !!token,
      isFormData
    });
    
    response = await fetch(url, requestOptions);
    
    console.log('[fetchAPI] Response received:', { 
      status: response.status, 
      ok: response.ok,
      contentType: response.headers.get('content-type')
    });
  } catch (err) {
    console.error('[fetchAPI] Network error:', err);
    throw new APIError('Network error: ' + err.message, 0);
  }

  // Always try to get response text first
  const text = await response.text();
  console.log('[fetchAPI] Response text:', text.slice(0, 150) + (text.length > 150 ? '...' : ''));
  
  // Then parse as JSON if it looks like JSON
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    console.error('[fetchAPI] JSON parse error:', err);
    throw new APIError(`Invalid JSON response: ${text.slice(0, 100)}...`, response.status);
  }

  if (!response.ok) {
    console.error('[fetchAPI] Error response:', { status: response.status, data });
    throw new APIError(data?.message || 'API Error', response.status);
  }

  return data;
}

export const base44 = {
  auth: {
    signup: async (data) => {
      return fetchAPI('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    login: async (email, password) => {
      console.log('API login attempt:', { email }); // Debug log
      try {
        const result = await fetchAPI('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        console.log('API login response:', result); // Debug log
        return result;
      } catch (err) {
        console.error('API login error:', err); // Debug log
        throw err;
      }
    },
    me: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new APIError('No token found', 401);
      }
      return fetchAPI('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
    forgotPassword: async (email) => {
      return fetchAPI('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },
    resetPassword: async (token, password) => {
      return fetchAPI('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });
    },
  },
  entities: {
    ToolCategory: {
      list: async () => normalizeEntity(await fetchAPI('/api/tool-categories')),
      create: async (data) => normalizeEntity(await fetchAPI('/api/tool-categories', {
        method: 'POST',
        body: JSON.stringify(data),
      })),
      update: async (id, data) => normalizeEntity(await fetchAPI(`/api/tool-categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })),
      delete: async (id) => fetchAPI(`/api/tool-categories/${id}`, {
        method: 'DELETE',
      }),
    },
    Tool: {
      list: async (categoryId) => normalizeEntity(await fetchAPI(
        categoryId ? `/api/tools?categoryId=${categoryId}` : '/api/tools'
      )),
      create: async (data) => normalizeEntity(await fetchAPI('/api/tools', {
        method: 'POST',
        body: JSON.stringify(data),
      })),
      update: async (id, data) => normalizeEntity(await fetchAPI(`/api/tools/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })),
      delete: async (id) => fetchAPI(`/api/tools/${id}`, {
        method: 'DELETE',
      }),
    },
    Topic: {
      list: async (orderBy) => normalizeEntity(await fetchAPI(`/api/topics?orderBy=${orderBy || ''}`)),
      create: async (data) => normalizeEntity(await fetchAPI('/api/topics', {
        method: 'POST',
        body: JSON.stringify(data),
      })),
      update: async (id, data) => normalizeEntity(await fetchAPI(`/api/topics/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })),
      delete: async (id) => fetchAPI(`/api/topics/${id}`, {
        method: 'DELETE',
      }),
      filter: async (query) => normalizeEntity(await fetchAPI(`/api/topics/search?q=${query.search || ''}`)),
    },
    Material: {
      list: async () => normalizeEntity(await fetchAPI('/api/materials')),
      create: async (data) => normalizeEntity(await fetchAPI('/api/materials', {
        method: 'POST',
        body: JSON.stringify(data),
      })),
      update: async (id, data) => normalizeEntity(await fetchAPI(`/api/materials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })),
      delete: async (id) => fetchAPI(`/api/materials/${id}`, {
        method: 'DELETE',
      }),
      filter: async (query, orderBy) => 
        normalizeEntity(await fetchAPI(`/api/materials/filter?topicId=${query.topic_id}&orderBy=${orderBy || ''}`)),
    },
    SourceCode: {
      list: async (orderBy) => normalizeEntity(await fetchAPI(`/api/source-code?orderBy=${orderBy || ''}`)),
      create: async (data) => normalizeEntity(await fetchAPI('/api/source-code', {
        method: 'POST',
        body: JSON.stringify(data),
      })),
      update: async (id, data) => normalizeEntity(await fetchAPI(`/api/source-code/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })),
      delete: async (id) => fetchAPI(`/api/source-code/${id}`, {
        method: 'DELETE',
      }),
      filter: async (query) => normalizeEntity(await fetchAPI(`/api/source-code/search?q=${query.search || ''}`)),
    },
    User: {
      // Admin-only: list all users
      list: async (orderBy) => normalizeEntity(await fetchAPI(`/api/admin/users${orderBy ? `?orderBy=${orderBy}` : ''}`)),
      // Update user role: promote or demote using server admin endpoints
      update: async (id, data) => {
        const role = data?.role;
        const permissions = data?.permissions;
        if (permissions && typeof permissions === 'object') {
          return normalizeEntity(await fetchAPI(`/api/admin/permissions/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ permissions }),
          }));
        }
        if (role === 'admin') {
          return normalizeEntity(await fetchAPI(`/api/admin/make-admin/${id}`, { 
            method: 'PUT',
            body: data?.permissions ? JSON.stringify({ permissions: data.permissions }) : undefined,
          }));
        }
        if (role === 'user') {
          return normalizeEntity(await fetchAPI(`/api/admin/revoke-admin/${id}`, { method: 'PUT' }));
        }
        throw new APIError('Unsupported role change requested', 400);
      },
    },
  },
  integrations: {
    Core: {
      UploadFiles: async ({ files }) => {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }
        return fetchAPI('/api/uploads/materials', {
          method: 'POST',
          body: formData,
        });
      },
    },
  },
};