/**
 * RESOURCE LIBRARY - Upload and organize templates, guides, and resources
 */
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Plus,
  FileText,
  Video,
  Link as LinkIcon,
  ExternalLink,
  Search,
  BookOpen,
  Wrench,
  Newspaper,
  FolderOpen,
} from "lucide-react";
export default function ResourceLibrary({
  cohortId,
  organizationId,
  userId,
  isAdmin,
}) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    type: "link",
    url: "",
    tags: "",
  });
  useEffect(() => {
    loadResources();
  }, [cohortId]);
  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/resources/${cohortId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch resources");
      const data = await response.json();
      setResources(data.resources);
    } catch (error) {
      console.error("Error loading resources:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      const tags = formData.tags
        .split(",")
        .filter((t) => t.trim())
        .map((t) => t.trim());
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/resources/create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cohortId,
            organizationId,
            title: formData.title,
            description: formData.description,
            category: formData.category,
            type: formData.type,
            url: formData.url,
            fileUrl: formData.url,
            // For now, using same URL
            tags,
            createdBy: userId,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to create resource");

      // Reset form and reload
      setFormData({
        title: "",
        description: "",
        category: "general",
        type: "link",
        url: "",
        tags: "",
      });
      setShowCreateForm(false);
      loadResources();
    } catch (error) {
      console.error("Error creating resource:", error);
      alert("Failed to create resource");
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
  const getCategoryIcon = (category) => {
    switch (category) {
      case "template":
        return <FolderOpen className="w-3 h-3" />;
      case "guide":
        return <BookOpen className="w-3 h-3" />;
      case "video":
        return <Video className="w-3 h-3" />;
      case "tool":
        return <Wrench className="w-3 h-3" />;
      case "article":
        return <Newspaper className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };
  const getTypeColor = (type) => {
    switch (type) {
      case "document":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "video":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
      case "template":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "link":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  // Filter resources
  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    const matchesCategory =
      filterCategory === "all" || resource.category === filterCategory;
    const matchesType = filterType === "all" || resource.type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Group by category
  const categories = Array.from(new Set(resources.map((r) => r.category)));
  const types = Array.from(new Set(resources.map((r) => r.type)));
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-[11px]">Resource Library</CardTitle>
              <CardDescription className="text-[9px]">
                Templates, guides, and tools for your cohort
              </CardDescription>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="h-6 text-[9px]"
              >
                <Plus className="w-3 h-3 mr-1" />
                {showCreateForm ? "Cancel" : "Add Resource"}
              </Button>
            )}
          </div>
        </CardHeader>
        {showCreateForm && (
          <CardContent className="border-t">
            <form onSubmit={handleCreateResource} className="space-y-3 pt-3">
              <div>
                <label className="text-[9px] text-muted-foreground">
                  Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g., Pitch Deck Template"
                  required={true}
                  className="h-7 text-[10px]"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of this resource"
                  className="text-[10px] min-h-[60px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-muted-foreground">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value,
                      })
                    }
                    className="w-full h-7 text-[10px] rounded-md border border-input bg-background px-2"
                  >
                    <option value="general">General</option>
                    <option value="template">Template</option>
                    <option value="guide">Guide</option>
                    <option value="video">Video</option>
                    <option value="tool">Tool</option>
                    <option value="article">Article</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value,
                      })
                    }
                    className="w-full h-7 text-[10px] rounded-md border border-input bg-background px-2"
                  >
                    <option value="link">Link</option>
                    <option value="document">Document</option>
                    <option value="video">Video</option>
                    <option value="template">Template</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">URL</label>
                <Input
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      url: e.target.value,
                    })
                  }
                  placeholder="https://..."
                  required={true}
                  type="url"
                  className="h-7 text-[10px]"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">
                  Tags (comma separated)
                </label>
                <Input
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value,
                    })
                  }
                  placeholder="fundraising, pitch, template"
                  className="h-7 text-[10px]"
                />
              </div>
              <Button type="submit" size="sm" className="h-6 text-[9px]">
                Add Resource
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="h-7 text-[10px] pl-7"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-7 text-[9px] rounded-md border border-input bg-background px-2"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-7 text-[9px] rounded-md border border-input bg-background px-2"
              >
                <option value="all">All Types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-pulse text-[10px]">
              Loading resources...
            </div>
          </CardContent>
        </Card>
      ) : filteredResources.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground">
              {searchQuery || filterCategory !== "all" || filterType !== "all"
                ? "No resources match your filters"
                : "No resources yet"}
            </p>
            {isAdmin && !searchQuery && filterCategory === "all" && (
              <p className="text-[9px] text-muted-foreground mt-1">
                Add resources to help your startups succeed
              </p>
            )}
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
                <div className="flex items-center gap-1.5 mb-2">
                  <Badge variant="outline" className="text-[7px]">
                    {getCategoryIcon(resource.category)}
                    <span className="ml-1">{resource.category}</span>
                  </Badge>
                </div>
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
                    {resource.tags.length > 3 && (
                      <Badge variant="outline" className="text-[7px]">
                        +{resource.tags.length - 3}
                      </Badge>
                    )}
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
                <div className="mt-2 pt-2 border-t text-[8px] text-muted-foreground">
                  {"Added "}
                  {new Date(resource.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!loading && filteredResources.length > 0 && (
        <div className="text-center">
          <p className="text-[9px] text-muted-foreground">
            {"Showing "}
            {filteredResources.length}
            {" of "}
            {resources.length}
            {" resources"}
          </p>
        </div>
      )}
    </div>
  );
}
