import React from "react";
import { CheckCircle, Server, Sparkles } from "lucide-react";
export default function BackendLiveBanner({ onDismiss }) {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Server className="size-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-green-800 dark:text-green-200">
              Backend Successfully Deployed! 🎉
            </h3>
          </div>
          <p className="text-green-700 dark:text-green-300 mb-3">
            {"Your Organizations & Accelerators backend is now "}
            <strong>100% operational</strong>. All features are live and ready
            to use!
          </p>
          <div className="bg-green-100 dark:bg-green-900/40 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-green-700 dark:text-green-300" />
              <span className="font-medium text-green-800 dark:text-green-200 text-sm">
                What you can do now:
              </span>
            </div>
            <ul className="space-y-1 text-sm text-green-700 dark:text-green-300 ml-6">
              <li className="list-disc">Create organizations and cohorts</li>
              <li className="list-disc">Invite founders to your programs</li>
              <li className="list-disc">Track startup progress in real-time</li>
              <li className="list-disc">Monitor Weekly Outcome Streaks</li>
              <li className="list-disc">View detailed startup snapshots</li>
            </ul>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 underline"
            >
              Got it, dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
