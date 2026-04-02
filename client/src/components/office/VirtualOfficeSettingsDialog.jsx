import React from "react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  Volume2,
  VolumeX,
  Bell,
  Coffee,
  TreePine,
  BookOpen,
  Building2,
  Mic2,
  Sparkles,
  Users,
  Eye,
  Activity,
  Shield,
  Crown,
} from "lucide-react";
export function VirtualOfficeSettingsDialog({
  open,
  onOpenChange,
  user,
  audioSettings,
  onUpdateAudioSettings,
  onTestSound,
  officeSettings,
  onUpdateOfficeSettings,
}) {
  const soundProfiles = [
    {
      id: "silent",
      name: "Silent",
      description: "No sounds",
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Essential sounds only",
    },
    {
      id: "balanced",
      name: "Balanced",
      description: "Recommended",
    },
    {
      id: "immersive",
      name: "Immersive",
      description: "Full experience",
    },
  ];
  const ambientTypes = [
    {
      id: "none",
      name: "None",
      icon: VolumeX,
    },
    {
      id: "office",
      name: "Office",
      icon: Building2,
    },
    {
      id: "cafe",
      name: "Café",
      icon: Coffee,
    },
    {
      id: "nature",
      name: "Nature",
      icon: TreePine,
    },
    {
      id: "library",
      name: "Library",
      icon: BookOpen,
    },
  ];
  const isFounder = user.role === "founder";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Virtual Office Settings
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="audio" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="audio" className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              Audio
            </TabsTrigger>
            <TabsTrigger
              value="collaboration"
              className="flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              Collaboration
              {isFounder && <Crown className="w-3 h-3 text-yellow-600 ml-1" />}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="audio" className="space-y-6 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  {audioSettings.isMuted ? (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-green-600" />
                  )}
                  Audio Enabled
                </Label>
                <Switch
                  checked={!audioSettings.isMuted}
                  onCheckedChange={(checked) => {
                    onUpdateAudioSettings({
                      isMuted: !checked,
                    });
                    if (checked) onTestSound("notification");
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                All sounds play at a fixed minimal volume (8%) for a subtle
                experience
              </p>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label>Sound Profile</Label>
              <div className="grid grid-cols-2 gap-2">
                {soundProfiles.map((profile) => (
                  <motion.button
                    key={profile.id}
                    onClick={() =>
                      onUpdateAudioSettings({
                        soundProfile: profile.id,
                      })
                    }
                    className={`p-3 rounded-lg border-2 text-left transition-all ${audioSettings.soundProfile === profile.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                    whileHover={{
                      scale: 1.02,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                  >
                    <div className="font-medium text-sm">{profile.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {profile.description}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label>Ambient Background</Label>
              <div className="grid grid-cols-5 gap-2">
                {ambientTypes.map((ambient) => {
                  const Icon = ambient.icon;
                  return (
                    <motion.button
                      key={ambient.id}
                      onClick={() =>
                        onUpdateAudioSettings({
                          ambientType: ambient.id,
                        })
                      }
                      className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1.5 transition-all ${audioSettings.ambientType === ambient.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                      whileHover={{
                        scale: 1.05,
                      }}
                      whileTap={{
                        scale: 0.95,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{ambient.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Mic2 className="w-4 h-4" />
                  AI Voice Coach
                  <Badge variant="outline" className="text-[10px]">
                    Experimental
                  </Badge>
                </Label>
                <Switch
                  checked={audioSettings.voiceCoachEnabled}
                  onCheckedChange={(checked) =>
                    onUpdateAudioSettings({
                      voiceCoachEnabled: checked,
                    })
                  }
                />
              </div>
              {audioSettings.voiceCoachEnabled && (
                <motion.div
                  initial={{
                    opacity: 0,
                    height: 0,
                  }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                  }}
                  className="space-y-3 pl-6 border-l-2 border-primary/20"
                >
                  <div className="space-y-2">
                    <Label className="text-xs">Coaching Level</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {["off", "minimal", "balanced", "full"].map((mode) => (
                        <Button
                          key={mode}
                          size="sm"
                          variant={
                            audioSettings.voiceCoachMode === mode
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            onUpdateAudioSettings({
                              voiceCoachMode: mode,
                            })
                          }
                          className="text-xs capitalize"
                        >
                          {mode}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Voice Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["female", "male", "neutral"].map((voice) => (
                        <Button
                          key={voice}
                          size="sm"
                          variant={
                            audioSettings.voiceCoachVoice === voice
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            onUpdateAudioSettings({
                              voiceCoachVoice: voice,
                            })
                          }
                          className="text-xs capitalize"
                        >
                          {voice}
                        </Button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="collaboration" className="space-y-6 mt-4">
            {isFounder && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Crown className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">
                      Founder Controls
                    </p>
                    <p className="text-xs text-yellow-700">
                      As a founder, you can control collaboration features for
                      your team
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Live Activity Feed
                </Label>
                <Switch
                  checked={officeSettings.showActivityFeed}
                  onCheckedChange={(checked) =>
                    onUpdateOfficeSettings({
                      showActivityFeed: checked,
                    })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Show real-time team activity updates
              </p>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Team Presence Bar
                </Label>
                <Switch
                  checked={officeSettings.showPresenceBar}
                  onCheckedChange={(checked) =>
                    onUpdateOfficeSettings({
                      showPresenceBar: checked,
                    })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Display who's online in the office
              </p>
            </div>
            <Separator />
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </Label>
              <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Activity Notifications</Label>
                  <Switch
                    checked={officeSettings.activityNotifications}
                    onCheckedChange={(checked) =>
                      onUpdateOfficeSettings({
                        activityNotifications: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Team Join/Leave Alerts</Label>
                  <Switch
                    checked={officeSettings.teamJoinLeaveAlerts}
                    onCheckedChange={(checked) =>
                      onUpdateOfficeSettings({
                        teamJoinLeaveAlerts: checked,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            {!isFounder && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-900">
                      Some collaboration settings can only be changed by
                      founders
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
