import axios from 'axios';

// Check if @google-cloud/translate is available
let translateClient = null;
let translateSetup = false;

// Setup translation client with service account credentials
const setupTranslationClient = (serviceAccountJson) => {
  try {
    if (typeof window !== 'undefined' && window.TranslateV2) {
      const credentials = JSON.parse(serviceAccountJson);
      
      translateClient = new window.TranslateV2({
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key
        },
        projectId: credentials.project_id
      });
      
      translateSetup = true;
      console.log('Google Translation client setup successfully');
      return true;
    } else {
      console.warn('TranslateV2 not available in the browser environment');
      return false;
    }
  } catch (error) {
    console.error('Error setting up translation client:', error);
    return false;
  }
};

export const translateText = async (text, targetLanguage, apiKey) => {
  try {
    if (!apiKey) {
      console.warn('No translation API key provided, using mock translation');
      
      // For demo purposes without API key
      return {
        translatedText: `[${targetLanguage}] ${text}`,
        detectedSourceLanguage: 'en'
      };
    }
    
    // Try to determine if this is a service account JSON
    let isServiceAccount = false;
    
    try {
      const credentials = JSON.parse(apiKey);
      isServiceAccount = (credentials.type === 'service_account' && 
                         credentials.client_email && 
                         credentials.private_key);
    } catch (e) {
      // Not JSON, assume it's a simple API key
      isServiceAccount = false;
    }

    // Handle service account credentials
    if (isServiceAccount) {
      // The example shows we need to use the @google-cloud/translate library
      // This won't work directly in browser, would need a backend
      
      // Important note: In a browser environment, this won't work directly 
      // because the authentication requires Node.js libraries for JWT generation
      console.error('Service account authentication requires a backend service');
      
      throw new Error(
        'Service account JSON detected: This requires a backend proxy. ' +
        'For browser apps, use a regular API key or create a proxy backend. ' +
        'Google authentication for service accounts cannot be done securely in the browser.'
      );
    }
    
    // Regular API key approach
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const response = await axios.post(url, {
      q: text,
      target: targetLanguage,
      format: 'text'
    });
    
    // Extract translated text from response
    if (response.data && response.data.data && response.data.data.translations) {
      return {
        translatedText: response.data.data.translations[0].translatedText,
        detectedSourceLanguage: 'en'
      };
    } else {
      throw new Error('Unexpected translation API response format');
    }
  } catch (error) {
    console.error('Translation error:', error);
    // Throw the error so it can be caught by the caller
    throw new Error(`Translation failed: ${error.message}`);
  }
};

export const translateFromTarget = async (text, targetLanguage, apiKey) => {
  try {
    if (!apiKey) {
      console.warn('No translation API key provided, using mock translation');
      
      // For demo purposes without API key
      return {
        translatedText: `[Translated from ${targetLanguage}] ${text}`,
        detectedSourceLanguage: targetLanguage
      };
    }
    
    // Try to determine if this is a service account JSON
    let isServiceAccount = false;
    
    try {
      const credentials = JSON.parse(apiKey);
      isServiceAccount = (credentials.type === 'service_account' && 
                         credentials.client_email && 
                         credentials.private_key);
    } catch (e) {
      // Not JSON, assume it's a simple API key
      isServiceAccount = false;
    }

    // Handle service account credentials
    if (isServiceAccount) {
      // Same limitation as translateText - would need a backend
      throw new Error(
        'Service account JSON detected: This requires a backend proxy. ' +
        'For browser apps, use a regular API key or create a proxy backend. ' +
        'Google authentication for service accounts cannot be done securely in the browser.'
      );
    }
    
    // Regular API key approach
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const response = await axios.post(url, {
      q: text,
      source: targetLanguage,
      target: 'en',
      format: 'text'
    });
    
    // Extract translated text from response
    if (response.data && response.data.data && response.data.data.translations) {
      return {
        translatedText: response.data.data.translations[0].translatedText,
        detectedSourceLanguage: targetLanguage
      };
    } else {
      throw new Error('Unexpected translation API response format');
    }
  } catch (error) {
    console.error('Translation error:', error);
    // Throw the error so it can be caught by the caller
    throw new Error(`Translation failed: ${error.message}`);
  }
};