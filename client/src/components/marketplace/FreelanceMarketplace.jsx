import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Progress } from "../ui/progress";
import {
  Search,
  Filter,
  Star,
  Clock,
  DollarSign,
  MapPin,
  Heart,
  Eye,
  MessageSquare,
  FileText,
  Calendar,
  CheckCircle,
  Zap,
  Trophy,
  Users,
  TrendingUp,
  Code,
  Palette,
  PenTool,
  BarChart,
  Megaphone,
  Camera,
  Briefcase,
} from "lucide-react";
export default function FreelanceMarketplace({ user }) {
  const [activeTab, setActiveTab] = useState("browse-projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Mock data
  const projects = [
    {
      id: "1",
      title: "React Frontend for AI Healthcare Platform",
      description:
        "We need an experienced React developer to build a modern, responsive frontend for our AI-powered healthcare platform. The project includes user authentication, dashboard creation, and integration with our API.",
      budget: {
        type: "fixed",
        amount: 5000,
        currency: "USD",
      },
      duration: "4-6 weeks",
      skillsRequired: [
        "React",
        "TypeScript",
        "Tailwind CSS",
        "API Integration",
      ],
      clientId: "client1",
      clientName: "HealthTech Startup",
      clientRating: 4.8,
      postedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      proposalCount: 12,
      status: "open",
      urgency: "high",
      type: "development",
    },
    {
      id: "2",
      title: "Brand Identity Design for FinTech Startup",
      description:
        "Looking for a creative designer to develop our complete brand identity including logo, color palette, typography, and brand guidelines. Must have experience with fintech or financial services.",
      budget: {
        type: "fixed",
        amount: 3000,
        currency: "USD",
      },
      duration: "3-4 weeks",
      skillsRequired: [
        "Brand Design",
        "Logo Design",
        "Adobe Illustrator",
        "Figma",
      ],
      clientId: "client2",
      clientName: "FinTech Pro",
      clientRating: 4.9,
      postedDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
      proposalCount: 8,
      status: "open",
      urgency: "medium",
      type: "design",
    },
    {
      id: "3",
      title: "Content Marketing Strategy & Execution",
      description:
        "We need a content marketing expert to develop and execute a comprehensive content strategy for our B2B SaaS platform. Includes blog posts, social media, and email campaigns.",
      budget: {
        type: "hourly",
        amount: 75,
        currency: "USD",
      },
      duration: "Ongoing",
      skillsRequired: [
        "Content Marketing",
        "SEO",
        "Social Media",
        "Email Marketing",
      ],
      clientId: "client3",
      clientName: "SaaS Solutions",
      clientRating: 4.7,
      postedDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
      proposalCount: 15,
      status: "open",
      urgency: "low",
      type: "marketing",
    },
  ];
  const freelancers = [
    {
      id: "1",
      name: "Sarah Chen",
      title: "Senior React Developer",
      rating: 4.9,
      reviewCount: 127,
      completedProjects: 89,
      responseTime: "1 hour",
      hourlyRate: 85,
      location: "San Francisco, CA",
      skills: ["React", "Node.js", "TypeScript", "GraphQL", "AWS"],
      isOnline: true,
      isFeatured: true,
      description:
        "Full-stack developer with 8+ years of experience building scalable web applications. Specialized in React ecosystem and cloud deployment.",
      languages: ["English", "Mandarin"],
      certifications: ["AWS Certified Developer", "React Professional"],
    },
    {
      id: "2",
      name: "Alex Rodriguez",
      title: "UI/UX Designer & Brand Strategist",
      rating: 4.8,
      reviewCount: 94,
      completedProjects: 67,
      responseTime: "2 hours",
      hourlyRate: 70,
      location: "New York, NY",
      skills: [
        "UI/UX Design",
        "Figma",
        "Brand Design",
        "Prototyping",
        "User Research",
      ],
      isOnline: false,
      isFeatured: true,
      description:
        "Creative designer focused on user-centered design and brand strategy. Helping startups create compelling digital experiences.",
      languages: ["English", "Spanish"],
      certifications: [
        "Google UX Design Certificate",
        "Adobe Certified Expert",
      ],
    },
  ];
  const myProjects = [
    {
      id: "4",
      title: "Mobile App Development for EdTech Platform",
      description:
        "Currently working on a React Native app for an educational technology startup.",
      budget: {
        type: "fixed",
        amount: 8000,
        currency: "USD",
      },
      duration: "8 weeks",
      skillsRequired: ["React Native", "Mobile Development"],
      clientId: "client4",
      clientName: "EduTech Solutions",
      clientRating: 4.6,
      postedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      proposalCount: 0,
      status: "in-progress",
      urgency: "medium",
      type: "development",
    },
  ];
  const getSkillIcon = (skill) => {
    const skillIcons = {
      React: Code,
      TypeScript: Code,
      "Node.js": Code,
      "UI/UX Design": Palette,
      Figma: PenTool,
      "Brand Design": Palette,
      "Content Marketing": Megaphone,
      SEO: TrendingUp,
      Photography: Camera,
      "Data Analysis": BarChart,
    };
    return skillIcons[skill] || Briefcase;
  };
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
    }
  };
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 1) {
      return "Less than 1 hour ago";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }
  };
  return (
    <div className="p-3 md:p-4">
      <div className="mb-3 md:mb-4">
        <h1 className="mb-1">Freelance Marketplace</h1>
        <p className="text-muted-foreground">
          {user.role === "freelancer"
            ? "Find your next project"
            : "Hire top talent for your startup"}
        </p>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-3 md:space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="browse-projects">
            {user.role === "freelancer" ? "Find Work" : "Browse Projects"}
          </TabsTrigger>
          <TabsTrigger value="browse-talent">
            {user.role === "freelancer" ? "Network" : "Find Talent"}
          </TabsTrigger>
          <TabsTrigger value="my-projects">My Projects</TabsTrigger>
          <TabsTrigger value="proposals">
            {user.role === "freelancer" ? "My Proposals" : "Received Proposals"}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="browse-projects" className="space-y-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="budget-high">
                        Budget: High to Low
                      </SelectItem>
                      <SelectItem value="budget-low">
                        Budget: Low to High
                      </SelectItem>
                      <SelectItem value="proposals">
                        Fewest Proposals
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-1" />
                    Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <div>
            <h3 className="mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Featured Projects
            </h3>
            <div className="space-y-3">
              {projects
                .filter((p) => p.urgency === "high")
                .map((project) => (
                  <Card
                    key={project.id}
                    className="border-l-4 border-l-yellow-500"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4>{project.title}</h4>
                            <Badge variant={getUrgencyColor(project.urgency)}>
                              {project.urgency}
                              {" priority"}
                            </Badge>
                            <Badge variant="outline">{project.type}</Badge>
                          </div>
                          <div className="flex items-center space-x-3 text-muted-foreground mb-2">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-3 h-3" />
                              <span>
                                {project.budget.type === "fixed"
                                  ? `$${project.budget.amount.toLocaleString()} fixed`
                                  : `$${project.budget.amount}/hr`}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{project.duration}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>
                                {project.proposalCount}
                                {" proposals"}
                              </span>
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {project.description}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {project.skillsRequired.map((skill) => {
                              const SkillIcon = getSkillIcon(skill);
                              return (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  <SkillIcon className="w-3 h-3" />
                                  {skill}
                                </Badge>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {project.clientName
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p>{project.clientName}</p>
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                    <span className="text-xs text-muted-foreground">
                                      {project.clientRating}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(project.postedDate)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Heart className="w-4 h-4" />
                              </Button>
                              <Button size="sm">Submit Proposal</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3">All Projects</h3>
            <div className="space-y-3">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4>{project.title}</h4>
                          <Badge variant={getUrgencyColor(project.urgency)}>
                            {project.urgency}
                          </Badge>
                          <Badge variant="outline">{project.type}</Badge>
                        </div>
                        <div className="flex items-center space-x-3 text-muted-foreground mb-2">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>
                              {project.budget.type === "fixed"
                                ? `$${project.budget.amount.toLocaleString()} fixed`
                                : `$${project.budget.amount}/hr`}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{project.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>
                              {project.proposalCount}
                              {" proposals"}
                            </span>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {project.skillsRequired.map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {project.clientName
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p>{project.clientName}</p>
                                <div className="flex items-center space-x-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  <span className="text-xs text-muted-foreground">
                                    {project.clientRating}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(project.postedDate)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Heart className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            <Button size="sm">Submit Proposal</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="browse-talent" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {freelancers.map((freelancer) => (
              <Card
                key={freelancer.id}
                className={
                  freelancer.isFeatured
                    ? "border-yellow-200 bg-yellow-50/50"
                    : ""
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={freelancer.avatar} />
                        <AvatarFallback>
                          {freelancer.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {freelancer.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                      {freelancer.isFeatured && (
                        <div className="absolute -top-0.5 -right-0.5">
                          <Trophy className="w-3 h-3 text-yellow-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4>{freelancer.name}</h4>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span>{freelancer.rating}</span>
                          <span className="text-muted-foreground">
                            ({freelancer.reviewCount})
                          </span>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        {freelancer.title}
                      </p>
                      <div className="flex items-center space-x-3 text-muted-foreground mb-2">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-3 h-3" />
                          <span>${freelancer.hourlyRate}/hr</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {freelancer.responseTime}
                            {" response"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{freelancer.location}</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {freelancer.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {freelancer.skills.slice(0, 4).map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {freelancer.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{freelancer.skills.length - 4}
                            {" more"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          <span>
                            {freelancer.completedProjects}
                            {" projects completed"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button size="sm">Hire Now</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="my-projects" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Briefcase className="w-5 h-5 text-accent" />
                </div>
                <h3>12</h3>
                <p className="text-muted-foreground">Active Projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <h3>47</h3>
                <p className="text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <h3>$24,500</h3>
                <p className="text-muted-foreground">Earned This Month</p>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-3">
            {myProjects.map((project) => (
              <Card key={project.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4>{project.title}</h4>
                        <Badge
                          variant={
                            project.status === "completed"
                              ? "default"
                              : project.status === "in-progress"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {project.status.replace("-", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3 text-muted-foreground mb-2">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-3 h-3" />
                          <span>
                            {project.budget.type === "fixed"
                              ? `$${project.budget.amount.toLocaleString()}`
                              : `$${project.budget.amount}/hr`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {"Started "}
                            {formatTimeAgo(project.postedDate)}
                          </span>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-3">
                        {project.description}
                      </p>
                      {project.status === "in-progress" && (
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span>Progress</span>
                            <span className="text-muted-foreground">65%</span>
                          </div>
                          <Progress value={65} className="h-2" />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {project.clientName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{project.clientName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                          <Button size="sm">
                            <FileText className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="proposals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proposal Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg mb-2">No proposals yet</h3>
                <p>
                  When you submit proposals to projects, they'll appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
