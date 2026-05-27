# PRD: AI Interview Coach for Frontend & System Design

## 1. Product Overview

### Product Name

**AI Interview Coach**

Alternative names:

* Frontend Interview Coach
* SeniorReady AI
* InterviewPilot
* FE Coach AI

### One-line Description

AI Interview Coach is a web application that helps frontend engineers practice technical interviews through realistic AI-led mock interviews, structured feedback, scoring, and personalized study plans.

### Product Vision

Help frontend engineers prepare for interviews more effectively by turning passive study into active, realistic interview practice.

Instead of only reading notes or watching tutorials, users can practice answering questions, receive instant feedback, identify weak areas, and improve over time.

### Target Users

Primary users:

* Mid-level frontend engineers preparing for senior frontend interviews
* Senior frontend engineers preparing for interviews at fintech, big tech, or high-growth startups
* Frontend engineers preparing for system design interviews
* Engineers who struggle to explain their thinking clearly in interviews

Secondary users:

* Full-stack engineers who want to improve frontend depth
* New grads preparing for frontend roles
* Non-native English speakers who want to practice technical communication

---

## 2. Problem Statement

Frontend interview preparation is difficult because candidates often do not know whether their answers are good enough.

Common problems:

* Candidates study many topics but rarely practice speaking answers out loud.
* They do not know how interviewers evaluate seniority.
* They lack structured feedback on clarity, trade-offs, depth, and communication.
* Mock interviews with real people are expensive, hard to schedule, and sometimes stressful.
* Existing question banks provide answers, but not personalized coaching.
* System design preparation is often too backend-focused and does not cover frontend-specific architecture deeply enough.

### Core Problem

Frontend engineers need a safe, repeatable, and realistic way to practice interviews and receive actionable feedback.

---

## 3. Goals and Success Metrics

## 3.1 Product Goals

1. Help users practice frontend interviews actively, not passively.
2. Provide realistic AI interviewer conversations.
3. Give structured feedback after each answer.
4. Track progress over time.
5. Recommend personalized practice topics based on weak areas.
6. Support both coding-style concept questions and frontend system design questions.

## 3.2 User Goals

Users should be able to:

* Practice common frontend interview questions.
* Practice senior-level frontend system design questions.
* Get instant feedback on their answers.
* Understand what a stronger answer should include.
* Track improvement across topics.
* Build confidence before real interviews.

## 3.3 Business / Portfolio Goals

For an MVP side project, the product should demonstrate:

* Strong frontend architecture
* AI integration
* Voice or text-based interaction
* Scoring and feedback system
* Personalization
* Data visualization
* Real-world product thinking

## 3.4 Success Metrics

Activation metrics:

* % of users who complete their first mock interview
* % of users who answer at least 3 questions in the first session
* Time from landing page to first interview started

Engagement metrics:

* Average number of practice sessions per user per week
* Average number of questions answered per session
* % of users who return within 7 days

Learning metrics:

* Average score improvement over time
* Number of weak topics improved
* % of users who complete recommended practice plans

Quality metrics:

* User rating of AI feedback usefulness
* User rating of question realism
* User rating of answer examples

---

## 4. User Personas

## 4.1 Persona 1: Mid-level Frontend Engineer

Name: Alex
Experience: 3 to 5 years
Goal: Prepare for senior frontend interviews
Pain points:

* Knows React and JavaScript but struggles to explain trade-offs
* Has limited experience with frontend system design
* Wants to know what senior-level answers sound like

Needs:

* Structured questions by topic
* Feedback on answer depth
* Better answer examples
* Roadmap for improvement

## 4.2 Persona 2: Senior Frontend Engineer

Name: Chris
Experience: 5 to 8 years
Goal: Prepare for interviews at fintech or big tech companies
Pain points:

* Needs to practice system design under interview pressure
* Wants realistic follow-up questions
* Wants feedback on communication and architecture decisions

Needs:

* Mock system design interviews
* Deep follow-up questions
* Scoring by seniority signals
* Architecture feedback

## 4.3 Persona 3: Non-native English Speaker

Name: Minh
Experience: 4 years
Goal: Improve technical communication in English
Pain points:

* Understands the concepts but cannot explain them smoothly
* Gives answers that are too short or unclear
* Wants natural technical phrases

Needs:

* Answer rewriting
* Better phrasing suggestions
* Speaking practice
* Confidence-building feedback

---

## 5. Product Scope

## 5.1 MVP Scope

The MVP should focus on text-based interview practice first.

Core features:

1. User onboarding
2. Topic selection
3. Interview mode
4. AI interviewer question flow
5. User answer input
6. AI feedback and scoring
7. Better answer suggestion
8. Session summary
9. Progress dashboard
10. Question bank management

