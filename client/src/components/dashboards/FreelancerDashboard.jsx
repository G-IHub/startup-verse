import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Briefcase, Rocket } from "lucide-react";
export default function FreelancerDashboard({ user, onLogout, onUpdateUser }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <Card className="max-w-2xl w-full text-center">
        <CardHeader className="pb-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg mb-2">
            Freelancer Features Coming Soon
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            We're building a platform connecting freelancers with exciting
            startup projects.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-left">
            <div className="p-3 border rounded-lg">
              <h4 className="mb-1.5 text-sm">Project Marketplace</h4>
              <p className="text-muted-foreground text-[10px]">
                Access high-quality projects from innovative startups
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="mb-1.5 text-sm">Portfolio Showcase</h4>
              <p className="text-muted-foreground text-[10px]">
                Display your work and attract potential clients
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="mb-1.5 text-sm">Smart Matching</h4>
              <p className="text-muted-foreground text-[10px]">
                Get matched with projects that fit your skills
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="mb-1.5 text-sm">Payment Protection</h4>
              <p className="text-muted-foreground text-[10px]">
                Secure escrow and milestone-based payments
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
