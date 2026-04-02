import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Brain, Rocket } from "lucide-react";
export default function MentorDashboard({ user, onLogout, onUpdateUser }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Card className="max-w-2xl w-full text-center">
        <CardHeader className="pb-3">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Brain className="w-6 h-6 text-accent" />
          </div>
          <CardTitle className="text-lg mb-2">
            Mentor Features Coming Soon
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            We're building powerful tools to help you guide startup founders and
            make an impact.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-left">
            <div className="p-3 border rounded-lg">
              <h4 className="mb-1.5 text-sm">Mentee Matching</h4>
              <p className="text-muted-foreground text-[10px]">
                AI-powered matching with founders who need your expertise
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="mb-1.5 text-sm">Mentoring Sessions</h4>
              <p className="text-muted-foreground text-[10px]">
                Schedule and conduct 1-on-1 video mentoring calls
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="mb-1.5 text-sm">Progress Tracking</h4>
              <p className="text-muted-foreground text-[10px]">
                Monitor mentee progress and provide structured guidance
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="mb-1.5 text-sm">Expert Network</h4>
              <p className="text-muted-foreground text-[10px]">
                Connect with other mentors and share best practices
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 pt-3">
            <Badge variant="secondary">
              <Rocket className="w-3 h-3 mr-2" />
              Launching Soon in Version 2
            </Badge>
            <p className="text-sm text-muted-foreground">
              Want to contribute? Share your feedback with our team!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