## 5.2 Post-MVP Scope

Future features:

1. Voice-based practice
2. Real-time speech-to-text
3. AI interviewer voice
4. Resume-based personalized questions
5. Company-specific interview mode
6. Live coding sandbox
7. System design whiteboard
8. Peer mock interview mode
9. Paid study plans
10. Browser extension for saving interview questions

## 5.3 Out of Scope for MVP

The MVP will not include:

* Real-time video interviews
* Full coding execution environment
* Human mentor marketplace
* Enterprise team management
* Mobile app
* Complex payment system
* Advanced whiteboarding

---

## 6. Core User Journey

## 6.1 First-time User Journey

1. User lands on homepage.
2. User sees value proposition: Practice frontend interviews with AI feedback.
3. User clicks “Start Practice”.
4. User selects experience level:

   * Junior
   * Mid-level
   * Senior
5. User selects target interview type:

   * Frontend Fundamentals
   * React
   * JavaScript
   * Browser / Web APIs
   * Performance
   * Frontend System Design
   * Behavioral / Communication
6. User selects session length:

   * Quick practice: 3 questions
   * Standard mock: 5 questions
   * Deep mock: 8 questions
7. AI starts the interview.
8. User answers each question.
9. AI asks follow-up questions when appropriate.
10. After the session, user receives summary feedback.
11. User sees weak areas and recommended next steps.

## 6.2 Returning User Journey

1. User opens dashboard.
2. User sees recent score trends.
3. User sees weak topics.
4. User starts a recommended practice session.
5. User practices and receives feedback.
6. User tracks progress over time.

---

## 7. Feature Requirements

# 7.1 Homepage

## Description

The homepage explains the value of the product and encourages users to start practicing quickly.

## Requirements

The homepage should include:

* Product headline
* Short product description
* Primary CTA: Start Practice
* Secondary CTA: View Demo
* Benefits section
* Supported interview categories
* Example AI feedback preview

## Example Copy

Headline:
**Practice Frontend Interviews with an AI Coach**

Subheadline:
Get realistic technical questions, structured feedback, better answer examples, and a personalized study plan.

Benefits:

* Practice realistic frontend interview questions
* Improve your answer structure and clarity
* Learn senior-level trade-offs
* Track your progress over time

## Acceptance Criteria

* User can start a practice session from the homepage.
* User understands the product value within 10 seconds.
* Homepage is responsive on desktop and mobile.

---

# 7.2 Onboarding

## Description

Onboarding collects the user’s experience level and preparation goals.

## Requirements

The onboarding flow should ask:

1. What is your current level?

   * Junior
   * Mid-level
   * Senior
2. What role are you preparing for?

   * Frontend Engineer
   * Senior Frontend Engineer
   * Staff Frontend Engineer
   * Full-stack Engineer
3. What topics do you want to practice?

   * JavaScript
   * React
   * Frontend System Design
   * Performance
   * Browser APIs
   * Testing
   * Behavioral
4. What is your target company type?

   * Startup
   * Fintech
   * Big Tech
   * Crypto / Web3
   * General
5. Preferred practice mode:

   * Quick Q&A
   * Realistic mock interview
   * Deep coaching mode

## Acceptance Criteria

* User can complete onboarding in under 2 minutes.
* User preferences are saved.
* User can skip onboarding.
* User can edit preferences later.

---

# 7.3 Topic Selection

## Description

Users can choose what kind of interview they want to practice.

## Topic Categories

### JavaScript

Example topics:

* Closures
* Event loop
* Promises
* Async / await
* Prototype chain
* Scope
* Memory management
* Debounce and throttle
* Error handling

### React

Example topics:

* Rendering behavior
* Hooks
* State management
* Performance optimization
* Context API
* React Query
* Component design
* Error boundaries
* Suspense

### Frontend System Design

Example topics:

* Design a dashboard
* Design a real-time notification system
* Design a file upload system
* Design a component library
* Design a checkout flow
* Design a form builder
* Design a micro frontend architecture
* Design a frontend analytics system

### Web Performance

Example topics:

* Core Web Vitals
* Code splitting
* Lazy loading
* Caching
* Bundle optimization
* Rendering performance
* Network optimization

### Browser and Web APIs

Example topics:

* DOM
* Event propagation
* Storage APIs
* Service workers
* Web workers
* Fetch API
* CORS
* Security basics

### Testing

Example topics:

* Unit testing
* Integration testing
* E2E testing
* Testing React components
* Mocking APIs
* Test strategy

### Behavioral / Communication

