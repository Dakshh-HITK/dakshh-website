'use client';

import React, { useEffect, useState } from 'react';
import HandDrawnCard from './HandDrawnCard';

interface Stat {
  label: string;
  value: string;
  color: string;
}

export default function StatsSection() {
  const [users, setUsers] = useState<number>(200);
  const stats: Stat[] = [
    { label: 'Total Prize Pool', value: '₹4,00,000+', color: 'text-yellow' },
    { label: 'Participants', value: `${users}+`, color: 'text-cyan' },
    { label: 'Events', value: '20+', color: 'text-green' },
    { label: 'Categories & tracks', value: '6+', color: 'text-red' },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/user/stats/users");
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          return;
        }

        setUsers((Math.floor(data.users.length / 100) + 1) * 100);
      } catch (error) {
        console.error(error);
      } finally {
      }
    };

    fetchUsers();
  }, []);

  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <h2 className="text-center hand-drawn-title text-white mb-8 sm:mb-10 md:mb-12 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">Festival Stats</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 max-w-7xl mx-auto">
        {stats.map((stat, index) => (
          <HandDrawnCard key={index} className="text-center min-w-0">
            <div className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 ${stat.color} wrap-break-word overflow-wrap-anywhere`}>
              {stat.value}
            </div>
            <div className="text-white/80 text-xs sm:text-sm uppercase tracking-wider wrap-break-word">
              {stat.label}
            </div>
          </HandDrawnCard>
        ))}
      </div>
    </section>
  );
}
