import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Database,
  FileJson,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { clearAllData, loadSampleData } from "../utils/sampleData";
export default function DataBackup() {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const getAllStorageData = () => {
    const keys = [
      "founder_journey_progress",
      "ideation_canvas",
      "ideation_competitors",
      "ideation_interviews",
      "company_entity",
      "company_founders",
      "company_documents",
      "company_ip",
      "product_milestones",
      "product_sprints",
      "product_tech_stack",
      "product_launch_checklist",
      "gtm_contacts",
      "gtm_deals",
      "gtm_campaigns",
      "gtm_feedback",
      "ops_financials",
      "ops_budget",
      "ops_invoices",
      "ops_okrs",
    ];
    const data = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      appName: "StartupVerse",
    };
    keys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch (e) {
          data[key] = value;
        }
      }
    });
    return data;
  };
  const exportData = () => {
    const data = getAllStorageData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {
      type: "application/json",
    });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `startupverse-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully!");
  };
  const importData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        const data = JSON.parse(content);

        // Validate it's a StartupVerse backup
        if (data.appName !== "StartupVerse") {
          toast.error("Invalid backup file");
          return;
        }

        // Import all data
        Object.entries(data).forEach(([key, value]) => {
          if (key !== "exportDate" && key !== "version" && key !== "appName") {
            localStorage.setItem(key, JSON.stringify(value));
          }
        });
        toast.success("Data imported successfully! Refreshing...");
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast.error("Failed to import data. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };
  const handleClearAll = () => {
    clearAllData();
    toast.success("All data cleared! Refreshing...");
    setTimeout(() => window.location.reload(), 1000);
  };
  const handleLoadSample = () => {
    loadSampleData();
    toast.success("Sample data loaded! Refreshing...");
    setTimeout(() => window.location.reload(), 1000);
  };
  const getDataSize = () => {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    return (totalSize / 1024).toFixed(2); // KB
  };
  const getItemCount = () => {
    const data = getAllStorageData();
    let count = 0;

    // Count items across all stages
    if (data.ideation_competitors) count += data.ideation_competitors.length;
    if (data.ideation_interviews) count += data.ideation_interviews.length;
    if (data.company_founders) count += data.company_founders.length;
    if (data.company_documents) count += data.company_documents.length;
    if (data.company_ip) count += data.company_ip.length;
    if (data.product_milestones) count += data.product_milestones.length;
    if (data.product_sprints) count += data.product_sprints.length;
    if (data.gtm_contacts) count += data.gtm_contacts.length;
    if (data.gtm_deals) count += data.gtm_deals.length;
    if (data.gtm_campaigns) count += data.gtm_campaigns.length;
    if (data.ops_financials) count += data.ops_financials.length;
    if (data.ops_budget) count += data.ops_budget.length;
    if (data.ops_invoices) count += data.ops_invoices.length;
    if (data.ops_okrs) count += data.ops_okrs.length;
    return count;
  };
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="mb-2">Data Backup & Management</h2>
        <p className="text-muted-foreground">
          Export, import, and manage your startup data
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-body-medium text-muted-foreground flex items-center gap-2">
              <Database className="w-4 h-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-display-small">{getItemCount()}</p>
            <p className="text-caption-large text-muted-foreground mt-1">
              Across all stages
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-body-medium text-muted-foreground flex items-center gap-2">
              <FileJson className="w-4 h-4" />
              Data Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-display-small">
              {getDataSize()}
              {" KB"}
            </p>
            <p className="text-caption-large text-muted-foreground mt-1">
              In browser storage
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-body-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Last Backup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-title-medium">Never</p>
            <p className="text-caption-large text-muted-foreground mt-1">
              Export to create backup
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Export Your Data
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Download all your startup data as a JSON file
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="mb-2">
                  <strong>What's included:</strong>
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    • All 6 stages (Ideation, Formation, Team, Product, GTM,
                    Operations)
                  </li>
                  <li>• Progress tracking and completion status</li>
                  <li>• All forms, data entries, and documents metadata</li>
                  <li>• Can be imported back anytime</li>
                </ul>
              </div>
            </div>
          </div>
          <Button onClick={exportData} className="w-full" size="lg">
            <Download className="w-4 h-4 mr-2" />
            Export All Data
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import Data
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Restore from a previous backup file
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="mb-2">
                  <strong>Warning:</strong>
                </p>
                <p className="text-muted-foreground">
                  {"Importing will "}
                  <strong>overwrite all existing data</strong>. Make sure to
                  export current data first if you want to keep it.
                </p>
              </div>
            </div>
          </div>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
              id="import-file"
            />
            <label htmlFor="import-file">
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                asChild={true}
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Backup File
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Sample Data
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Load example startup "TechFlow AI" to explore features
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm mb-2">
              <strong>TechFlow AI - Workflow Automation SaaS</strong>
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary">21 customer interviews</Badge>
              <Badge variant="secondary">3 founders</Badge>
              <Badge variant="secondary">12 weeks active</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              This sample includes completed ideation, company formation, and
              product development progress with early traction.
            </p>
          </div>
          <Button
            onClick={handleLoadSample}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Database className="w-4 h-4 mr-2" />
            Load Sample Data
          </Button>
        </CardContent>
      </Card>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Permanently delete all your data
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showConfirmClear ? (
            <>
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="mb-2">
                      <strong>This action cannot be undone!</strong>
                    </p>
                    <p className="text-muted-foreground">
                      All your startup data will be permanently deleted from
                      this browser. Make sure to export first if you want to
                      keep it.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowConfirmClear(true)}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-center">Are you absolutely sure?</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleClearAll}
                  variant="destructive"
                  className="flex-1"
                >
                  Yes, Delete Everything
                </Button>
                <Button
                  onClick={() => setShowConfirmClear(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="mb-1">
                <strong>About Data Storage:</strong>
              </p>
              <ul className="space-y-1">
                <li>• Data is stored in your browser's localStorage</li>
                <li>• Works offline and syncs instantly</li>
                <li>• Limited to this browser and device only</li>
                <li>• Clearing browser data will delete everything</li>
                <li>
                  {"• "}
                  <strong>Always keep a backup</strong>
                  {" by exporting regularly"}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