Example topics:

* Tell me about a difficult bug
* Tell me about a conflict with product or design
* Tell me about a project you led
* Tell me about a performance optimization
* Explain a trade-off you made

## Acceptance Criteria

* User can select one or multiple topics.
* User can filter topics by difficulty.
* User can start an interview from a selected topic.

---

# 7.4 Interview Session

## Description

The interview session is the main practice experience. The AI interviewer asks questions, receives user answers, asks follow-ups, and provides feedback.

## Session Types

### Quick Practice

* 3 questions
* Short feedback after each answer
* Best for daily practice

### Standard Mock Interview

* 5 questions
* Follow-up questions enabled
* Full summary at the end

### Deep Coaching Mode

* 3 to 5 questions
* Detailed feedback after every answer
* Better answer examples
* Explanation of senior-level expectations

## Interview Flow

1. AI introduces the session.
2. AI asks the first question.
3. User submits answer.
4. AI evaluates answer.
5. AI may ask one follow-up question.
6. User answers follow-up.
7. AI moves to next question.
8. After all questions, AI generates session summary.

## Interview UI Requirements

The interview screen should include:

* Current question
* Topic and difficulty badge
* Answer input box
* Submit answer button
* Timer, optional
* Progress indicator
* Interview history
* End session button

## Acceptance Criteria

* User can complete a full interview session.
* User can end session early.
* User can see current progress.
* User answers are saved.
* AI feedback is generated reliably.

---

# 7.5 AI Question Generation

## Description

The AI should generate interview questions based on selected topic, difficulty, user level, and previous performance.

## Question Types

### Conceptual Question

Example:
Explain how JavaScript closures work and give a practical use case.

### Debugging Question

Example:
A React component keeps re-rendering unexpectedly. How would you debug it?

### Trade-off Question

Example:
When would you choose Zustand over Context API?

### System Design Question

Example:
Design a frontend architecture for a real-time trading dashboard.

### Behavioral Question

Example:
Tell me about a time you disagreed with a product requirement.

## Question Difficulty

### Junior

Focus:

* Basic understanding
* Definitions
* Simple examples

### Mid-level

Focus:

* Practical usage
* Debugging
* Trade-offs
* Real project experience

### Senior

Focus:

* Architecture
* Scalability
* Performance
* Cross-team collaboration
* Long-term maintainability
* Business impact

## Acceptance Criteria

* Questions match the selected topic.
* Questions match user level.
* Questions are not repeated too often.
* Follow-up questions are relevant to the user’s answer.

---

# 7.6 AI Feedback and Scoring

## Description

After each answer, the AI evaluates the response and provides structured feedback.

## Scoring Dimensions

Each answer should be scored from 1 to 5 on:

1. **Correctness**

   * Is the answer technically accurate?

2. **Completeness**

   * Does the answer cover important points?

3. **Clarity**

   * Is the answer easy to understand?

4. **Depth**

   * Does the answer show senior-level understanding?

5. **Trade-off Thinking**

   * Does the answer discuss pros, cons, and alternatives?

6. **Communication**

   * Is the answer structured like a good interview response?

## Feedback Structure

For each answer, AI should provide:

* Overall score
* What went well
* What was missing
* Technical corrections
* Senior-level improvement suggestions
* Better answer example
* Follow-up practice recommendation

## Example Feedback Format

Question:
Explain when you would use debounce and throttle.

User answer:
Debounce is when you delay a function. Throttle is when you limit it.

AI feedback:

Score: 2.5 / 5

What went well:

* You correctly identified that both techniques control function execution frequency.

What was missing:

* You did not explain the difference clearly.
* You did not provide practical use cases.
* You did not mention implementation concerns.

Better answer:
Debounce delays execution until a period of inactivity. It is useful for search input because we only want to call the API after the user stops typing. Throttle ensures a function runs at most once within a fixed interval. It is useful for scroll or resize handlers where we want regular updates but not too many calls.

Senior-level addition:
In production, I would also consider cancellation, cleanup, memory leaks, and whether the logic should live inside a reusable hook such as useDebounce or useThrottle.

## Acceptance Criteria

* Feedback is specific to the user’s answer.
* Feedback includes actionable improvements.
* Feedback does not only provide generic praise.
* Better answer is clear and interview-ready.
* Scoring is consistent across sessions.

---

# 7.7 Better Answer Generator

## Description

The product should generate improved versions of the user’s answer.

## Answer Versions

The AI should provide:

1. Concise answer
2. Strong interview answer
3. Senior-level answer
4. Natural English version, optional

## Example

Question:
How do you optimize a slow React page?

