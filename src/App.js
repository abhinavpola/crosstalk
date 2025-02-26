import React, { useState, useEffect } from 'react';
import ChatSide from './components/ChatSide';
import Settings from './components/Settings';
import { translateText, translateFromTarget } from './services/translate';
import { sendMessageToModel } from './services/api';

const App = () => {
  // Load settings from local storage if available
  const loadSavedSettings = () => {
    try {
      const savedSettings = JSON.parse(localStorage.getItem('crosstalk_settings')) || {};
      return {
        modelProvider: savedSettings.modelProvider || 'openai',
        modelName: savedSettings.modelName || 'gpt-4o',
        apiHost: savedSettings.apiHost || 'api.openai.com',
        apiKey: savedSettings.apiKey || '',
        targetLanguage: savedSettings.targetLanguage || 'es',
        translationApiKey: savedSettings.translationApiKey || '',
      };
    } catch (error) {
      console.error('Error loading saved settings:', error);
      return {
        modelProvider: 'openai',
        modelName: 'gpt-4o',
        apiHost: 'api.openai.com',
        apiKey: '',
        targetLanguage: 'es',
        translationApiKey: '',
      };
    }
  };
  
  const [settings, setSettings] = useState(loadSavedSettings());

  const [userMessages, setUserMessages] = useState([]);
  const [modelMessages, setModelMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to handle sending a message from the user side
  const handleSendUserMessage = async (message) => {
    setLoading(true);
    
    try {
      // Translate user message to target language
      const translatedMessage = await translateText(
        message, 
        settings.targetLanguage, 
        settings.translationApiKey
      );
      
      // Add user message to the user side (with both English and translated versions)
      const userMsg = { 
        type: 'user', 
        content: message, 
        translatedContent: translatedMessage.translatedText 
      };
      setUserMessages(prev => [...prev, userMsg]);
      
      // Add user message to the model side (with both English and translated versions)
      setModelMessages(prev => [...prev, { 
        type: 'user', 
        content: message, 
        translatedContent: translatedMessage.translatedText 
      }]);
      
      // Send translated message to the model
      const modelResponse = await sendMessageToModel(
        translatedMessage.translatedText, 
        settings
      );
      
      // Log the model response for debugging
      console.log('Model response:', modelResponse);
      
      // For testing purposes - extract English content if this is our own translation
      let englishResponse = modelResponse;
      
      // Translate model response back to English
      const translatedResponse = await translateFromTarget(
        modelResponse, 
        settings.targetLanguage, 
        settings.translationApiKey
      );
      englishResponse = translatedResponse.translatedText;
      
      // Add model response to the model side (original response in target language)
      setModelMessages(prev => [...prev, { 
        type: 'model', 
        content: englishResponse, // This will be ignored due to isModelSide=true
        translatedContent: modelResponse // This will be shown on model side
      }]);
      
      // Add model response to the user side (translated back to English)
      setUserMessages(prev => [...prev, { 
        type: 'model', 
        content: englishResponse, // English translation shown on user side
        translatedContent: modelResponse // This will be ignored due to isModelSide=false
      }]);
    } catch (error) {
      console.error('Error in message flow:', error);
      // Show error on both sides
      const errorMsg = `Error: ${error.message || 'Something went wrong'}`;
      setUserMessages(prev => [...prev, { 
        type: 'model', 
        content: errorMsg,
        translatedContent: errorMsg
      }]);
      setModelMessages(prev => [...prev, { 
        type: 'model', 
        content: errorMsg,
        translatedContent: errorMsg
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Get language name from code
  const getLanguageName = (code) => {
    const languageMap = {
      'af': 'Afrikaans',
      'ar': 'Arabic',
      'bg': 'Bulgarian',
      'ca': 'Catalan',
      'zh': 'Chinese',
      'hr': 'Croatian',
      'cs': 'Czech',
      'da': 'Danish',
      'nl': 'Dutch',
      'en': 'English',
      'et': 'Estonian',
      'fi': 'Finnish',
      'fr': 'French',
      'de': 'German',
      'el': 'Greek',
      'he': 'Hebrew',
      'hi': 'Hindi',
      'hu': 'Hungarian',
      'is': 'Icelandic',
      'id': 'Indonesian',
      'it': 'Italian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'lv': 'Latvian',
      'lt': 'Lithuanian',
      'no': 'Norwegian',
      'pl': 'Polish',
      'pt': 'Portuguese',
      'ro': 'Romanian',
      'ru': 'Russian',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'es': 'Spanish',
      'sv': 'Swedish',
      'th': 'Thai',
      'tr': 'Turkish',
      'uk': 'Ukrainian',
      'vi': 'Vietnamese',
    };
    
    return languageMap[code] || code;
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>CrossTalk: AI Translation Interface</h1>
        <p>Test AI models in different languages</p>
      </div>
      
      <Settings settings={settings} setSettings={setSettings} />
      
      <div className="chat-container">
        <ChatSide 
          title="User Side (English)" 
          messages={userMessages} 
          onSendMessage={handleSendUserMessage} 
          language="English"
          targetLanguage={getLanguageName(settings.targetLanguage)}
          isModelSide={false}
        />
        
        <ChatSide 
          title={`Model Side (${getLanguageName(settings.targetLanguage)})`} 
          messages={modelMessages} 
          language="English"
          targetLanguage={getLanguageName(settings.targetLanguage)}
          isModelSide={true}
        />
      </div>
      
      {loading && <div className="loading-indicator">Translating and processing...</div>}
    </div>
  );
};

export default App;