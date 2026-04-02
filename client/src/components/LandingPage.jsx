import React from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Rocket, Users, Target, ArrowRight } from "lucide-react";
export default function LandingPage({ onRoleSelect }) {
  const roles = [
    {
      id: "founder",
      title: "Founder",
      icon: Rocket,
      description: "Build your startup from idea to success",
      features: [
        "Virtual office",
        "Team building tools",
        "Task management",
        "Messaging & collaboration",
      ],
      color: "bg-accent",
    },
    {
      id: "team-member",
      title: "Team Member",
      icon: Users,
      description: "Join innovative startups and build the future",
      features: [
        "Virtual office",
        "Task collaboration",
        "Team messaging",
        "Video meetings",
      ],
      color: "bg-primary",
    },
  ];
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-12 md:py-16">
          <div className="text-center mb-8 md:mb-12">
            <Badge variant="secondary" className="mb-3">
              <Lightbulb className="w-3 h-3 mr-2" />
              Welcome to the Future of Startups
            </Badge>
            <h1 className="mb-4 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              StartupVerse
            </h1>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              The ultimate virtual platform where founders and teams come
              together to build amazing startups.
            </p>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="w-4 h-4 text-accent" />
                <span className="text-body-medium">Goal: 500+ Startups</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Network className="w-4 h-4 text-accent" />
                <span className="text-body-medium">
                  Goal: 2000+ Active Users
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Rocket className="w-4 h-4 text-accent" />
                <span className="text-body-medium">Launch in 3 Months</span>
              </div>
            </div>
          </div>
          <div className="mb-8 md:mb-12">
            <h2 className="text-center mb-6 md:mb-8">Choose Your Journey</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {roles.map((role) => {
                const IconComponent = role.icon;
                return (
                  <Card
                    key={role.id}
                    className="relative group transition-all duration-300 cursor-pointer border-2 hover:border-accent/50"
                    onClick={() => onRoleSelect(role.id)}
                  >
                    <CardHeader className="text-center pb-3 p-5">
                      <div
                        className={`w-14 h-14 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                      >
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <CardTitle>{role.title}</CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 p-5">
                      <ul className="space-y-2 mb-4">
                        {role.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-center text-muted-foreground"
                          >
                            <div className="w-1.5 h-1.5 bg-accent rounded-full mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full group-hover:bg-accent group-hover:text-white transition-colors"
                        variant="outline"
                      >
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="text-center mt-8">
              <Badge variant="outline" className="text-xs">
                More user types coming soon: Mentors, Investors, Freelancers
              </Badge>
            </div>
          </div>
          <div className="text-center">
            <h3 className="mb-6">Why Choose StartupVerse?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <Network className="w-5 h-5 text-accent" />
                </div>
                <h4 className="mb-2">Virtual Collaboration</h4>
                <p className="text-muted-foreground">
                  Work together seamlessly in a virtual office environment
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <h4 className="mb-2">Built for Speed</h4>
                <p className="text-muted-foreground">
                  Streamlined tools to help you build and launch faster
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <h4 className="mb-2">Team First</h4>
                <p className="text-muted-foreground">
                  Find co-founders and build high-performing teams
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