Concise answer:
I would first measure the bottleneck using React Profiler, browser performance tools, and network analysis. Then I would optimize rendering, bundle size, API loading, and expensive computations based on the actual cause.

Strong interview answer:
I would avoid guessing and start with measurement. First, I would check whether the slowness comes from rendering, network, JavaScript execution, or large assets. For rendering issues, I would use React Profiler to find unnecessary re-renders, split large components, memoize expensive calculations, and review state placement. For network issues, I would check API waterfalls, caching, pagination, and loading strategy. For bundle issues, I would use code splitting, lazy loading, and bundle analysis. Finally, I would validate the improvement using metrics such as LCP, INP, and real user monitoring.

Senior-level answer:
At a senior level, I would combine technical optimization with product impact. I would define the user journey affected, collect performance metrics, identify the bottleneck, and prioritize fixes based on user impact. I would also make sure the solution is maintainable by adding performance budgets, monitoring, and team guidelines to prevent regressions.

## Acceptance Criteria

* Better answers should not be too long by default.
* User can copy the better answer.
* User can save the answer for review.
* User can request a simpler or deeper version.

---

# 7.8 Session Summary

## Description

At the end of each session, the user receives a clear summary of performance.

## Summary Should Include

* Overall score
* Topic scores
* Strong areas
* Weak areas
* Repeated mistakes
* Recommended next topics
* Suggested practice plan
* Saved better answers

## Example Summary

Overall score: 3.2 / 5

Strong areas:

* Good understanding of React rendering basics
* Clear examples from real projects

Weak areas:

* Need deeper trade-off discussion
* Need more specific performance metrics
* Answers are sometimes too short

Recommended next practice:

1. React performance optimization
2. Frontend system design: dashboard UI
3. Web performance metrics

## Acceptance Criteria

* Summary is generated after every completed session.
* Summary is still generated if the user ends early, as long as there is at least one answer.
* Summary is saved in history.

---

# 7.9 Progress Dashboard

## Description

The dashboard helps users track improvement over time.

## Dashboard Sections

### Overview Cards

* Total sessions completed
* Total questions answered
* Average score
* Best topic
* Weakest topic
* Current practice streak

### Score Trend

Line chart showing average score over time.

### Topic Breakdown

Radar chart or bar chart showing scores by topic:

* JavaScript
* React
* System Design
* Performance
* Testing
* Communication

### Weak Area List

Examples:

* Trade-off explanation
* Senior-level architecture thinking
* Performance metrics
* Answer structure

### Recommended Practice

AI-generated next steps based on recent performance.

## Acceptance Criteria

* User can view historical progress.
* User can open previous sessions.
* User can see topic-level weaknesses.
* User receives recommended next sessions.

---

# 7.10 Question Bank

## Description

The system should maintain a structured question bank that can be used directly or as AI generation seed data.

## Question Fields

Each question should include:

* ID
* Title
* Topic
* Subtopic
* Difficulty
* Question type
* Expected answer points
* Good answer example
* Follow-up questions
* Evaluation rubric

## Example Question Object

```json
{
  "id": "react-performance-001",
  "topic": "React",
  "subtopic": "Performance",
  "difficulty": "Senior",
  "type": "System Thinking",
  "question": "How would you investigate and optimize a slow React page?",
  "expectedPoints": [
    "Measure before optimizing",
    "Use React Profiler",
    "Check unnecessary re-renders",
    "Analyze network requests",
    "Analyze bundle size",
    "Use memoization carefully",
    "Validate with performance metrics"
  ],
  "followUps": [
    "How do you know whether memoization is actually helping?",
    "How would you prevent performance regressions?",
    "What metrics would you report to product stakeholders?"
  ]
}
```

## Acceptance Criteria

* Questions can be filtered by topic and difficulty.
* Question metadata supports scoring.
* Question bank can be extended easily.

---

## 8. AI Behavior Requirements

## 8.1 AI Interviewer Style

The AI interviewer should be:

* Professional
* Clear
* Realistic
* Slightly challenging
* Not overly friendly during mock interview mode
* More supportive during coaching mode

## 8.2 AI Coach Style

The AI coach should be:

* Encouraging but honest
* Specific
* Actionable
* Concise when possible
* Able to explain concepts simply

## 8.3 AI Prompting Strategy

The system should use different prompts for different tasks:

1. Question generation prompt
2. Follow-up question prompt
3. Answer evaluation prompt
4. Better answer generation prompt
5. Session summary prompt
6. Personalized study plan prompt

## 8.4 Evaluation Prompt Requirements

The AI should evaluate answers based on:

