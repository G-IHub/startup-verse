import React from "react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import {
  Volume2,
  VolumeX,
  Music,
  Bell,
  MousePointer,
  Coffee,
  TreePine,
  BookOpen,
  Building2,
  Speaker,
  Mic2,
  Sparkles,
} from "lucide-react";
export function AudioSettingsDialog({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
  onTestSound,
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
  const voiceCoachModes = [
    {
      id: "off",
      name: "Off",
      description: "No coaching",
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Achievements only",
    },
    {
      id: "balanced",
      name: "Balanced",
      description: "Achievements + Focus",
    },
    {
      id: "full",
      name: "Full",
      description: "All coaching",
    },
  ];
  const voiceTypes = [
    {
      id: "female",
      name: "Female",
      icon: "👩",
    },
    {
      id: "male",
      name: "Male",
      icon: "👨",
    },
    {
      id: "neutral",
      name: "Neutral",
      icon: "🤖",
    },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Speaker className="w-4 h-4" />
            Audio Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                {settings.isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                Sound Enabled
              </Label>
              <Switch
                checked={!settings.isMuted}
                onCheckedChange={(checked) =>
                  onUpdateSettings({
                    isMuted: !checked,
                  })
                }
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              All sounds are set to a minimal, subtle volume
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sound Profile</Label>
            <div className="grid grid-cols-2 gap-2">
              {soundProfiles.map((profile) => (
                <Button
                  key={profile.id}
                  variant={
                    settings.soundProfile === profile.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    onUpdateSettings({
                      soundProfile: profile.id,
                    })
                  }
                  className="h-auto flex-col items-start p-2"
                >
                  <span className="text-[11px] font-semibold">
                    {profile.name}
                  </span>
                  <span className="text-[9px] opacity-70">
                    {profile.description}
                  </span>
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Test Sounds</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTestSound("notification")}
                className="h-auto flex-col items-center p-2 gap-1"
                disabled={settings.isMuted}
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="text-[9px]">Notification</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTestSound("action")}
                className="h-auto flex-col items-center p-2 gap-1"
                disabled={settings.isMuted}
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span className="text-[9px]">Action</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTestSound("ambient")}
                className="h-auto flex-col items-center p-2 gap-1"
                disabled={settings.isMuted}
              >
                <Music className="w-3.5 h-3.5" />
                <span className="text-[9px]">Ambient</span>
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ambient Sound</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {ambientTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={
                    settings.ambientType === type.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    onUpdateSettings({
                      ambientType: type.id,
                    })
                  }
                  className="h-auto flex-col items-center p-2 gap-1"
                  disabled={settings.isMuted}
                >
                  <type.icon className="w-3.5 h-3.5" />
                  <span className="text-[9px]">{type.name}</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-3 p-3 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-purple-600" />
                <span className="flex items-center gap-1.5">
                  Voice Coach
                  <Sparkles className="w-3 h-3 text-purple-500" />
                </span>
              </Label>
              <Switch
                checked={settings.voiceCoachEnabled}
                onCheckedChange={(checked) =>
                  onUpdateSettings({
                    voiceCoachEnabled: checked,
                  })
                }
                disabled={settings.isMuted}
              />
            </div>
            {settings.voiceCoachEnabled && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                }}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <Label className="text-[11px]">Coaching Level</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {voiceCoachModes.map((mode) => (
                      <Button
                        key={mode.id}
                        variant={
                          settings.voiceCoachMode === mode.id
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          onUpdateSettings({
                            voiceCoachMode: mode.id,
                          })
                        }
                        className="h-auto flex-col items-start p-1.5"
                      >
                        <span className="text-[10px] font-semibold">
                          {mode.name}
                        </span>
                        <span className="text-[8px] opacity-70">
                          {mode.description}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px]">Voice Type</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {voiceTypes.map((voice) => (
                      <Button
                        key={voice.id}
                        variant={
                          settings.voiceCoachVoice === voice.id
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          onUpdateSettings({
                            voiceCoachVoice: voice.id,
                          })
                        }
                        className="h-auto flex-col items-center p-1.5 gap-0.5"
                      >
                        <span className="text-base">{voice.icon}</span>
                        <span className="text-[9px]">{voice.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px]">Speech Rate</Label>
                    <span className="text-[9px] text-muted-foreground">
                      {(settings.voiceCoachRate || 1.0).toFixed(1)}x
                    </span>
                  </div>
                  <Slider
                    value={[settings.voiceCoachRate || 1.0]}
                    onValueChange={([value]) =>
                      onUpdateSettings({
                        voiceCoachRate: value,
                      })
                    }
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onTestSound("voice")}
                  className="w-full text-[10px]"
                >
                  <Mic2 className="w-3 h-3 mr-1.5" />
                  Test Voice Coach
                </Button>
              </motion.div>
            )}
          </div>
          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-[10px] text-blue-900">
            <p className="font-medium mb-1">💡 Audio Tips</p>
            <ul className="space-y-0.5 text-[9px] opacity-80">
              <li>
                {"• Use "}
                <strong>Balanced</strong>
                {" for the best experience"}
              </li>
              <li>
                {"• "}
                <strong>Voice Coach</strong>
                {" motivates during focus sessions"}
              </li>
              <li>
                {"• Press "}
                <strong>M</strong>
                {" to quickly mute/unmute"}
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
