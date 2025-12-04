"use client";

import { DisputeStats } from "@/services/organizer-api.service";
import { AlertTriangle, CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react";

interface DisputeStatsProps {
  stats: DisputeStats;
  isLoading?: boolean;
}

export function DisputeStatsComponent({ stats, isLoading }: DisputeStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Disputes",
      value: stats.total,
      icon: AlertTriangle,
      iconColor: "text-gray-500",
      bgColor: "bg-gray-50",
    },
    {
      label: "Needs Response",
      value: stats.needs_response,
      icon: Clock,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      urgent: stats.needs_response > 0,
    },
    {
      label: "Under Review",
      value: stats.under_review,
      icon: Clock,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Won",
      value: stats.won,
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Lost",
      value: stats.lost,
      icon: XCircle,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`border border-gray-200 rounded-lg p-4 ${stat.bgColor} ${
              stat.urgent ? "ring-2 ring-amber-500" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              {stat.urgent && (
                <span className="text-xs text-amber-600 font-medium">
                  Action Required
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Win Rate and Total Amount */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Win Rate</span>
            <TrendingUp
              className={`h-4 w-4 ${
                stats.winRate >= 70 ? "text-green-600" : stats.winRate >= 50 ? "text-amber-600" : "text-red-600"
              }`}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {stats.winRate.toFixed(1)}%
            </span>
            {stats.won + stats.lost > 0 && (
              <span className="text-xs text-gray-500">
                ({stats.won} won / {stats.won + stats.lost} resolved)
              </span>
            )}
          </div>
          {/* Progress Bar */}
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                stats.winRate >= 70
                  ? "bg-green-500"
                  : stats.winRate >= 50
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${stats.winRate}%` }}
            />
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Disputed Amount</span>
            <span className="text-xs text-gray-500">USD</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              ${(stats.totalAmount / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Across {stats.total} dispute{stats.total !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Alert if there are urgent disputes */}
      {stats.needs_response > 0 && (
        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {stats.needs_response} dispute{stats.needs_response !== 1 ? "s" : ""} need
                {stats.needs_response === 1 ? "s" : ""} your response
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Respond promptly to avoid losing the dispute. Check response deadlines below.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
