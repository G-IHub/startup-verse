/**
 * FOUNDER RESOURCES VIEW - Browse resources from cohorts
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  BookOpen,
  Search,
  ExternalLink,
  FileText,
  Video,
  FolderOpen,
  Link as LinkIcon,
} from "lucide-react";
import { unwrapData } from "../../utils/apiEnvelope";

const API_BASE = API_BASE_URL;

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

export default function FounderResourcesView({ founderId }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    loadResources();
  }, [founderId]);
  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/founders/${founderId}/resources`, {
        ...defaultOptions,
      });
      if (!response.ok) throw new Error("Failed to fetch resources");
      const inner = unwrapData(await response.json());
      setResources(inner.resources || []);
    } catch (error) {
      console.error("Error loading resources:", error);
    } finally {
      setLoading(false);
    }
  };
  const getTypeIcon = (type) => {
    switch (type) {
      case "document":
        return <FileText className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "template":
        return <FolderOpen className="w-4 h-4" />;
      case "link":
        return <LinkIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };
  const getTypeColor = (type) => {
    switch (type) {
      case "document":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "video":
        return "bg-purple-500/10 text-purple-700 border-purple-500/20";
      case "template":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "link":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };
  const filteredResources = resources.filter(
    (resource) =>
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse text-[10px]">Loading resources...</div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="h-7 text-[10px] pl-7"
            />
          </div>
        </CardContent>
      </Card>
      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground">
              {searchQuery
                ? "No resources match your search"
                : "No resources available yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredResources.map((resource) => (
            <Card
              key={resource.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 bg-muted/30 rounded">
                    {getTypeIcon(resource.type)}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[7px] ${getTypeColor(resource.type)}`}
                  >
                    {resource.type}
                  </Badge>
                </div>
                <h3 className="text-[10px] font-medium mb-1 truncate">
                  {resource.title}
                </h3>
                {resource.description && (
                  <p className="text-[9px] text-muted-foreground mb-2 line-clamp-2">
                    {resource.description}
                  </p>
                )}
                <p className="text-[8px] text-muted-foreground mb-2">
                  {resource.cohortName}
                </p>
                {resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {resource.tags.slice(0, 3).map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-[7px] bg-primary/5"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-[9px] text-primary hover:underline font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Resource
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
