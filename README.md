# CrossTalk: AI Translation Interface

A split-screen translator/chat interface for testing AI language models in different languages. This tool helps users explore and red-team models by automatically translating prompts into a specified language and then translating model responses back to English.

## Features

- Split-screen interface with user and model sides
- User side always displays content in English
- Model side always displays content in the target language
- Automatic translation of user input to the target language
- Translation of model responses back to English for the user side
- Support for various language models (OpenAI, Anthropic, custom endpoints)
- Multiple target language options
- Local storage of API keys and settings

## Use Cases

- Red-teaming language models in non-English languages
- Testing model capabilities across languages
- Exploring language-specific behaviors and biases
- Research into cross-lingual AI capabilities

## Setup

### Prerequisites

- Node.js and npm installed
- Google Cloud Translation API key
- API key for your preferred language model (OpenAI, Anthropic, etc.)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/crosstalk.git
   cd crosstalk
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm start
   ```

4. Open your browser to `http://localhost:5050`

## Configuration

The app requires API keys for:

1. Language model API (OpenAI, Anthropic, etc.)
2. Translation service (Google Cloud Translation API)

Enter these in the settings panel within the app. They will be saved to your browser's localStorage for convenience.

## Using the Application

1. Configure your settings:
   - Select a model provider (OpenAI, Anthropic, or Custom)
   - Enter your API key and model name
   - Choose a target language
   - Enter your Google Cloud Translation API key

2. Type messages in English on the user side:
   - Your messages will remain in English on the user side
   - Automatically translated versions appear on the model side

3. View model responses:
   - The model's raw responses appear in the target language on the model side
   - Automatically translated responses (to English) appear on the user side
   - Test how the model responds to non-English prompts while keeping the interface accessible

## Implementation Notes

- The application uses the Google Cloud Translation API for translations
- API keys are stored in your browser's localStorage for persistence
- Custom API endpoints may need adjustments to match your specific service

## Getting API Keys

### Google Cloud Translation API
1. Create a Google Cloud account
2. Create a new project
3. Enable the Cloud Translation API
4. Create an API key through the Credentials page
5. Add any necessary restrictions to the API key

### OpenAI API
1. Create an OpenAI account at https://platform.openai.com/
2. Navigate to the API keys section
3. Create a new API key

### Anthropic API
1. Create an Anthropic account
2. Navigate to the API keys section
3. Create a new API key

## License

MIT

---

Created for AI safety research and testing purposes.