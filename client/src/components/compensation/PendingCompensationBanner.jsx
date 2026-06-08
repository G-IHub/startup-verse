import React from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Clock, AlertCircle } from "lucide-react";
export default function PendingCompensationBanner({ founderName }) {
  return (
    <Alert className="border-amber-500/50 bg-amber-50">
      <Clock className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-900 text-lg">
        Compensation Pending
      </AlertTitle>
      <AlertDescription className="text-amber-800 mt-2 space-y-2">
        <p>
          {founderName ? `${founderName} is` : "Your founder is"}
          {
            " setting up your compensation package. You'll get full access to all features once this is complete."
          }
        </p>
        <div className="flex items-start gap-2 mt-3 p-3 bg-amber-100/50 rounded-md border border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium mb-1">Limited Access Mode</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700">
              <li>Performance dashboard is locked</li>
              <li>Core Engine & Milestones are view-only</li>
              <li>Virtual Office is read-only</li>
            </ul>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
