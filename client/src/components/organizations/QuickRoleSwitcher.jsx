import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Users, Building2, Briefcase, Sparkles } from "lucide-react";
export default function QuickRoleSwitcher({ currentUserId, onSwitchUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const allUsers = [];
  const getRoleIcon = (role) => {
    switch (role) {
      case "founder":
        return <Sparkles className="w-3 h-3" />;
      case "organization-admin":
        return <Building2 className="w-3 h-3" />;
      case "team-member":
        return <Users className="w-3 h-3" />;
      case "talent":
        return <Briefcase className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };
  const getRoleColor = (role) => {
    switch (role) {
      case "founder":
        return "bg-primary text-primary-foreground";
      case "organization-admin":
        return "bg-purple-600 text-white";
      case "team-member":
        return "bg-green-600 text-white";
      case "talent":
        return "bg-blue-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          className="h-8 text-[9px] shadow-lg"
        >
          🧪 Test Accounts
        </Button>
      </div>
    );
  }
  return (
    <div className="fixed bottom-4 right-4 z-50 w-72">
      <Card className="shadow-2xl border-2">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold">🧪 Quick Role Switcher</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-5 text-[9px]"
            >
              ✕
            </Button>
          </div>
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {allUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  onSwitchUser(user.id);
                  setIsOpen(false);
                }}
                className={`w-full p-2 rounded-lg border text-left transition-all ${user.id === currentUserId ? "bg-primary/10 border-primary" : "hover:bg-muted border-transparent"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-[9px] font-medium truncate">
                        {user.name}
                      </p>
                      {user.id === currentUserId && (
                        <Badge className="text-[7px] px-1 py-0 bg-green-600">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-[8px] text-muted-foreground truncate">
                      {user.email}
                    </p>
                    {user.startupName && (
                      <p className="text-[8px] text-muted-foreground truncate italic">
                        {user.startupName}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={`text-[8px] px-1.5 py-0.5 ${getRoleColor(user.role)} flex items-center gap-1`}
                  >
                    {getRoleIcon(user.role)}
                    {user.role}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t">
            <p className="text-[8px] text-muted-foreground">
              💡 Switch between accounts to test organization features
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
