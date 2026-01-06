import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: string;
    color?: "blue" | "green" | "purple" | "orange";
}

export function StatCard({ title, value, icon, trend, color = "blue" }: StatCardProps) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        green: "bg-green-50 text-green-600 border-green-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
    };

    return (
        <div className={`p-6 rounded-2xl border ${colorClasses[color].replace("text-", "border-")} bg-white shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
                </div>
                {icon && <div className={`p-3 rounded-xl ${colorClasses[color]}`}>{icon}</div>}
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 font-medium flex items-center">
                        {trend}
                    </span>
                    <span className="text-gray-400 ml-2">vs last month</span>
                </div>
            )}
        </div>
    );
}
