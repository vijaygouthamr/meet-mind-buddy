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

export interface PostureAnalysisResult {
  overallPosture: 'excellent' | 'good' | 'needs improvement' | 'poor';
  score: number;
  issues: string[];
  improvements: string[];
  bodyLanguage: string;
  confidence: number;
}

// Function to analyze voice tone from audio text with real-time feedback
export async function analyzeVoiceTone(transcript: string, previousTones: string[]): Promise<VoiceAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    Analyze this REAL-TIME speech for immediate feedback on tone, pitch, and consistency.
    Previous tones (last 5): ${previousTones.slice(-5).join(", ") || "Starting analysis"}
    Current speech: "${transcript}"
    
    ANALYZE FOR:
    1. Filler words (um, uh, like, you know) - indicates nervousness
    2. Sentence length - short = tension, long = uncertainty
    3. Question inflection on statements - lack of confidence
    4. Speech pace indicators - rushed words = anxiety
    5. Power words vs weak words
    6. Professional vocabulary usage
    
    Provide IMMEDIATE, ACTIONABLE feedback in JSON:
    {
      "pitch": number (0-100, where 40-60 is optimal, <30 too low, >70 too high),
      "tone": string (confident/nervous/enthusiastic/calm/uncertain/professional/friendly/hesitant/assertive),
      "consistency": number (0-100, compare with previous tones),
      "emotion": string (calm/excited/anxious/frustrated/happy/uncertain/engaged/bored/stressed),
      "suggestions": [3 SPECIFIC real-time tips based on actual speech content],
      "energy": string (low/optimal/high/varies)
    }
    
    Make suggestions SPECIFIC to what was just said, like:
    - "Remove 'um' before key points"
    - "Slow down when explaining technical concepts"
    - "Raise voice slightly for emphasis"
    - "Pause between sentences for clarity"
    
    Return ONLY valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const cleanedText = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (parseError) {
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

// Function to get real-time interview response based on conversation context
export async function getInterviewResponse(question: string, context: string): Promise<QuestionResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    You are an expert interview coach providing REAL-TIME guidance.
    
    Question asked: "${question}"
    What they've been discussing: "${context || 'Just started the conversation'}"
    
    Based on the ACTUAL CONVERSATION CONTEXT, provide:
    1. question: the original question
    2. answer: A CONTEXTUAL answer that references what they've ALREADY discussed (2-3 sentences)
    3. confidence: confidence level (0-100)
    4. tips: 3 SPECIFIC tips using words and topics from their actual conversation
    
    Make it CONTEXTUAL:
    - If they mentioned specific projects, reference those
    - If they used certain terminology, incorporate it
    - If they showed expertise in an area, leverage it
    - Suggest specific words and phrases to use based on the discussion
    
    Example contextual tips:
    - "Since you mentioned [specific project], elaborate on the challenges you overcame"
    - "Use the technical term [X] you mentioned earlier to show expertise"
    - "Connect this to your experience with [Y] you just discussed"
    
    Return ONLY valid JSON.
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

// Function to analyze body posture from webcam image
export async function analyzeBodyPosture(imageBase64: string): Promise<PostureAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Analyze this person's body posture and body language in a professional meeting context.
    
    EVALUATE:
    1. Overall posture (sitting/standing position)
    2. Shoulder position (slouched, tense, relaxed)
    3. Head position (straight, tilted, forward)
    4. Eye contact with camera
    5. Facial expression
    6. Hand position and gestures
    7. Professional appearance
    8. Confidence indicators
    
    Provide ACTIONABLE feedback in JSON:
    {
      "overallPosture": string (excellent/good/needs improvement/poor),
      "score": number (0-100),
      "issues": [list 2-3 specific posture issues observed],
      "improvements": [list 3-4 specific, actionable improvements],
      "bodyLanguage": string (brief description of what the body language conveys),
      "confidence": number (0-100, based on posture and body language)
    }
    
    Make improvements SPECIFIC and immediately actionable:
    - "Straighten your shoulders by rolling them back"
    - "Lift your chin slightly to improve eye contact"
    - "Relax your hands on the desk to appear more confident"
    - "Sit back in your chair for better posture"
    
    Return ONLY valid JSON.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1] // Remove data:image/jpeg;base64, prefix
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    try {
      const cleanedText = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (parseError) {
      return {
        overallPosture: 'good',
        score: 70,
        issues: ["Unable to analyze posture clearly"],
        improvements: [
          "Ensure good lighting for camera",
          "Sit upright with shoulders back",
          "Maintain eye contact with camera"
        ],
        bodyLanguage: "Professional and engaged",
        confidence: 70
      };
    }
  } catch (error) {
    console.error("Gemini API posture analysis error:", error);
    throw error;
  }
}