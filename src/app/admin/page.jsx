'use client';

import React, { useState } from 'react';

export default function AdminDashboard() {
  // Master Registries
  const [dojos] = useState([
    { id: 'DJ-01', name: 'HQ Central Dojo', location: 'Kochi, India', instructor: 'Sensei Martin', count: 84, status: 'Active' },
    { id: 'DJ-02', name: 'Coastal Branch', location: 'Vytilla', instructor: 'Sempai Rahul', count: 42, status: 'Active' },
    { id: 'DJ-03', name: 'Northside Center', location: 'Aluva', instructor: 'Sempai Priya', count: 28, status: 'Maintenance' },
  ]);

  const [students] = useState([
    { id: 'MKA-0941', name: 'Arjun Das', belt: 'Black Belt (1st Dan)', dojo: 'HQ Central', status: 'Active' },
    { id: 'MKA-1022', name: 'Miriam Joseph', belt: 'Brown Belt', dojo: 'Coastal Branch', status: 'Active' },
    { id: 'MKA-1105', name: 'Adithyan K.R.', belt: 'Yellow Belt', dojo: 'HQ Central', status: 'Inactive' },
    { id: 'MKA-1112', name: 'Siddharth Menon', belt: 'White Belt', dojo: 'Northside', status: 'Active' },
  ]);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-light tracking-tight text-zinc-100">Academy Registries</h1>
        <p className="text-xs text-zinc-500 mt-1">Direct access control for Martins Karate Academy databases.</p>
      </div>

      {/* TWO-COLUMN LISTING INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* DOJO REGISTRY LISTING */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <span className="w-1 h-1 rounded-full bg-zinc-400" />
              <h2 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Dojo Branches</h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-600">{dojos.length} Locations</span>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden shadow-xl">
            <div className="divide-y divide-white/[0.04]">
              {dojos.map((dojo) => (
                <div key={dojo.id} className="p-5 flex items-center justify-between hover:bg-white/[0.01] transition-colors group">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{dojo.name}</h3>
                      <span className="text-[10px] font-mono text-zinc-600">[{dojo.id}]</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
                      <span>{dojo.instructor}</span>
                      <span>•</span>
                      <span>{dojo.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-mono text-zinc-300">{dojo.count}</span>
                      <span className="text-[10px] text-zinc-600 block">Students</span>
                    </div>
                    <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border ${
                      dojo.status === 'Active' 
                        ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}>
                      {dojo.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STUDENT ROSTER LISTING */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <span className="w-1 h-1 rounded-full bg-zinc-400" />
              <h2 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Active Roster Peek</h2>
            </div>
            <a href="/admin/students" className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
              Full Database →
            </a>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] tracking-wider text-zinc-500 uppercase bg-black/10">
                    <th className="py-3 px-4 font-medium">Student</th>
                    <th className="py-3 px-4 font-medium hidden sm:table-cell">Rank</th>
                    <th className="py-3 px-4 font-medium">Branch</th>
                    <th className="py-3 px-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-white/[0.01] transition-colors group text-xs">
                      <td className="py-3.5 px-4 font-medium text-zinc-200">
                        <div className="group-hover:text-white transition-colors">{student.name}</div>
                        <div className="text-[10px] font-mono text-zinc-600 mt-0.5">{student.id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 hidden sm:table-cell">
                        {student.belt}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">
                        {student.dojo}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${
                          student.status === 'Active'
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                            : 'bg-red-950/20 border-red-500/10 text-red-400/70'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}