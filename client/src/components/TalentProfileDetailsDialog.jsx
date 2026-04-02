import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import {
  MapPin,
  Briefcase,
  Clock,
  Mail,
  Linkedin,
  Github,
  ExternalLink,
  Building2,
  Award,
  GraduationCap,
  Target,
  FileText,
  Star,
  Send,
} from "lucide-react";
export default function TalentProfileDetailsDialog({
  isOpen,
  onClose,
  talent,
  onInvite,
}) {
  const [inviteMessage, setInviteMessage] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const handleClose = () => {
    setShowInviteForm(false);
    setInviteMessage("");
    onClose();
  };
  const handleSendInvite = () => {
    if (onInvite && inviteMessage.trim()) {
      onInvite(inviteMessage);
      handleClose();
    }
  };
  if (!talent) return null;
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <div className="flex items-start gap-4 pr-8">
            <Avatar className="w-20 h-20 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {talent.fullName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "TU"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-3xl mb-2">
                {talent.fullName}
              </DialogTitle>
              <DialogDescription className="text-lg mb-3">
                {talent.professionalTitle}
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {talent.match && (
                  <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/20 px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-primary">
                      {talent.match}%
                    </span>
                    <span className="text-muted-foreground">Match</span>
                  </div>
                )}
                {talent.location && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {talent.location}
                  </div>
                )}
                {talent.yearsOfExperience && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    {talent.yearsOfExperience}
                    {" years experience"}
                  </div>
                )}
                {talent.email && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {talent.email}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-6 mt-6">
          {talent.bio && (
            <div>
              <h3 className="mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                About
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {talent.bio}
              </p>
            </div>
          )}
          {talent.lookingFor && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  What I'm Looking For
                </h3>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-muted-foreground leading-relaxed">
                    {talent.lookingFor}
                  </p>
                </div>
              </div>
            </>
          )}
          {talent.interests && talent.interests.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Industries of Interest
                </h3>
                <div className="flex flex-wrap gap-2">
                  {talent.interests.map((interest, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-sm py-1.5 px-3 border-primary/30"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
          <Separator />
          {talent.skills && talent.skills.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Skills & Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {talent.skills.map((skill, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-sm py-1.5 px-3"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {(talent.linkedinUrl ||
            talent.githubUrl ||
            talent.portfolioWebsite) && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-primary" />
                  Professional Links
                </h3>
                <div className="flex flex-wrap gap-3">
                  {talent.linkedinUrl && (
                    <Button variant="outline" size="sm" asChild={true}>
                      <a
                        href={talent.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Linkedin className="w-4 h-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {talent.githubUrl && (
                    <Button variant="outline" size="sm" asChild={true}>
                      <a
                        href={talent.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="w-4 h-4 mr-2" />
                        GitHub
                      </a>
                    </Button>
                  )}
                  {talent.portfolioWebsite && (
                    <Button variant="outline" size="sm" asChild={true}>
                      <a
                        href={talent.portfolioWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Portfolio
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
          {talent.workExperiences && talent.workExperiences.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Work Experience
                </h3>
                <div className="space-y-4">
                  {talent.workExperiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="border-l-2 border-primary/20 pl-4 pb-4 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="font-semibold">{exp.position}</h4>
                          <p className="text-muted-foreground">{exp.company}</p>
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {exp.startDate}
                          {" - "}
                          {exp.current ? "Present" : exp.endDate}
                        </div>
                      </div>
                      {exp.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {talent.educationList && talent.educationList.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Education
                </h3>
                <div className="space-y-3">
                  {talent.educationList.map((edu) => (
                    <div key={edu.id} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">
                          {edu.degree}
                          {" in "}
                          {edu.field}
                        </h4>
                        <p className="text-muted-foreground">
                          {edu.institution}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {"Graduated: "}
                          {edu.graduationYear}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {talent.certifications && talent.certifications.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Certifications & Credentials
                </h3>
                <div className="space-y-3">
                  {talent.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">{cert.name}</h4>
                        <p className="text-muted-foreground">
                          {cert.issuer}
                          {" • "}
                          {cert.issueYear}
                        </p>
                        {cert.credentialId && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {"ID: "}
                            {cert.credentialId}
                          </p>
                        )}
                        {cert.credentialUrl && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 mt-1"
                            asChild={true}
                          >
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {"View Credential "}
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {talent.portfolioItems && talent.portfolioItems.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Portfolio & Projects
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {talent.portfolioItems.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <h4 className="font-semibold mb-2">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      {item.url && (
                        <Button variant="outline" size="sm" asChild={true}>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {"View Project "}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {(talent.availabilityStatus || talent.preferredCommitment) && (
            <>
              <Separator />
              <div>
                <h3 className="mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Availability & Preferences
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {talent.availabilityStatus && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        Availability
                      </p>
                      <p className="font-semibold">
                        {talent.availabilityStatus}
                      </p>
                    </div>
                  )}
                  {talent.preferredCommitment && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        Preferred Commitment
                      </p>
                      <p className="font-semibold">
                        {talent.preferredCommitment}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          <div className="pt-4 border-t sticky bottom-0 bg-background">
            {!showInviteForm ? (
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={() => setShowInviteForm(true)}
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Invitation
                </Button>
                <Button variant="outline" size="lg" onClick={handleClose}>
                  Close
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Invitation Message</p>
                  <Textarea
                    placeholder={`Tell ${talent.fullName} about your startup, the role you're offering, and why you think they'd be perfect for your team...`}
                    rows={5}
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={handleSendInvite}
                    disabled={!inviteMessage.trim()}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Send Invitation
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setShowInviteForm(false);
                      setInviteMessage("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
