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
    
    // Calculate speech characteristics for more dynamic analysis
    const words = transcript.split(' ').filter(w => w.length > 0);
    const avgWordLength = words.reduce((acc, w) => acc + w.length, 0) / (words.length || 1);
    const hasFillerWords = /\b(um|uh|like|you know|basically|actually|literally)\b/gi.test(transcript);
    const hasQuestionMark = transcript.includes('?');
    const isShortBurst = words.length < 5;
    const isLongSentence = words.length > 20;
    
    const prompt = `
    Analyze this REAL-TIME speech segment for vocal characteristics and communication effectiveness.
    
    SPEECH SEGMENT: "${transcript}"
    
    CONTEXT:
    - Previous tones (last 5): ${previousTones.slice(-5).join(", ") || "Starting analysis"}
    - Word count: ${words.length}
    - Average word length: ${avgWordLength.toFixed(1)}
    - Contains filler words: ${hasFillerWords}
    - Question pattern: ${hasQuestionMark}
    - Segment type: ${isShortBurst ? 'short burst' : isLongSentence ? 'long sentence' : 'normal length'}
    
    ANALYZE FOR REALISTIC VOICE PATTERNS:
    1. PITCH (0-100):
       - Nervous/uncertain: 65-85 (higher pitch)
       - Confident/assertive: 35-55 (lower, steady)
       - Excited/enthusiastic: 55-75 (varied)
       - Tired/bored: 25-40 (low, monotone)
       - Questions naturally rise: +10-20 points
       - Filler words indicate: +5-10 points (nervousness)
    
    2. TONE CLASSIFICATION:
       - Based on word choice, sentence structure, and context
       - Consider: confident, nervous, enthusiastic, calm, uncertain, professional, friendly, hesitant, assertive, engaging
    
    3. ENERGY LEVEL:
       - Short bursts + questions = high energy or nervousness
       - Long sentences + filler words = uncertainty or rambling
       - Medium length + clear words = optimal energy
    
    4. EMOTION DETECTION:
       - Map to realistic emotions based on speech patterns
       - Consider: calm, excited, anxious, frustrated, happy, uncertain, engaged, bored, stressed, focused
    
    5. CONSISTENCY SCORE:
       - Compare with previous tones
       - Natural variation is 70-90%
       - Too consistent (95-100%) might indicate monotone
       - Too inconsistent (<50%) might indicate nervousness
    
    Provide DYNAMIC, REALISTIC feedback in JSON:
    {
      "pitch": number (fluctuate realistically based on content, 0-100),
      "tone": string (most appropriate from the list above),
      "consistency": number (0-100, natural variation expected),
      "emotion": string (current emotional state),
      "suggestions": [3 SPECIFIC, actionable tips based on THIS exact speech],
      "energy": string (low/optimal/high/varies)
    }
    
    Make pitch FLUCTUATE naturally:
    - Questions should show rising pitch
    - Statements should be steady
    - Nervousness shows in higher, varying pitch
    - Confidence shows in lower, steady pitch
    
    Make suggestions ULTRA-SPECIFIC to what was just said.
    
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