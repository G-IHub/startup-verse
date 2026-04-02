import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { PlayCircle, ExternalLink, BookOpen, Video } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

// Curated video resources for each stage
const stageVideos = {
  1: [
    // Idea & Validation
    {
      id: "1",
      title: "How to Get and Evaluate Startup Ideas",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "15:49",
      youtubeId: "Th8JoIan4dg",
      description:
        "Learn how to generate and validate startup ideas from YC partners.",
      recommended: true,
    },
    {
      id: "2",
      title: "How to Talk to Users",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "19:05",
      youtubeId: "MT4Ig2uqjTc",
      description:
        "Essential techniques for conducting effective user interviews and getting honest feedback.",
    },
    {
      id: "3",
      title: "How to Validate Your Startup Idea",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "26:19",
      youtubeId: "DOtCl5PU8F0",
      description:
        "Learn how to validate your startup idea before building your product.",
    },
  ],
  2: [
    // Company Formation
    {
      id: "1",
      title: "How to Start a Startup: Legal and Accounting Basics",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "54:23",
      youtubeId: "EHzvmyMJEK4",
      description:
        "Legal basics every founder needs to know when forming a company.",
      recommended: true,
    },
    {
      id: "2",
      title: "Startup Legal Mechanics",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "20:11",
      youtubeId: "SBjy7O1WxEw",
      description:
        "Understanding legal structure and incorporation for startups.",
    },
  ],
  3: [
    // Team Building
    {
      id: "1",
      title: "How to Find the Right Co-Founder",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "14:23",
      youtubeId: "RYJx22ZDFjs",
      description: "Learn what makes a great co-founder and how to find them.",
      recommended: true,
    },
    {
      id: "2",
      title: "Splitting Equity Among Co-Founders",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "16:47",
      youtubeId: "vIEkRML-CQw",
      description: "How to fairly split equity and avoid common mistakes.",
    },
    {
      id: "3",
      title: "How to Hire",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "34:46",
      youtubeId: "LuR7K0k1Tgc",
      description:
        "Strategies for hiring your first employees and building your team.",
    },
  ],
  4: [
    // MVP Development
    {
      id: "1",
      title: "How to Build an MVP",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "23:45",
      youtubeId: "1hHMwLxN6EM",
      description:
        "Learn how to build your first product version quickly and efficiently.",
      recommended: true,
    },
    {
      id: "2",
      title: "How to Launch (Again and Again)",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "18:34",
      youtubeId: "AlTeW4H7D_Q",
      description:
        "Strategies for successfully launching your MVP and getting initial users.",
    },
    {
      id: "3",
      title: "Building Product",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "48:16",
      youtubeId: "C27RVio2rOs",
      description:
        "Best practices for building products that users actually want.",
    },
  ],
  5: [
    // Early Traction
    {
      id: "1",
      title: "How to Get Your First Customers",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "21:15",
      youtubeId: "hyYwIMhLjBM",
      description:
        "Proven strategies for acquiring your first 10-100 customers.",
      recommended: true,
    },
    {
      id: "2",
      title: "Growth for Startups",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "17:56",
      youtubeId: "raIUQP71SBU",
      description:
        "How to think about growth and find channels that work for your startup.",
    },
    {
      id: "3",
      title: "How to Get Users and Grow",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "51:14",
      youtubeId: "T9ikpoF2GH0",
      description:
        "Understanding customer acquisition and growth strategies for early-stage startups.",
    },
  ],
  6: [
    // Scaling & Fundraising
    {
      id: "1",
      title: "How to Raise a Seed Round",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "26:18",
      youtubeId: "KQJ6zsNCA-4",
      description:
        "Complete guide to raising your first institutional funding round.",
      recommended: true,
    },
    {
      id: "2",
      title: "How to Pitch Your Startup",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "15:52",
      youtubeId: "17XZGUX_9iM",
      description: "Crafting and delivering a compelling investor pitch.",
    },
    {
      id: "3",
      title: "Scaling Your Startup",
      source: "Y Combinator",
      sourceUrl: "https://www.ycombinator.com",
      duration: "42:08",
      youtubeId: "r-98YRAF1dY",
      description: "Strategies for scaling your team, operations, and growth.",
    },
  ],
};
export default function StageLearningModal({
  isOpen,
  onClose,
  stageName,
  stageKey,
}) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const videos = stageVideos[stageKey] || [];
  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };
  const handleBackToList = () => {
    setSelectedVideo(null);
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[85vh] p-0 flex flex-col">
        <DialogHeader className="p-4 pb-3 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="w-4 h-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {selectedVideo
                  ? selectedVideo.title
                  : `Learn About ${stageName}`}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {selectedVideo
                  ? `${selectedVideo.source} • ${selectedVideo.duration}`
                  : "Curated video lessons from top startup programs"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="overflow-y-scroll flex-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {selectedVideo ? (
            <div className="p-4 space-y-4 pb-16">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="mb-2"
              >
                ← Back to all videos
              </Button>
              <div className="relative w-full pb-[56.25%] bg-black rounded-lg overflow-hidden">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?rel=0`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen={true}
                />
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm">
                        {selectedVideo.title}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {selectedVideo.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedVideo.source}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedVideo.duration}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-7 text-xs"
                      onClick={() =>
                        window.open(
                          `https://youtube.com/watch?v=${selectedVideo.youtubeId}`,
                          "_blank",
                        )
                      }
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Watch on YouTube
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-4 space-y-3 w-full pb-16">
              {videos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    Learning resources coming soon for this stage.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-4">
                    Watch these curated videos to learn best practices from
                    successful founders and top startup programs.
                  </p>
                  {videos.map((video) => (
                    <Card
                      key={video.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors w-full"
                      onClick={() => handleVideoSelect(video)}
                    >
                      <CardContent className="p-3">
                        <div className="flex gap-3 w-full">
                          <div className="relative w-32 h-20 flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded overflow-hidden group">
                            <img
                              src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                              alt={video.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback for videos without thumbnails
                                const target = e.target;
                                target.style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <PlayCircle className="w-10 h-10 text-primary opacity-70" />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded">
                              {video.duration}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-xs font-medium line-clamp-2 leading-snug">
                                {video.title}
                              </h4>
                              {video.recommended && (
                                <Badge
                                  variant="default"
                                  className="text-[9px] h-4 flex-shrink-0"
                                >
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mb-1.5">
                              {video.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="text-[9px] h-4"
                              >
                                {video.source}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
