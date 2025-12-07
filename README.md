# Project Code

<p align="center">
  <a href="#" target="_blank">
    <img src="https://placehold.co/600x150/25830e/ffffff/png?text=Project+Code" alt="Project Code Banner">
  </a>
</p>

<p align="center">
  <strong>An AI-powered platform designed to revolutionize project-based learning.</strong>
  <br />
  Stop watching tutorials and start building real-world applications with dynamically generated, step-by-step guidance from our intelligent agent.
</p>

---

## ✨ Key Features

-   **🤖 AI-Powered Tutorial Generation**: Describe the project you want to build, and our AI will generate a complete, structured tutorial from scratch.
-   **📋 Structured Learning Paths**: Projects are broken down into logical steps and granular sub-tasks, providing a clear path from concept to completion.
-   **📝 On-Demand Content**: Detailed instructions, explanations, and code snippets are generated for each task as you progress.
-   **✅ Interactive Checklists**: Keep track of your progress with an interactive checklist for every step.
-   **💡 Personalized Assistance**: Stuck on a task? Ask our integrated AI Assistant for hints, explanations, or code analysis.
-   **🔍 Project Discovery**: Browse and filter a list of generated and pre-defined projects by technology and difficulty.

---

## 🚀 Tech Stack

This project is built with a modern, robust, and scalable technology stack:

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Generative AI**: [Google Gemini](https://deepmind.google/technologies/gemini/) via [Genkit](https://firebase.google.com/docs/genkit)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **State Management**: React Hooks & Context API
-   **Form Handling**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

---

## 🛠️ Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18.x or later)
-   `npm` or your favorite package manager

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/byteom/ProjectForgeAI.git
    cd ProjectForgeAI
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of your project. You can copy the example file:
    ```bash
    cp .env.local.example .env.local
    ```
    
    Then edit `.env.local` and add your credentials:
    
    **Required:**
    - **GEMINI_API_KEY**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
    - **Firebase Configuration**: Get these from [Firebase Console](https://console.firebase.google.com/) > Project Settings > General > Your apps
    
    ```env
    # Google Gemini API Key (Required for AI features)
    GEMINI_API_KEY=your_gemini_api_key_here
    
    # Firebase Configuration (Required)
    NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```
    
    **Optional (for admin features):**
    - Place `serviceAccountKey.json` in the project root (for admin seeding)
    - Or set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local` for seeding admin users

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application should now be running on [http://localhost:9002](http://localhost:9002).

---

## 📝 Bulk Loading Interview Questions

You can bulk load interview questions into the database using the provided scripts:

### Load Technical/CSE Questions (30 Questions)

To load 30 commonly asked technical and Computer Science Engineering interview questions:

```bash
npm run bulk-load-cse
```

This will load questions covering:
- Data Structures & Algorithms
- System Design
- Databases
- Operating Systems
- Computer Networks
- OOP Concepts
- Programming Languages
- And more...

### Load Custom Questions

To load questions from a custom JSON file:

```bash
npm run bulk-load <filename.json>
```

Or use the default sample questions:

```bash
npm run bulk-load
```

**Question JSON Format:**
```json
{
  "question": "Your question here",
  "category": "Technical" | "Behavioral",
  "type": "General" | "Backend" | "Frontend" | "Full Stack" | "DevOps",
  "difficulty": "Easy" | "Medium" | "Hard",
  "company": "Optional company name",
  "tags": ["tag1", "tag2"]
}
```

---

## 🔧 Troubleshooting

### API Quota Exceeded Error

If you see an error like `429 Too Many Requests` or `Quota exceeded`, this means you've hit the Gemini API free tier limits.

**Solutions:**
1. **Wait**: The free tier has rate limits. Wait a few minutes (usually 1-60 minutes) and try again.
2. **Check Your Quota**: Visit [Google AI Studio Usage](https://ai.dev/usage?tab=rate-limit) to see your current usage and limits.
3. **Upgrade Your Plan**: Consider upgrading to a paid plan in [Google Cloud Console](https://console.cloud.google.com/) for higher quotas.
4. **Use a Different API Key**: If you have multiple Google accounts, try using a different API key.

**Free Tier Limits (approximate):**
- Requests per minute: Limited
- Requests per day: Limited
- Input tokens per minute: Limited

For more details, see [Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits).

### Firestore 403 Forbidden Error

If you see `403 Forbidden` errors from Firestore:
1. Check your Firebase configuration in `.env.local`
2. Ensure your Firebase project has the correct permissions
3. Verify your service account has the necessary roles (if using admin features)

### WebSocket Connection Failed

The WebSocket error for Hot Module Replacement (HMR) is usually harmless and doesn't affect functionality. It's a development server issue that can be ignored.

---

## 🤝 Acknowledgements

This project was envisioned and brought to life by **Om Singh**.

-   **GitHub**: [@byteom](https://github.com/byteom)
-   **Let's Connect!**: Feel free to reach out for collaborations or just to chat about tech.

Made with ❤️ and a lot of code.
