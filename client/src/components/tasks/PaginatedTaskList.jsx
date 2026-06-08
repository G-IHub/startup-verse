import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { usePagination } from "../../hooks/usePagination";
import { PaginationControls } from "../shared/PaginationControls";
import * as taskApi from "../../utils/api/taskApi";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  Ban,
  Search,
  Calendar,
} from "lucide-react";
export function PaginatedTaskList({ userId, userRole, onTaskClick }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ✅ Use pagination hook for tasks
  const {
    data: tasks,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    hasNext,
    hasPrev,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    refresh,
  } = usePagination({
    fetchFn: async (page, pageSize) => {
      // Fetch tasks based on role
      if (userRole === "founder") {
        return await taskApi.getTasks(userId, {
          page,
          pageSize,
        });
      } else {
        return await taskApi.getTasksByAssignee(userId, {
          page,
          pageSize,
        });
      }
    },
    initialPageSize: 20,
  });
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "blocked":
        return <Ban className="w-4 h-4 text-red-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "in-progress":
        return "bg-blue-50 border-blue-200";
      case "blocked":
        return "bg-red-50 border-red-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "default";
      case "blocked":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Filter tasks client-side (already paginated from backend)
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>
              {"Error loading tasks: "}
              {error}
            </p>
            <Button onClick={refresh} className="mt-4" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">All Tasks</CardTitle>
              <CardDescription className="text-xs">
                {totalItems}
                {" total task"}
                {totalItems !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <Circle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-sm font-medium text-muted-foreground">
                No tasks found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first task to get started"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer border-l-4 ${getStatusColor(task.status)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium truncate">
                          {task.title}
                        </h4>
                        <Badge
                          variant={getStatusBadgeVariant(task.status)}
                          className="text-xs flex-shrink-0"
                        >
                          {task.status === "in-progress"
                            ? "In Progress"
                            : task.status === "completed"
                              ? "Completed"
                              : task.status === "blocked"
                                ? "Blocked"
                                : "Pending"}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {task.assignedToName && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Assigned to:</span>{" "}
                            {task.assignedToName}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        )}
                        {task.priority && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5"
                          >
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {!loading && totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          onNextPage={nextPage}
          onPrevPage={prevPage}
          hasNext={hasNext}
          hasPrev={hasPrev}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
