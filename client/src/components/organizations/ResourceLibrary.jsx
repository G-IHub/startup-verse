/**
 * RESOURCE LIBRARY - Upload and organize templates, guides, and resources
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
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
import { unwrapData } from "../../utils/apiEnvelope";
import {
  SectionCard,
  SectionHeader,
  StatusBadge,
  EmptyStateBlock,
  CollapsibleFormCard,
} from "./_primitives";

const API_BASE = API_BASE_URL;

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

const PRIMARY_BUTTON =
  "h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover";

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "template", label: "Template" },
  { value: "guide", label: "Guide" },
  { value: "video", label: "Video" },
  { value: "tool", label: "Tool" },
  { value: "article", label: "Article" },
];

const TYPE_OPTIONS = [
  { value: "link", label: "Link" },
  { value: "document", label: "Document" },
  { value: "video", label: "Video" },
  { value: "template", label: "Template" },
];

const TYPE_TONE = {
  document: "info",
  video: "info",
  template: "success",
  link: "warning",
};

const TYPE_ICON = {
  document: FileText,
  video: Video,
  template: FolderOpen,
  link: LinkIcon,
};

const CATEGORY_ICON = {
  template: FolderOpen,
  guide: BookOpen,
  video: Video,
  tool: Wrench,
  article: Newspaper,
  general: FileText,
};

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
        `${API_BASE}/cohorts/${cohortId}/resources`,
        { ...defaultOptions },
      );
      if (!response.ok) throw new Error("Failed to fetch resources");
      const inner = unwrapData(await response.json());
      setResources(inner.resources || []);
    } catch (error) {
      console.error("Error loading resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/resources`,
        {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({
            organizationId,
            title: formData.title,
            description: formData.description,
            url: formData.url,
            founderId: userId,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to create resource");
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

  const categories = Array.from(new Set(resources.map((r) => r.category)));
  const types = Array.from(new Set(resources.map((r) => r.type)));

  return (
    <div className="space-y-4 font-body">
      <SectionHeader
        icon={BookOpen}
        title="Resource Library"
        description="Templates, guides, and tools for your cohort"
      />

      {isAdmin && (
        <CollapsibleFormCard
          title="Add Resource"
          description="Share a link, document, or template with your cohort"
          triggerLabel="Add Resource"
          isOpen={showCreateForm}
          onToggle={setShowCreateForm}
        >
          <form onSubmit={handleCreateResource} className="space-y-3">
            <div>
              <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Pitch Deck Template"
                required={true}
                className="font-body text-[13px]"
              />
            </div>
            <div>
              <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this resource"
                className="min-h-[60px] font-body text-[13px]"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="font-body text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="font-body text-[13px]"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                  Type
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className="font-body text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="font-body text-[13px]"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                URL
              </label>
              <Input
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="https://..."
                required={true}
                type="url"
                className="font-body text-[13px]"
              />
            </div>
            <div>
              <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                Tags (comma separated)
              </label>
              <Input
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="fundraising, pitch, template"
                className="font-body text-[13px]"
              />
            </div>
            <Button type="submit" size="sm" className={PRIMARY_BUTTON}>
              <Plus className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          </form>
        </CollapsibleFormCard>
      )}

      <SectionCard>
        <SectionCard.Body className="p-3">
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="pl-8 font-body text-[13px]"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={filterCategory}
                onValueChange={(value) => setFilterCategory(value)}
              >
                <SelectTrigger className="min-w-[140px] font-body text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-body text-[13px]">
                    All Categories
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="font-body text-[13px] capitalize"
                    >
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterType}
                onValueChange={(value) => setFilterType(value)}
              >
                <SelectTrigger className="min-w-[120px] font-body text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-body text-[13px]">
                    All Types
                  </SelectItem>
                  {types.map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="font-body text-[13px] capitalize"
                    >
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard.Body>
      </SectionCard>

      {loading ? (
        <SectionCard>
          <SectionCard.Body className="p-8 text-center">
            <div className="animate-pulse font-body text-[13px] text-text-muted">
              Loading resources...
            </div>
          </SectionCard.Body>
        </SectionCard>
      ) : filteredResources.length === 0 ? (
        <SectionCard>
          <SectionCard.Body className="p-0">
            <EmptyStateBlock
              variant="centered"
              icon={BookOpen}
              tone="info"
              title={
                searchQuery || filterCategory !== "all" || filterType !== "all"
                  ? "No resources match your filters"
                  : "No resources yet"
              }
              description={
                isAdmin && !searchQuery && filterCategory === "all"
                  ? "Add resources to help your startups succeed"
                  : "Try adjusting your filters or search query"
              }
              action={
                isAdmin && !searchQuery && filterCategory === "all" ? (
                  <Button
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                    className={PRIMARY_BUTTON}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Resource
                  </Button>
                ) : null
              }
            />
          </SectionCard.Body>
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => {
            const TypeIcon = TYPE_ICON[resource.type] || FileText;
            const CategoryIcon =
              CATEGORY_ICON[resource.category] || FileText;
            const typeTone = TYPE_TONE[resource.type] || "info";
            return (
              <SectionCard key={resource.id} interactive={true}>
                <SectionCard.Body>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-input bg-primary-tint text-primary">
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <StatusBadge tone={typeTone} label={resource.type} />
                  </div>
                  <h3 className="mb-1 truncate font-heading text-[14px] font-bold text-text-heading">
                    {resource.title}
                  </h3>
                  {resource.description && (
                    <p className="mb-2 line-clamp-2 font-body text-[13px] text-text-body">
                      {resource.description}
                    </p>
                  )}
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full border-0 bg-surface-page px-[10px] py-[2px] font-body text-[11px] font-semibold capitalize text-text-muted">
                      <CategoryIcon className="h-3 w-3" />
                      {resource.category}
                    </span>
                  </div>
                  {resource.tags?.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {resource.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-full border-0 bg-primary-tint px-[10px] py-[2px] font-body text-[11px] font-semibold text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                      {resource.tags.length > 3 && (
                        <span className="inline-flex items-center rounded-full border-0 bg-surface-page px-[10px] py-[2px] font-body text-[11px] font-semibold text-text-muted">
                          +{resource.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 font-body text-[13px] font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Resource
                  </a>
                  <div className="mt-2 border-t border-surface-border pt-2 font-body text-[12px] text-text-muted">
                    Added {new Date(resource.createdAt).toLocaleDateString()}
                  </div>
                </SectionCard.Body>
              </SectionCard>
            );
          })}
        </div>
      )}

      {!loading && filteredResources.length > 0 && (
        <div className="text-center">
          <p className="font-body text-[12px] text-text-muted">
            Showing {filteredResources.length} of {resources.length} resources
          </p>
        </div>
      )}
    </div>
  );
}
