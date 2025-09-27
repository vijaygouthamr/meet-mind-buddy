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
  CheckCircle
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
  const windowRef = useRef<HTMLDivElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    segments
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

  // Analyze voice tone when new segments are available
  useEffect(() => {
    if (segments.length > 0 && isRecording) {
      const analyzeLatestSegment = async () => {
        const latestSegment = segments[segments.length - 1];
        if (latestSegment && latestSegment.length > 10) {
          setIsAnalyzing(true);
          try {
            const analysis = await analyzeVoiceTone(latestSegment, toneHistory);
            setVoiceAnalysis(analysis);
            setToneHistory(prev => [...prev.slice(-4), analysis.tone]);
            
            // Analyze consistency every 3 segments
            if (segments.length >= 3) {
              const consistencyResult = await analyzeSpeechConsistency(segments.slice(-5));
              setConsistencyAnalysis(consistencyResult);
            }
          } catch (error) {
            console.error("Analysis error:", error);
          } finally {
            setIsAnalyzing(false);
          }
        }
      };
      analyzeLatestSegment();
    }
  }, [segments, isRecording, toneHistory]);

  // Auto-save notes from transcript
  useEffect(() => {
    if (transcript) {
      setNotes(prev => {
        const newNotes = prev + (prev ? "\n" : "") + transcript;
        return newNotes;
      });
    }
  }, [transcript]);

  // Handle question analysis
  const analyzeQuestion = async () => {
    if (!currentQuestion) {
      toast({
        title: "No question entered",
        description: "Please type a question to get interview coaching",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await getInterviewResponse(currentQuestion, transcript);
      setQuestionResponse(response);
      toast({
        title: "Analysis complete",
        description: "Check the Tips tab for your personalized response strategy",
      });
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

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      startListening();
      toast({
        title: "Recording started",
        description: "Voice analysis active - Gemini AI is listening",
      });
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
      <Card className="bg-glass/90 border-glass-border shadow-glass backdrop-blur-xl">
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
          </div>
          <div className="flex items-center gap-1">
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
              
              {/* Live Transcript */}
              {isRecording && (
                <div className="mt-3 p-2 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-3 w-3 text-primary animate-pulse" />
                    <span className="text-xs font-medium">Live Transcript</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {interimTranscript || "Listening..."}
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
                  {/* Question Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interview Question</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type or paste an interview question..."
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

                  {/* Question Response */}
                  {questionResponse && (
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 animate-slide-up">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium">AI Response Strategy</h4>
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
                        <span className="text-xs font-medium text-primary">Key Tips</span>
                        {questionResponse.tips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-pitch-optimal mt-0.5" />
                            <span className="text-xs text-muted-foreground">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Tips */}
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <h4 className="text-xs font-medium mb-2 text-primary">General Interview Tips</h4>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• Use the STAR method for behavioral questions</li>
                      <li>• Maintain eye contact with the camera</li>
                      <li>• Speak 10% slower than normal conversation</li>
                      <li>• Pause briefly before answering complex questions</li>
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