* Selected topic
* User level
* Question expectations
* User answer
* Follow-up answer, if available
* Rubric dimensions

The AI should not:

* Give only generic feedback
* Always give high scores
* Ignore technical mistakes
* Make the answer unnecessarily complicated
* Over-praise weak answers

---

## 9. Suggested AI Prompts

## 9.1 Interview Question Prompt

```text
You are a realistic technical interviewer for a frontend engineering role.

User profile:
- Level: {{level}}
- Target role: {{targetRole}}
- Target company type: {{companyType}}
- Selected topic: {{topic}}
- Session mode: {{sessionMode}}

Generate one interview question that matches the user's level and selected topic.

Requirements:
- The question should be realistic.
- The question should be clear and not too long.
- For senior users, prefer trade-offs, architecture, debugging, and scalability.
- Do not include the answer.
- Include topic, difficulty, question type, and expected evaluation points.
```

## 9.2 Follow-up Question Prompt

```text
You are conducting a frontend technical interview.

Question:
{{question}}

User answer:
{{userAnswer}}

Ask one relevant follow-up question.

Requirements:
- The follow-up should test depth, trade-off thinking, or practical experience.
- Do not ask multiple questions at once.
- Do not reveal the ideal answer.
```

## 9.3 Answer Evaluation Prompt

```text
You are an expert frontend interview coach.

Evaluate the user's answer using the rubric below.

Question:
{{question}}

Expected points:
{{expectedPoints}}

User answer:
{{userAnswer}}

User level:
{{level}}

Score the answer from 1 to 5 for each dimension:
- Correctness
- Completeness
- Clarity
- Depth
- Trade-off Thinking
- Communication

Return feedback in this structure:
1. Overall score
2. Dimension scores
3. What went well
4. What was missing
5. Technical corrections
6. How to improve
7. Better answer
8. Senior-level addition
9. Recommended next practice

Be honest, specific, and actionable. Do not over-praise weak answers.
```

## 9.4 Session Summary Prompt

```text
You are an AI interview coach summarizing a completed practice session.

User profile:
{{userProfile}}

Session answers and feedback:
{{sessionData}}

Generate a session summary with:
- Overall performance
- Average score
- Strong areas
- Weak areas
- Repeated mistakes
- Topic-level analysis
- Recommended next practice session
- 3 concrete action items

Keep the tone supportive but honest.
```

---

## 10. Functional Requirements

## 10.1 Authentication

MVP options:

* Allow guest practice
* Optional login for saving progress

Recommended MVP:

* Guest users can try one session.
* Logged-in users can save progress and history.

Requirements:

* User can sign up with email or OAuth.
* User can log in and log out.
* User data is associated with account.

## 10.2 Session Management

Requirements:

* Create new session
* Save session status
* Save question history
* Save user answers
* Save AI feedback
* Resume incomplete session, optional
* End session manually

## 10.3 Feedback Storage

Requirements:

* Store scores per answer
* Store feedback text
* Store better answer
* Store topic and difficulty
* Store timestamp

## 10.4 History

Requirements:

* User can view previous sessions
* User can filter by topic
* User can open session details
* User can review past feedback

## 10.5 Recommendations

Requirements:

* Recommend topics based on low scores
* Recommend next session type
* Recommend saved answers to review

---

## 11. Non-functional Requirements

## 11.1 Performance

* First page load should be fast.
* AI response should stream if possible.
* User should see loading state when AI is generating.
* Dashboard should load within 2 seconds for normal usage.

## 11.2 Reliability

* If AI response fails, user should be able to retry.
* User answers should not be lost during AI generation failure.
* Session state should be saved before calling AI APIs.

## 11.3 Security

* Protect user data.
* Do not expose API keys on frontend.
* Use server-side AI API calls.
* Rate limit AI endpoints.
* Sanitize user-generated content.

## 11.4 Privacy

* Tell users their answers may be processed by AI.
* Allow users to delete their data.
* Do not share user answers publicly.
* Avoid collecting unnecessary personal information.

## 11.5 Accessibility

* Keyboard navigable UI
* Clear focus states
* Good color contrast
* Screen-reader friendly labels
* Responsive layout

---

## 12. UX Requirements

## 12.1 Design Principles

The product should feel:

* Calm
* Focused
* Professional
* Encouraging
* Minimal but powerful

Avoid:

* Too many options at the start
* Overwhelming dashboards
* Long walls of text without structure
* Gamification that feels childish

## 12.2 Key Screens

1. Homepage
2. Onboarding
3. Topic selection
4. Interview session
5. Answer feedback
6. Session summary
7. Dashboard
8. History detail
9. Settings

## 12.3 Interview Screen Layout

