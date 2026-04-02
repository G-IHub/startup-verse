/**
 * QUICK LOGIN PANEL
 * Development/Testing tool to quickly log in as any mock user
 */

import React, { useState } from "react";
import {
  User,
  ChevronDown,
  ChevronUp,
  UserCircle,
  Briefcase,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { clearMockData, initializeMockData } from "../utils/mockData";
export default function QuickLoginPanel({ onLogin }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const mockUsers = [
    {
      id: "user-founder-001",
      name: "Sarah Chen",
      email: "sarah@taskflow-ai.com",
      role: "founder",
      companyName: "TaskFlow AI",
      companyId: "company-001",
      onboardingComplete: true,
      profile: {
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SarahChen",
        title: "Founder & CEO",
        bio: "Serial entrepreneur with 8 years in B2B SaaS.",
        location: "San Francisco, CA",
      },
      icon: UserCircle,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    {
      id: "user-team-001",
      name: "Alex Kumar",
      email: "alex@taskflow-ai.com",
      role: "team-member",
      companyName: "TaskFlow AI",
      companyId: "company-001",
      startupId: "user-founder-001",
      // Link to Sarah Chen
      onboardingComplete: true,
      profile: {
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AlexKumar",
        title: "Co-Founder & CTO",
        bio: "Full-stack engineer with ML expertise.",
        location: "San Francisco, CA",
        department: "Engineering",
      },
      icon: Briefcase,
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    },
    {
      id: "user-team-002",
      name: "Maya Patel",
      email: "maya@taskflow-ai.com",
      role: "team-member",
      companyName: "TaskFlow AI",
      companyId: "company-001",
      startupId: "user-founder-001",
      // Link to Sarah Chen
      onboardingComplete: true,
      profile: {
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=MayaPatel",
        title: "Lead Product Designer",
        bio: "Product designer obsessed with UX.",
        location: "Remote - Austin, TX",
        department: "Design",
      },
      icon: UserCircle,
      color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    },
    {
      id: "user-team-003",
      name: "Jordan Lee",
      email: "jordan@taskflow-ai.com",
      role: "team-member",
      companyName: "TaskFlow AI",
      companyId: "company-001",
      startupId: "user-founder-001",
      // Link to Sarah Chen
      onboardingComplete: true,
      profile: {
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=JordanLee",
        title: "Head of Growth",
        bio: "Growth hacker who scaled 2 startups.",
        location: "Remote - NYC",
        department: "Marketing",
      },
      icon: UserCircle,
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
    {
      id: "user-team-004",
      name: "Chris Martinez",
      email: "chris@taskflow-ai.com",
      role: "team-member",
      companyName: "TaskFlow AI",
      companyId: "company-001",
      startupId: "user-founder-001",
      // Link to Sarah Chen
      onboardingComplete: true,
      profile: {
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ChrisMartinez",
        title: "Senior Backend Engineer",
        bio: "Backend specialist with microservices expertise.",
        location: "San Francisco, CA",
        department: "Engineering",
      },
      icon: UserCircle,
      color:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    },
    {
      id: "user-talent-001",
      name: "Emma Wilson",
      email: "emma.wilson@example.com",
      role: "talent",
      onboardingComplete: true,
      profile: {
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=EmmaWilson",
        title: "Fullstack Developer",
        bio: "Passionate developer looking to join startups.",
        location: "Seattle, WA",
      },
      icon: UserCircle,
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    },
  ];
  const handleLogin = (mockUser) => {
    // Add startupId for team members
    const startupId =
      mockUser.role === "team-member" ? "user-founder-001" : undefined;
    const user = {
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role,
      companyName: mockUser.companyName,
      companyId: mockUser.companyId,
      startupId: startupId,
      onboardingComplete: mockUser.onboardingComplete,
      profile: mockUser.profile,
      createdAt: new Date().toISOString(),
    };

    // Save current user
    localStorage.setItem("startupverse_user", JSON.stringify(user));

    // Also save all mock users to startupverse_users so TaskManagementPanel can find the founder
    const allUsers = mockUsers.map((mu) => ({
      id: mu.id,
      name: mu.name,
      email: mu.email,
      role: mu.role,
      companyName: mu.companyName,
      companyId: mu.companyId,
      startupId: mu.role === "team-member" ? "user-founder-001" : undefined,
      onboardingComplete: mu.onboardingComplete,
      profile: mu.profile,
      createdAt: new Date().toISOString(),
    }));
    localStorage.setItem("startupverse_users", JSON.stringify(allUsers));
    onLogin(user);
  };
  const handleResetMockData = () => {
    clearMockData();
    initializeMockData();
    toast.success("Mock data reset successfully! Please refresh the page.", {
      description: "All mock data has been cleared and reinitialized.",
    });
  };
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="shadow-lg bg-primary hover:bg-primary/90"
          size="sm"
        >
          <User className="w-4 h-4 mr-2" />
          Quick Login (Dev)
          <ChevronUp className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-2xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">
                Quick Login (Development)
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Log in as any mock user to test the platform
          </p>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {mockUsers.map((mockUser) => {
            const IconComponent = mockUser.icon;
            return (
              <button
                key={mockUser.id}
                onClick={() => handleLogin(mockUser)}
                className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${mockUser.color} flex items-center justify-center flex-shrink-0`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {mockUser.name}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {mockUser.role === "founder"
                          ? "Founder"
                          : mockUser.role === "team-member"
                            ? "Team"
                            : "Talent"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {mockUser.profile.title}
                    </p>
                    {mockUser.companyName && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {mockUser.companyName}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          <div className="pt-2 mt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Click any user to log in instantly
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
