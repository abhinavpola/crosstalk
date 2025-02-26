import axios from 'axios';

// Google Translate API implementation

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
    
    // Use Google Translate API to translate from English to target language
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const response = await axios.post(url, {
      q: text,
      target: targetLanguage,
      format: 'text'
    });
    
    // Return the translated text from the API response
    return {
      translatedText: response.data.data.translations[0].translatedText,
      detectedSourceLanguage: 'en'
    };
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback to original text if translation fails
    return {
      translatedText: text,
      detectedSourceLanguage: 'en',
      error: 'Translation failed: ' + error.message
    };
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
    
    // Use Google Translate API to translate from target language to English
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const response = await axios.post(url, {
      q: text,
      source: targetLanguage,
      target: 'en',
      format: 'text'
    });
    
    // Return the translated text from the API response
    return {
      translatedText: response.data.data.translations[0].translatedText,
      detectedSourceLanguage: targetLanguage
    };
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback with error message if translation fails
    return {
      translatedText: `Error translating from ${targetLanguage}: ${error.message}`,
      detectedSourceLanguage: targetLanguage,
      error: 'Translation failed'
    };
  }
};