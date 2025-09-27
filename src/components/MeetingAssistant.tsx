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
  Moon,
  Camera,
  CameraOff,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { 
  analyzeVoiceTone, 
  getInterviewResponse, 
  analyzeSpeechConsistency,
  analyzeBodyPosture,
  type VoiceAnalysisResult,
  type QuestionResponse,
  type PostureAnalysisResult 
} from "@/services/geminiService";

const MeetingAssistant = () => {
  const [notes, setNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [detectedQuestion, setDetectedQuestion] = useState<string | null>(null);
  const [questionResponse, setQuestionResponse] = useState<QuestionResponse | null>(null);
  const [toneHistory, setToneHistory] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [postureAnalysis, setPostureAnalysis] = useState<PostureAnalysisResult | null>(null);
  const [isAnalyzingPosture, setIsAnalyzingPosture] = useState(false);
  
  const windowRef = useRef<HTMLDivElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null);
  const conversationContextRef = useRef<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const postureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Webcam setup
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      setWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      toast({
        title: "Camera started",
        description: "Posture analysis will begin automatically",
      });
      
      // Start periodic posture analysis
      postureIntervalRef.current = setInterval(() => {
        captureAndAnalyzePosture();
      }, 10000); // Analyze every 10 seconds
      
    } catch (error) {
      console.error("Failed to start webcam:", error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access for posture analysis",
        variant: "destructive"
      });
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (postureIntervalRef.current) {
        clearInterval(postureIntervalRef.current);
        postureIntervalRef.current = null;
      }
      toast({
        title: "Camera stopped",
        description: "Posture analysis has been paused",
      });
    }
  };

  const captureAndAnalyzePosture = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzingPosture) return;
    
    setIsAnalyzingPosture(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      setIsAnalyzingPosture(false);
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
    
    try {
      const result = await analyzeBodyPosture(imageBase64);
      setPostureAnalysis(result);
      
      // Show toast for significant posture issues
      if (result.score < 60) {
        toast({
          title: "Posture needs improvement",
          description: "Check the Posture tab for specific tips",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to analyze posture:", error);
    } finally {
      setIsAnalyzingPosture(false);
    }
  };

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
      if (postureIntervalRef.current) {
        clearInterval(postureIntervalRef.current);
      }
    };
  }, [webcamStream]);

  // Real-time voice analysis and question detection
  useEffect(() => {
    if (isListening && transcript && segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      
      // Run voice tone analysis
      analyzeVoiceTone(lastSegment, toneHistory)
        .then(analysis => {
          setVoiceAnalysis(analysis);
          setToneHistory(prev => [...prev, analysis.tone]);
        })
        .catch(console.error);

      // Question detection with improved patterns
      const questionIndicators = [
        /\b(what|where|when|why|how|who|which|can|could|would|should|is|are|do|does|did|have|has|will)\b.*\?/i,
        /\b(tell me|explain|describe|share|talk about|thoughts on|opinion on|experience with)\b/i,
        /\?$/,
        /\b(what's|where's|when's|why's|how's|who's)\b/i
      ];
      
      const isQuestion = questionIndicators.some(pattern => pattern.test(lastSegment));
      
      if (isQuestion && lastSegment.length > 20) {
        setDetectedQuestion(lastSegment);
        conversationContextRef.current = transcript.slice(-500);
        
        // Automatically analyze detected questions
        getInterviewResponse(lastSegment, conversationContextRef.current)
          .then(response => {
            setQuestionResponse(response);
            toast({
              title: "💡 Question detected!",
              description: "Check the Tips tab for AI-powered response suggestions",
            });
          })
          .catch(console.error);
      }
    }
  }, [segments, isListening, transcript, toneHistory]);

  // Auto-save notes from transcript
  useEffect(() => {
    if (transcript && transcript.length > notes.length) {
      const newContent = transcript.slice(notes.length);
      if (newContent.length > 10) {
        setNotes(prev => {
          const combined = prev + (prev ? '\n' : '') + newContent;
          return combined;
        });
      }
    }
  }, [transcript, notes.length]);

  // Analyze question when user submits manually
  const analyzeQuestion = () => {
    if (currentQuestion.trim()) {
      setIsAnalyzing(true);
      conversationContextRef.current = transcript.slice(-500);
      
      getInterviewResponse(currentQuestion, conversationContextRef.current)
        .then(response => {
          setQuestionResponse(response);
          setCurrentQuestion("");
        })
        .catch(console.error)
        .finally(() => setIsAnalyzing(false));
    }
  };

  // Speech consistency analysis
  useEffect(() => {
    if (segments.length >= 3) {
      const recentSegments = segments.slice(-5);
      analyzeSpeechConsistency(recentSegments)
        .then(analysis => {
          setConsistencyAnalysis(analysis);
        })
        .catch(console.error);
    }
  }, [segments]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

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

  useEffect(() => {
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
    if (isRecording) {
      stopListening();
      setIsRecording(false);
      toast({
        title: "Recording stopped",
        description: "Your session has been saved to notes.",
      });
    } else {
      startListening();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "AI is now analyzing your voice in real-time.",
      });
    }
  };

  const exportToPDF = () => {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    let yPosition = 20;

    // Title
    pdf.setFontSize(18);
    pdf.text("Meeting Assistant Report", 20, yPosition);
    yPosition += 15;

    // Date
    pdf.setFontSize(10);
    pdf.text(`Date: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 10;

    // Voice Analysis Summary
    pdf.setFontSize(14);
    pdf.text("Voice Analysis", 20, yPosition);
    yPosition += 8;
    pdf.setFontSize(10);
    pdf.text(`Overall Tone: ${voiceAnalysis.tone}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Consistency: ${consistencyAnalysis.overallConsistency}%`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Energy Level: ${voiceAnalysis.energy}`, 20, yPosition);
    yPosition += 10;

    // Posture Analysis Summary (if available)
    if (postureAnalysis) {
      pdf.setFontSize(14);
      pdf.text("Posture Analysis", 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(10);
      pdf.text(`Overall Posture: ${postureAnalysis.overallPosture}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Confidence Level: ${postureAnalysis.confidence}%`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Body Language: ${postureAnalysis.bodyLanguage}`, 20, yPosition);
      yPosition += 10;
    }

    // Meeting Notes
    pdf.setFontSize(14);
    pdf.text("Meeting Notes", 20, yPosition);
    yPosition += 8;
    pdf.setFontSize(10);
    
    const splitNotes = pdf.splitTextToSize(notes || "No notes recorded", 170);
    splitNotes.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, 20, yPosition);
      yPosition += 6;
    });

    pdf.save("meeting-assistant-report.pdf");
    toast({
      title: "PDF exported",
      description: "Your meeting report has been downloaded.",
    });
  };

  const getPitchInfo = () => {
    if (voiceAnalysis.pitch < 30) {
      return { message: "Too low", color: "text-orange-500", icon: TrendingDown };
    } else if (voiceAnalysis.pitch > 70) {
      return { message: "Too high", color: "text-orange-500", icon: TrendingUp };
    } else {
      return { message: "Optimal", color: "text-green-500", icon: Activity };
    }
  };

  const pitchInfo = getPitchInfo();

  return (
    <div
      ref={windowRef}
      className={`fixed z-50 ${isMinimized ? 'w-64' : 'w-96'} ${isDragging ? 'cursor-move' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <Card className={`shadow-2xl border-2 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div
          className={`flex items-center justify-between p-3 border-b cursor-move ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping" />
                <div className="relative w-2 h-2 bg-red-500 rounded-full" />
              </div>
            )}
            <span className={`font-semibold text-sm ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>
              AI Meeting Assistant
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => windowRef.current?.remove()}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Recording Controls */}
            <div className={`p-3 border-b ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50/50 border-gray-200'}`}>
              <div className="flex gap-2">
                <Button
                  onClick={toggleRecording}
                  size="sm"
                  variant={isRecording ? "destructive" : "default"}
                  className="flex-1"
                  disabled={!isSupported}
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
                  size="sm"
                  variant="outline"
                  className={isDarkMode ? 'border-slate-600 hover:bg-slate-700' : ''}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Live Transcript Display */}
              {isListening && (
                <div className={`mt-2 p-2 rounded text-xs ${isDarkMode ? 'bg-slate-800/50 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                  <span className="font-medium">Live: </span>
                  {interimTranscript || "Listening..."}
                </div>
              )}
              
              {speechError && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                  {speechError}
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="voice" className="p-3">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="voice">Voice</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="posture">Posture</TabsTrigger>
              </TabsList>

              <TabsContent value="voice" className="mt-4 space-y-3">
                {/* Consistency Score */}
                <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Voice Consistency</span>
                    <Badge className={consistencyAnalysis.overallConsistency >= 80 ? 'bg-green-500/10 text-green-500' : 
                                   consistencyAnalysis.overallConsistency >= 60 ? 'bg-yellow-500/10 text-yellow-500' : 
                                   'bg-red-500/10 text-red-500'}>
                      {consistencyAnalysis.overallConsistency}%
                    </Badge>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                    <div 
                      className={`h-full transition-all duration-500 ${
                        consistencyAnalysis.overallConsistency >= 80 ? 'bg-green-500' :
                        consistencyAnalysis.overallConsistency >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${consistencyAnalysis.overallConsistency}%` }}
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    {consistencyAnalysis.patterns.map((pattern, i) => (
                      <div key={i} className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        <CheckCircle className="h-3 w-3" />
                        {pattern}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real-time Tone Analysis */}
                <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Current Tone</span>
                    <Badge variant="outline" className={isDarkMode ? 'bg-blue-500/10 border-blue-400 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700'}>
                      {voiceAnalysis.tone}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className={`rounded p-2 ${isDarkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
                      <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Emotion</span>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{voiceAnalysis.emotion}</p>
                    </div>
                    <div className={`rounded p-2 ${isDarkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
                      <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Energy</span>
                      <p className={`text-sm font-medium capitalize ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{voiceAnalysis.energy}</p>
                    </div>
                  </div>

                  {/* Pitch Indicator */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Pitch Level</span>
                      <div className={`flex items-center gap-1 ${pitchInfo.color}`}>
                        <pitchInfo.icon className="h-3 w-3" />
                        <span className="text-xs font-medium">{pitchInfo.message}</span>
                      </div>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${voiceAnalysis.pitch}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Suggestions */}
                  <div className="space-y-2">
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>AI Suggestions</span>
                    {voiceAnalysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        <AlertCircle className={`h-3 w-3 mt-0.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                        <span className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className={`h-4 w-4 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Areas to Improve</span>
                  </div>
                  <div className="space-y-1">
                    {consistencyAnalysis.improvements.map((improvement, i) => (
                      <p key={i} className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>• {improvement}</p>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <Textarea
                  placeholder="Your meeting notes will appear here automatically as you speak..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`min-h-[280px] resize-none text-sm ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500'}`}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {notes.split(' ').filter(w => w).length} words
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'}
                    onClick={() => {
                      setNotes("");
                      resetTranscript();
                    }}
                  >
                    Clear Notes
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="posture" className="mt-4 space-y-3">
                {/* Webcam View */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'} flex items-center gap-2`}>
                      <Camera className="h-3 w-3" />
                      Body Posture Analysis
                    </h4>
                    {!webcamStream ? (
                      <Button
                        size="sm"
                        onClick={startWebcam}
                        className="h-7 text-xs"
                      >
                        <Camera className="h-3 w-3 mr-1" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={stopWebcam}
                        className="h-7 text-xs"
                      >
                        <CameraOff className="h-3 w-3 mr-1" />
                        Stop Camera
                      </Button>
                    )}
                  </div>
                  
                  {/* Video Preview */}
                  {webcamStream && (
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <canvas
                        ref={canvasRef}
                        className="hidden"
                      />
                      {isAnalyzingPosture && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-white text-xs flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing posture...
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Analysis Button */}
                  {webcamStream && (
                    <Button
                      size="sm"
                      onClick={captureAndAnalyzePosture}
                      disabled={isAnalyzingPosture}
                      className="w-full h-8"
                    >
                      {isAnalyzingPosture ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Camera className="h-3 w-3 mr-1" />
                          Analyze Now
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Posture Analysis Results */}
                {postureAnalysis && (
                  <Card className={`p-3 space-y-3 ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : ''}`}>
                    {/* Overall Score */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Overall Posture</h4>
                        <Badge 
                          className={
                            postureAnalysis.overallPosture === 'excellent' ? 'bg-green-500/10 text-green-500' :
                            postureAnalysis.overallPosture === 'good' ? 'bg-blue-500/10 text-blue-500' :
                            postureAnalysis.overallPosture === 'needs improvement' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-red-500/10 text-red-500'
                          }
                        >
                          {postureAnalysis.overallPosture}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'} rounded-full h-2`}>
                          <div
                            className={`h-2 rounded-full transition-all ${
                              postureAnalysis.score >= 80 ? 'bg-green-500' :
                              postureAnalysis.score >= 60 ? 'bg-blue-500' :
                              postureAnalysis.score >= 40 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${postureAnalysis.score}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                          {postureAnalysis.score}%
                        </span>
                      </div>
                    </div>

                    {/* Body Language */}
                    <div className="space-y-1">
                      <h5 className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Body Language</h5>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{postureAnalysis.bodyLanguage}</p>
                    </div>

                    {/* Confidence Level */}
                    <div className="space-y-1">
                      <h5 className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Confidence Level</h5>
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'} rounded-full h-2`}>
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${postureAnalysis.confidence}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                          {postureAnalysis.confidence}%
                        </span>
                      </div>
                    </div>

                    {/* Issues */}
                    {postureAnalysis.issues.length > 0 && (
                      <div className="space-y-1">
                        <h5 className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Issues Detected</h5>
                        <div className="space-y-1">
                          {postureAnalysis.issues.map((issue, i) => (
                            <div key={i} className="flex items-start gap-1">
                              <AlertCircle className="h-3 w-3 text-yellow-500 mt-0.5" />
                              <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>{issue}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Improvements */}
                    <div className="space-y-1">
                      <h5 className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Improvements</h5>
                      <div className="space-y-1">
                        {postureAnalysis.improvements.map((improvement, i) => (
                          <div key={i} className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                            <p className={`text-xs ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{improvement}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Instructions when no camera */}
                {!webcamStream && !postureAnalysis && (
                  <Card className={`p-4 ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50'}`}>
                    <div className="space-y-2 text-center">
                      <Camera className={`h-8 w-8 mx-auto ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        Body Posture Analysis
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Start your camera to receive real-time feedback on your body posture, 
                        helping you maintain professional appearance and confident body language.
                      </p>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </Card>
    </div>
  );
};

export default MeetingAssistant;