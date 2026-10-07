"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function WhatsAppBusinessProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner / Switcher Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-44 rounded-md" />
            <Skeleton className="h-3 w-64 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Main Grid: Form on Left, Preview Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Cards */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Profile Picture & Identity Card */}
          <Card className="border-slate-200/80 shadow-xs rounded-2xl bg-white">
            <CardHeader className="pb-4 border-b border-slate-100">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-3.5 w-72 rounded-md mt-1" />
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Photo Upload Area */}
              <div className="flex items-center gap-5">
                <Skeleton className="h-20 w-20 rounded-full shrink-0" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-28 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                  <Skeleton className="h-3 w-60 rounded-md" />
                </div>
              </div>

              {/* Read-Only Identity Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Details Card */}
          <Card className="border-slate-200/80 shadow-xs rounded-2xl bg-white">
            <CardHeader className="pb-4 border-b border-slate-100">
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-3.5 w-64 rounded-md mt-1" />
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Category */}
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>

              {/* About Status */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-3 w-12 rounded-md" />
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3 w-12 rounded-md" />
                </div>
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>

              {/* Address & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>

              {/* Websites */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons Skeleton */}
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-9 w-36 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        {/* Right Column: Live WhatsApp Mobile Preview Card */}
        <div className="lg:col-span-5 xl:col-span-4">
          <Card className="border-slate-200/80 shadow-xs rounded-2xl bg-white overflow-hidden sticky top-6">
            <div className="bg-[#128C7E] px-4 py-3 flex items-center justify-between text-white">
              <Skeleton className="h-4 w-24 bg-white/30 rounded-md" />
              <Skeleton className="h-4 w-12 bg-white/30 rounded-md" />
            </div>
            <CardContent className="p-6 space-y-6">
              {/* Header preview */}
              <div className="flex flex-col items-center text-center space-y-3">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-5 w-40 rounded-md" />
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-3 w-52 rounded-md" />
              </div>

              {/* Action pill buttons preview */}
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>

              {/* Preview Rows */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 rounded-md shrink-0 mt-0.5" />
                  <div className="space-y-1 w-full">
                    <Skeleton className="h-3 w-16 rounded-md" />
                    <Skeleton className="h-4 w-44 rounded-md" />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 rounded-md shrink-0 mt-0.5" />
                  <div className="space-y-1 w-full">
                    <Skeleton className="h-3 w-16 rounded-md" />
                    <Skeleton className="h-4 w-36 rounded-md" />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 rounded-md shrink-0 mt-0.5" />
                  <div className="space-y-1 w-full">
                    <Skeleton className="h-3 w-16 rounded-md" />
                    <Skeleton className="h-4 w-48 rounded-md" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
