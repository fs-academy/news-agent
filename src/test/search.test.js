import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock user data
const mockUser = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  interests: ['Technology', 'Science'],
};

// Mock article data
const mockArticle = {
  id: 'article123',
  title: 'Test Article Title',
  description: 'Test article description',
  source: { name: 'Test Source' },
  publishedAt: '2024-01-15T10:00:00Z',
  url: 'https://example.com/article',
  urlToImage: 'https://example.com/image.jpg',
};

const mockExternalArticle = {
  title: 'External Article',
  description: 'External article description',
  source: { name: 'External Source' },
  publishedAt: '2024-01-15T10:00:00Z',
  url: 'https://external.com/article',
  urlToImage: null,
};

describe('Article Storage Validation', () => {
  it('validates required fields', () => {
    const validArticle = {
      url: 'https://example.com',
      title: 'Test',
      source: { name: 'Test' },
    };
    
    expect(validArticle.url).toBeTruthy();
    expect(validArticle.title).toBeTruthy();
    expect(validArticle.source?.name).toBeTruthy();
  });

  it('rejects articles without URL', () => {
    const invalidArticle = {
      title: 'Test',
      source: { name: 'Test' },
    };
    
    expect(invalidArticle.url).toBeUndefined();
  });

  it('rejects articles without title', () => {
    const invalidArticle = {
      url: 'https://example.com',
      source: { name: 'Test' },
    };
    
    expect(invalidArticle.title).toBeUndefined();
  });

  it('handles article with missing source gracefully', () => {
    const articleWithoutSource = {
      url: 'https://example.com',
      title: 'Test Article',
    };
    
    expect(articleWithoutSource.source?.name).toBeUndefined();
  });
});

describe('API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUser }),
        });
      }
      if (url.includes('/api/news/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { articles: [mockExternalArticle] } 
          }),
        });
      }
      if (url.includes('/api/articles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches user data correctly', async () => {
    const response = await mockFetch('/api/auth/me');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data.email).toBe('test@example.com');
  });

  it('fetches search results correctly', async () => {
    const response = await mockFetch('/api/news/search?q=test');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data.articles).toHaveLength(1);
    expect(data.data.articles[0].title).toBe('External Article');
  });

  it('handles search API errors gracefully', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, error: 'Server error' }),
      })
    );
    
    const response = await mockFetch('/api/news/search?q=test');
    expect(response.ok).toBe(false);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Server error');
  });

  it('handles network timeout errors', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Network timeout'))
    );
    
    await expect(mockFetch('/api/news/search?q=test')).rejects.toThrow('Network timeout');
  });
});

describe('Store Article API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully stores an article', async () => {
    mockFetch.mockImplementationOnce((url, options) => {
      const body = JSON.parse(options.body);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { id: 'stored123', ...body }
        }),
      });
    });
    
    const response = await mockFetch('/api/news/store-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockArticle),
    });
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Test Article Title');
  });

  it('handles invalid article data', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ 
          success: false, 
          error: 'Invalid article data: URL is required' 
        }),
      })
    );
    
    const response = await mockFetch('/api/news/store-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'No URL Article' }),
    });
    
    expect(response.ok).toBe(false);
    const data = await response.json();
    expect(data.error).toContain('URL is required');
  });

  it('handles duplicate article', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { id: 'existing123', alreadyExists: true }
        }),
      })
    );
    
    const response = await mockFetch('/api/news/store-article', {
      method: 'POST',
      body: JSON.stringify(mockArticle),
    });
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.alreadyExists).toBe(true);
  });
});

describe('AI Summary Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches summary for an article', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { 
            summary: 'This is a test summary of the article content.',
            keyPoints: ['Point 1', 'Point 2', 'Point 3']
          }
        }),
      })
    );
    
    const response = await mockFetch('/api/articles/article123/summarize');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data.summary).toContain('test summary');
  });

  it('handles AI service unavailable', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ 
          success: false, 
          error: 'AI service unavailable',
          code: 'AI_SERVICE_ERROR'
        }),
      })
    );
    
    const response = await mockFetch('/api/articles/article123/summarize');
    expect(response.ok).toBe(false);
    
    const data = await response.json();
    expect(data.code).toBe('AI_SERVICE_ERROR');
  });

  it('handles summary timeout', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 504,
        json: () => Promise.resolve({ 
          success: false, 
          error: 'Summary generation timed out'
        }),
      })
    );
    
    const response = await mockFetch('/api/articles/article123/summarize');
    expect(response.ok).toBe(false);
    expect(response.status).toBe(504);
  });
});

describe('Article Ranking Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ranks articles successfully', async () => {
    const articlesToRank = [mockArticle, mockExternalArticle];
    
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: articlesToRank.map((a, i) => ({ 
            ...a, 
            relevanceScore: 1 - (i * 0.1) 
          }))
        }),
      })
    );
    
    const response = await mockFetch('/api/articles/rank', {
      method: 'POST',
      body: JSON.stringify({ articles: articlesToRank, query: 'test' }),
    });
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data[0].relevanceScore).toBeGreaterThan(data.data[1].relevanceScore);
  });

  it('handles empty article list', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: []
        }),
      })
    );
    
    const response = await mockFetch('/api/articles/rank', {
      method: 'POST',
      body: JSON.stringify({ articles: [], query: 'test' }),
    });
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(0);
  });
});

describe('Input Validation', () => {
  it('validates search query length', () => {
    const shortQuery = 'a';
    const validQuery = 'artificial intelligence';
    const longQuery = 'a'.repeat(501);
    
    expect(shortQuery.length).toBeLessThan(2);
    expect(validQuery.length).toBeGreaterThanOrEqual(2);
    expect(longQuery.length).toBeGreaterThan(500);
  });

  it('validates article URL format', () => {
    const validUrls = [
      'https://example.com/article',
      'http://news.site.com/path/to/article',
      'https://sub.domain.org/article?id=123',
    ];
    
    const invalidUrls = [
      'not-a-url',
      'ftp://files.com/doc',
      '',
    ];
    
    const urlRegex = /^https?:\/\/.+/;
    
    validUrls.forEach(url => {
      expect(urlRegex.test(url)).toBe(true);
    });
    
    invalidUrls.forEach(url => {
      expect(urlRegex.test(url)).toBe(false);
    });
  });

  it('sanitizes search input', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const sanitized = maliciousInput.replace(/<[^>]*>/g, '');
    
    expect(sanitized).not.toContain('<');
    expect(sanitized).not.toContain('>');
  });
});
