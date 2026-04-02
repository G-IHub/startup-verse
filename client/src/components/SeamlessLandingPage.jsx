import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import ThemeToggle from "./ThemeToggle";
import { Rocket, Star, CheckCircle } from "lucide-react";
import SignupModal from "./SignupModal";
export default function SeamlessLandingPage({ onRoleSelect }) {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const handleRoleClick = (role) => {
    setSelectedRole(role);
    setShowSignupModal(true);
  };
  const handleSignup = (role, data) => {
    onRoleSelect(role, data);
  };
  const steps = [
    {
      id: 0,
      title: "Choose Your Path",
      description: "Select the option that fits you best",
      component: (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3.5 max-w-2xl mx-auto">
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center shrink-0">
                    <Rocket className="w-4.5 h-4.5 text-background" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-base font-semibold">I'm a Founder</h4>
                    <p className="text-xs text-muted-foreground">
                      Build and scale your startup
                    </p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>Post your startup idea</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>Find talented team members</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>Turn vision into team execution</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>Virtual office & collaboration</span>
                  </div>
                </div>
                <Button
                  className="w-full mt-4 h-8 text-xs"
                  onClick={() => handleRoleClick("founder")}
                >
                  Create Founder Account
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Button>
              </CardContent>
            </Card>
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Star className="w-4.5 h-4.5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-base font-semibold">
                      I'm Looking to Join
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Find exciting startup opportunities
                    </p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>Browse startup opportunities</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>Connect with founders</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>Showcase your skills</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>Join innovative teams</span>
                  </div>
                </div>
                <Button
                  className="w-full mt-4 h-8 text-xs"
                  onClick={() => handleRoleClick("talent")}
                >
                  Create Talent Account
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="max-w-2xl mx-auto mt-6">
            <details className="group">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors text-center list-none flex items-center justify-center gap-2">
                <Building className="w-3.5 h-3.5" />
                <span>Are you an accelerator, competition, or program?</span>
                <ArrowRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
              </summary>
              <Card className="border-2 hover:shadow-lg transition-all mt-3">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2.5 mb-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center shrink-0">
                      <Building className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-base font-semibold">
                        Organization Admin
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Manage startup cohorts & programs
                      </p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Create and manage cohorts</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Invite startups to your program</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Monitor real-time execution progress</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Export reports for stakeholders</span>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4 h-8 text-xs bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleRoleClick("organization-admin")}
                  >
                    Create Organization Account
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    For accelerators, competitions, university programs, and
                    more
                  </p>
                </CardContent>
              </Card>
            </details>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-6">
            By creating an account, you agree to our Terms of Service and
            Privacy Policy
          </p>
        </div>
      ),
    },
  ];
  const currentStepData = steps[0];
  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="border-b">
        <div className="container mx-auto px-3 md:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-muted-foreground" />
            <span className="text-base font-semibold">StartupVerse</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </div>
      <div className="container mx-auto px-3 md:px-4 py-8 md:py-12 flex items-center justify-center">
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl mb-2">
              {currentStepData.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {currentStepData.description}
            </p>
          </div>
          <div>{currentStepData.component}</div>
        </div>
      </div>
      {showSignupModal && selectedRole && (
        <SignupModal
          role={selectedRole}
          onClose={() => setShowSignupModal(false)}
          onSignup={handleSignup}
        />
      )}
    </div>
  );
}
