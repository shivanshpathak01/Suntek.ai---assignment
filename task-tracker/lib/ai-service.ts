import OpenAI from 'openai';
import { AITaskSuggestion } from './types';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function generateTaskSuggestion(
  userInput: string
): Promise<AITaskSuggestion> {
  // If OpenAI is not configured, return a simple formatted version
  if (!openai) {
    return {
      title: userInput.charAt(0).toUpperCase() + userInput.slice(1),
      description: `Task: ${userInput}`,
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that converts casual task descriptions into clear, actionable task titles and descriptions. 
          Return a JSON object with "title" and "description" fields.
          The title should be concise and clear (max 100 characters).
          The description should be more detailed and actionable (max 500 characters).`,
        },
        {
          role: 'user',
          content: `Convert this task: "${userInput}"`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || userInput,
        description: parsed.description || '',
      };
    } catch {
      // If not JSON, use the content as description
      return {
        title: userInput.charAt(0).toUpperCase() + userInput.slice(1),
        description: content,
      };
    }
  } catch (error) {
    console.error('AI task generation error:', error);
    // Fallback to simple formatting
    return {
      title: userInput.charAt(0).toUpperCase() + userInput.slice(1),
      description: `Task: ${userInput}`,
    };
  }
}

