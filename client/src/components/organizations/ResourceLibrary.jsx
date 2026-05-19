/**
 * RESOURCE LIBRARY - Upload and organize templates, guides, and resources
 */
import React, { useState, useCallback } from "react";
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
  Upload,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { unwrapData } from "../../utils/apiEnvelope";
import { useOrgListQuery } from "../../hooks/useOrgListQuery";
import { getCohortResourcesPage } from "../../utils/api/organizationApi";
import PaginationControls from "../shared/PaginationControls";
import { toastError } from "../../utils/toastError";
import { toast } from "sonner";
import { uploadFile } from "../../utils/api/uploadApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  SectionCard,
  SectionHeader,
  StatusBadge,
  EmptyStateBlock,
  CollapsibleFormCard,
} from "./_primitives";

const OUTLINE_BUTTON =
  "h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:bg-primary-tint hover:text-primary";

/** Map a MIME type to the closest Resource.type enum value the form supports. */
function inferResourceTypeFromMime(mimeType) {
  const mt = String(mimeType || "").toLowerCase();
  if (mt.startsWith("video/")) return "video";
  // Everything else uploaded as a file is treated as a "document" - the safest
  // bucket that still maps to an option in TYPE_OPTIONS.
  return "document";
}

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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  // Non-null editingResourceId puts the form into edit mode (PUT instead of POST)
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [isDeletingResource, setIsDeletingResource] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const emptyForm = {
    title: "",
    description: "",
    category: "general",
    type: "link",
    url: "",
    tags: "",
  };
  const [formData, setFormData] = useState(emptyForm);

  const {
    items: resources,
    total,
    limit,
    loading,
    q: searchQuery,
    setSearch,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    goToPage,
    nextPage,
    prevPage,
    refresh,
  } = useOrgListQuery({
    fetchFn: useCallback(
      (params) =>
        getCohortResourcesPage(cohortId, {
          ...params,
          category: filterCategory !== "all" ? filterCategory : undefined,
          type: filterType !== "all" ? filterType : undefined,
        }),
      [cohortId, filterCategory, filterType],
    ),
    initialLimit: 25,
  });

  const handleSubmitResource = async (e) => {
    e.preventDefault();
    const isEdit = Boolean(editingResourceId);
    try {
      const payload = {
        organizationId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        url: formData.url,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        founderId: userId,
        createdBy: userId,
      };
      const url = isEdit
        ? `${API_BASE}/cohorts/${cohortId}/resources/${editingResourceId}`
        : `${API_BASE}/cohorts/${cohortId}/resources`;
      const response = await fetch(url, {
        ...defaultOptions,
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const err = new Error(
          body?.message ||
            (isEdit ? "Failed to update resource" : "Failed to create resource"),
        );
        err.status = response.status;
        throw err;
      }
      setFormData(emptyForm);
      setEditingResourceId(null);
      setShowCreateForm(false);
      refresh();
      toast.success(isEdit ? "Resource updated" : "Resource added");
    } catch (error) {
      console.error(
        isEdit ? "Error updating resource:" : "Error creating resource:",
        error,
      );
      toastError(
        error,
        isEdit ? "Failed to update resource" : "Failed to create resource",
      );
    }
  };

  const handleUploadFile = async (file) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await uploadFile(file, "resources");
      const inferredType = inferResourceTypeFromMime(result?.mimeType);
      setFormData((prev) => ({
        ...prev,
        url: result?.url || prev.url,
        type: inferredType,
        title: prev.title || file.name.replace(/\.[^.]+$/, ""),
      }));
      toast.success("File uploaded - URL filled in");
    } catch (error) {
      console.error("Error uploading file:", error);
      toastError(error, "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const startEditResource = (resource) => {
    setEditingResourceId(resource.id || resource._id);
    setFormData({
      title: resource.title || "",
      description: resource.description || "",
      category: resource.category || "general",
      type: resource.type || "link",
      url: resource.url || "",
      tags: Array.isArray(resource.tags) ? resource.tags.join(", ") : "",
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingResourceId(null);
    setFormData(emptyForm);
    setShowCreateForm(false);
  };

  const confirmDeleteResource = async () => {
    if (!resourceToDelete) return;
    setIsDeletingResource(true);
    try {
      const id = resourceToDelete.id || resourceToDelete._id;
      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/resources/${id}`,
        { ...defaultOptions, method: "DELETE" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const err = new Error(body?.message || "Failed to delete resource");
        err.status = response.status;
        throw err;
      }
      setResourceToDelete(null);
      refresh();
      toast.success("Resource deleted");
    } catch (error) {
      console.error("Error deleting resource:", error);
      toastError(error, "Failed to delete resource");
    } finally {
      setIsDeletingResource(false);
    }
  };

  const categories = Object.keys(CATEGORY_ICON);
  const types = Object.keys(TYPE_ICON);

  return (
    <div className="space-y-4 font-body">
      <SectionHeader
        icon={BookOpen}
        title="Resource Library"
        description="Templates, guides, and tools for your cohort"
      />

      {isAdmin && (
        <CollapsibleFormCard
          title={editingResourceId ? "Edit Resource" : "Add Resource"}
          description={
            editingResourceId
              ? "Update resource details"
              : "Share a link, document, or template with your cohort"
          }
          triggerLabel={editingResourceId ? "Edit Resource" : "Add Resource"}
          isOpen={showCreateForm}
          onToggle={(open) => {
            if (!open && editingResourceId) cancelEdit();
            else setShowCreateForm(open);
          }}
        >
          <form onSubmit={handleSubmitResource} className="space-y-3">
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
              <div className="flex items-stretch gap-2">
                <Input
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://..."
                  required={true}
                  type="url"
                  className="flex-1 font-body text-[13px]"
                />
                <label
                  className={`${OUTLINE_BUTTON} flex cursor-pointer items-center px-3`}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? "Uploading..." : "Upload file"}
                  <input
                    type="file"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) handleUploadFile(file);
                    }}
                  />
                </label>
              </div>
              <p className="mt-1 font-body text-[12px] text-text-muted">
                Optional: upload a file to auto-fill the URL.
              </p>
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
            <div className="flex gap-2">
              <Button type="submit" size="sm" className={PRIMARY_BUTTON}>
                <Plus className="mr-2 h-4 w-4" />
                {editingResourceId ? "Save Changes" : "Add Resource"}
              </Button>
              {editingResourceId && (
                <Button
                  type="button"
                  size="sm"
                  onClick={cancelEdit}
                  className={OUTLINE_BUTTON}
                >
                  Cancel
                </Button>
              )}
            </div>
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
                onChange={(e) => setSearch(e.target.value)}
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
      ) : resources.length === 0 ? (
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
          {resources.map((resource) => {
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
                    <div className="flex items-center gap-1">
                      <StatusBadge tone={typeTone} label={resource.type} />
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild={true}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-36"
                          >
                            <DropdownMenuItem
                              onClick={() => startEditResource(resource)}
                              className="font-body text-[13px]"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setResourceToDelete(resource)}
                              className="font-body text-[13px] text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
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

      {!loading && total > limit && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onNext={nextPage}
          onPrev={prevPage}
          onGoToPage={goToPage}
          totalItems={total}
          pageSize={limit}
        />
      )}

      <AlertDialog
        open={!!resourceToDelete}
        onOpenChange={(open) => !open && setResourceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-base font-bold text-text-heading">
              Delete Resource
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-[13px] text-text-body">
              {"Delete "}
              <strong>{resourceToDelete?.title}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="h-9 rounded-input font-body text-[13px] font-medium"
              disabled={isDeletingResource}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteResource}
              disabled={isDeletingResource}
              className="h-9 rounded-input bg-destructive font-body text-[13px] font-semibold text-white hover:bg-destructive/90"
            >
              {isDeletingResource ? "Deleting..." : "Delete Resource"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
