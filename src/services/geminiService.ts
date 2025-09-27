import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI("AIzaSyAig3HAg5M4eNoDCdJOTGaNNcCb_dhRmTY");

export interface VoiceAnalysisResult {
  pitch: number;
  tone: string;
  consistency: number;
  emotion: string;
  suggestions: string[];
  energy: "low" | "optimal" | "high";
}

export interface QuestionResponse {
  question: string;
  answer: string;
  confidence: number;
  tips: string[];
}

// Function to analyze voice tone from audio text
export async function analyzeVoiceTone(transcript: string, previousTones: string[]): Promise<VoiceAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    Analyze the following speech transcript for voice tone and delivery quality.
    Previous tones detected: ${previousTones.join(", ")}
    Current transcript: "${transcript}"
    
    Provide analysis in JSON format with:
    1. pitch: number between 0-100 (0=very low, 50=optimal, 100=very high)
    2. tone: one of "confident", "nervous", "enthusiastic", "calm", "uncertain", "professional", "friendly"
    3. consistency: percentage score for tone consistency with previous samples
    4. emotion: detected primary emotion
    5. suggestions: array of 2-3 specific actionable suggestions for improvement
    6. energy: "low", "optimal", or "high"
    
    Focus on:
    - Maintaining consistent tone throughout
    - Professional delivery
    - Clear communication
    - Engagement level
    
    Return ONLY valid JSON without markdown formatting.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Clean the response and parse JSON
      const cleanedText = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (parseError) {
      // Fallback response if parsing fails
      return {
        pitch: 50,
        tone: "neutral",
        consistency: 75,
        emotion: "calm",
        suggestions: [
          "Maintain steady pace",
          "Keep tone consistent",
          "Speak with confidence"
        ],
        energy: "optimal"
      };
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

// Function to get real-time interview response
export async function getInterviewResponse(question: string, context: string): Promise<QuestionResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    You are an expert interview coach. The interviewee just received this question: "${question}"
    
    Context from the conversation: "${context}"
    
    Provide a response in JSON format with:
    1. question: the original question
    2. answer: a concise, professional suggested answer structure (2-3 sentences max)
    3. confidence: confidence level for this answer (0-100)
    4. tips: array of 2-3 specific tips for answering this question effectively
    
    Focus on:
    - STAR method where applicable (Situation, Task, Action, Result)
    - Being specific and concise
    - Highlighting relevant skills
    - Showing enthusiasm and cultural fit
    
    Return ONLY valid JSON without markdown formatting.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const cleanedText = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (parseError) {
      return {
        question: question,
        answer: "Structure your response with specific examples from your experience.",
        confidence: 70,
        tips: [
          "Use the STAR method",
          "Be specific with examples",
          "Keep it concise"
        ]
      };
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

// Function to analyze speech patterns for consistency
export async function analyzeSpeechConsistency(audioTranscripts: string[]): Promise<{
  overallConsistency: number;
  patterns: string[];
  improvements: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    Analyze these speech segments for consistency in tone, pace, and delivery:
    ${audioTranscripts.map((t, i) => `Segment ${i + 1}: "${t}"`).join("\n")}
    
    Provide analysis in JSON format with:
    1. overallConsistency: percentage score (0-100)
    2. patterns: array of 2-3 observed speech patterns
    3. improvements: array of 2-3 specific improvements for maintaining consistency
    
    Focus on identifying:
    - Tone variations
    - Pace changes
    - Energy fluctuations
    - Filler words
    - Clarity issues
    
    Return ONLY valid JSON without markdown formatting.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const cleanedText = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (parseError) {
      return {
        overallConsistency: 75,
        patterns: ["Generally steady tone", "Occasional pace variations"],
        improvements: ["Maintain consistent energy", "Reduce filler words"]
      };
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}