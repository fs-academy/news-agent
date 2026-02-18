/**
 * Hugging Face Summarization Service
 * 
 * This service handles text summarization using the Hugging Face Inference API
 * with the Falconsai/text_summarization model (T5-small fine-tuned).
 * 
 * Features:
 * - Reads full article content for comprehensive understanding
 * - Generates complete 3-5 sentence summaries
 * - Retry logic for transient failures
 * - No dependency on Python service
 * 
 * Completely standalone - works independently of any other backend service.
 */

import { config } from '../config.js';

/**
 * Get the model name from config
 * @returns {string} Model name
 */
function getModelName() {
  return config.huggingface?.model || 'Falconsai/text_summarization';
}

/**
 * Get API token from config
 * @returns {string} API token
 */
function getApiToken() {
  return config.huggingface?.apiToken || '';
}

/**
 * Simple semaphore for concurrency control
 */
class Semaphore {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.currentCount = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.currentCount < this.maxConcurrent) {
      this.currentCount++;
      return;
    }
    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }

  release() {
    this.currentCount--;
    if (this.queue.length > 0) {
      this.currentCount++;
      const next = this.queue.shift();
      next();
    }
  }
}

// Limit concurrent requests
const summarizationSemaphore = new Semaphore(2);

/**
 * Clean and prepare article text for summarization
 * @param {string} text - Raw article text
 * @returns {string} Cleaned text
 */
function cleanArticleText(text) {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, ' ')           // Remove HTML tags
    .replace(/\s+/g, ' ')               // Normalize whitespace
    .replace(/\[.*?\]/g, '')            // Remove brackets
    .replace(/\(.*?Getty.*?\)/gi, '')   // Remove photo credits
    .replace(/\(.*?Reuters.*?\)/gi, '')
    .replace(/\(.*?AP.*?\)/gi, '')
    .replace(/Advertisement/gi, '')     // Remove ad markers
    .replace(/Continue reading.*/gi, '')
    .replace(/Read more.*/gi, '')
    .trim();
}

/**
 * Prepare content for the model - keep it concise for T5-small
 * T5-small works best with ~512-1024 tokens input
 * @param {string} content - Full article content
 * @param {string} title - Article title
 * @returns {string} Prepared text for summarization
 */
function prepareInputText(content, title = '') {
  const cleaned = cleanArticleText(content);
  
  // T5-small model works best with shorter inputs (around 512-1024 tokens ≈ 2000-4000 chars)
  // Taking too much text can cause truncation in output
  const maxInputChars = 2500;
  
  let inputText = cleaned;
  
  // If content is too long, take the most important parts
  if (cleaned.length > maxInputChars) {
    // Take first 80% and last 20% for context
    const firstPart = Math.floor(maxInputChars * 0.8);
    const lastPart = maxInputChars - firstPart;
    
    inputText = cleaned.substring(0, firstPart) + ' ' + 
                cleaned.substring(cleaned.length - lastPart);
  }
  
  // Add title for context if available
  if (title) {
    inputText = `${title}. ${inputText}`;
  }
  
  return inputText;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call Hugging Face Inference API with retry logic
 * @param {string} inputText - Text to summarize
 * @param {Object} options - API options
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<{summary?: string, error?: string}>}
 */
