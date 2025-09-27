import MeetingAssistant from "@/components/MeetingAssistant";
import { Button } from "@/components/ui/button";
import { Video, Sparkles, Shield, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      
      {/* Meeting Assistant Window */}
      <MeetingAssistant />
      
      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-8">
        <div className="max-w-4xl text-center animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 mb-6 bg-primary/10 rounded-full">
            <Video className="h-8 w-8 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            AI Meeting Assistant
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your intelligent companion for meetings. Record notes, analyze your voice tone, 
            and get real-time interview coaching powered by AI.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Voice Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Real-time pitch and tone detection with Gemini AI integration
              </p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Interview Coaching</h3>
              <p className="text-sm text-muted-foreground">
                Get real-time tips and feedback for common interview questions
              </p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="w-12 h-12 bg-secondary/50 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Users className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">PDF Export</h3>
              <p className="text-sm text-muted-foreground">
                Download your meeting notes and insights as a professional PDF
              </p>
            </div>
          </div>
          
          <div className="mt-12 p-4 bg-secondary/30 rounded-lg border border-glass-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Ready for Gemini API:</span> Add your API key in the code to enable advanced AI features
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
