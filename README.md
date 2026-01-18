# Simple as That - LinkedIn Content Creator

> AI-powered LinkedIn content studio for discovering and sharing AI tools

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase)

---

## Overview

**Simple as That** is a comprehensive content creation platform designed specifically for LinkedIn. It leverages AI to help you discover trending AI tools, generate engaging posts, and publish directly to LinkedIn — all from one streamlined interface.

---

## Key Features

### 🔍 AI Tools Research
Discover trending AI tools using Perplexity-powered search. Choose from preset queries or create custom searches, with results including structured summaries, pricing, and use cases.

### ✍️ Smart Draft Editor
Create LinkedIn posts with AI assistance. Features include:
- Live preview (desktop & mobile) with your actual LinkedIn profile data
- Content rewrite options (tighten, expand, add CTA, change tone)
- Character count and formatting validation

### #️⃣ Hashtag Management
Generate optimized hashtags using a three-bucket system:
- **Broad** - High-reach general tags
- **Niche** - Industry-specific tags
- **Trending** - Current trending tags

### 🎨 Image Generation
Multiple image options for your posts:
- AI-generated images (DALL-E 3 or Gemini models)
- Fetch OG images from source URLs
- Upload and manage your own assets

### 🔗 LinkedIn Integration
OAuth-based connection for:
- Direct publishing to LinkedIn
- Profile data sync (name, avatar)
- Publication history tracking

### 🛡️ Content Guardrails
Maintain content quality with:
- Banned phrases detection
- Required disclaimers
- Clickbait prevention
- Maximum hashtag limits

### 🌐 Dual Language Support
Full support for English and Hebrew, including:
- RTL layout for Hebrew
- Per-draft language selection
- Localized AI generation

### 📊 AI Transparency
Complete audit trail via AI Output Ledger tracking all AI-generated content with model info, tokens used, and timestamps.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| State | TanStack Query |
| Backend | Supabase (Lovable Cloud) |
| AI | Perplexity, OpenAI, Google Gemini |

---

## Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview with stats and recent activity |
| **Topics** | AI tools research and discovery |
| **Drafts** | Content editor with live preview |
| **Assets** | Image library management |
| **Published** | Publication history |
| **Settings** | LinkedIn, prompts, guardrails, language |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone <your-repo-url>

# Navigate to project
cd simple-as-that

# Install dependencies
npm install

# Start development server
npm run dev
```
---
### Environment Variables

Create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

```
---
### Workflow
```
Research AI Tools → Select Tool → Generate Draft → Edit & Preview → 
Add Hashtags → Generate Image → Publish to LinkedIn
```
---
## ⚙️ Configuration

All settings are managed through the **Settings** page:

| Tab | Description |
|-----|-------------|
| **LinkedIn** | Connect your LinkedIn account via OAuth |
| **Prompts** | Customize AI generation prompts |
| **Images** | Select default image generation model |
| **Guardrails** | Set content rules and banned phrases |
| **Language** | Choose interface and content language |


---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
