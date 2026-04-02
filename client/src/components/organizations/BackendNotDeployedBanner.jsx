import React from "react";
import { AlertTriangle, Server, Terminal, ExternalLink } from "lucide-react";
export default function BackendNotDeployedBanner({ onDismiss }) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="size-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Server className="size-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
              Backend Not Deployed
            </h3>
          </div>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            The Organizations feature requires Supabase Edge Functions to be
            deployed. Without the backend, you won't be able to create
            organizations, manage cohorts, or invite founders.
          </p>
          <div className="bg-yellow-100 dark:bg-yellow-900/40 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="size-4 text-yellow-700 dark:text-yellow-300" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">
                Deploy Instructions:
              </span>
            </div>
            <ol className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300 ml-6">
              <li className="list-decimal">
                Install Supabase CLI:
                <code className="ml-2 px-2 py-1 bg-yellow-200 dark:bg-yellow-800 rounded text-xs">
                  npm install -g supabase
                </code>
              </li>
              <li className="list-decimal">
                Login to Supabase:
                <code className="ml-2 px-2 py-1 bg-yellow-200 dark:bg-yellow-800 rounded text-xs">
                  supabase login
                </code>
              </li>
              <li className="list-decimal">
                Link your project:
                <code className="ml-2 px-2 py-1 bg-yellow-200 dark:bg-yellow-800 rounded text-xs">
                  supabase link --project-ref YOUR_PROJECT_REF
                </code>
              </li>
              <li className="list-decimal">
                Deploy the backend:
                <code className="ml-2 px-2 py-1 bg-yellow-200 dark:bg-yellow-800 rounded text-xs">
                  supabase functions deploy server
                </code>
              </li>
              <li className="list-decimal">
                Reload this page after deployment completes
              </li>
            </ol>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://supabase.com/docs/guides/functions/deploy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100"
            >
              <ExternalLink className="size-4" />
              Deployment Documentation
            </a>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