async function callHuggingFaceAPI(inputText, options = {}, retryCount = 0) {
  const { 
    maxLength = 256,    // Good for 3-5 complete sentences
    minLength = 50,     // Ensure meaningful output
    timeout = 60000     // 60s timeout
  } = options;
  
  const model = getModelName();
  const token = getApiToken();
  const maxRetries = 2;
  
  // Build API URL
  const apiUrl = `https://router.huggingface.co/hf-inference/models/${model}`;
  
  console.log(`[HuggingFace] API call attempt ${retryCount + 1}/${maxRetries + 1}`, { 
    model,
    inputLength: inputText.length,
    maxLength,
    minLength
  });
  
  // Validate token
  if (!token) {
    console.error('[HuggingFace] No API token configured');
    return { error: 'API token required. Set HF_API_TOKEN in .env' };
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        inputs: inputText,
        parameters: {
          max_length: maxLength,
          min_length: minLength,
          do_sample: false,
          num_beams: 4,           // Better quality output
          early_stopping: true,   // Stop when complete
          length_penalty: 1.0     // Balanced length
        },
        options: {
          wait_for_model: true,
          use_cache: true
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[HuggingFace] HTTP ${response.status}:`, errorText.substring(0, 150));
      
      // Retry on 503 (model loading) or 429 (rate limit)
      if ((response.status === 503 || response.status === 429) && retryCount < maxRetries) {
        const waitTime = response.status === 503 ? 5000 : 2000;
        console.log(`[HuggingFace] Retrying in ${waitTime/1000}s...`);
        await sleep(waitTime);
        return callHuggingFaceAPI(inputText, options, retryCount + 1);
      }
      
      if (response.status === 503) {
        return { error: 'Model is loading. Please try again in a few seconds.' };
      }
      if (response.status === 429) {
        return { error: 'Too many requests. Please try again in a moment.' };
      }
      if (response.status === 401 || response.status === 403) {
        return { error: 'Invalid API token. Check HF_API_TOKEN in .env' };
      }
      
      return { error: `API error: ${response.status}` };
    }
    
    // Parse response
    const result = await response.json();
    console.log('[HuggingFace] Response received:', JSON.stringify(result).substring(0, 150));
    
    // Extract summary from various response formats
    let summary = '';
    if (Array.isArray(result) && result.length > 0) {
      summary = result[0].summary_text || result[0].generated_text || '';
    } else if (result.summary_text) {
      summary = result.summary_text;
    } else if (result.generated_text) {
      summary = result.generated_text;
    }
    
    if (!summary) {
      if (retryCount < maxRetries) {
        console.log('[HuggingFace] Empty response, retrying...');
        await sleep(2000);
        return callHuggingFaceAPI(inputText, options, retryCount + 1);
      }
      return { error: 'No summary generated' };
    }
    
    return { summary: summary.trim() };
    
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[HuggingFace] Error:', err.message);
    
    // Retry on timeout
    if (err.name === 'AbortError' && retryCount < maxRetries) {
      console.log('[HuggingFace] Timeout, retrying with shorter input...');
      // On timeout retry, use shorter input
      const shorterInput = inputText.substring(0, Math.floor(inputText.length * 0.7));
      await sleep(1000);
      return callHuggingFaceAPI(shorterInput, options, retryCount + 1);
    }
    
    if (err.name === 'AbortError') {
      return { error: 'Request timed out. Please try again.' };
    }
    
    // Retry on network errors
    if (retryCount < maxRetries) {
      console.log('[HuggingFace] Network error, retrying...');
      await sleep(2000);
      return callHuggingFaceAPI(inputText, options, retryCount + 1);
    }
    
    return { error: `Network error: ${err.message}` };
  }
}

/**
 * Summarize article content using Hugging Face model
 * 
 * This function reads the article content and generates a complete summary
 * that captures the key points of the news.
 * 
 * @param {string} content - Full article content to summarize
 * @param {string} [title=''] - Article title for context
 * @param {Object} [options] - Optional configuration
 * @returns {Promise<{summary: string, error?: string}>} Summary result
 */
export async function summarizeArticle(content, title = '', options = {}) {
  // Validate input
  if (!content || typeof content !== 'string') {
    return { summary: '', error: 'No content provided' };
  }
  
  // Prepare input text (clean and truncate if needed)
  const inputText = prepareInputText(content, title);
  
  // Check if we have enough content
  if (inputText.length < 100) {
    return { summary: '', error: 'Article too short for summarization' };
  }
  
  // Acquire semaphore
  await summarizationSemaphore.acquire();
  
  try {
    console.log(`[HuggingFace] Summarizing: "${title?.substring(0, 40)}..." (${inputText.length} chars)`);
    
    // Call API with appropriate parameters for complete summaries
    const result = await callHuggingFaceAPI(inputText, {
      maxLength: 256,   // Enough for 3-5 complete sentences
      minLength: 50,    // Ensure meaningful content
      timeout: 45000    // 45s timeout per attempt
    });
    
    if (result.error) {
      return { summary: '', error: result.error };
    }
    
    if (!result.summary) {
      return { summary: '', error: 'Failed to generate summary' };
    }
    
    console.log(`[HuggingFace] Summary generated (${result.summary.length} chars)`);
    return { summary: result.summary };
    
  } finally {
    summarizationSemaphore.release();
  }
}

/**
 * Check if Hugging Face service is available
 * @returns {Promise<{available: boolean, message: string}>}
 */
export async function checkHealth() {
  const token = getApiToken();
  
  if (!token) {
    return {
      available: false,
      message: 'No API token configured (HF_API_TOKEN)'
    };
  }
  
  try {
    const result = await callHuggingFaceAPI('Test article about technology.', {
      maxLength: 30,
      minLength: 10,
      timeout: 15000
    });
    
    if (result.error) {
      if (result.error.includes('loading')) {
        return { available: true, message: 'Model loading, will be ready soon' };
      }
      return { available: false, message: result.error };
    }
    
    return { available: true, message: 'Service ready' };
  } catch (error) {
    return { available: false, message: error.message };
  }
}

export default {
  summarizeArticle,
  checkHealth
};
