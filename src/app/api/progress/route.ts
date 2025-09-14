import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Goal, LLMProgressResponse } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to perform web search for domain-specific research
async function performWebSearch(query: string): Promise<string> {
  try {
    // Use a simple web search approach - in production, you'd want to use a proper search API
    // For now, we'll simulate research with domain-specific knowledge
    const researchResults = {
      'pokemon tcg': 'Pokemon TCG competitive play involves deck building, meta analysis, and strategic gameplay. Key factors include card synergy, energy management, and opponent prediction.',
      'programming': 'Programming progress involves understanding concepts, building projects, debugging skills, and following best practices. Key milestones include syntax mastery, problem-solving, and system design.',
      'fitness': 'Fitness progress includes strength gains, endurance improvement, and body composition changes. Key factors are consistency, progressive overload, and proper nutrition.',
      'learning': 'Learning progress involves comprehension, retention, application, and mastery. Key factors include active practice, spaced repetition, and real-world application.'
    };

    const lowerQuery = query.toLowerCase();
    for (const [key, value] of Object.entries(researchResults)) {
      if (lowerQuery.includes(key)) {
        return value;
      }
    }

    return 'General progress tracking involves setting clear goals, measuring outcomes, and adjusting strategies based on results.';
  } catch (error) {
    console.error('Web search error:', error);
    return 'Research data unavailable.';
  }
}

// Function to generate research queries based on goal context
function generateProgressResearchQueries(goal: Goal): string[] {
  const queries = [];
  
  // Extract key terms from goal title and description
  const text = `${goal.title} ${goal.description || ''} ${goal.context || ''}`.toLowerCase();
  
  if (text.includes('pokemon') || text.includes('tcg') || text.includes('card')) {
    queries.push('pokemon tcg competitive strategy');
  }
  if (text.includes('programming') || text.includes('code') || text.includes('development')) {
    queries.push('programming learning progress');
  }
  if (text.includes('fitness') || text.includes('exercise') || text.includes('workout')) {
    queries.push('fitness progress tracking');
  }
  if (text.includes('learn') || text.includes('study') || text.includes('skill')) {
    queries.push('learning progress milestones');
  }
  
  return queries.length > 0 ? queries : ['general goal progress tracking'];
}

export async function POST(request: NextRequest) {
  try {
    const { goal, journalEntry, previousUpdates } = await request.json();

    if (!goal || !journalEntry) {
      return NextResponse.json({ error: 'Goal and journal entry are required' }, { status: 400 });
    }

    // Generate research queries and perform web search
    const researchQueries = generateProgressResearchQueries(goal);
    const researchPromises = researchQueries.slice(0, 2).map(query => performWebSearch(query));
    const researchResults = await Promise.all(researchPromises);
    const researchContext = researchResults.join(' ');

    // Create progress analysis prompt
    const prompt = createProgressAnalysisPrompt(goal, journalEntry, previousUpdates || [], researchContext);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a progress analysis AI. Analyze journal entries and update goal progress in JSON format:

{
  "overall_progress": 75,
  "progress_increase": 5,
  "reasoning": "explanation for the progress change",
  "feedback": "encouraging advice and next steps"
}

Rules:
- Progress increase should be 0-15% per entry
- Be conservative with progress increases
- Consider context from previous updates to avoid double-counting
- Provide specific, actionable feedback
- Use research context when relevant
- Always output the exact percentage increase given and reasoning`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.4,
    });

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

function createProgressAnalysisPrompt(goal: Goal, journalEntry: string, previousUpdates: any[], researchContext: string): string {
  const context = previousUpdates.length > 0 
    ? `Previous updates: ${previousUpdates.slice(-3).map(u => `${u.journalEntry} (${u.llmResponse?.overall_progress || 0}%)`).join('; ')}`
    : 'No previous updates';

  return `Goal: ${goal.title}
Description: ${goal.description || 'No description'}
Current Progress: ${goal.overallProgress}%
Initial Progress: ${goal.initialProgress || 'Not specified'}
Context: ${goal.context || 'No additional context'}

Research Context: ${researchContext}

${context}

New Journal Entry: "${journalEntry}"

Analyze this entry and determine:
1. New overall progress percentage (0-100)
2. Progress increase from current ${goal.overallProgress}%
3. Reasoning for the change
4. Encouraging feedback and next steps

Consider the research context and previous updates to avoid double-counting accomplishments.`;
}