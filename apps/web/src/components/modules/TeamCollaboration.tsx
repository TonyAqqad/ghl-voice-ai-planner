import React, { useState } from 'react';
import { Users, MessageSquare, Bell, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TeamCollaboration: React.FC = () => {
  const [teamMembers] = useState([
    { id: '1', name: 'Sarah Chen', role: 'Developer', status: 'online', avatar: 'SC' },
    { id: '2', name: 'John Smith', role: 'Designer', status: 'online', avatar: 'JS' },
    { id: '3', name: 'Emma Wilson', role: 'Manager', status: 'away', avatar: 'EW' },
  ]);

  const [activities] = useState([
    { user: 'Sarah Chen', action: 'Created new agent configuration', time: '5m ago' },
    { user: 'John Smith', action: 'Updated voice settings', time: '15m ago' },
    { user: 'Emma Wilson', action: 'Approved deployment', time: '1h ago' },
  ]);

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Team Collaboration</h1>
            <p className="text-muted-foreground">Real-time team collaboration and communication</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-xl font-semibold mb-4">Team Activity</h2>
          <div className="space-y-4">
            {activities.map((activity, idx) => (
              <div key={idx} className="border-l-2 border-primary pl-4">
                <p className="font-medium">{activity.user}</p>
                <p className="text-sm text-muted-foreground">{activity.action}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Team Members</h2>
          <div className="space-y-4">
            {teamMembers.map(member => (
              <div key={member.id} className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold ${
                  member.status === 'online' ? 'border-2 border-green-600' : ''
                }`}>
                  {member.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
                <span className={`w-2 h-2 rounded-full ${
                  member.status === 'online' ? 'bg-green-600' : 'bg-yellow-600'
                }`}></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamCollaboration;
