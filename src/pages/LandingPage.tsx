import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Mic, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Target, 
  BarChart3, 
  Sparkles,
  ChevronRight,
  CheckCircle,
  Brain,
  Shield,
  Zap
} from "lucide-react";

const LandingPage = () => {
  const openWidget = () => {
    const width = 400;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      '/widget',
      'AI Meeting Coach',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />
        <div className="container mx-auto px-6 pt-20 pb-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered Meeting Assistant</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Meeting Confidence Coach
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Transform your meeting participation with real-time AI feedback that builds confidence and improves communication
            </p>
            
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105"
              onClick={openWidget}
            >
              <Mic className="mr-2 h-5 w-5" />
              Launch Meeting Assistant
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Challenge</h2>
            <p className="text-lg text-muted-foreground">
              In team meetings, many voices go unheard due to confidence barriers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
              <div className="text-destructive mb-4">
                <Users className="h-10 w-10" />
              </div>
              <h3 className="font-semibold mb-2">Fewer Perspectives</h3>
              <p className="text-sm text-muted-foreground">
                Junior team members and underrepresented voices hesitate to share valuable insights
              </p>
            </Card>
            
            <Card className="p-6 border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
              <div className="text-destructive mb-4">
                <TrendingUp className="h-10 w-10 rotate-180" />
              </div>
              <h3 className="font-semibold mb-2">Lower Engagement</h3>
              <p className="text-sm text-muted-foreground">
                Fear of miscommunication leads to reduced participation and team collaboration
              </p>
            </Card>
            
            <Card className="p-6 border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
              <div className="text-destructive mb-4">
                <MessageSquare className="h-10 w-10" />
              </div>
              <h3 className="font-semibold mb-2">Missed Innovation</h3>
              <p className="text-sm text-muted-foreground">
                Unclear communication prevents breakthrough ideas from being properly expressed
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Solution</h2>
            <p className="text-lg text-muted-foreground">
              An intelligent assistant that transforms how you communicate in meetings
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Brain className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Real-time Analysis</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered feedback on communication style and confidence
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Target className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Personal Goals</h3>
              <p className="text-sm text-muted-foreground">
                Set and track communication improvement objectives
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <BarChart3 className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Team Insights</h3>
              <p className="text-sm text-muted-foreground">
                Aggregated analytics on participation and engagement
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Shield className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Safe Growth</h3>
              <p className="text-sm text-muted-foreground">
                Positive, growth-oriented feedback in a supportive environment
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Features</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to excel in meetings
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="p-8 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">User Profiles & Goal Setting</h3>
                  <p className="text-muted-foreground mb-3">
                    Create your profile and set personal communication goals tailored to your role
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">Personal Dashboard</span>
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">Goal Tracking</span>
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">Progress Analytics</span>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Individual Meeting Analysis</h3>
                  <p className="text-muted-foreground mb-3">
                    Get personalized feedback on your communication style, tone, and clarity
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">Voice Recognition</span>
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">Tone Analysis</span>
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">Actionable Tips</span>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Team Meeting Insights</h3>
                  <p className="text-muted-foreground mb-3">
                    Managers get comprehensive analytics on team dynamics and participation
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">Participation Metrics</span>
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">Sentiment Analysis</span>
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">Team Balance</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <Card className="max-w-3xl mx-auto p-12 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="text-center">
              <Zap className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">
                Ready to Transform Your Meeting Confidence?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Start your journey to more confident and effective communication today
              </p>
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={openWidget}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Launch Assistant Now
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2024 AI Meeting Confidence Coach. Empowering voices in every meeting.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;