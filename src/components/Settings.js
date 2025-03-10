import React from 'react';

const languages = [
    { code: 'af', name: 'Afrikaans' },
    { code: 'ar', name: 'Arabic' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'ca', name: 'Catalan' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hr', name: 'Croatian' },
    { code: 'cs', name: 'Czech' },
    { code: 'da', name: 'Danish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'en', name: 'English' },
    { code: 'et', name: 'Estonian' },
    { code: 'fi', name: 'Finnish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'el', name: 'Greek' },
    { code: 'he', name: 'Hebrew' },
    { code: 'hi', name: 'Hindi' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'is', name: 'Icelandic' },
    { code: 'id', name: 'Indonesian' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'no', name: 'Norwegian' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ro', name: 'Romanian' },
    { code: 'ru', name: 'Russian' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'es', name: 'Spanish' },
    { code: 'sv', name: 'Swedish' },
    { code: 'th', name: 'Thai' },
    { code: 'tr', name: 'Turkish' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'vi', name: 'Vietnamese' },
];

const Settings = ({ settings, setSettings, visible = true }) => {
    const handleSettingChange = (e) => {
        const { name, value } = e.target;
        const newSettings = {
            ...settings,
            [name]: value
        };

        // Save to state
        setSettings(newSettings);

        // Save to local storage
        localStorage.setItem('crosstalk_settings', JSON.stringify(newSettings));
    };

    // If not visible, don't render
    if (!visible) {
        return null;
    }

    return (
        <div className="settings-container">
            <h2>Settings</h2>
            <div className="divider"></div>
            <div className="settings-grid">
                <div className="setting-group">
                    <label className="setting-label">
                        Model Provider
                        <select
                            name="modelProvider"
                            className="setting-select"
                            value={settings.modelProvider}
                            onChange={handleSettingChange}
                        >
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                            <option value="custom">Custom</option>
                        </select>
                    </label>

                    <label className="setting-label">
                        Model Name
                        <input
                            type="text"
                            name="modelName"
                            className="setting-input"
                            placeholder="e.g. gpt-4, claude-3"
                            value={settings.modelName}
                            onChange={handleSettingChange}
                        />
                    </label>
                </div>

                <div className="setting-group">
                    <label className="setting-label">
                        API Host
                        <input
                            type="text"
                            name="apiHost"
                            className="setting-input"
                            placeholder="e.g. api.openai.com"
                            value={settings.apiHost}
                            onChange={handleSettingChange}
                        />
                    </label>

                    <label className="setting-label">
                        API Key
                        <input
                            type="password"
                            name="apiKey"
                            className="setting-input"
                            placeholder="Your API key"
                            value={settings.apiKey}
                            onChange={handleSettingChange}
                        />
                    </label>
                </div>

                <div className="setting-group">
                    <label className="setting-label">
                        Target Language
                        <select
                            name="targetLanguage"
                            className="setting-select"
                            value={settings.targetLanguage}
                            onChange={handleSettingChange}
                        >
                            {languages.map(lang => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="setting-label">
                        Translation API Key
                        <input
                            type="password"
                            name="translationApiKey"
                            className="setting-input"
                            placeholder="Translation API key"
                            value={settings.translationApiKey}
                            onChange={handleSettingChange}
                        />
                    </label>
                </div>

                <div className="setting-group">
                    <label className="setting-label">
                        Temperature
                        <div className="range-container">
                            <input
                                type="range"
                                name="temperature"
                                className="setting-range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.temperature || 0.7}
                                onChange={handleSettingChange}
                            />
                            <span className="range-value">{settings.temperature || 0.7}</span>
                        </div>
                    </label>

                    <label className="setting-label">
                        Max Tokens
                        <input
                            type="number"
                            name="maxTokens"
                            className="setting-input"
                            placeholder="Maximum tokens"
                            min="100"
                            max="16000"
                            value={settings.maxTokens || 1000}
                            onChange={handleSettingChange}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
};

export default Settings;