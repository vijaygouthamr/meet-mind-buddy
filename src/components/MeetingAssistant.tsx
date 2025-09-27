import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Mic, 
  MicOff, 
  Volume2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lightbulb,
  X,
  Minimize2,
  Move,
  Activity,
  Zap,
  MessageSquare,
  CheckCircle,
  Sun,
  Moon
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { 
  analyzeVoiceTone, 
  getInterviewResponse, 
  analyzeSpeechConsistency,
  VoiceAnalysisResult,
  QuestionResponse 
} from "@/services/geminiService";

const MeetingAssistant = () => {
  const [notes, setNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionResponse, setQuestionResponse] = useState<QuestionResponse | null>(null);
  const [toneHistory, setToneHistory] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    segments,
    error: speechError,
    isSupported
  } = useSpeechRecognition();

  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysisResult>({
    pitch: 50,
    tone: "neutral",
    consistency: 100,
    emotion: "calm",
    suggestions: [
      "Click 'Start Recording' to begin voice analysis",
      "Speak clearly and maintain a steady pace",
      "The AI will provide real-time feedback"
    ],
    energy: "optimal"
  });

  const [consistencyAnalysis, setConsistencyAnalysis] = useState({
    overallConsistency: 100,
    patterns: ["Ready to analyze"],
    improvements: ["Start speaking to get feedback"]
  });

  // Toggle theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Real-time voice analysis - analyze more frequently
  useEffect(() => {
    if (!isRecording) return;
    
    const analyzeVoice = async () => {
      // Analyze if we have recent speech (including interim)
      const textToAnalyze = interimTranscript || (segments.length > 0 ? segments[segments.length - 1] : "");
      
      if (textToAnalyze && textToAnalyze.length > 15) {
        setIsAnalyzing(true);
        try {
          // Analyze tone in real-time
          const analysis = await analyzeVoiceTone(textToAnalyze, toneHistory);
          setVoiceAnalysis(analysis);
          
          // Update tone history
          if (analysis.tone !== toneHistory[toneHistory.length - 1]) {
            setToneHistory(prev => [...prev.slice(-9), analysis.tone]);
          }
          
          // Analyze consistency every 2 segments for faster feedback
          if (segments.length >= 2) {
            const consistencyResult = await analyzeSpeechConsistency(segments.slice(-10));
            setConsistencyAnalysis(consistencyResult);
          }
        } catch (error) {
          console.error("Analysis error:", error);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };
    
    // Set up interval for real-time analysis (every 2 seconds)
    const interval = setInterval(analyzeVoice, 2000);
    
    return () => clearInterval(interval);
  }, [segments, isRecording, toneHistory, interimTranscript]);

  // Auto-save notes from transcript
  useEffect(() => {
    if (transcript) {
      setNotes(prev => {
        const newNotes = prev + (prev ? "\n" : "") + transcript;
        return newNotes;
      });
    }
  }, [transcript]);

  // Real-time question analysis based on conversation
  const analyzeQuestion = async () => {
    if (!currentQuestion && !transcript) {
      toast({
        title: "Start speaking first",
        description: "Begin your conversation to get contextual tips",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Use current question or analyze the conversation for tips
      const questionToAnalyze = currentQuestion || "Based on this conversation, what tips would help?";
      const response = await getInterviewResponse(questionToAnalyze, transcript);
      setQuestionResponse(response);
      
      // Don't show toast for automatic analysis
      if (currentQuestion) {
        toast({
          title: "Analysis complete",
          description: "Check the Tips tab for your personalized response strategy",
        });
      }
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Unable to analyze question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Auto-analyze conversation for contextual tips
  useEffect(() => {
    if (transcript && transcript.length > 100 && !currentQuestion) {
      // Debounce to avoid too frequent calls
      const timer = setTimeout(() => {
        analyzeQuestion();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [transcript]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const toggleRecording = async () => {
    if (!isSupported) {
      toast({
        title: "Browser not supported",
        description: "Please use Chrome, Edge, or Safari for voice recording",
        variant: "destructive"
      });
      return;
    }

    if (!isRecording) {
      setIsRecording(true);
      try {
        await startListening();
        toast({
          title: "Recording started",
          description: "Voice analysis active - Gemini AI is listening",
        });
      } catch (error) {
        setIsRecording(false);
        toast({
          title: "Failed to start recording",
          description: speechError || "Please check microphone permissions",
          variant: "destructive"
        });
      }
    } else {
      setIsRecording(false);
      stopListening();
      toast({
        title: "Recording stopped",
        description: "Your notes and analysis have been saved",
      });
    }
  };

  const exportToPDF = () => {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const lineHeight = 10;
    const margin = 20;
    let yPosition = margin;
    
    // Add title
    pdf.setFontSize(18);
    pdf.text("Meeting Notes & Voice Analysis", margin, yPosition);
    yPosition += 20;
    
    // Add timestamp
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 20;
    
    // Add voice analysis summary
    pdf.setFontSize(14);
    pdf.text("Voice Analysis Summary", margin, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(10);
    pdf.text(`Overall Consistency: ${consistencyAnalysis.overallConsistency}%`, margin, yPosition);
    yPosition += 10;
    pdf.text(`Primary Tone: ${voiceAnalysis.tone}`, margin, yPosition);
    yPosition += 10;
    pdf.text(`Energy Level: ${voiceAnalysis.energy}`, margin, yPosition);
    yPosition += 15;
    
    // Add notes
    pdf.setFontSize(14);
    pdf.text("Meeting Notes", margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(notes || "No notes recorded", 170);
    
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
    
    pdf.save("meeting-notes-analysis.pdf");
    toast({
      title: "PDF exported successfully",
      description: "Your meeting notes and analysis have been downloaded",
    });
  };

  const getPitchIndicator = (pitch: number) => {
    if (pitch < 35) return { icon: TrendingDown, color: "text-pitch-low", message: "Raise pitch slightly" };
    if (pitch > 65) return { icon: TrendingUp, color: "text-pitch-high", message: "Lower pitch slightly" };
    return { icon: Volume2, color: "text-pitch-optimal", message: "Perfect pitch!" };
  };

  const pitchInfo = getPitchIndicator(voiceAnalysis.pitch);

  return (
    <div
      ref={windowRef}
      className={`fixed z-50 transition-all duration-300 animate-fade-in ${isMinimized ? 'w-64' : 'w-[450px]'}`}
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        backdropFilter: 'blur(20px)',
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className={`${isDarkMode ? 'dark' : ''} bg-glass/90 border-glass-border shadow-glass backdrop-blur-xl`}>
        {/* Header */}
        <div className="drag-handle flex items-center justify-between p-4 border-b border-glass-border cursor-move">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-destructive animate-pulse' : 'bg-muted'}`} />
            <span className="text-sm font-semibold text-glass-foreground">AI Meeting Assistant</span>
            {isAnalyzing && (
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                Analyzing
              </Badge>
            )}
            {isListening && (
              <Badge variant="outline" className="ml-1 bg-primary/10">
                <Mic className="h-3 w-3 mr-1 animate-pulse" />
                Live
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-secondary"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-secondary"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-secondary"
              onClick={() => window.location.reload()}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Recording Controls */}
            <div className="p-4 border-b border-glass-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={toggleRecording}
                    variant={isRecording ? "destructive" : "default"}
                    size="sm"
                    className={isRecording ? "" : "bg-gradient-primary hover:opacity-90"}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={exportToPDF}
                    variant="outline"
                    size="sm"
                    className="border-glass-border"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
              
              {/* Live Transcript & Error Display */}
              {speechError && (
                <div className="mt-3 p-2 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    <span className="text-xs font-medium">Error</span>
                  </div>
                  <p className="text-xs text-destructive">
                    {speechError}
                  </p>
                </div>
              )}
              
              {isRecording && !speechError && (
                <div className="mt-3 p-2 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-3 w-3 text-primary animate-pulse" />
                    <span className="text-xs font-medium">Live Transcript</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {interimTranscript || (isListening ? "Listening... Please speak clearly into your microphone" : "Starting microphone...")}
                  </p>
                </div>
              )}
            </div>

            {/* Main Content */}
            <Tabs defaultValue="voice" className="p-4">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
                <TabsTrigger value="voice">
                  <Volume2 className="h-4 w-4 mr-2" />
                  Voice
                </TabsTrigger>
                <TabsTrigger value="notes">
                  <FileText className="h-4 w-4 mr-2" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="tips">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Tips
                </TabsTrigger>
              </TabsList>

              <TabsContent value="voice" className="mt-4 space-y-4">
                {/* Tone Consistency Score */}
                <div className="bg-gradient-to-r from-secondary/30 to-accent/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Tone Consistency</span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {consistencyAnalysis.overallConsistency}%
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary transition-all duration-1000"
                      style={{ width: `${consistencyAnalysis.overallConsistency}%` }}
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    {consistencyAnalysis.patterns.map((pattern, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3" />
                        {pattern}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real-time Tone Analysis */}
                <div className="bg-secondary/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Current Tone</span>
                    <Badge variant="outline" className="bg-primary/10">
                      {voiceAnalysis.tone}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-background/50 rounded p-2">
                      <span className="text-xs text-muted-foreground">Emotion</span>
                      <p className="text-sm font-medium">{voiceAnalysis.emotion}</p>
                    </div>
                    <div className="bg-background/50 rounded p-2">
                      <span className="text-xs text-muted-foreground">Energy</span>
                      <p className="text-sm font-medium capitalize">{voiceAnalysis.energy}</p>
                    </div>
                  </div>

                  {/* Pitch Indicator */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Pitch Level</span>
                      <div className={`flex items-center gap-1 ${pitchInfo.color}`}>
                        <pitchInfo.icon className="h-3 w-3" />
                        <span className="text-xs font-medium">{pitchInfo.message}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-pitch transition-all duration-500"
                        style={{ width: `${voiceAnalysis.pitch}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Suggestions */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-primary">AI Suggestions</span>
                    {voiceAnalysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        <AlertCircle className="h-3 w-3 text-accent mt-0.5" />
                        <span className="text-muted-foreground">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                <div className="bg-accent/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="text-xs font-medium">Areas to Improve</span>
                  </div>
                  <div className="space-y-1">
                    {consistencyAnalysis.improvements.map((improvement, i) => (
                      <p key={i} className="text-xs text-muted-foreground">• {improvement}</p>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <Textarea
                  placeholder="Your meeting notes will appear here automatically as you speak..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[280px] bg-secondary/30 border-glass-border resize-none text-sm"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {notes.split(' ').filter(w => w).length} words
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNotes("");
                      resetTranscript();
                    }}
                  >
                    Clear Notes
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="tips" className="mt-4">
                <div className="space-y-3">
                  {/* Real-time Contextual Tips Header */}
                  {transcript && (
                    <div className="bg-gradient-to-r from-accent/20 to-primary/20 rounded-lg p-2 animate-pulse">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-primary" />
                        <span className="text-xs font-medium">AI analyzing your conversation in real-time...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Question Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ask Interview Question (Optional)</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a question for specific tips..."
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        className="bg-secondary/30 border-glass-border"
                      />
                      <Button
                        onClick={analyzeQuestion}
                        disabled={isAnalyzing}
                        size="sm"
                        className="bg-gradient-primary"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Real-time Response with Context */}
                  {questionResponse && (
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 animate-slide-up">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium">
                          {currentQuestion ? "AI Response Strategy" : "Contextual Tips Based on Your Discussion"}
                        </h4>
                        <Badge variant="secondary">
                          {questionResponse.confidence}% confidence
                        </Badge>
                      </div>
                      
                      <div className="bg-background/50 rounded p-3 mb-3">
                        <p className="text-sm text-foreground">
                          {questionResponse.answer}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-medium text-primary">
                          {transcript ? "Tips Based on What You've Said" : "Key Tips"}
                        </span>
                        {questionResponse.tips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-pitch-optimal mt-0.5" />
                            <span className="text-xs text-muted-foreground">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Word Suggestions */}
                  {transcript && transcript.length > 50 && (
                    <div className="bg-primary/5 rounded-lg p-3">
                      <h4 className="text-xs font-medium mb-2 text-primary">Power Words to Use</h4>
                      <div className="flex flex-wrap gap-1">
                        {["achieved", "implemented", "optimized", "collaborated", "delivered", "spearheaded", "innovative", "strategic"].map(word => (
                          <Badge key={word} variant="secondary" className="text-xs">
                            {word}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* General Tips */}
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <h4 className="text-xs font-medium mb-2 text-primary">Live Interview Tips</h4>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• {voiceAnalysis.tone === "nervous" ? "Take a deep breath and slow down" : "Maintain your confident tone"}</li>
                      <li>• {voiceAnalysis.energy === "low" ? "Increase energy and enthusiasm" : "Keep your energy consistent"}</li>
                      <li>• {transcript.includes("um") || transcript.includes("uh") ? "Reduce filler words - pause instead" : "Good job avoiding filler words"}</li>
                      <li>• {voiceAnalysis.pitch > 65 ? "Lower your pitch slightly for authority" : voiceAnalysis.pitch < 35 ? "Raise your pitch for engagement" : "Perfect pitch level - maintain it"}</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </Card>
    </div>
  );
};

export default MeetingAssistant;