import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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
  ChevronUp,
  ChevronDown,
  Lightbulb,
  X,
  Minimize2,
  Move
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface VoiceAnalysis {
  pitch: number;
  tone: string;
  confidence: number;
  suggestions: string[];
}

const MeetingAssistant = () => {
  const [notes, setNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);
  
  // Mock voice analysis data - will be replaced with Gemini API
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysis>({
    pitch: 50,
    tone: "neutral",
    confidence: 75,
    suggestions: [
      "Try to speak more slowly for better clarity",
      "Your tone is professional and engaging",
      "Consider adding brief pauses between key points"
    ]
  });

  const interviewTips = [
    {
      question: "Tell me about yourself",
      tip: "Structure: Present role → Past experience → Future goals. Keep it under 2 minutes."
    },
    {
      question: "Why do you want this role?",
      tip: "Connect your skills to company needs. Show enthusiasm and research."
    },
    {
      question: "What's your greatest weakness?",
      tip: "Share a genuine weakness + steps you're taking to improve."
    },
    {
      question: "Where do you see yourself in 5 years?",
      tip: "Show ambition aligned with company growth. Be realistic and specific."
    }
  ];

  useEffect(() => {
    // Simulate real-time voice analysis
    if (isRecording) {
      const interval = setInterval(() => {
        setVoiceAnalysis(prev => ({
          ...prev,
          pitch: Math.random() * 100,
          confidence: 60 + Math.random() * 40,
          tone: ["calm", "confident", "enthusiastic", "neutral"][Math.floor(Math.random() * 4)]
        }));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

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
    setIsRecording(!isRecording);
    toast({
      title: isRecording ? "Recording stopped" : "Recording started",
      description: isRecording ? "Your notes have been saved" : "Voice analysis active",
    });
  };

  const exportToPDF = () => {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const lineHeight = 10;
    const margin = 20;
    let yPosition = margin;
    
    // Add title
    pdf.setFontSize(18);
    pdf.text("Meeting Notes", margin, yPosition);
    yPosition += 20;
    
    // Add timestamp
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 20;
    
    // Add notes
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(notes || "No notes recorded", 170);
    
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
    
    // Add voice analysis summary
    if (isRecording) {
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.text("Voice Analysis Summary", margin, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(10);
      pdf.text(`Average Confidence: ${voiceAnalysis.confidence.toFixed(0)}%`, margin, yPosition);
      yPosition += 10;
      pdf.text(`Tone: ${voiceAnalysis.tone}`, margin, yPosition);
    }
    
    pdf.save("meeting-notes.pdf");
    toast({
      title: "PDF exported successfully",
      description: "Your meeting notes have been downloaded",
    });
  };

  const getPitchIndicator = (pitch: number) => {
    if (pitch < 35) return { icon: TrendingDown, color: "text-pitch-low", message: "Lower pitch" };
    if (pitch > 65) return { icon: TrendingUp, color: "text-pitch-high", message: "Higher pitch" };
    return { icon: Volume2, color: "text-pitch-optimal", message: "Optimal pitch" };
  };

  const pitchInfo = getPitchIndicator(voiceAnalysis.pitch);

  return (
    <div
      ref={windowRef}
      className={`fixed z-50 transition-all duration-300 animate-fade-in ${isMinimized ? 'w-64' : 'w-96'}`}
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
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse-soft" />
            <span className="text-sm font-semibold text-glass-foreground">Meeting Assistant</span>
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
            </div>

            {/* Main Content */}
            <Tabs defaultValue="notes" className="p-4">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
                <TabsTrigger value="notes">
                  <FileText className="h-4 w-4 mr-2" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="voice">
                  <Volume2 className="h-4 w-4 mr-2" />
                  Voice
                </TabsTrigger>
                <TabsTrigger value="tips">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Tips
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="mt-4">
                <Textarea
                  placeholder="Your meeting notes will appear here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[200px] bg-secondary/30 border-glass-border resize-none"
                />
              </TabsContent>

              <TabsContent value="voice" className="mt-4">
                <div className="space-y-4">
                  {/* Pitch Indicator */}
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Pitch Level</span>
                      <div className={`flex items-center gap-1 ${pitchInfo.color}`}>
                        <pitchInfo.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{pitchInfo.message}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-pitch transition-all duration-500"
                        style={{ width: `${voiceAnalysis.pitch}%` }}
                      />
                    </div>
                  </div>

                  {/* Confidence Score */}
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      <span className="text-sm font-medium">{voiceAnalysis.confidence.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary transition-all duration-500"
                        style={{ width: `${voiceAnalysis.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Tone Analysis */}
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Tone: {voiceAnalysis.tone}</span>
                    </div>
                    
                    {/* Suggestions */}
                    <div className="space-y-2">
                      {voiceAnalysis.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs">
                          <AlertCircle className="h-3 w-3 text-accent mt-0.5" />
                          <span className="text-muted-foreground">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tips" className="mt-4">
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3">
                    {interviewTips.map((tip, index) => (
                      <div key={index} className="bg-secondary/30 rounded-lg p-3">
                        <h4 className="text-sm font-medium mb-2 text-primary">
                          {tip.question}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {tip.tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        )}
      </Card>
    </div>
  );
};

export default MeetingAssistant;