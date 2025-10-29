import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Target, Download } from 'lucide-react';

const BusinessIntelligence: React.FC = () => {
  const reports = [
    { name: 'Monthly Performance Report', type: 'Performance', date: '2024-01-15' },
    { name: 'Agent Analysis', type: 'Agents', date: '2024-01-14' },
    { name: 'Cost Analysis', type: 'Financial', date: '2024-01-13' },
  ];

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Business Intelligence</h1>
            <p className="text-muted-foreground">Advanced reporting and analytics</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <Users className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
          <p className="text-2xl font-bold">1,234</p>
        </div>
        <div className="card p-6">
          <DollarSign className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Revenue</p>
          <p className="text-2xl font-bold">$25,430</p>
        </div>
        <div className="card p-6">
          <Target className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Conversion</p>
          <p className="text-2xl font-bold">32.5%</p>
        </div>
        <div className="card p-6">
          <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Growth</p>
          <p className="text-2xl font-bold">+15.2%</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Reports</h2>
          <button className="btn btn-outline">
            <Download className="w-4 h-4 mr-2" />Export
          </button>
        </div>
        <div className="space-y-4">
          {reports.map((report, idx) => (
            <div key={idx} className="border rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{report.name}</h3>
                <p className="text-sm text-muted-foreground">{report.type} • {report.date}</p>
              </div>
              <button className="btn btn-outline btn-sm">View</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligence;
