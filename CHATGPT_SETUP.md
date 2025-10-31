# ChatGPT Integration Setup

This guide will help you set up ChatGPT integration for both text and voice chat features.

## Prerequisites

1. An OpenAI API key - Get one at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

## Implementation Notes

The integration uses direct HTTP fetch calls to the OpenAI API instead of the OpenAI SDK, ensuring full compatibility with React Native and Expo environments.

## Setup Instructions

### 1. Create a `.env` file (if it doesn't exist)

In the root directory of your project, create a `.env` file:

```bash
touch .env
```

### 2. Add your OpenAI API key to `.env`

Open the `.env` file and add your OpenAI API key:

```
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: Replace `your_openai_api_key_here` with your actual API key from OpenAI.

### 3. Restart your development server

After adding the API key, restart your Expo development server:

```bash
npm start
```

Or if you're running it already, stop it (Ctrl+C) and restart it.

## Features

### Text Chat (AIChatScreen)
- Full ChatGPT integration for text-based conversations
- Conversation history maintained throughout the session
- Quick action buttons for common health queries
- Error handling with user-friendly messages

### Voice Chat (VoiceChatScreen)
- **Web**: Full speech-to-text using Web Speech API
- **Mobile**: Quick action buttons available (speech-to-text requires platform-specific setup)
- Text-to-speech for AI responses using device TTS
- ChatGPT integration for intelligent responses
- Conversation history maintained

## Platform Support

### Speech Recognition
- **Web**: Full support via Web Speech API (works in Chrome, Edge, Safari)
- **iOS/Android**: Currently uses quick action buttons. For full speech-to-text on mobile, additional native modules would be required (e.g., `expo-speech` with native extensions)

### Text-to-Speech
- **All Platforms**: Supported via `expo-speech`

## Troubleshooting

### "OpenAI API key is not configured" error
1. Make sure you've created a `.env` file in the root directory
2. Verify the key name is exactly `EXPO_PUBLIC_OPENAI_API_KEY`
3. Restart your development server after adding the key
4. Check that your API key is valid and has credits available

### Speech recognition not working
- **Web**: Make sure you're using a supported browser (Chrome, Edge, Safari)
- **Mobile**: Speech-to-text on mobile requires additional setup. Currently, use the quick action buttons or switch to text chat

### API errors
- Check your OpenAI API account has available credits
- Verify your API key hasn't been revoked
- Check OpenAI service status at [status.openai.com](https://status.openai.com)

## Security Notes

- Never commit your `.env` file to version control (it's already in `.gitignore`)
- The API key is exposed to the client-side app, so consider implementing a backend proxy for production
- Monitor your API usage to avoid unexpected charges

## Cost Considerations

OpenAI API usage is charged based on tokens used. The current implementation uses `gpt-3.5-turbo` which is cost-effective. Monitor your usage at [platform.openai.com/usage](https://platform.openai.com/usage).