Suggested layout:

Left side:

* Question
* Topic badge
* Difficulty badge
* Progress

Center:

* Answer input
* Submit button
* AI feedback after submission

Right side:

* Interview notes
* Previous questions
* Tips
* Timer

Mobile layout:

* Single-column layout
* Question at top
* Answer input below
* Feedback below answer

---

## 13. Data Model

## 13.1 User

```ts
type User = {
  id: string;
  email: string;
  name?: string;
  level: 'junior' | 'mid' | 'senior';
  targetRole?: string;
  targetCompanyType?: string;
  preferredTopics: string[];
  createdAt: string;
  updatedAt: string;
};
```

## 13.2 InterviewSession

```ts
type InterviewSession = {
  id: string;
  userId: string;
  mode: 'quick' | 'standard' | 'deep_coaching';
  topics: string[];
  difficulty: 'junior' | 'mid' | 'senior';
  status: 'in_progress' | 'completed' | 'ended_early';
  overallScore?: number;
  startedAt: string;
  completedAt?: string;
};
```

## 13.3 InterviewQuestion

```ts
type InterviewQuestion = {
  id: string;
  sessionId: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  type: 'conceptual' | 'debugging' | 'system_design' | 'behavioral' | 'tradeoff';
  question: string;
  expectedPoints: string[];
  order: number;
};
```

## 13.4 UserAnswer

```ts
type UserAnswer = {
  id: string;
  questionId: string;
  sessionId: string;
  userId: string;
  answer: string;
  followUpAnswer?: string;
  createdAt: string;
};
```

## 13.5 AnswerFeedback

```ts
type AnswerFeedback = {
  id: string;
  answerId: string;
  overallScore: number;
  scores: {
    correctness: number;
    completeness: number;
    clarity: number;
    depth: number;
    tradeoffThinking: number;
    communication: number;
  };
  whatWentWell: string[];
  whatWasMissing: string[];
  technicalCorrections: string[];
  improvementSuggestions: string[];
  betterAnswer: string;
  seniorLevelAddition?: string;
  recommendedNextPractice: string[];
  createdAt: string;
};
```

---

## 14. API Design

## 14.1 Create Session

```http
POST /api/interview-sessions
```

Request:

```json
{
  "mode": "standard",
  "topics": ["React", "Performance"],
  "difficulty": "senior"
}
```

Response:

```json
{
  "sessionId": "session_123",
  "status": "in_progress"
}
```

## 14.2 Generate Question

```http
POST /api/interview-sessions/:sessionId/questions/generate
```

Response:

```json
{
  "questionId": "question_123",
  "question": "How would you investigate and optimize a slow React page?",
  "topic": "React",
  "difficulty": "senior",
  "type": "debugging",
  "expectedPoints": []
}
```

## 14.3 Submit Answer

```http
POST /api/questions/:questionId/answers
```

Request:

```json
{
  "answer": "I would first check React Profiler and network requests..."
}
```

Response:

```json
{
  "answerId": "answer_123",
  "status": "submitted"
}
```

## 14.4 Generate Feedback

```http
POST /api/answers/:answerId/feedback/generate
```

Response:

```json
{
  "feedbackId": "feedback_123",
  "overallScore": 4.1,
  "scores": {
    "correctness": 4,
    "completeness": 4,
    "clarity": 4,
    "depth": 4,
    "tradeoffThinking": 4,
    "communication": 5
  },
  "betterAnswer": "..."
}
```

## 14.5 Complete Session

```http
POST /api/interview-sessions/:sessionId/complete
```

Response:

```json
{
  "summaryId": "summary_123",
  "overallScore": 3.8,
  "strongAreas": [],
  "weakAreas": [],
  "recommendedTopics": []
}
```

---

## 15. Technical Architecture

## 15.1 Recommended Tech Stack

Frontend:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Zustand or TanStack Store
* TanStack Query
* shadcn/ui
* Recharts

Backend:

* Next.js API routes or separate Node.js service
* PostgreSQL
* Prisma ORM
* Redis for rate limiting, optional

AI:

* OpenAI API or compatible LLM provider
* Streaming responses for better UX
* Server-side prompt orchestration

Auth:

* NextAuth.js / Auth.js
* Supabase Auth, optional
* Clerk, optional

Deployment:

* Vercel for frontend and API
* Supabase / Neon for PostgreSQL

## 15.2 High-level Architecture

```text
User Browser
   |
   v
Next.js Frontend
   |
   v
Next.js API Layer
   |        \
   |         \--> AI Provider
   |
   v
PostgreSQL Database
```

## 15.3 Frontend Architecture

