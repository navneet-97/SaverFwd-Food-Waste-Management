import React from 'react';

export const Skeleton = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-md ${className}`}
      {...props}
    />
  );
};

export const SkeletonCard = ({ children, className = "" }) => {
  return (
    <div className={`rounded-lg border bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
};

export const SkeletonHeader = ({ width = "w-32" }) => {
  return <Skeleton className={`h-6 ${width} mb-2`} />;
};

export const SkeletonText = ({ width = "w-full", lines = 1 }) => {
  return (
    <div className="space-y-2">
      {[...Array(lines)].map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? width : 'w-full'}`} />
      ))}
    </div>
  );
};

export const SkeletonButton = ({ className = "" }) => {
  return <Skeleton className={`h-9 w-20 ${className}`} />;
};

export const StatCardSkeleton = () => {
  return (
    <SkeletonCard className="bg-gradient-to-br from-gray-200 to-gray-300">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-gray-300" />
          <Skeleton className="h-8 w-16 bg-gray-300" />
        </div>
        <Skeleton className="h-12 w-12 bg-gray-300 rounded-full" />
      </div>
    </SkeletonCard>
  );
};

export const FoodItemSkeleton = () => {
  return (
    <SkeletonCard>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <SkeletonHeader width="w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <SkeletonText lines={2} />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <SkeletonText width="w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <SkeletonText width="w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <SkeletonText width="w-40" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <SkeletonButton className="flex-1" />
          <SkeletonButton className="flex-1" />
        </div>
      </div>
    </SkeletonCard>
  );
};

export const OrderSkeleton = () => {
  return (
    <SkeletonCard>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <SkeletonHeader width="w-24" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <SkeletonText width="w-32" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <SkeletonText width="w-16" />
            <SkeletonText width="w-12" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <SkeletonText width="w-full" />
            <SkeletonText width="w-3/4" />
            <SkeletonText width="w-full" />
          </div>
          <div className="space-y-2">
            <SkeletonText width="w-full" />
            <SkeletonText width="w-2/3" />
            <SkeletonText width="w-full" />
          </div>
        </div>
      </div>
    </SkeletonCard>
  );
};

export const RecipientSkeleton = () => {
  return (
    <SkeletonCard>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <SkeletonHeader width="w-32" />
            <SkeletonText width="w-24" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <SkeletonText width="w-full" />
          <SkeletonText width="w-3/4" />
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-8 mx-auto" />
            <SkeletonText width="w-16 mx-auto" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-8 mx-auto" />
            <SkeletonText width="w-16 mx-auto" />
          </div>
        </div>
      </div>
    </SkeletonCard>
  );
};
