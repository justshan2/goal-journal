import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Goal, LLMProgressResponse } from '@/types';

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

    const { goal, journalEntry, previousUpdates } = await request.json();

    if (!goal || !journalEntry) {
      return NextResponse.json({ error: 'Goal and journal entry are required' }, { status: 400 });
    }

    // Create progress analysis prompt
    const prompt = createProgressAnalysisPrompt(goal, journalEntry, previousUpdates || []);

    // Call OpenAI API
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Analyze progress and return JSON:
{
  "overall_progress": 75,
  "progress_increase": 5,
  "reasoning": "brief explanation",
  "feedback": "encouraging advice"
}
Progress increase: 0-15% per entry. Be conservative.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.4,
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json({ 
        error: 'Failed to analyze progress. Please check your API key and try again.',
        success: false,
        details: openaiError instanceof Error ? openaiError.message : 'Unknown OpenAI error'
      }, { status: 500 });
    }

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    let progressData: LLMProgressResponse;
    try {
      progressData = JSON.parse(response);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      progressData = {
        overall_progress: goal.overallProgress,
        progress_increase: 0,
        reasoning: 'Unable to analyze progress due to parsing error',
        feedback: 'Your progress has been recorded. Please try again for AI analysis.'
      };
    }

    // Validate progress data
    if (typeof progressData.overall_progress !== 'number' || 
        typeof progressData.progress_increase !== 'number') {
      throw new Error('Invalid progress data format');
    }

    return NextResponse.json({ 
      success: true, 
      data: progressData 
    });

  } catch (error) {
    console.error('Progress API error:', error);
    
    // Return fallback response
    const fallbackResponse: LLMProgressResponse = {
      overall_progress: 0,
      progress_increase: 0,
      reasoning: 'Unable to analyze progress due to technical issues',
      feedback: 'Your progress has been recorded. AI analysis is temporarily unavailable.'
    };

    return NextResponse.json({ 
      error: 'Failed to analyze progress',
      fallback: fallbackResponse,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function createProgressAnalysisPrompt(goal: Goal, journalEntry: string, previousUpdates: any[]): string {
  const context = previousUpdates.length > 0 
    ? `Previous: ${previousUpdates.slice(-1).map(u => `${u.journalEntry.substring(0, 50)} (${u.llmResponse?.overall_progress || 0}%)`).join('; ')}`
    : '';

  return `Goal: ${goal.title}
Current: ${goal.overallProgress}%
${context}
Entry: "${journalEntry}"
Analyze progress change.`;
}