export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Get OpenAI API key from environment variables
const getOpenAIApiKey = (): string | null => {
  return import.meta.env.VITE_OPENAI_API_KEY || null;
};

/**
 * Send a message to OpenAI and get a streaming response
 */
export async function sendChatMessageStreaming(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  onChunk: (chunk: string) => void
): Promise<string> {
  const apiKey = getOpenAIApiKey();
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your environment variables.');
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

    // Call OpenAI API with streaming
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
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status} ${response.statusText}`);
    }

    // Read streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (!reader) {
      throw new Error('Failed to read response stream');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (!value) continue;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              return fullResponse;
            }

            if (!data) continue;

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                onChunk(content);
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
              console.debug('Skipping incomplete chunk:', data);
            }
          }
        }
      }
    } catch (streamError: any) {
      console.error('Error reading stream:', streamError);
      // If we have partial response, return it
      if (fullResponse) {
        return fullResponse;
      }
      throw streamError;
    }

    return fullResponse;
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);
    throw new Error(error.message || 'Failed to get response from OpenAI. Please check your API key and try again.');
  }
}

/**
 * Send a message to OpenAI and get a complete response (non-streaming fallback)
 */
export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  const apiKey = getOpenAIApiKey();
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your environment variables.');
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

    // Call OpenAI API
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
    console.error('Error calling OpenAI API:', error);
    throw new Error(error.message || 'Failed to get response from OpenAI. Please check your API key and try again.');
  }
}

