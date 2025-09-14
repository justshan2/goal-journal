# Manual API Testing Guide

## Cost Optimization Summary

### Changes Made:
1. **Removed research capability**: Eliminated all web search functionality
2. **Reduced max_tokens**: 800 → 400 (50% reduction)
3. **Ultra-simplified system prompt**: ~400 tokens → ~20 tokens (95% reduction)
4. **Minimal context**: Last 10 updates → Last 2 updates (80% reduction)
5. **Ultra-simplified user prompt**: Verbose → Minimal (80% reduction)
6. **Lower temperature**: 0.4 → 0.3 (more focused responses)

### Estimated Cost Reduction: ~85-90%

## Manual Testing Workflow

### Option 1: Direct API Testing
```bash
# Test coaching API directly
curl -X POST http://localhost:8531/api/coaching \
  -H "Content-Type: application/json" \
  -d '{
    "goal": {
      "id": "test-goal",
      "title": "Learn React Programming",
      "description": "Build a portfolio website",
      "overallProgress": 20,
      "createdAt": "2024-01-01",
      "updatedAt": "2024-01-01"
    },
    "previousUpdates": [],
    "userInput": "I have 2 months to prepare for interviews"
  }'
```

### Option 2: UI Testing with Manual Override
1. **Create a test goal** in the UI
2. **Add some journal entries** to build context
3. **Test coaching** with different user inputs
4. **Monitor terminal logs** for API calls and costs

### Option 3: Environment Variable Control
```bash
# Disable API calls entirely for UI testing
export OPENAI_API_KEY=""
npm run dev

# This will cause API errors, but you can test UI flow
```

## Cost Monitoring

### Check API Usage:
- Monitor terminal logs for API call frequency
- Look for response times (shorter = fewer tokens)
- Check for error rates

### Expected Improvements:
- **Response time**: 15-20s → 3-6s
- **Token usage**: ~2000 tokens → ~200-300 tokens per call
- **Cost per call**: ~$0.12 → ~$0.01-0.02 (matching progress API)

## Testing Checklist

- [ ] Coaching API responds correctly
- [ ] Milestones are relevant and actionable
- [ ] Habits are specific and measurable
- [ ] Advice addresses user input
- [ ] No hallucination of specific details
- [ ] Response time is reasonable
- [ ] JSON format is valid

## Rollback Plan

If optimizations cause issues, revert these files:
- `src/app/api/coaching/route.ts` (system prompt and max_tokens)
- `src/app/api/coaching/route.ts` (prompt creation function)

The original verbose prompts are preserved in git history.
