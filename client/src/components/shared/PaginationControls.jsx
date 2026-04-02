/**
 * Reusable Pagination Controls Component
 * Works with usePagination hook to provide consistent pagination UI
 */

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
export default function PaginationControls({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  onGoToPage,
  totalItems,
  pageSize,
  className = "",
}) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Show at most 7 page buttons

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current, and nearby pages
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }

      // Show current page and neighbors
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };
  const startItem = (currentPage - 1) * (pageSize || 0) + 1;
  const endItem = Math.min(currentPage * (pageSize || 0), totalItems || 0);
  return (
    <div
      className={`flex items-center justify-between border-t border-gray-800 pt-3 ${className}`}
    >
      {totalItems !== undefined && pageSize !== undefined && (
        <div className="text-xs text-gray-400">
          {"Showing "}
          {startItem}-{endItem}
          {" of "}
          {totalItems}
          {" items"}
        </div>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className={`p-1.5 rounded transition-colors ${hasPrev ? "hover:bg-gray-800 text-gray-300" : "text-gray-600 cursor-not-allowed"}`}
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-0.5">
          {getPageNumbers().map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-gray-500 text-xs"
                >
                  ...
                </span>
              );
            }
            const pageNum = page;
            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                onClick={() => onGoToPage(pageNum)}
                className={`min-w-[28px] h-7 px-2 rounded text-xs font-medium transition-colors ${isActive ? "bg-primary text-white" : "hover:bg-gray-800 text-gray-400"}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`p-1.5 rounded transition-colors ${hasNext ? "hover:bg-gray-800 text-gray-300" : "text-gray-600 cursor-not-allowed"}`}
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
