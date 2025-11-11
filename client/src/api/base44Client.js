// Mock base44 client with in-memory storage
const storage = {
  topics: [],
  materials: [],
  tools: [],
  toolCategories: [],
  sourceCodes: [],
  users: [
    {
      id: '1',
      email: 'user@example.com',
      full_name: 'Test User',
      role: 'admin'
    }
  ]
};

export const base44 = {
  auth: {
    me: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to get user data');
      }
      return response.json();
    },
    login: async (email, password) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        throw new Error('Invalid credentials');
      }
      return response.json();
    },
    signup: async (userData) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      if (!response.ok) {
        throw new Error('Failed to create account');
      }
      return response.json();
    },
    forgotPassword: async (email) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      if (!response.ok) {
        throw new Error('Failed to process request');
      }
      return response.json();
    },
    resetPassword: async (token, password) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password })
      });
      if (!response.ok) {
        throw new Error('Failed to reset password');
      }
      return response.json();
    }
  },
  entities: {
    Topic: {
      list: async (orderBy) => {
        if (orderBy === "order") {
          return [...storage.topics].sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        return storage.topics;
      },
      create: async (data) => {
        const newTopic = { id: Date.now().toString(), ...data };
        storage.topics.push(newTopic);
        return newTopic;
      },
      update: async (id, data) => {
        const index = storage.topics.findIndex(t => t.id === id);
        if (index !== -1) {
          storage.topics[index] = { ...storage.topics[index], ...data };
          return storage.topics[index];
        }
        throw new Error('Topic not found');
      },
      delete: async (id) => {
        const index = storage.topics.findIndex(t => t.id === id);
        if (index !== -1) {
          storage.topics.splice(index, 1);
          // Also delete related materials
          storage.materials = storage.materials.filter(m => m.topic_id !== id);
        }
      },
      filter: async (query) => storage.topics.filter(t => 
        t.title.toLowerCase().includes((query.search || '').toLowerCase())
      )
    },
    Material: {
      list: async () => storage.materials,
      create: async (data) => {
        const newMaterial = { id: Date.now().toString(), ...data };
        storage.materials.push(newMaterial);
        return newMaterial;
      },
      update: async (id, data) => {
        const index = storage.materials.findIndex(m => m.id === id);
        if (index !== -1) {
          storage.materials[index] = { ...storage.materials[index], ...data };
          return storage.materials[index];
        }
        throw new Error('Material not found');
      },
      delete: async (id) => {
        const index = storage.materials.findIndex(m => m.id === id);
        if (index !== -1) {
          storage.materials.splice(index, 1);
        }
      },
      filter: async ({ topic_id }, orderBy) => {
        let filtered = storage.materials.filter(m => m.topic_id === topic_id);
        if (orderBy === "order") {
          filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        return filtered;
      }
    },
    Tool: {
      list: async (orderBy) => {
        if (orderBy === "order") {
          return [...storage.tools].sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        return storage.tools;
      },
      create: async (data) => {
        const newTool = { id: Date.now().toString(), ...data };
        storage.tools.push(newTool);
        return newTool;
      },
      update: async (id, data) => {
        const index = storage.tools.findIndex(t => t.id === id);
        if (index !== -1) {
          storage.tools[index] = { ...storage.tools[index], ...data };
          return storage.tools[index];
        }
        throw new Error('Tool not found');
      },
      delete: async (id) => {
        const index = storage.tools.findIndex(t => t.id === id);
        if (index !== -1) {
          storage.tools.splice(index, 1);
        }
      }
    },
    ToolCategory: {
      list: async (orderBy) => {
        if (orderBy === "order") {
          return [...storage.toolCategories].sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        return storage.toolCategories;
      },
      create: async (data) => {
        const newCategory = { id: Date.now().toString(), ...data };
        storage.toolCategories.push(newCategory);
        return newCategory;
      },
      update: async (id, data) => {
        const index = storage.toolCategories.findIndex(c => c.id === id);
        if (index !== -1) {
          storage.toolCategories[index] = { ...storage.toolCategories[index], ...data };
          return storage.toolCategories[index];
        }
        throw new Error('Category not found');
      },
      delete: async (id) => {
        const index = storage.toolCategories.findIndex(c => c.id === id);
        if (index !== -1) {
          storage.toolCategories.splice(index, 1);
          // Also delete related tools
          storage.tools = storage.tools.filter(t => t.category_id !== id);
        }
      }
    },
    SourceCode: {
      list: async (orderBy) => {
        if (orderBy === "-created_date") {
          return [...storage.sourceCodes].reverse();
        }
        return storage.sourceCodes;
      },
      create: async (data) => {
        const newRepo = { 
          id: Date.now().toString(), 
          created_date: new Date().toISOString(),
          ...data 
        };
        storage.sourceCodes.push(newRepo);
        return newRepo;
      },
      filter: async (query) => storage.sourceCodes.filter(repo => 
        repo.name.toLowerCase().includes((query.search || '').toLowerCase()) ||
        repo.description?.toLowerCase().includes((query.search || '').toLowerCase()) ||
        repo.tags?.some(tag => tag.toLowerCase().includes((query.search || '').toLowerCase()))
      )
    },
    User: {
      list: async (orderBy) => {
        if (orderBy === "-created_date") {
          return [...storage.users].reverse();
        }
        return storage.users;
      },
      update: async (id, data) => {
        const index = storage.users.findIndex(u => u.id === id);
        if (index !== -1) {
          storage.users[index] = { ...storage.users[index], ...data };
          return storage.users[index];
        }
        throw new Error('User not found');
      }
    }
  }
};

base44.integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      try {
        const fileUrl = URL.createObjectURL(file);
        return {
          file_url: fileUrl,
          file_name: file.name,
          mime_type: file.type,
          size: file.size,
        };
      } catch (error) {
        throw new Error('Mock upload failed');
      }
    }
  }
};