Suggested folders:

```text
src/
  app/
    page.tsx
    onboarding/
    practice/
    dashboard/
    history/
  components/
    interview/
    feedback/
    dashboard/
    common/
  features/
    interview/
      api/
      components/
      hooks/
      stores/
      types/
    feedback/
    dashboard/
  lib/
    ai/
    db/
    auth/
    utils/
```

## 15.4 State Management

Use TanStack Query for server state:

* Session data
* Questions
* Feedback
* Dashboard metrics

Use Zustand for local UI state:

* Current interview step
* Draft answer
* Timer state
* Modal state
* Temporary UI preferences

---

## 16. MVP Milestones

## Milestone 1: Foundation

Deliverables:

* Landing page
* Basic layout
* Auth or guest mode
* Topic selection
* Static question bank

## Milestone 2: Interview Flow

Deliverables:

* Create session
* Show question
* Submit answer
* Generate AI feedback
* Move to next question
* Complete session

## Milestone 3: Feedback and Summary

Deliverables:

* Structured scoring
* Better answer generation
* Session summary
* Save session history

## Milestone 4: Dashboard

Deliverables:

* Progress overview
* Topic score breakdown
* Previous session list
* Recommended practice

## Milestone 5: Polish

Deliverables:

* Responsive design
* Loading states
* Error handling
* Rate limiting
* Demo data
* Public portfolio page

---

## 17. MVP Feature Priority

## Must Have

* Topic selection
* Interview session
* Text answer input
* AI feedback
* Better answer
* Session summary
* Basic progress dashboard

## Should Have

* User login
* Session history
* Recommended topics
* Question difficulty control
* Follow-up questions

## Could Have

* Voice input
* Timer
* Company-specific mode
* Save favorite answers
* Export feedback to PDF

## Will Not Have Initially

* Video interview
* Live coding IDE
* Peer matching
* Payment
* Mobile app

---

## 18. Example MVP User Stories

## User Story 1: Start Practice

As a user, I want to choose a topic and start a mock interview so that I can practice quickly.

Acceptance criteria:

* User can select topic.
* User can select difficulty.
* User can start interview.
* First question appears after session starts.

## User Story 2: Submit Answer

As a user, I want to submit my answer so that I can receive feedback.

Acceptance criteria:

* User can type answer.
* Submit button is disabled when answer is empty.
* Answer is saved after submission.
* Loading state is shown while feedback is generated.

## User Story 3: Receive Feedback

As a user, I want to receive specific feedback so that I know how to improve.

Acceptance criteria:

* Feedback includes score.
* Feedback includes what went well.
* Feedback includes what was missing.
* Feedback includes better answer.

## User Story 4: Complete Session

As a user, I want to see a session summary so that I know my overall performance.

Acceptance criteria:

* Summary appears after final question.
* Summary includes average score.
* Summary includes weak areas.
* Summary includes recommended next topics.

## User Story 5: Track Progress

As a user, I want to see my progress over time so that I know whether I am improving.

Acceptance criteria:

* Dashboard shows total sessions.
* Dashboard shows average score.
* Dashboard shows topic breakdown.
* Dashboard shows recent sessions.

---

## 19. Edge Cases

## Interview Session

* User closes browser during session.
* AI feedback generation fails.
* User submits a very short answer.
* User submits irrelevant answer.
* User tries to submit empty answer.
* User ends session early.
* AI generates duplicate question.

## Dashboard

* User has no completed sessions.
* User has only one session.
* Scores are missing because feedback failed.

## AI

* AI response is too long.
* AI gives inconsistent score.
* AI hallucinates a technical fact.
* AI feedback is too generic.
* AI produces invalid JSON.

## Recommended Handling

* Save user answer before AI generation.
* Allow retry feedback generation.
* Validate AI response schema.
* Use fallback feedback message if AI fails.
* Add max token limits.
* Use structured output when possible.

---

## 20. Analytics Events

Recommended events:

```text
homepage_viewed
start_practice_clicked
onboarding_started
onboarding_completed
topic_selected
session_created
question_generated
answer_submitted
feedback_generated
followup_answered
session_completed
session_ended_early
dashboard_viewed
history_session_opened
better_answer_copied
recommended_practice_started
```

Important event properties:

* userId
* sessionId
* topic
* difficulty
* mode
* score
* questionType
* duration

---

## 21. Monetization Ideas

MVP can be free. Later monetization options:

### Free Plan

* 3 practice sessions per week
* Basic feedback
* Limited history

### Pro Plan

* Unlimited sessions
* Deep coaching mode
* Voice practice
* Company-specific interview mode
* Personalized study plan
* Export reports

