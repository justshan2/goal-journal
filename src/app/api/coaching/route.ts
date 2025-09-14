import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Goal } from '../../../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { goal, previousUpdates, userInput } = await request.json();

    if (!goal) {
      return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
    }

    // Create coaching prompt
    const prompt = createCoachingPrompt(goal, previousUpdates || [], userInput);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
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
- Keep responses under 400 tokens
- Focus on current progress, not past work
- Provide specific, actionable steps
- Use simple language
- Keep it concise and actionable`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    let coachingData;
    try {
      coachingData = JSON.parse(response);
    } catch (parseError) {
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
        advice: response
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
