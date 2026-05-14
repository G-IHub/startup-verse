/**
 * ORGANIZATION SETTINGS PAGE
 * Complete organization profile and admin management
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Building2,
  Mail,
  Globe,
  Save,
  UserPlus,
  Trash2,
  Shield,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { unwrapData } from "../../utils/apiEnvelope";
import { SectionCard, ListRow, StatusBadge } from "./_primitives";
import { uploadFile } from "../../utils/api/uploadApi";
import { toastError } from "../../utils/toastError";

const API_BASE = API_BASE_URL;

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

const PRIMARY_BUTTON =
  "h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover";
const OUTLINE_BUTTON =
  "h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:bg-primary-tint hover:text-primary";

export default function OrganizationSettings({
  organizationId,
  userId,
  isCreator,
  onUpdate,
}) {
  const [organization, setOrganization] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("");

  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isMountedRef = React.useRef(true);
  const abortControllerRef = React.useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [organizationId]);

  const loadData = async () => {
    if (!isMountedRef.current) return;
    try {
      setLoading(true);
      abortControllerRef.current = new AbortController();
      const orgResponse = await fetch(
        `${API_BASE}/organizations/${organizationId}`,
        {
          ...defaultOptions,
          signal: abortControllerRef.current.signal,
        },
      );
      if (!isMountedRef.current) return;
      if (orgResponse.ok) {
        const org = unwrapData(await orgResponse.json());
        if (!isMountedRef.current) return;
        if (org && typeof org === "object") {
          setOrganization(org);
          setName(org.name || "");
          setDescription(org.description || "");
          setWebsite(org.website || "");
          setLogo(org.logo || "");
        }
      }

      const adminsResponse = await fetch(
        `${API_BASE}/organizations/${organizationId}/admins`,
        {
          ...defaultOptions,
          signal: abortControllerRef.current.signal,
        },
      );
      if (!isMountedRef.current) return;
      if (adminsResponse.ok) {
        const raw = unwrapData(await adminsResponse.json());
        if (!isMountedRef.current) return;
        setAdmins(Array.isArray(raw) ? raw : raw.admins || []);
      }
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Failed to load settings:", error);
      if (isMountedRef.current) {
        setErrorMessage("Failed to load organization settings");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!isMountedRef.current) return;
    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");
      const response = await fetch(
        `${API_BASE}/organizations/${organizationId}/update`,
        {
          ...defaultOptions,
          method: "PUT",
          body: JSON.stringify({ name, description, website, userId }),
        },
      );
      if (!isMountedRef.current) return;
      if (!response.ok) throw new Error("Failed to update organization");
      if (isMountedRef.current) {
        setSuccessMessage("Organization updated successfully!");
        setTimeout(() => {
          if (isMountedRef.current) setSuccessMessage("");
        }, 3000);
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to save settings:", error);
      if (isMountedRef.current) {
        setErrorMessage("Failed to save changes. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image must be less than 5MB");
      return;
    }
    try {
      setUploadingLogo(true);
      setErrorMessage("");
      const uploaded = await uploadFile(file, "org-logo");
      const logoUrl = uploaded?.url;
      if (!logoUrl) {
        throw new Error("Upload did not return a URL");
      }
      const response = await fetch(
        `${API_BASE}/organizations/${organizationId}/logo`,
        {
          ...defaultOptions,
          method: "PUT",
          body: JSON.stringify({ logo: logoUrl }),
        },
      );
      const responseJson = await response.json().catch(() => ({}));
      if (!response.ok) {
        const err = new Error(responseJson?.message || "Failed to upload logo");
        err.status = response.status;
        throw err;
      }
      const inner = unwrapData(responseJson);
      const nextLogo = inner?.logo || inner?.url || logoUrl;
      setLogo(nextLogo);
      setSuccessMessage("Logo uploaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to upload logo:", error);
      setErrorMessage("Failed to upload logo. Please try again.");
      toastError(error, "Failed to upload logo. Please try again.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      setErrorMessage("Please enter an email address");
      return;
    }
    try {
      setAddingAdmin(true);
      setErrorMessage("");
      setSuccessMessage("");
      const response = await fetch(
        `${API_BASE}/organizations/${organizationId}/admins/add`,
        {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({
            email: newAdminEmail.trim(),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to add admin");
      }
      setSuccessMessage("Admin added successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setNewAdminEmail("");
      setShowAddAdmin(false);
      loadData();
    } catch (error) {
      console.error("Failed to add admin:", error);
      setErrorMessage(
        error.message || "Failed to add admin. Please try again.",
      );
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (adminUserId) => {
    if (!confirm("Are you sure you want to remove this admin?")) return;
    try {
      setErrorMessage("");
      setSuccessMessage("");
      const response = await fetch(
        `${API_BASE}/organizations/${organizationId}/admins/${adminUserId}/remove`,
        {
          ...defaultOptions,
          method: "DELETE",
          body: JSON.stringify({ removedBy: userId }),
        },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.message || data.error || "Failed to remove admin",
        );
      }
      setSuccessMessage("Admin removed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      loadData();
    } catch (error) {
      console.error("Failed to remove admin:", error);
      setErrorMessage(
        error.message || "Failed to remove admin. Please try again.",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse font-body text-[13px] text-text-muted">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-body">
      {successMessage && (
        <div className="flex items-center gap-2 rounded-input bg-[#d1fae5] px-3 py-2.5 font-body text-[13px] text-[#00c896]">
          <Check className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-input bg-[#fff1f2] px-3 py-2.5 font-body text-[13px] text-[#ff4f6b]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      <SectionCard>
        <SectionCard.Header
          title={
            <span className="inline-flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Organization Profile
            </span>
          }
          description="Basic information about your organization"
        />
        <SectionCard.Body className="space-y-4">
          <div className="space-y-2">
            <Label className="font-body text-[13px] font-medium text-text-heading">
              Organization Logo
            </Label>
            <div className="flex items-center gap-3">
              {logo && (
                <img
                  src={logo}
                  alt="Organization logo"
                  className="h-16 w-16 rounded-input border border-surface-border object-cover"
                />
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="font-body text-[13px]"
                />
                <p className="mt-1 font-body text-[12px] text-text-muted">
                  PNG, JPG or WEBP. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="font-body text-[13px] font-medium text-text-heading"
            >
              Organization Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Y Combinator"
              className="font-body text-[13px]"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="font-body text-[13px] font-medium text-text-heading"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your organization..."
              className="min-h-[80px] font-body text-[13px]"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="website"
              className="flex items-center gap-1 font-body text-[13px] font-medium text-text-heading"
            >
              <Globe className="h-3.5 w-3.5" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourorganization.com"
              className="font-body text-[13px]"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className={PRIMARY_BUTTON}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </SectionCard.Body>
      </SectionCard>

      <SectionCard>
        <SectionCard.Header
          title={
            <span className="inline-flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Team
            </span>
          }
          description="Manage who can administer this organization"
        />
        <SectionCard.Body className="space-y-3">
          <div className="space-y-2">
            {admins.map((admin) => (
              <ListRow
                key={admin.userId}
                title={
                  <span className="inline-flex items-center gap-2">
                    {admin.name}
                    {admin.isCreator && (
                      <StatusBadge tone="info" label="Creator" />
                    )}
                  </span>
                }
                description={
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {admin.email}
                  </span>
                }
                meta={
                  <span className="font-body text-[12px] text-text-muted">
                    Added {new Date(admin.addedAt).toLocaleDateString()}
                  </span>
                }
                trailing={
                  isCreator && !admin.isCreator ? (
                    <Button
                      size="sm"
                      onClick={() => handleRemoveAdmin(admin.userId)}
                      className="h-9 w-9 rounded-input p-0 text-[#ff4f6b] hover:bg-[#fff1f2]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null
                }
              />
            ))}
          </div>

          {isCreator && (
            <div className="space-y-2">
              {!showAddAdmin ? (
                <Button
                  size="sm"
                  onClick={() => setShowAddAdmin(true)}
                  className={`w-full ${OUTLINE_BUTTON}`}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Admin
                </Button>
              ) : (
                <div className="space-y-2 rounded-input bg-surface-page p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="font-heading text-[14px] font-semibold text-text-heading">
                      Add New Admin
                    </Label>
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowAddAdmin(false);
                        setNewAdminEmail("");
                      }}
                      className="h-7 w-7 rounded-input p-0 text-text-muted hover:bg-surface-border/40"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="font-body text-[13px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddAdmin();
                    }}
                  />
                  <p className="font-body text-[12px] text-text-muted">
                    The user must have a StartupVerse account with this email
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddAdmin}
                      disabled={addingAdmin || !newAdminEmail.trim()}
                      className={`flex-1 ${PRIMARY_BUTTON}`}
                    >
                      {addingAdmin ? "Adding..." : "Add Admin"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddAdmin(false);
                        setNewAdminEmail("");
                      }}
                      className={OUTLINE_BUTTON}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isCreator && (
            <p className="font-body text-[12px] italic text-text-muted">
              Only the organization creator can manage admins
            </p>
          )}
        </SectionCard.Body>
      </SectionCard>

      <SectionCard>
        <SectionCard.Header title="Organization Details" />
        <SectionCard.Body className="space-y-2">
          <div className="flex items-center justify-between font-body text-[13px]">
            <span className="text-text-muted">Organization ID</span>
            <span className="font-mono text-text-body">{organizationId}</span>
          </div>
          <div className="flex items-center justify-between font-body text-[13px]">
            <span className="text-text-muted">Type</span>
            <StatusBadge tone="info" label={organization?.type || "N/A"} />
          </div>
          <div className="flex items-center justify-between font-body text-[13px]">
            <span className="text-text-muted">Total Admins</span>
            <span className="font-semibold text-text-heading">
              {admins.length}
            </span>
          </div>
        </SectionCard.Body>
      </SectionCard>
    </div>
  );
}
