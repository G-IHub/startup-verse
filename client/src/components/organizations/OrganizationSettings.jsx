/**
 * ORGANIZATION SETTINGS PAGE
 * Complete organization profile and admin management
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
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
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
import { getAccessToken } from "../../app/session";
import { unwrapData } from "../../utils/apiEnvelope";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

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

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("");

  // Add admin state
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Messages
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = React.useRef(true);
  const abortControllerRef = React.useRef(null);
  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    return () => {
      isMountedRef.current = false;
      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [organizationId]);
  const loadData = async () => {
    if (!isMountedRef.current) return;
    try {
      setLoading(true);

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      const token = getAccessToken();
      const auth = token ? { Authorization: `Bearer ${token}` } : {};

      // Load organization data
      const orgResponse = await fetch(`${API_BASE}/organizations/${organizationId}`, {
        headers: { ...auth },
        signal: abortControllerRef.current.signal,
      });
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

      // Load admins
      const adminsResponse = await fetch(
        `${API_BASE}/organizations/${organizationId}/admins`,
        {
          headers: { ...auth },
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
      if (error.name === "AbortError") {
        console.log("Request aborted");
        return;
      }
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
      const token = getAccessToken();
      const response = await fetch(
        `${API_BASE}/organizations/${organizationId}/update`,
        {
          method: "PUT",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            website,
            logo,
            userId,
          }),
        },
      );
      if (!isMountedRef.current) return;
      if (!response.ok) {
        throw new Error("Failed to update organization");
      }
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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image must be less than 5MB");
      return;
    }
    try {
      setUploadingLogo(true);
      setErrorMessage("");
      const token = getAccessToken();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      const response = await fetch(
        `${API_BASE}/organizations/${organizationId}/logo`,
        {
          method: "PUT",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ logo: dataUrl }),
        },
      );
      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }
      const inner = unwrapData(await response.json());
      const nextLogo = inner?.logo || inner?.url;
      if (nextLogo) {
        setLogo(nextLogo);
        setSuccessMessage("Logo uploaded successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Failed to upload logo:", error);
      setErrorMessage("Failed to upload logo. Please try again.");
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
      const token = getAccessToken();
      const response = await fetch(
        `${API_BASE}/organizations/${organizationId}/admins/add`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: newAdminEmail.trim(),
            addedBy: userId,
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
      loadData(); // Reload admins
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
    if (!confirm("Are you sure you want to remove this admin?")) {
      return;
    }
    try {
      setErrorMessage("");
      setSuccessMessage("");
      const token = getAccessToken();
      const response = await fetch(
        `${API_BASE}/organizations/${organizationId}/admins/${adminUserId}/remove`,
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            removedBy: userId,
          }),
        },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || "Failed to remove admin");
      }
      setSuccessMessage("Admin removed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      loadData(); // Reload admins
    } catch (error) {
      console.error("Failed to remove admin:", error);
      setErrorMessage(
        error.message || "Failed to remove admin. Please try again.",
      );
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[10px] text-muted-foreground">
          Loading settings...
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {successMessage && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-3 flex items-center gap-2 text-[10px] text-green-700 dark:text-green-400">
            <Check className="w-4 h-4" />
            {successMessage}
          </CardContent>
        </Card>
      )}
      {errorMessage && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-3 flex items-center gap-2 text-[10px] text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-[11px] flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Organization Profile
          </CardTitle>
          <CardDescription className="text-[9px]">
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[9px]">Organization Logo</Label>
            <div className="flex items-center gap-3">
              {logo && (
                <img
                  src={logo}
                  alt="Organization logo"
                  className="w-16 h-16 rounded-lg object-cover border"
                />
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="text-[9px] h-8"
                />
                <p className="text-[8px] text-muted-foreground mt-1">
                  PNG, JPG or WEBP. Max 5MB.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[9px]">
              Organization Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Y Combinator"
              className="text-[10px] h-8"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[9px]">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your organization..."
              className="text-[10px] min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="website"
              className="text-[9px] flex items-center gap-1"
            >
              <Globe className="w-3 h-3" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourorganization.com"
              className="text-[10px] h-8"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="h-8 text-[9px]"
          >
            <Save className="w-3 h-3 mr-1" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-[11px] flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Admin Team
          </CardTitle>
          <CardDescription className="text-[9px]">
            Manage who can administer this organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {admins.map((admin) => (
              <div
                key={admin.userId}
                className="flex items-center justify-between p-2.5 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-[10px] font-medium flex items-center gap-2">
                    {admin.name}
                    {admin.isCreator && (
                      <Badge
                        variant="outline"
                        className="text-[7px] px-1.5 py-0"
                      >
                        Creator
                      </Badge>
                    )}
                  </div>
                  <div className="text-[8px] text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {admin.email}
                  </div>
                  <div className="text-[8px] text-muted-foreground">
                    {"Added "}
                    {new Date(admin.addedAt).toLocaleDateString()}
                  </div>
                </div>
                {isCreator && !admin.isCreator && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAdmin(admin.userId)}
                    className="h-7 text-[9px] text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {isCreator && (
            <div className="space-y-2">
              {!showAddAdmin ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddAdmin(true)}
                  className="h-7 text-[9px] w-full"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Add Admin
                </Button>
              ) : (
                <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-[9px] font-semibold">
                      Add New Admin
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddAdmin(false);
                        setNewAdminEmail("");
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <Input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="text-[10px] h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddAdmin();
                    }}
                  />
                  <p className="text-[8px] text-muted-foreground">
                    The user must have a StartupVerse account with this email
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddAdmin}
                      disabled={addingAdmin || !newAdminEmail.trim()}
                      className="h-7 text-[9px] flex-1"
                    >
                      {addingAdmin ? "Adding..." : "Add Admin"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddAdmin(false);
                        setNewAdminEmail("");
                      }}
                      className="h-7 text-[9px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          {!isCreator && (
            <p className="text-[8px] text-muted-foreground italic">
              Only the organization creator can manage admins
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-[11px]">Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-muted-foreground">Organization ID</span>
            <span className="font-mono">{organizationId}</span>
          </div>
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-muted-foreground">Type</span>
            <Badge variant="outline" className="text-[8px]">
              {organization?.type || "N/A"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-muted-foreground">Total Admins</span>
            <span className="font-semibold">{admins.length}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
