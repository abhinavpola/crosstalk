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
  return axios.create({
    baseURL: `https://${apiHost}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });
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
    
    switch (modelProvider) {
      case 'openai':
        client = createOpenAIClient(apiKey, apiHost);
        response = await client.post('/chat/completions', {
          model: modelName,
          messages: [{ role: 'user', content: actualMessage }],
          max_tokens: 1000
        });
        return response.data.choices[0].message.content;
        
      case 'anthropic':
        client = createAnthropicClient(apiKey, apiHost);
        response = await client.post('/messages', {
          model: modelName,
          messages: [{ role: 'user', content: actualMessage }],
          max_tokens: 1000
        });
        return response.data.content[0].text;
        
      case 'custom':
        client = createCustomClient(apiKey, apiHost);
        // This will need to be customized based on the API format
        response = await client.post('/chat', {
          model: modelName,
          messages: [{ role: 'user', content: actualMessage }]
        });
        // Parse response based on expected format
        return response.data.message || response.data.choices?.[0]?.message?.content || 
               response.data.content?.[0]?.text || response.data.response || 
               'Failed to parse response';
        
      default:
        throw new Error(`Unsupported model provider: ${modelProvider}`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return `Error: ${error.message || 'Failed to communicate with the model'}`;
  }
};