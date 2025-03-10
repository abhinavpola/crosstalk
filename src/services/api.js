import axios from 'axios';

const createOpenAIClient = (apiKey, apiHost = 'api.openai.com') => {
  return axios.create({
    baseURL: `https://${apiHost}/v1`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });
};

const createAnthropicClient = (apiKey, apiHost = 'api.anthropic.com') => {
  return axios.create({
    baseURL: `https://${apiHost}/v1`,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }
  });
};

const createCustomClient = (apiKey, apiHost) => {
  // Check if the apiHost already contains the protocol
  const baseURL = apiHost.startsWith('http') ? apiHost : `https://${apiHost}`;
  
  return axios.create({
    baseURL: baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });
};

// Extract thinking content from response
const extractThinking = (content) => {
  // Check if the content has <think></think> tags
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;
  const match = content.match(thinkRegex);
  
  if (match && match[1]) {
    // Extract the content inside the think tags
    const thinking = match[1].trim();
    // Remove the think tags from the original content
    const cleanContent = content.replace(thinkRegex, '').trim();
    return { content: cleanContent, thinking };
  }
  
  // No thinking tags found
  return { content, thinking: null };
};

export const sendMessageToModel = async (message, settings) => {
  try {
    const { modelProvider, modelName, apiKey, apiHost } = settings;
    
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    if (!modelName) {
      throw new Error('Model name is required');
    }
    
    // Pass the message directly to the model without stripping anything
    // This ensures the model receives the message in the target language
    let actualMessage = message;
    console.log('Sending to model:', actualMessage);
    
    let client;
    let response;
    let responseContent;
    
    switch (modelProvider) {
      case 'openai':
        client = createOpenAIClient(apiKey, apiHost);
        response = await client.post('/chat/completions', {
          model: modelName,
          messages: [{ role: 'user', content: actualMessage }],
          max_tokens: settings.maxTokens || 1000,
          temperature: parseFloat(settings.temperature) || 0.7
        });
        responseContent = response.data.choices[0].message.content;
        break;
        
      case 'anthropic':
        client = createAnthropicClient(apiKey, apiHost);
        response = await client.post('/messages', {
          model: modelName,
          messages: [{ role: 'user', content: actualMessage }],
          max_tokens: settings.maxTokens || 1000,
          temperature: parseFloat(settings.temperature) || 0.7
        });
        responseContent = response.data.content[0].text;
        break;
        
      case 'custom':
        client = createCustomClient(apiKey, apiHost);
        // Don't append '/chat' since we're using the full URL
        response = await client.post('', {
          model: modelName,
          messages: [{ role: 'user', content: actualMessage }],
          temperature: parseFloat(settings.temperature) || 0.7,
          max_tokens: settings.maxTokens || 1000
        });
        // Parse response based on expected format
        console.log('Response from custom API:', response.data);
        responseContent = response.data.message || response.data.choices?.[0]?.message?.content || 
                response.data.content?.[0]?.text || response.data.response || 
                'Failed to parse response';
        break;
        
      default:
        throw new Error(`Unsupported model provider: ${modelProvider}`);
    }
    
    // Process the response to extract thinking content
    return extractThinking(responseContent);
    
  } catch (error) {
    console.error('API Error:', error);
    return { 
      content: `Error: ${error.message || 'Failed to communicate with the model'}`,
      thinking: null
    };
  }
};