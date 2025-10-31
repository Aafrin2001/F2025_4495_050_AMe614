import Constants from 'expo-constants';
import * as Speech from 'expo-speech';

// Get OpenAI API key from environment variables
const getOpenAIApiKey = (): string | null => {
  return Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY || null;
};

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Send a message to ChatGPT and get a text response
 */
export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  const apiKey = getOpenAIApiKey();
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment variables.');
  }

  try {
    // System message to set the AI's behavior
    const systemMessage: ChatMessage = {
      role: 'system',
      content: 'You are a helpful AI health companion. You assist users with health monitoring, medication reminders, and answer health-related questions in a friendly and professional manner.',
    };

    // Construct messages array
    const messages: ChatMessage[] = [
      systemMessage,
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Call OpenAI API using fetch (compatible with React Native)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';
    
    return aiResponse;
  } catch (error: any) {
    console.error('Error calling ChatGPT API:', error);
    throw new Error(error.message || 'Failed to get response from ChatGPT. Please check your API key and try again.');
  }
}

/**
 * Convert text to speech using device's TTS
 */
export async function speakText(text: string, language: string = 'en'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      Speech.speak(text, {
        language,
        pitch: 1.0,
        rate: 0.9,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: (error) => reject(error),
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
  Speech.stop();
}

/**
 * Check if speech is currently speaking
 */
export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

