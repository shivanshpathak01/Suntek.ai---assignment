import OpenAI from 'openai';
import { AITaskSuggestion } from './types';

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function generateTaskSuggestion(userInput: string): Promise<AITaskSuggestion> {
  if (!openai) {
    return {
      title: userInput.charAt(0).toUpperCase() + userInput.slice(1),
      description: `Task: ${userInput}`,
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content:
            'You convert casual task text into a concise title and a short, actionable description. Respond ONLY with strict JSON: {"title": string, "description": string}. No extra text.',
        },
        {
          role: 'user',
          content: userInput,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('No content from OpenAI');

    // Extract JSON if wrapped in code fences
    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonText = fenceMatch ? fenceMatch[1] : content;

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      // As a last resort, create a reasonable fallback using model output
      return {
        title: userInput.charAt(0).toUpperCase() + userInput.slice(1),
        description: content,
      };
    }

    return {
      title: typeof parsed?.title === 'string' && parsed.title.trim() ? parsed.title.trim() : userInput,
      description: typeof parsed?.description === 'string' ? parsed.description.trim() : `Task: ${userInput}`,
    };
  } catch (error) {
    console.error('AI task generation error:', error);
    return {
      title: userInput.charAt(0).toUpperCase() + userInput.slice(1),
      description: `Task: ${userInput}`,
    };
  }
}