### One-time Package

* Senior Frontend Interview Pack
* Frontend System Design Pack
* React Deep Dive Pack

---

## 22. Risks and Mitigations

## Risk 1: AI feedback is too generic

Mitigation:

* Use structured rubrics.
* Include expected answer points.
* Ask AI to cite missing points directly.
* Use examples in prompts.

## Risk 2: AI scoring is inconsistent

Mitigation:

* Define clear scoring criteria.
* Use fixed dimensions.
* Store rubric per question.
* Normalize scores in backend.

## Risk 3: AI cost becomes high

Mitigation:

* Limit free sessions.
* Cache question generation.
* Use smaller models for simple tasks.
* Use larger models only for deep feedback.

## Risk 4: Users do not return

Mitigation:

* Add progress dashboard.
* Add daily quick practice.
* Add weak area recommendations.
* Send reminder emails later, optional.

## Risk 5: Product feels like a generic chatbot

Mitigation:

* Make interview flow structured.
* Add scoring and progress tracking.
* Use topic-specific question bank.
* Provide dashboard and study plan.

---

## 23. Future Roadmap

## Phase 1: Text MVP

* Text-based interview
* AI feedback
* Session history
* Dashboard

## Phase 2: Voice Practice

* Speech-to-text answer input
* AI voice interviewer
* Communication feedback
* Filler word detection, optional

## Phase 3: Frontend System Design Studio

* Whiteboard-like canvas
* Architecture diagram blocks
* Component tree design
* Data flow diagram
* AI critique

## Phase 4: Company-specific Practice

* Big Tech mode
* Fintech mode
* Crypto/Web3 mode
* Startup mode
* Custom company profile

## Phase 5: Personalized Study Plan

* Weekly plan
* Weak area drills
* Flashcards
* Saved answer review
* Practice streaks

---

## 24. Recommended MVP Build Plan

## Week 1: Product Foundation

* Create Next.js project
* Build landing page
* Build topic selection
* Define question bank schema
* Create static mock interview flow

## Week 2: AI Integration

* Create AI API endpoints
* Generate questions
* Submit answers
* Generate feedback
* Add loading and retry states

## Week 3: Session Summary and History

* Store sessions in database
* Generate session summary
* Build history page
* Build session detail page

## Week 4: Dashboard and Polish

* Build progress dashboard
* Add charts
* Add recommended practice
* Improve UI
* Add demo data
* Prepare portfolio write-up

---

## 25. Portfolio Positioning

This project can be described on a resume as:

**AI Interview Coach**
Built an AI-powered technical interview preparation platform for frontend engineers, featuring realistic mock interviews, rubric-based answer scoring, personalized feedback, better answer generation, session history, and progress analytics.

Possible resume bullets:

* Designed and developed an AI-powered mock interview platform using Next.js, TypeScript, Tailwind CSS, and PostgreSQL.
* Implemented structured AI feedback with multi-dimensional scoring across correctness, clarity, depth, trade-off thinking, and communication.
* Built a personalized progress dashboard to track topic-level performance and recommend targeted practice sessions.
* Created a frontend system design question bank covering React, performance, browser APIs, testing, and architecture topics.
* Integrated server-side AI workflows with prompt orchestration, response validation, retry handling, and rate limiting.

---

## 26. MVP Definition of Done

The MVP is considered complete when:

1. User can start a practice session.
2. User can answer at least 3 questions.
3. AI can generate structured feedback for each answer.
4. User can see a final session summary.
5. User can view past sessions.
6. User can view basic progress dashboard.
7. The app is responsive and deployable.
8. AI failure states are handled safely.
9. The project is presentable in a portfolio.

---

## 27. Open Questions

1. Should MVP require login or allow guest-only mode first?
2. Should questions come from a static question bank, AI generation, or hybrid approach?
3. Should voice input be included in MVP or saved for phase 2?
4. Should the product focus only on frontend first or include full-stack later?
5. Should company-specific mode be based on public interview patterns or user-uploaded job descriptions?
6. Should the system support Vietnamese or Chinese explanations for non-native speakers?

---

## 28. Recommended MVP Direction

For the first version, the strongest direction is:

**A text-based AI interview coach focused on Senior Frontend and Frontend System Design interviews.**

Why:

* It matches a clear user pain point.
* It is realistic to build as a side project.
* It demonstrates strong frontend and AI product skills.
* It is useful for the creator personally.
* It can become a strong portfolio project for Singapore or global frontend roles.

The MVP should not try to do everything. It should do one thing very well:

**Help frontend engineers answer interview questions better through realistic practice and structured AI feedback.**
