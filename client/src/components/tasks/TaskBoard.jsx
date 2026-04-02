import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Clock,
  MessageSquare,
  Paperclip,
  Edit,
  CheckCircle,
  Circle,
  AlertCircle,
  TrendingUp,
  Target,
  Activity,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar as CalendarIcon,
  Timer,
} from "lucide-react";
export default function TaskBoard({ user }) {
  const [activeTab, setActiveTab] = useState("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("created");

  // Mock data
  const teamMembers = [
    {
      id: "1",
      name: "Sarah Chen",
      email: "sarah@startup.com",
      role: "CTO",
    },
    {
      id: "2",
      name: "Alex Rodriguez",
      email: "alex@startup.com",
      role: "Backend Developer",
    },
    {
      id: "3",
      name: "Lisa Zhang",
      email: "lisa@startup.com",
      role: "Designer",
    },
    {
      id: "4",
      name: "Marcus Johnson",
      email: "marcus@startup.com",
      role: "Marketing",
    },
    {
      id: "5",
      name: "Emily Davis",
      email: "emily@startup.com",
      role: "Product Manager",
    },
  ];
  const projects = [
    {
      id: "1",
      name: "MVP Development",
      color: "bg-accent",
    },
    {
      id: "2",
      name: "Marketing Campaign",
      color: "bg-primary",
    },
    {
      id: "3",
      name: "User Research",
      color: "bg-accent",
    },
    {
      id: "4",
      name: "Infrastructure",
      color: "bg-accent",
    },
  ];
  const tasks = [
    {
      id: "1",
      title: "Design User Authentication Flow",
      description:
        "Create wireframes and user flow for the login and signup process",
      status: "todo",
      priority: "high",
      assigneeIds: ["3"],
      createdBy: "5",
      createdAt: new Date("2024-06-20"),
      dueDate: new Date("2024-06-28"),
      labels: ["Design", "UX"],
      attachments: 2,
      comments: 3,
      estimatedHours: 8,
      projectId: "1",
    },
    {
      id: "2",
      title: "Implement JWT Authentication",
      description:
        "Set up secure JWT-based authentication system with refresh tokens",
      status: "in-progress",
      priority: "high",
      assigneeIds: ["2"],
      createdBy: "1",
      createdAt: new Date("2024-06-18"),
      dueDate: new Date("2024-06-25"),
      labels: ["Backend", "Security"],
      attachments: 1,
      comments: 5,
      estimatedHours: 12,
      actualHours: 8,
      projectId: "1",
    },
    {
      id: "3",
      title: "Database Schema Design",
      description:
        "Design and implement the core database schema for user management",
      status: "review",
      priority: "medium",
      assigneeIds: ["2", "1"],
      createdBy: "1",
      createdAt: new Date("2024-06-15"),
      dueDate: new Date("2024-06-22"),
      labels: ["Database", "Backend"],
      attachments: 3,
      comments: 8,
      estimatedHours: 16,
      actualHours: 18,
      projectId: "1",
    },
    {
      id: "4",
      title: "Landing Page Copy",
      description: "Write compelling copy for the main landing page sections",
      status: "done",
      priority: "medium",
      assigneeIds: ["4"],
      createdBy: "4",
      createdAt: new Date("2024-06-10"),
      dueDate: new Date("2024-06-20"),
      labels: ["Marketing", "Content"],
      attachments: 0,
      comments: 2,
      estimatedHours: 6,
      actualHours: 5,
      projectId: "2",
    },
    {
      id: "5",
      title: "User Interview Analysis",
      description: "Analyze findings from the latest round of user interviews",
      status: "in-progress",
      priority: "low",
      assigneeIds: ["5", "3"],
      createdBy: "5",
      createdAt: new Date("2024-06-19"),
      dueDate: new Date("2024-06-30"),
      labels: ["Research", "Analysis"],
      attachments: 5,
      comments: 1,
      estimatedHours: 10,
      actualHours: 4,
      projectId: "3",
    },
    {
      id: "6",
      title: "API Documentation",
      description: "Create comprehensive API documentation for all endpoints",
      status: "todo",
      priority: "medium",
      assigneeIds: ["2"],
      createdBy: "1",
      createdAt: new Date("2024-06-21"),
      dueDate: new Date("2024-07-05"),
      labels: ["Documentation", "API"],
      attachments: 0,
      comments: 0,
      estimatedHours: 8,
      projectId: "1",
    },
  ];
  const columns = [
    {
      id: "todo",
      title: "To Do",
      status: "todo",
      color: "border-gray-300",
      tasks: tasks.filter((task) => task.status === "todo"),
    },
    {
      id: "in-progress",
      title: "In Progress",
      status: "in-progress",
      color: "border-blue-300",
      tasks: tasks.filter((task) => task.status === "in-progress"),
    },
    {
      id: "review",
      title: "Review",
      status: "review",
      color: "border-yellow-300",
      tasks: tasks.filter((task) => task.status === "review"),
    },
    {
      id: "done",
      title: "Done",
      status: "done",
      color: "border-green-300",
      tasks: tasks.filter((task) => task.status === "done"),
    },
  ];
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "urgent":
        return <ArrowUp className="w-3 h-3 text-red-600" />;
      case "high":
        return <ArrowUp className="w-3 h-3 text-orange-600" />;
      case "medium":
        return <Minus className="w-3 h-3 text-yellow-600" />;
      case "low":
        return <ArrowDown className="w-3 h-3 text-green-600" />;
    }
  };
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
    }
  };
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };
  const isOverdue = (dueDate) => {
    return dueDate && dueDate < new Date();
  };
  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const overdue = tasks.filter((t) => isOverdue(t.dueDate)).length;
    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate: Math.round((completed / total) * 100),
    };
  };
  const stats = getTaskStats();
  const TaskCard = ({ task }) => {
    const project = projects.find((p) => p.id === task.projectId);
    const assignees = teamMembers.filter((member) =>
      task.assigneeIds.includes(member.id),
    );
    return (
      <Card
        className="mb-3 cursor-pointer"
        onClick={() => setSelectedTask(task)}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h4 className="text-sm line-clamp-2">{task.title}</h4>
              <div className="flex items-center space-x-1">
                {getPriorityIcon(task.priority)}
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {project && (
                <Badge variant="outline" className="text-xs">
                  <div
                    className={`w-2 h-2 rounded-full ${project.color} mr-1`}
                  />
                  {project.name}
                </Badge>
              )}
              {task.labels.slice(0, 2).map((label) => (
                <Badge key={label} variant="secondary" className="text-xs">
                  {label}
                </Badge>
              ))}
              {task.labels.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{task.labels.length - 2}
                </Badge>
              )}
            </div>
            {task.dueDate && (
              <div
                className={`flex items-center space-x-1 text-xs ${isOverdue(task.dueDate) ? "text-red-600" : "text-muted-foreground"}`}
              >
                <Calendar className="w-3 h-3" />
                <span>{formatDate(task.dueDate)}</span>
                {isOverdue(task.dueDate) && <AlertCircle className="w-3 h-3" />}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {assignees.length > 0 && (
                  <div className="flex -space-x-1">
                    {assignees.slice(0, 2).map((assignee) => (
                      <Avatar
                        key={assignee.id}
                        className="w-5 h-5 border border-background"
                      >
                        <AvatarImage src={assignee.avatar} />
                        <AvatarFallback className="text-xs">
                          {assignee.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {assignees.length > 2 && (
                      <div className="w-5 h-5 rounded-full bg-muted border border-background flex items-center justify-center">
                        <span className="text-xs">+{assignees.length - 2}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {task.comments > 0 && (
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{task.comments}</span>
                  </div>
                )}
                {task.attachments > 0 && (
                  <div className="flex items-center space-x-1">
                    <Paperclip className="w-3 h-3" />
                    <span>{task.attachments}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  return (
    <div className="py-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="mb-1">Task Board</h1>
          <p className="text-muted-foreground">
            Manage tasks, track progress, and collaborate with your team
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <Filter className="w-3 h-3 mr-1" />
            Filter
          </Button>
          <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
            <DialogTrigger asChild={true}>
              <Button size="sm" className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Create a new task and assign it to team members
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input id="title" placeholder="Enter task title" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the task..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-3 h-3 rounded-full ${project.color}`}
                            />
                            <span>{project.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input id="estimatedHours" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labels">Labels</Label>
                  <Input
                    id="labels"
                    placeholder="Enter labels (comma separated)"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateTask(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateTask(false)}>
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        <Card>
          <CardContent className="p-3 flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent/10 rounded-md flex items-center justify-center">
              <Target className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
              <p>{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p>{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center space-x-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p>{stats.inProgress}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p>{stats.overdue}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-3"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-8">
          <TabsTrigger value="board" className="text-xs">
            Board
          </TabsTrigger>
          <TabsTrigger value="list" className="text-xs">
            List
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs">
            Calendar
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">
            Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <div className="flex space-x-6 overflow-x-auto pb-6">
            {columns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <Card
                  className={`border-t-4 ${column.color.replace("border-", "border-t-")}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {column.title}
                      </CardTitle>
                      <Badge variant="secondary">{column.tasks.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-[calc(100vh-400px)]">
                      <div className="space-y-3">
                        {column.tasks.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                        {column.tasks.length === 0 && (
                          <div className="text-center text-muted-foreground py-8">
                            <Circle className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">No tasks yet</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="list" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="assigned">Assigned to Me</SelectItem>
                <SelectItem value="created">Created by Me</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Date Created</SelectItem>
                <SelectItem value="due">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {tasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const assignees = teamMembers.filter((member) =>
                    task.assigneeIds.includes(member.id),
                  );
                  return (
                    <div
                      key={task.id}
                      className="p-4 hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center space-x-2">
                            {getPriorityIcon(task.priority)}
                            <Badge
                              variant={getPriorityColor(task.priority)}
                              className="text-xs"
                            >
                              {task.status.replace("-", " ")}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm">{task.title}</h4>
                            <div className="flex items-center space-x-3 mt-1">
                              {project && (
                                <div className="flex items-center space-x-1">
                                  <div
                                    className={`w-2 h-2 rounded-full ${project.color}`}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {project.name}
                                  </span>
                                </div>
                              )}
                              {task.dueDate && (
                                <div
                                  className={`flex items-center space-x-1 text-xs ${isOverdue(task.dueDate) ? "text-red-600" : "text-muted-foreground"}`}
                                >
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(task.dueDate)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {task.comments > 0 && (
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <MessageSquare className="w-3 h-3" />
                                <span>{task.comments}</span>
                              </div>
                            )}
                            {task.attachments > 0 && (
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <Paperclip className="w-3 h-3" />
                                <span>{task.attachments}</span>
                              </div>
                            )}
                          </div>
                          {assignees.length > 0 && (
                            <div className="flex -space-x-1">
                              {assignees.slice(0, 3).map((assignee) => (
                                <Avatar
                                  key={assignee.id}
                                  className="w-6 h-6 border border-background"
                                >
                                  <AvatarImage src={assignee.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {assignee.name.substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {assignees.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-muted border border-background flex items-center justify-center">
                                  <span className="text-xs">
                                    +{assignees.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg mb-2">Calendar View</h3>
              <p className="text-muted-foreground mb-4">
                View tasks in a calendar format to better manage deadlines and
                schedules
              </p>
              <Button>
                <Calendar className="w-4 h-4 mr-2" />
                Open Calendar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Task Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl mb-1">{stats.completionRate}%</div>
                    <p className="text-sm text-muted-foreground">
                      Completion Rate
                    </p>
                  </div>
                  <div className="space-y-3">
                    {columns.map((column) => (
                      <div key={column.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{column.title}</span>
                          <span>
                            {column.tasks.length}
                            {" tasks"}
                          </span>
                        </div>
                        <Progress
                          value={(column.tasks.length / tasks.length) * 100}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => {
                    const memberTasks = tasks.filter((task) =>
                      task.assigneeIds.includes(member.id),
                    );
                    const completedTasks = memberTasks.filter(
                      (task) => task.status === "done",
                    );
                    const completionRate =
                      memberTasks.length > 0
                        ? (completedTasks.length / memberTasks.length) * 100
                        : 0;
                    return (
                      <div key={member.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{member.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm">
                              {completedTasks.length}/{memberTasks.length}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {Math.round(completionRate)}%
                            </div>
                          </div>
                        </div>
                        <Progress value={completionRate} className="h-1" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 text-accent" />
                <div className="text-2xl mb-1">
                  {tasks
                    .filter((t) => t.actualHours)
                    .reduce((sum, t) => sum + (t.actualHours || 0), 0)}
                </div>
                <p className="text-sm text-muted-foreground">Hours Tracked</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Timer className="w-8 h-8 mx-auto mb-2 text-accent" />
                <div className="text-2xl mb-1">
                  {Math.round(
                    tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0) /
                      tasks.length,
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Avg Est. Hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-accent" />
                <div className="text-2xl mb-1">
                  +{Math.round(Math.random() * 20)}%
                </div>
                <p className="text-sm text-muted-foreground">Productivity</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      {selectedTask && (
        <Dialog
          open={!!selectedTask}
          onOpenChange={() => setSelectedTask(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {selectedTask.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Task details and activity
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Badge variant={getPriorityColor(selectedTask.priority)}>
                      {selectedTask.priority}
                    </Badge>
                    <Badge variant="outline">
                      {selectedTask.status.replace("-", " ")}
                    </Badge>
                    {selectedTask.dueDate && (
                      <div
                        className={`flex items-center space-x-1 text-sm ${isOverdue(selectedTask.dueDate) ? "text-red-600" : "text-muted-foreground"}`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>
                          {"Due "}
                          {formatDate(selectedTask.dueDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="col-span-2 space-y-6">
                <div>
                  <h4 className="text-sm text-muted-foreground mb-2">
                    Description
                  </h4>
                  <p className="text-sm">{selectedTask.description}</p>
                </div>
                <div>
                  <h4 className="text-sm text-muted-foreground mb-3">
                    Activity
                  </h4>
                  <div className="space-y-3">
                    <div className="flex space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm">
                            Added a comment about the API implementation
                            approach.
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          2 hours ago
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>SC</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm">Moved task to In Progress</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          1 day ago
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm text-muted-foreground mb-3">
                    Assignees
                  </h4>
                  <div className="space-y-2">
                    {teamMembers
                      .filter((member) =>
                        selectedTask.assigneeIds.includes(member.id),
                      )
                      .map((assignee) => (
                        <div
                          key={assignee.id}
                          className="flex items-center space-x-2"
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={assignee.avatar} />
                            <AvatarFallback className="text-xs">
                              {assignee.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm">{assignee.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {assignee.role}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm text-muted-foreground mb-3">
                    Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span>{formatDate(selectedTask.createdAt)}</span>
                    </div>
                    {selectedTask.estimatedHours && (
                      <div className="flex justify-between">
                        <span>Estimated</span>
                        <span>{selectedTask.estimatedHours}h</span>
                      </div>
                    )}
                    {selectedTask.actualHours && (
                      <div className="flex justify-between">
                        <span>Tracked</span>
                        <span>{selectedTask.actualHours}h</span>
                      </div>
                    )}
                  </div>
                </div>
                {selectedTask.labels.length > 0 && (
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-3">
                      Labels
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedTask.labels.map((label) => (
                        <Badge
                          key={label}
                          variant="secondary"
                          className="text-xs"
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
