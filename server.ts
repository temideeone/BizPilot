import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded GenAI client to prevent startup crash if key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it via Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

/**
 * Helper to execute Gemini generation with automatic cross-model failover and backoff.
 * 
 * Key architectural insight: Free-tier rate limits (429 RESOURCE_EXHAUSTED) and 503 spikes
 * are scoped PER MODEL. When one model is exhausted or experiencing high demand, switching
 * immediately to an alternate model (e.g., gemini-3.1-flash-lite, gemini-3.8-flash, gemini-3.1-pro-preview)
 * succeeds instantly without waiting for cooldown timers.
 */
async function generateContentWithRetry(
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  },
  maxPasses = 2
) {
  const ai = getAiClient();
  // Order: flash-lite (high capacity & speed), 3.8-flash (standard), flash-latest, pro-preview (reasoning)
  const baseModels = [
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3.1-pro-preview"
  ];

  // If a preferred model is provided, place it first
  const modelsToTry = params.preferredModel 
    ? [params.preferredModel, ...baseModels.filter(m => m !== params.preferredModel)]
    : baseModels;

  let lastError: any = null;

  for (let pass = 0; pass < maxPasses; pass++) {
    for (const currentModel of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isUnavailable = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE");
        const isRateLimit = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED");

        if (isRateLimit || isUnavailable) {
          // Immediately switch to the next model in the pool (they have independent quotas)
          console.warn(`[Gemini API] ${isRateLimit ? '429 Rate Limit' : '503 High Demand'} on ${currentModel}. Failing over to next available model in pool...`);
          continue;
        }

        console.warn(`[Gemini API] Error on model ${currentModel}: ${errMsg}. Trying next model...`);
      }
    }

    if (pass < maxPasses - 1) {
      console.warn(`[Gemini API] All models busy in pass ${pass + 1}. Waiting 1s before second pass...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw lastError;
}

function handleApiError(res: express.Response, logPrefix: string, err: any) {
  console.error(logPrefix, err);
  const errMsg = err?.message || String(err);
  const isUnavailable = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE");
  const isRateLimit = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED");

  res.setHeader("Content-Type", "application/json");

  if (isUnavailable) {
    return res.status(503).json({
      error: "The AI service is experiencing temporary high demand across Google Cloud. Please try again shortly."
    });
  }

  if (isRateLimit) {
    return res.status(429).json({
      error: "Service quota momentarily exceeded. Please wait a brief moment and retry."
    });
  }

  return res.status(500).json({
    error: errMsg || "An unexpected error occurred while communicating with Gemini."
  });
}

const SYSTEM_INSTRUCTION = `You are BizPilot AI, an elite virtual Chief Operating Officer, Accountant, and Strategic Marketing Consultant. 
You provide highly professional, detailed, and actionable business advice.

CRITICAL REQUIREMENT: You MUST ALWAYS structure every single response with these exact six sections, using clear markdown headers:
## Executive Summary
[Provide a summary of the advice and core ideas]

## Analysis
[Deconstruct the situation, metrics, and background]

## Recommendations
[Provide direct, professional, specific recommendations]

## Risks
[Identify potential hazards, pitfalls, and cash flow concerns]

## Opportunities
[Identify upside potential, market gaps, or operational leverage]

## 30-Day Action Plan
[Provide a step-by-step checklist of what to do over the next 30 days]

Do not omit any of these six sections under any circumstances. Be thorough, concrete, and quantitative where possible. Use bullet points for checklists.`;

// API route for chatbot advice
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Map history to the format required by contents parameter
    // Each history item is { sender: 'user' | 'pilot', text: string }
    const formattedContents: any[] = [];
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        formattedContents.push({
          role: msg.sender === 'pilot' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        });
      });
    }

    // Append current user message
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await generateContentWithRetry({
      contents: formattedContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "I was unable to generate a detailed response. Please try again.";
    return res.json({ text: replyText });
  } catch (err: any) {
    return handleApiError(res, "Gemini Chat API Error:", err);
  }
});

// API route for Business Plan generation
app.post("/api/generate-business-plan", async (req, res) => {
  try {
    const { planTitle, industry, targetAudience, budget, usp } = req.body;
    if (!planTitle || !industry) {
      return res.status(400).json({ error: "Plan title and Industry sector are required." });
    }

    const prompt = `Generate a comprehensive, high-quality, and professional Business Plan for a business with the following details:
Business Name: ${planTitle}
Industry Sector: ${industry}
Target Audience/Market: ${targetAudience || "General target consumers"}
Starting Budget Constraint: ${budget || "Not specified"}
Unique Selling Proposition (USP): ${usp || "Not specified"}

You MUST structure the plan exactly with these headers. Provide rich, detailed paragraphs, bullet points, and realistic numbers or SWOT data:

# ${planTitle} - Professional Business Plan

## Executive Summary
[Provide an elite, professional executive summary outlining the vision, market problem, company description, and growth expectations]

## Market Analysis
[Provide an exhaustive market analysis describing the industry landscape, target audience needs, size of target market, and competitor weaknesses]

## SWOT
[Provide a thorough SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis organized cleanly using bullet points or lists]

## Financial Plan
[Provide a structured financial plan outlining recommended startup expenses, a realistic year-1 cash flow forecast, break-even timeline, and budget metrics]

## Marketing Strategy
[Provide a robust marketing strategy detailing high-converting client acquisition funnels, digital marketing, organic channels, and brand positioning]

## Revenue Model
[Provide a clear description of the revenue streams, price points, gross margins, and recurring subscription or sales options]

## Conclusion
[Provide an inspiring conclusion summary wrapping up the strategic next steps, investment viability, and company milestones]

Ensure the output is in clean Markdown, detailed, quantitative, and professional. Do not omit any section.`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    const replyText = response.text || "I was unable to generate a detailed business plan. Please try again.";
    return res.json({ text: replyText });
  } catch (err: any) {
    return handleApiError(res, "Business Plan API Error:", err);
  }
});

// API route for Quotation generation
app.post("/api/generate-quotation", async (req, res) => {
  try {
    const { clientName, clientEmail, description, budget } = req.body;
    if (!clientName) {
      return res.status(400).json({ error: "Client business name is required." });
    }

    const prompt = `Given the following project details, generate a professional corporate quotation in JSON format:
Client Business Name: ${clientName}
Client Email: ${clientEmail || "billing@client.com"}
Project/Services Description: ${description || "General strategic business consulting and support services"}
Estimated Budget Constraint: ${budget || "Market standard rates"}

Task:
1. Generate 3 to 5 detailed itemized line items with description, quantity, and price based on the project description and budget.
2. Generate a valid quotation number in the format 'QT-2026-XXX' where XXX is a random 3-digit number.
3. Suggest a validity date (YYYY-MM-DD format) exactly 30 days from now.
4. Keep tax rate around 10% and discount around $100 unless the description dictates otherwise.

You MUST return a JSON object with this EXACT structure (do not wrap in any markdown, just raw JSON, and output nothing else):
{
  "clientName": "${clientName}",
  "clientEmail": "${clientEmail || "billing@client.com"}",
  "quoteNo": "QT-2026-101",
  "validUntil": "2026-07-27",
  "items": [
    { "desc": "Detailed service item description here", "quantity": 1, "price": 1500 }
  ],
  "taxRate": 10,
  "discount": 100,
  "status": "draft"
}`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });

    const replyText = response.text;
    if (!replyText) {
      throw new Error("No response text generated by Gemini.");
    }

    const cleanJson = replyText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsedJson = JSON.parse(cleanJson);
    return res.json(parsedJson);
  } catch (err: any) {
    return handleApiError(res, "Quotation API Error:", err);
  }
});

// API route for Invoice generation
app.post("/api/generate-invoice", async (req, res) => {
  try {
    const { clientName, clientEmail, description, pricing } = req.body;
    if (!clientName) {
      return res.status(400).json({ error: "Client name is required." });
    }

    const prompt = `Given the following business details, generate a professional corporate invoice in JSON format:
Client Name: ${clientName}
Client Email: ${clientEmail || "billing@client.com"}
Deliverables/Tasks Completed: ${description || "General strategic consulting work and administrative support"}
Pricing Guidelines: ${pricing || "Market standard hourly rate of $80/hr"}

Task:
1. Generate 2 to 4 detailed itemized line items with detailed description, quantity (hours or items), and rate based on the completed deliverables and pricing.
2. Generate a valid invoice number in format 'INV-2026-XXX' where XXX is a random 3-digit number.
3. Suggest a due date (YYYY-MM-DD format) exactly 15 days from now.
4. Suggest standard payment transfer coordinates (bank name, SWIFT/routing, account).

You MUST return a JSON object with this EXACT structure (do not wrap in any markdown, just raw JSON, and output nothing else):
{
  "clientName": "${clientName}",
  "clientEmail": "${clientEmail || "billing@client.com"}",
  "invoiceNo": "INV-2026-101",
  "dueDate": "2026-07-15",
  "lines": [
    { "description": "Detailed line item description here", "quantity": 40, "rate": 75 }
  ],
  "taxRate": 15,
  "discount": 150,
  "paymentDetails": "Standard corporate bank details routing and account coordinates",
  "invoiceStatus": "unpaid"
}`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });

    const replyText = response.text;
    if (!replyText) {
      throw new Error("No response text generated by Gemini.");
    }

    const cleanJson = replyText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsedJson = JSON.parse(cleanJson);
    return res.json(parsedJson);
  } catch (err: any) {
    return handleApiError(res, "Invoice API Error:", err);
  }
});

// API route for AI Marketing Suite content generation
app.post("/api/generate-marketing-content", async (req, res) => {
  try {
    const { module: mod, tone, targetAudience, businessType, language, description } = req.body;
    
    if (!mod || !businessType) {
      return res.status(400).json({ error: "Module and Business type are required." });
    }

    let specificGuidelines = "";
    
    switch (mod) {
      case "facebook":
        specificGuidelines = `
- Generate a highly engaging Facebook post.
- Start with a compelling hook or scroll-stopping headline using emojis.
- Include 3-4 bulleted benefits or features written in an approachable manner.
- Include a clear, singular Call to Action (CTA) telling the user exactly what to do (e.g. visit website, sign up, comment).
- Keep the style highly visual with spaces between paragraphs.
- Suggest 4-5 relevant hashtags at the bottom.`;
        break;
      case "instagram":
        specificGuidelines = `
- Generate an aesthetic, high-converting Instagram caption.
- Start with an attention-grabbing first line (the hook) that is visible before "more" is clicked.
- Use spacing and clear line breaks to prevent clutter.
- Incorporate conversational, lifestyle-oriented phrasing matching the specified tone.
- Include an interactive question or prompt to drive comments and engagement.
- Place a clean, structured block of 5-10 hashtags at the very bottom separated by dots or negative space.`;
        break;
      case "linkedin":
        specificGuidelines = `
- Generate a professional, thought-provoking LinkedIn post.
- Utilize a storytelling or professional value-sharing structure (e.g., sharing a lesson, a common industry myth, or an actionable tip).
- Use clear line breaks and single-sentence paragraphs to maximize mobile readability.
- Structure key takeaways with clean bullet points or numbered lists.
- Keep the CTA professional and inviting (e.g., share thoughts in the comments, download resource).
- Include 3-5 relevant industry and professional hashtags.`;
        break;
      case "x":
        specificGuidelines = `
- Generate a high-impact X (Twitter) post (under 280 characters) or a short 2-post thread if more details are needed.
- Write with sharp, punchy, and direct sentences.
- Open with a bold hook or intriguing statement.
- State a single key benefit or unique insight.
- Conclude with a short call to action.
- Use no more than 1-2 relevant, trending hashtags.`;
        break;
      case "whatsapp":
        specificGuidelines = `
- Generate a direct, friendly, and persuasive WhatsApp promotional message.
- Use standard WhatsApp formatting: *bold* using asterisks, _italics_ using underscores, and ~strikethrough~ where appropriate.
- Begin with an attention-grabbing headline (e.g., "*EXCLUSIVE PROMOTION* 🚀").
- List key benefits or offer details using clear bullet points.
- Include a crystal-clear call to action with a placeholder link (e.g., "Tap the link below to claim yours: [LINK]").
- Provide contact placeholder details at the bottom.
- Keep it highly readable on mobile screens.`;
        break;
      case "email":
        specificGuidelines = `
- Generate a complete, high-converting promotional/marketing email campaign.
- Provide 3 distinct, high-clickrate Subject Line options.
- Provide a brief, engaging Preheader (teaser text) option.
- Write a warm, customized greeting.
- Write an engaging body copy starting with a clear customer pain point, followed by your business's solution.
- List 3-4 clear customer outcomes/benefits using a bulleted list.
- Conclude with a strong, prominent, and clickable Call to Action (CTA) button or link placeholder.
- Add a professional sign-off and footer layout placeholder.`;
        break;
      case "business_name":
        specificGuidelines = `
- Generate 10 premium, highly creative, and strategic business name ideas tailored strictly to the business concept and target audience.
- For each suggested name, provide:
  1. **Name**: The suggested brand name.
  2. **Slogan**: A short, catchy brand tagline or slogan.
  3. **Domain Recommendation**: Suggested custom domain (e.g. name.com, name.io) and predicted availability.
  4. **Suitability Score**: A percentage match (out of 100) based on alignment with the business type.
  5. **Strategic AI Reason**: 2-3 sentences explaining the marketing logic and brand psychology behind the name.
- Present these name concepts in an elegant, beautifully organized markdown list or table format.`;
        break;
      case "slogan":
        specificGuidelines = `
- Generate 15 distinct, memorable, and high-impact slogans or taglines for the business.
- Categorize the slogans into these 5 branding styles (provide 3 options per style):
  1. **Bold & Authoritative** (Confidence, power, and market leadership)
  2. **Modern & Minimalist** (Sleek, direct, and sophisticated)
  3. **Playful & Friendly** (Warm, approachable, and creative)
  4. **Emotional & Visionary** (Connecting to dreams, values, and long-term impact)
  5. **Direct & Action-Oriented** (Immediate benefit and call to action)
- For each slogan, provide a 1-sentence strategic note about when/where to use it (e.g., website header, print ad, social bio).`;
        break;
      case "brand_story":
        specificGuidelines = `
- Write an inspiring, emotional, and authentic Brand Story or Company Narrative.
- Divide the narrative into these 4 compelling sections with clear markdown headers:
  1. ## The Spark (Our Origin) - Write a highly engaging narrative on how the idea was born, the initial struggle, and the aha moment.
  2. ## The Core Beliefs (What We Stand For) - Outline the core values and philosophical views driving the brand.
  3. ## The Mission (The Change We Drive) - Define the immediate value we are committed to delivering for our target audience.
  4. ## The Vision (Our Tomorrow) - Paint an inspiring picture of the future we are building and the long-term impact we aim to achieve.
  - Ensure the copy is inspiring, authentic, and emotionally resonant.`;
        break;
    }

    const prompt = `You are an elite, world-class copywriter and brand strategist.
Generate highly professional marketing copy for the following business:
- **Business Type**: ${businessType}
- **Target Audience**: ${targetAudience || "General Audience"}
- **Brand Tone**: ${tone || "Professional and persuasive"}
- **Language**: ${language || "English"}
- **Additional Context/Keywords/Product Description**: ${description || "General brand launch and value promotion"}

### Specific Module Guidelines for ${mod.toUpperCase()}:
${specificGuidelines}

### CRITICAL REQUIREMENTS:
1. Write strictly in the requested language: "${language || "English"}".
2. Ensure the tone aligns perfectly with: "${tone || "Professional"}".
3. Write high-converting, original, and punchy copywriting. Avoid generic filler.
4. Output the results in clean, beautiful, and fully structured Markdown. Do not wrap the response in a markdown block of markdown (i.e. do not use "\`\`\`markdown ... \`\`\`" wrappers if possible, just output the raw markdown text so it reads beautifully).`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        temperature: 0.8,
      }
    });

    const replyText = response.text || "Unable to generate marketing content. Please try again.";
    return res.json({ text: replyText });
  } catch (err: any) {
    return handleApiError(res, "Marketing Gen API Error:", err);
  }
});

// API route for Business Health Improvement Roadmap generation
app.post("/api/generate-health-roadmap", async (req, res) => {
  try {
    const { businessType, globalScore, answers, strengths, weaknesses, riskLevel, recommendations, opportunities } = req.body;

    if (!businessType) {
      return res.status(400).json({ error: "Business type is required." });
    }

    const prompt = `You are an elite business growth consultant, venture strategist, and corporate advisor.
Your task is to write a highly customized, extremely actionable, and inspirational "Personalized Business Improvement Roadmap" for a company based on their recent Comprehensive Business Health Assessment.

### Business Under Review:
- **Business Type/Name**: ${businessType}
- **Calculated Business Health Score**: ${globalScore || 50} / 100
- **Identified Risk Profile**: ${riskLevel || "Moderate Risk"}
- **Identified Business Strengths**: ${strengths ? strengths.join(", ") : "N/A"}
- **Identified Key Vulnerabilities/Weaknesses**: ${weaknesses ? weaknesses.join(", ") : "N/A"}
- **Key Initial Recommendations**: ${recommendations ? recommendations.join(", ") : "N/A"}
- **Growth & Scaling Opportunities**: ${opportunities ? opportunities.join(", ") : "N/A"}

### Detailed Answers provided to Assessment Questions:
${JSON.stringify(answers, null, 2)}

---

### REQUIRED ROADMAP STRUCTURE:
Write a beautifully styled, deep-dive Markdown document. Use clear, elegant headers and do not use generic text wrappers. Include these exact sections:

1. # 📈 EXEC SUMMARY: Strategic Growth Diagnosis
   - A highly customized 2-paragraph business diagnostic narrative explaining how the company's score of ${globalScore}/100 positions them in the current market, why their strengths are valuable, and the hidden costs of ignoring their weaknesses.

2. # 🛡️ PHASE 1: Immediate Stabilization & Risk Mitigation (Month 1)
   - 3 specific, step-by-step actions they must execute in the next 30 days to resolve their top weaknesses and reduce their risk profile. For each action, specify:
     - **Action**: A clear title.
     - **Execution Steps**: 3 bulleted instructions.
     - **KPI Tracker**: How to measure success.
     - **BizPilot Tool to Use**: (e.g. "Invoice Generator for overdue collections", "Marketing Suite for promotional sequences", "Ask Pilot AI for contract reviews").

3. # 🚀 PHASE 2: Operational Optimization & Efficiency (Month 2 - 3)
   - 3 specific, structured actions to systematize their operations, improve internal hygiene, and build stable pipelines. For each action, specify:
     - **Action**: A clear title.
     - **Execution Steps**: 3 bulleted instructions.
     - **KPI Tracker**: How to measure success.
     - **BizPilot Tool to Use**: Choose the most relevant.

4. # 💎 PHASE 3: Strategic Scaling & Market Dominance (Month 4 - 6)
   - 2 ambitious yet highly practical scaling plans leveraging their strengths and the identified growth opportunities to outcompete the market. For each action, specify:
     - **Action**: A clear title.
     - **Execution Steps**: 3 bulleted instructions.
     - **KPI Tracker**: How to measure success.
     - **BizPilot Tool to Use**: Choose the most relevant.

5. # 📊 PILOT STRATEGY PRIORITY MATRIX
   - A markdown table evaluating the 8 suggested actions above against:
     - | Strategy Action | Priority (High/Med/Low) | Difficulty (Low/Med/High) | Direct Business Impact | 

Ensure the writing is inspiring, rigorous, and completely customized to a "${businessType}". Do not wrap the response in markdown code blocks (\`\`\`markdown ... \`\`\`), output raw markdown directly for elegant display.`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        temperature: 0.75,
      }
    });

    const replyText = response.text || "Unable to generate business roadmap. Please try again.";
    return res.json({ text: replyText });
  } catch (err: any) {
    return handleApiError(res, "Health Roadmap Gen API Error:", err);
  }
});

// Unmatched API routes must return JSON 404, never falling through to HTML index.html
app.all("/api/*", (req, res) => {
  res.status(404).setHeader("Content-Type", "application/json").json({
    error: `API route not found: ${req.method} ${req.path}`
  });
});

// Configure Vite middleware or static routes
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start Vite middleware server:", err);
});
