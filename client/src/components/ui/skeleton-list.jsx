/**
 * Reusable skeleton loading components for lists
 * Provides visual feedback during pagination loading
 */

import { Skeleton } from "./skeleton";
import { Card } from "./card";
export function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
export function ListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({
        length: count,
      }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}
export function CardSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex space-x-2 pt-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </Card>
  );
}
export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({
        length: count,
      }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
export function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-20" />
      </td>
    </tr>
  );
}
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left">
              <Skeleton className="h-4 w-24" />
            </th>
            <th className="px-4 py-3 text-left">
              <Skeleton className="h-4 w-24" />
            </th>
            <th className="px-4 py-3 text-left">
              <Skeleton className="h-4 w-24" />
            </th>
            <th className="px-4 py-3 text-left">
              <Skeleton className="h-4 w-20" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({
            length: rows,
          }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function TaskSkeleton() {
  return (
    <Card className="p-3">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-1/2 ml-6" />
        <div className="flex space-x-2 ml-6">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-5 w-16 rounded" />
        </div>
      </div>
    </Card>
  );
}
export function TaskListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({
        length: count,
      }).map((_, i) => (
        <TaskSkeleton key={i} />
      ))}
    </div>
  );
}
export function ProfileCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start space-x-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <div className="flex space-x-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}
export function ProfileGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({
        length: count,
      }).map((_, i) => (
        <ProfileCardSkeleton key={i} />
      ))}
    </div>
  );
}
export function InfiniteScrollLoader() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-2 text-muted-foreground">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
        <span className="text-sm">Loading more...</span>
      </div>
    </div>
  );
}
export function EndOfListMessage() {
  return (
    <div className="flex items-center justify-center py-8">
      <p className="text-sm text-muted-foreground">
        You've reached the end of the list
      </p>
    </div>
  );
}
export function EmptyStateMessage({
  title = "No items found",
  description = "There are no items to display",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium text-muted-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground/80">{description}</p>
      </div>
    </div>
  );
}
