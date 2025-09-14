import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Goal, LLMProgressResponse } from '../../../types';

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

    // Check if this is a financial goal and handle it differently
    if (isFinancialGoal(goal)) {
      const financialProgress = calculateFinancialProgress(goal, journalEntry, previousUpdates || []);
      if (financialProgress) {
        return NextResponse.json({ 
          success: true, 
          data: financialProgress 
        });
      }
    }

    // Create progress analysis prompt for non-financial goals
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

// Check if a goal is financial in nature
function isFinancialGoal(goal: Goal): boolean {
  const financialKeywords = [
    'bankroll', 'savings', 'money', 'dollar', '$', 'budget', 'income', 'revenue',
    'profit', 'loss', 'investment', 'portfolio', 'cash', 'fund', 'capital',
    'earn', 'make money', 'financial', 'wealth', 'net worth'
  ];
  
  const goalText = `${goal.title} ${goal.description || ''} ${goal.context || ''}`.toLowerCase();
  return financialKeywords.some(keyword => goalText.includes(keyword));
}

// Calculate progress for financial goals based on actual numbers
function calculateFinancialProgress(goal: Goal, journalEntry: string, previousUpdates: any[]): LLMProgressResponse | null {
  try {
    // Extract target amount from goal
    const targetAmount = extractTargetAmount(goal);
    if (!targetAmount) {
      return null; // Fall back to AI analysis if we can't extract target
    }

    // Extract current amount from journal entry
    const currentAmount = extractCurrentAmount(journalEntry);
    if (currentAmount === null) {
      return null; // Fall back to AI analysis if we can't extract current amount
    }

    // Calculate progress percentage
    const progressPercentage = Math.min(Math.max((currentAmount / targetAmount) * 100, 0), 100);
    
    // Calculate progress increase from previous update
    const previousProgress = previousUpdates.length > 0 
      ? previousUpdates[previousUpdates.length - 1].llmResponse?.overall_progress || 0
      : 0;
    
    const progressIncrease = Math.max(progressPercentage - previousProgress, 0);

    // Generate appropriate feedback
    const feedback = generateFinancialFeedback(currentAmount, targetAmount, progressPercentage, journalEntry);

    return {
      overall_progress: Math.round(progressPercentage),
      progress_increase: Math.round(progressIncrease),
      reasoning: `Current: $${currentAmount.toLocaleString()}, Target: $${targetAmount.toLocaleString()}`,
      feedback: feedback
    };
  } catch (error) {
    console.error('Error calculating financial progress:', error);
    return null; // Fall back to AI analysis
  }
}

// Extract target amount from goal
function extractTargetAmount(goal: Goal): number | null {
  const text = `${goal.title} ${goal.description || ''} ${goal.context || ''}`;
  
  // Look for patterns like "3K", "3000", "$3000", "3,000", etc.
  const patterns = [
    /(\d+(?:\.\d+)?)\s*k/i,  // 3K, 3k
    /\$(\d+(?:,\d{3})*(?:\.\d+)?)/,  // $3,000, $3000
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*dollars?/i,  // 3000 dollars
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*\$/,  // 3000$
    /(\d+(?:,\d{3})*(?:\.\d+)?)(?=\s|$)/  // 3000 at end of string
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let amount = parseFloat(match[1].replace(/,/g, ''));
      
      // Handle K suffix
      if (text.toLowerCase().includes('k') && amount < 1000) {
        amount *= 1000;
      }
      
      return amount;
    }
  }
  
  return null;
}

// Extract current amount from journal entry
function extractCurrentAmount(journalEntry: string): number | null {
  // Look for patterns like "current bankroll: $2500", "now at $2500", "bankroll is $2500", etc.
  const patterns = [
    /(?:current|now|at|is|bankroll|balance|total|amount)\s*:?\s*\$?(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    /\$(\d+(?:,\d{3})*(?:\.\d+)?)/,
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*dollars?/i,
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*\$/
  ];

  for (const pattern of patterns) {
    const match = journalEntry.match(pattern);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }
  
  return null;
}

// Generate appropriate feedback for financial goals
function generateFinancialFeedback(currentAmount: number, targetAmount: number, progressPercentage: number, journalEntry: string): string {
  const isLoss = journalEntry.toLowerCase().includes('lost') || journalEntry.toLowerCase().includes('down') || journalEntry.toLowerCase().includes('decreased');
  
  if (isLoss) {
    return `Current bankroll: $${currentAmount.toLocaleString()}. You're ${Math.round(progressPercentage)}% to your $${targetAmount.toLocaleString()} goal. Stay disciplined and stick to your strategy.`;
  } else if (progressPercentage >= 100) {
    return `🎉 Congratulations! You've reached your $${targetAmount.toLocaleString()} goal! Current bankroll: $${currentAmount.toLocaleString()}.`;
  } else if (progressPercentage >= 80) {
    return `Great progress! You're ${Math.round(progressPercentage)}% to your $${targetAmount.toLocaleString()} goal. Current bankroll: $${currentAmount.toLocaleString()}. You're almost there!`;
  } else if (progressPercentage >= 50) {
    return `Good progress! You're ${Math.round(progressPercentage)}% to your $${targetAmount.toLocaleString()} goal. Current bankroll: $${currentAmount.toLocaleString()}. Keep it up!`;
  } else {
    return `Current bankroll: $${currentAmount.toLocaleString()}. You're ${Math.round(progressPercentage)}% to your $${targetAmount.toLocaleString()} goal. Stay consistent and focused.`;
  }
}