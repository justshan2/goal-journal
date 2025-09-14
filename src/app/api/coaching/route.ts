import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Goal } from '../../../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json({ 
        error: 'OpenAI API key is not configured. Please check your environment variables.',
        success: false 
      }, { status: 500 });
    }

    const { goal, previousUpdates, userInput } = await request.json();

    if (!goal) {
      return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
    }

    // Create coaching prompt
    const prompt = createCoachingPrompt(goal, previousUpdates || [], userInput);

    // Call OpenAI API
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a strategic goal coaching AI. Provide concise, actionable advice in JSON format:

{
  "milestones": [{"title": "X", "description": "Y", "timeline": "Z", "priority": "high|medium|low"}],
  "habits": [{"name": "X", "description": "Y", "frequency": "Z", "impact": "W"}],
  "advice": "Brief advice"
}

Rules:
- Keep descriptions concise (1-2 sentences max)
- Focus on current progress, not past work
- Provide specific, actionable steps
- Use simple language
- Ensure complete JSON structure`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json({ 
        error: 'Failed to get coaching advice from AI. Please check your API key and try again.',
        success: false,
        details: openaiError instanceof Error ? openaiError.message : 'Unknown OpenAI error'
      }, { status: 500 });
    }

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    let coachingData;
    try {
      // Clean the response to remove any markdown formatting or extra text
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON object in the response if it's not the whole response
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }
      
      console.log('Attempting to parse cleaned response:', cleanResponse);
      coachingData = JSON.parse(cleanResponse);
      
      // Validate the structure
      if (!coachingData.milestones || !coachingData.habits || !coachingData.advice) {
        throw new Error('Invalid response structure');
      }
      
    } catch (parseError) {
      console.error('Failed to parse coaching response:', parseError);
      console.error('Raw response:', response);
      
      // Try to extract advice from the raw response if possible
      let extractedAdvice = 'Unable to parse AI response. Please try again for personalized coaching advice.';
      try {
        // Look for any text that might be advice
        const adviceMatch = response.match(/advice["\s]*:["\s]*"([^"]+)"/i);
        if (adviceMatch) {
          extractedAdvice = adviceMatch[1];
        } else {
          // Try to find any meaningful text after common patterns
          const textMatch = response.match(/(?:advice|guidance|recommendation)[\s\S]*?([A-Z][^.!?]*[.!?])/i);
          if (textMatch) {
            extractedAdvice = textMatch[1];
          }
        }
      } catch (extractError) {
        console.error('Failed to extract advice from response:', extractError);
      }
      
      // Fallback if JSON parsing fails
      coachingData = {
        milestones: [
          {"title": "Break down your goal", "description": "Divide your goal into smaller, manageable steps", "timeline": "1 week", "priority": "high"},
          {"title": "Set weekly targets", "description": "Create specific weekly objectives to track progress", "timeline": "ongoing", "priority": "high"},
          {"title": "Track progress regularly", "description": "Monitor and adjust your approach based on results", "timeline": "ongoing", "priority": "medium"}
        ],
        habits: [
          {"name": "Daily practice", "description": "Dedicate time each day to work toward your goal", "frequency": "daily", "impact": "high"},
          {"name": "Weekly review", "description": "Reflect on progress and adjust strategies", "frequency": "weekly", "impact": "medium"},
          {"name": "Monthly assessment", "description": "Evaluate overall progress and set new targets", "frequency": "monthly", "impact": "high"}
        ],
        advice: extractedAdvice
      };
    }

    return NextResponse.json({ 
      success: true, 
      data: coachingData 
    });

  } catch (error) {
    console.error('Coaching API error:', error);
    return NextResponse.json({ 
      error: 'Failed to get coaching advice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function createCoachingPrompt(goal: Goal, previousUpdates: any[], userInput?: string): string {
  const context = previousUpdates.length > 0 
    ? `Recent progress: ${previousUpdates.slice(-2).map(u => u.journalEntry).join('; ')}`
    : 'No previous progress updates';

  const basePrompt = `Goal: ${goal.title}
Description: ${goal.description || 'No description'}
Current Progress: ${goal.overallProgress}%
Initial Progress: ${goal.initialProgress || 'Not specified'}
Context: ${goal.context || 'No additional context'}
${context}`;

  if (userInput) {
    return `${basePrompt}

User Question: ${userInput}

Provide specific advice addressing their question.`;
  }

  return `${basePrompt}

Provide strategic milestones and habits to help achieve this goal.`;
}
