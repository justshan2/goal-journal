# 🎯 Goal Tracker MVP

A modern, AI-powered goal tracking application built with Next.js, TypeScript, and OpenAI GPT-4. Track your progress with intelligent journal entries and get personalized coaching advice.

## ✨ Features

### 🎯 **Smart Goal Management**
- Create goals with detailed descriptions, initial progress, and context
- Three goal statuses: In Progress, Paused, Completed
- Automatic completion when progress reaches 100%
- Visual progress tracking with color-coded status indicators

### 📝 **AI-Powered Progress Updates**
- Journal-style progress entries
- GPT-4 analyzes your updates and adjusts progress percentage
- Context-aware feedback that considers previous entries
- Detailed reasoning for progress changes

### 🎓 **Strategic Coaching**
- Get personalized advice and milestones for your goals
- Domain-specific research and recommendations
- Ask specific questions for targeted guidance
- Cost-optimized API calls for efficient usage

### 🎨 **Modern UI/UX**
- Clean, minimal design with soft & friendly aesthetics
- Responsive layout optimized for desktop
- Three-tab navigation: Goals Dashboard, Journal Entry, Coaching
- Clickable goal cards with detailed modal views

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd agency_webapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your OpenAI API key to `.env.local`:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom warm color palette
- **AI**: OpenAI GPT-4 API
- **Storage**: LocalStorage (client-side persistence)
- **Deployment**: Vercel-ready

## 📱 Usage

### Creating Goals
1. Click "Add Goal" on the dashboard
2. Enter title, description, initial progress, and context
3. Goals start as "In Progress" by default

### Tracking Progress
1. Go to the "Journal Entry" tab
2. Select an in-progress goal
3. Write about your progress, challenges, or insights
4. AI analyzes and updates your progress percentage
5. Get feedback and reasoning for the change

### Getting Coaching
1. Go to the "Coaching" tab
2. Select an in-progress goal
3. Optionally ask a specific question
4. Get strategic advice, milestones, and habits
5. Previous coaching responses are saved per goal

### Managing Goals
- **Status Control**: Change goal status via dropdown (In Progress/Paused/Completed)
- **Auto-Completion**: Goals automatically complete at 100% progress
- **Detailed View**: Click any goal card to see full details and journal history
- **Reset**: Use "Reset Goals" to clear all data

## 🎨 Design Philosophy

- **Soft & Friendly**: Warm colors and gentle interactions
- **Minimal & Clean**: Focus on content, not clutter
- **Desktop-First**: Optimized for productive desktop workflows
- **Conversation-Style**: AI feedback feels natural and helpful

## 🔧 API Endpoints

- `POST /api/progress` - Analyze journal entries and update progress
- `POST /api/coaching` - Get strategic coaching advice

## 📊 Data Structure

### Goal
```typescript
interface Goal {
  id: string;
  title: string;
  description?: string;
  initialProgress?: string;
  context?: string;
  overallProgress: number; // 0-100
  status: 'in-progress' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}
```

### Progress Update
```typescript
interface ProgressUpdate {
  id: string;
  goalId: string;
  journalEntry: string;
  timestamp: string;
  llmResponse?: LLMProgressResponse;
}
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repository to Vercel
3. Add `OPENAI_API_KEY` environment variable
4. Deploy!

### Other Platforms
- Ensure Node.js 18+ support
- Set `OPENAI_API_KEY` environment variable
- Build command: `npm run build`
- Start command: `npm start`

## 🔒 Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## 📝 Development

### Project Structure
```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   └── page.tsx        # Main page
├── components/         # React components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── GoalCard.tsx    # Individual goal cards
│   ├── ProgressInput.tsx # Journal entry form
│   ├── CoachingInput.tsx # Coaching form
│   └── ...
├── lib/               # Utilities
│   ├── storage.ts     # LocalStorage helpers
│   └── utils.ts       # General utilities
└── types/             # TypeScript definitions
    └── index.ts       # Interface definitions
```

### Key Features Implemented
- ✅ Auto-completion at 100% progress
- ✅ Goal status management (In Progress/Paused/Completed)
- ✅ Filtered dropdowns (only in-progress goals for journal/coaching)
- ✅ Cost-optimized coaching API
- ✅ Clean, minimal UI design
- ✅ Responsive goal cards with detailed modals
- ✅ LocalStorage persistence

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Powered by [OpenAI GPT-4](https://openai.com/)
- Deployed on [Vercel](https://vercel.com/)

---

**Ready to achieve your goals? Start tracking today! 🚀**