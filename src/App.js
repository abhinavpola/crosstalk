import React, { useState, useEffect } from 'react';
import ChatSide from './components/ChatSide';
import Settings from './components/Settings';
import { translateText, translateFromTarget } from './services/translate';
import { sendMessageToModel } from './services/api';
import { 
  logMessage, 
  getCurrentLogId, 
  startNewLog, 
  getLogEntries, 
  convertLogToMessages,
  downloadCurrentLogAsJsonl
} from './services/logger';

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
                temperature: savedSettings.temperature || 0.7,
                maxTokens: savedSettings.maxTokens || 1000,
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
                temperature: 0.7,
                maxTokens: 1000,
            };
        }
    };

    const [settings, setSettings] = useState(loadSavedSettings());

    const [userMessages, setUserMessages] = useState([]);
    const [modelMessages, setModelMessages] = useState([]);
    const [directModelMessages, setDirectModelMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentLogId, setCurrentLogId] = useState(getCurrentLogId());
    const [showSettings, setShowSettings] = useState(false);

    // Load previous conversation when component mounts
    useEffect(() => {
        const logId = getCurrentLogId();
        setCurrentLogId(logId);
        
        // Load messages from the current log
        const savedMessages = convertLogToMessages(logId);
        if (savedMessages.userMessages.length > 0) {
            setUserMessages(savedMessages.userMessages);
            setModelMessages(savedMessages.modelMessages);
            setDirectModelMessages(savedMessages.directModelMessages);
            console.log(`Loaded conversation from log: ${logId}`);
        }
    }, []);
    
    // Function to handle conversation reset
    const handleReset = () => {
        // Download current log first
        downloadCurrentLogAsJsonl();
        
        // Start a new log
        const newLogId = startNewLog();
        setCurrentLogId(newLogId);
        
        // Clear all messages
        setUserMessages([]);
        setModelMessages([]);
        setDirectModelMessages([]);
        
        console.log(`Started new conversation with log ID: ${newLogId}`);
    };

    // Function to handle sending a message from the user side
    const handleSendUserMessage = async (message) => {
        setLoading(true);

        try {
            // First add the user's original message to the UI immediately
            const userMsg = {
                type: 'user',
                content: message,
                translatedContent: "Translating..." // Placeholder until translation completes
            };
            setUserMessages(prev => [...prev, userMsg]);

            // Add user message to the model side with placeholder
            setModelMessages(prev => [...prev, {
                type: 'user',
                content: message,
                translatedContent: "Translating..."
            }]);

            // Add user message to the direct model side
            setDirectModelMessages(prev => [...prev, {
                type: 'user',
                content: message
            }]);
            
            // Log the user message for each side
            logMessage({
                messageType: 'user',
                side: 'user',
                content: message,
                translatedContent: "Translating..."
            });
            
            logMessage({
                messageType: 'user',
                side: 'model',
                content: message,
                translatedContent: "Translating..."
            });
            
            logMessage({
                messageType: 'user',
                side: 'directModel',
                content: message
            });

            // DIRECT MODEL: Send the original message directly to the model (no translation)
            // We do this in parallel with the translated version
            const directModelPromise = sendMessageToModel(message, settings);

            // Step 1: Translate user message to target language
            // If this fails, it will throw an error and no model query will happen
            const translatedMessage = await translateText(
                message,
                settings.targetLanguage,
                settings.translationApiKey
            );

            // Update with the actual translation
            setUserMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].translatedContent = translatedMessage.translatedText;
                return newMessages;
            });

            setModelMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].translatedContent = translatedMessage.translatedText;
                return newMessages;
            });
            
            // Update log entries with translated content
            logMessage({
                messageType: 'user',
                side: 'user',
                content: message,
                translatedContent: translatedMessage.translatedText,
                updatePrevious: true
            });
            
            logMessage({
                messageType: 'user',
                side: 'model',
                content: message,
                translatedContent: translatedMessage.translatedText,
                updatePrevious: true
            });

            // Step 2: Send translated message to the model
            const modelResponse = await sendMessageToModel(
                translatedMessage.translatedText,
                settings
            );

            // Log the model response for debugging
            console.log('Model response:', modelResponse);

            // Extract the content and thinking from the model response
            const { content: modelContent, thinking: modelThinking } = modelResponse;

            // Step 3: Translate both the model content and thinking back to English
            // First translate the main response
            const translatedResponse = await translateFromTarget(
                modelContent,
                settings.targetLanguage,
                settings.translationApiKey
            );

            const englishResponse = translatedResponse.translatedText;

            // Translate the thinking content if it exists
            let translatedThinking = null;
            if (modelThinking) {
                const thinkingTranslated = await translateFromTarget(
                    modelThinking,
                    settings.targetLanguage,
                    settings.translationApiKey
                );
                translatedThinking = thinkingTranslated.translatedText;
            }

            // Add model response to the model side (original response in target language)
            setModelMessages(prev => [...prev, {
                type: 'model',
                content: englishResponse, // This will be ignored due to isModelSide=true
                translatedContent: modelContent, // This will be shown on model side
                thinking: modelThinking, // Original language thinking for model side
                translatedThinking: modelThinking // Keep it untranslated for model side
            }]);

            // Add model response to the user side (translated back to English)
            setUserMessages(prev => [...prev, {
                type: 'model',
                content: englishResponse, // English translation shown on user side
                translatedContent: modelContent, // This will be ignored due to isModelSide=false
                thinking: translatedThinking, // Translated thinking for user side
                translatedThinking: translatedThinking // Keep it translated for user side
            }]);
            
            // Log model responses
            // Model side log (target language)
            logMessage({
                messageType: 'model',
                side: 'model',
                content: englishResponse,
                translatedContent: modelContent,
                thinking: modelThinking,
                translatedThinking: modelThinking
            });
            
            // User side log (English)
            logMessage({
                messageType: 'model',
                side: 'user',
                content: englishResponse,
                translatedContent: modelContent,
                thinking: translatedThinking,
                translatedThinking: translatedThinking
            });

            // Handle the direct model response (no translation)
            const directResponse = await directModelPromise;
            const { content: directContent, thinking: directThinking } = directResponse;

            // Add direct model response
            setDirectModelMessages(prev => [...prev, {
                type: 'model',
                content: directContent,
                thinking: directThinking
            }]);
            
            // Log direct model response
            logMessage({
                messageType: 'model',
                side: 'directModel',
                content: directContent,
                thinking: directThinking
            });
        } catch (error) {
            console.error('Error in message flow:', error);
            // Show error on all sides
            const errorMsg = `Error: ${error.message || 'Something went wrong'}`;

            // Update existing messages if they're in a pending state
            setUserMessages(prev => {
                if (prev.length > 0 && prev[prev.length - 1].translatedContent === "Translating...") {
                    // Update the last message to show it failed
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].translatedContent = `Translation failed`;

                    // Add the error message
                    return [...newMessages, {
                        type: 'model',
                        content: errorMsg,
                        translatedContent: errorMsg
                    }];
                } else {
                    // Just add the error message
                    return [...prev, {
                        type: 'model',
                        content: errorMsg,
                        translatedContent: errorMsg
                    }];
                }
            });

            setModelMessages(prev => {
                if (prev.length > 0 && prev[prev.length - 1].translatedContent === "Translating...") {
                    // Update the last message to show it failed
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].translatedContent = `Translation failed`;

                    // Add the error message
                    return [...newMessages, {
                        type: 'model',
                        content: errorMsg,
                        translatedContent: errorMsg
                    }];
                } else {
                    // Just add the error message
                    return [...prev, {
                        type: 'model',
                        content: errorMsg,
                        translatedContent: errorMsg
                    }];
                }
            });

            // Add error message to direct model side as well
            setDirectModelMessages(prev => {
                return [...prev, {
                    type: 'model',
                    content: errorMsg
                }];
            });
            
            // Log error on all sides
            logMessage({
                messageType: 'error',
                side: 'user',
                content: errorMsg
            });
            
            logMessage({
                messageType: 'error',
                side: 'model',
                content: errorMsg
            });
            
            logMessage({
                messageType: 'error',
                side: 'directModel',
                content: errorMsg
            });
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
                <div className="title-section">
                    <h1>CrossTalk: AI Translation Interface</h1>
                    <p className="subtitle">Test AI models in different languages</p>
                
                    <div className="control-buttons">
                        <button 
                            className="control-button reset-button"
                            onClick={handleReset}
                            title="Start a new conversation and download the current log"
                        >
                            New Conversation
                        </button>
                        <button 
                            className="control-button settings-toggle"
                            onClick={() => setShowSettings(!showSettings)}
                            title="Toggle settings visibility"
                        >
                            {showSettings ? 'Hide Settings' : 'Show Settings'}
                        </button>
                    </div>
                </div>
                <div className="log-info">
                    Log ID: {currentLogId}
                </div>
            </div>

            <Settings settings={settings} setSettings={setSettings} visible={showSettings} />

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

                <ChatSide
                    title="Direct Model (English)"
                    messages={directModelMessages}
                    language="English"
                    targetLanguage="English"
                    isModelSide={true}
                    isDirectModel={true}
                />
            </div>

            {loading && <div className="loading-indicator">Processing...</div>}
        </div>
    );
};

export default App;