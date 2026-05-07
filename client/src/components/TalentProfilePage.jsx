import React, { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
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
  ArrowLeft,
  Calendar,
  Globe,
  Code,
  Heart,
  Zap,
  CheckCircle2,
} from "lucide-react";

export default function TalentProfilePage({ talent, currentUser, onBack, onSendInvitation }) {
  const [inviteMessage, setInviteMessage] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);

  if (!talent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Talent not found</h2>
          <p className="text-muted-foreground">The talent profile you're looking for doesn't exist.</p>
          <Button onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse
          </Button>
        </div>
      </div>
    );
  }

  const handleSendInvite = () => {
    if (!inviteMessage.trim()) return;
    
    if (onSendInvitation) {
      onSendInvitation(inviteMessage);
    }
    
    setInvitationSent(true);
    setTimeout(() => {
      setShowInviteForm(false);
      setInvitationSent(false);
      setInviteMessage("");
    }, 2000);
  };

  const getMatchColor = (score) => {
    if (score >= 80) return "from-emerald-500 to-emerald-600";
    if (score >= 60) return "from-blue-500 to-blue-600";
    if (score >= 40) return "from-amber-500 to-amber-600";
    return "from-slate-500 to-slate-600";
  };

  return (
    <div className="min-h-full bg-slate-50/50 pb-12">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 bg-white px-4 py-3 mb-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Browse
          </Button>
          
          {talent.match && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Match Score</span>
              <Badge 
                className={`bg-gradient-to-r ${getMatchColor(talent.match)} text-white border-0 font-semibold`}
              >
                <Star className="w-3.5 h-3.5 mr-1 fill-white" />
                {talent.match}%
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* Hero Profile Card */}
        <Card className="border-0 overflow-hidden bg-white">
          <div className="bg-slate-50/80 p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 shrink-0 bg-primary">
                <AvatarFallback className="bg-primary text-white text-3xl md:text-4xl font-bold">
                  {talent.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "TU"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                      {talent.fullName}
                    </h1>
                    <p className="text-xl text-primary font-medium mb-3">
                      {talent.professionalTitle}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      {talent.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {talent.location}
                        </div>
                      )}
                      {talent.yearsOfExperience && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          {talent.yearsOfExperience} years experience
                        </div>
                      )}
                      {talent.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {talent.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Availability Badge */}
                  <div className="flex-shrink-0">
                    {talent.availabilityStatus ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 px-3 py-1.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        {talent.availabilityStatus}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                        <Clock className="w-4 h-4 mr-1.5" />
                        Availability unknown
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="bg-white px-8 py-4">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              {talent.skills && (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-slate-600">{talent.skills.length} Skills</span>
                </div>
              )}
              {talent.workExperiences && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span className="text-slate-600">{talent.workExperiences.length} Positions</span>
                </div>
              )}
              {talent.educationList && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-500" />
                  <span className="text-slate-600">{talent.educationList.length} Education</span>
                </div>
              )}
              {talent.certifications && (
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span className="text-slate-600">{talent.certifications.length} Certifications</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            {talent.bio && (
              <Card className="border-0 bg-white">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-primary" />
                    About
                  </h2>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {talent.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Looking For */}
            {talent.lookingFor && (
              <Card className="border-0 bg-white">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-primary" />
                    What I'm Looking For
                  </h2>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-700 leading-relaxed">
                      {talent.lookingFor}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {talent.skills && talent.skills.length > 0 && (
              <Card className="border-0 bg-white">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Code className="w-5 h-5 text-primary" />
                    Skills & Expertise
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {talent.skills.map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-sm py-2 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Work Experience */}
            {talent.workExperiences && talent.workExperiences.length > 0 && (
              <Card className="border-0 bg-white">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Work Experience
                  </h2>
                  <div className="space-y-6">
                    {talent.workExperiences.map((exp) => (
                      <div key={exp.id} className="relative pl-6 pb-6 last:pb-0">
                        <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-primary" />
                        <div className="absolute left-0.75 top-4 bottom-0 w-0.5 bg-slate-200" 
                             style={{ display: exp === talent.workExperiences[talent.workExperiences.length - 1] ? 'none' : 'block' }} />
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-900">{exp.position}</h3>
                            <p className="text-slate-600">{exp.company}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Calendar className="w-4 h-4" />
                            {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                          </div>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {talent.educationList && talent.educationList.length > 0 && (
              <Card className="border-0 bg-white">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Education
                  </h2>
                  <div className="space-y-4">
                    {talent.educationList.map((edu) => (
                      <div key={edu.id} className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900">
                            {edu.degree} in {edu.field}
                          </h3>
                          <p className="text-slate-600">{edu.institution}</p>
                          <p className="text-sm text-slate-500">Graduated {edu.graduationYear}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {talent.certifications && talent.certifications.length > 0 && (
              <Card className="border-0 bg-white">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                    <Award className="w-5 h-5 text-primary" />
                    Certifications
                  </h2>
                  <div className="grid gap-3">
                    {talent.certifications.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-slate-50"
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900">{cert.name}</h3>
                          <p className="text-sm text-slate-600">{cert.issuer} • {cert.issueYear}</p>
                          {cert.credentialUrl && (
                            <Button variant="link" size="sm" className="h-auto p-0 mt-1" asChild>
                              <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                                View Credential <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio */}
            {talent.portfolioItems && talent.portfolioItems.length > 0 && (
              <Card className="border-0 bg-white">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                    <Globe className="w-5 h-5 text-primary" />
                    Portfolio & Projects
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {talent.portfolioItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{item.description}</p>
                        {item.url && (
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              View Project <ExternalLink className="w-3 h-3 ml-1.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Right Column (1/3) */}
          <div className="space-y-6">
            {/* Send Invitation Card */}
            <Card className="border-0 bg-white sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Interested in {talent.fullName?.split(" ")[0]}?</h3>
                
                {!showInviteForm ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      Send a personalized invitation to join your startup team.
                    </p>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => setShowInviteForm(true)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Invitation
                    </Button>
                  </div>
                ) : invitationSent ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="font-medium text-emerald-600">Invitation sent!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Your Message
                      </label>
                      <Textarea
                        placeholder={`Hi ${talent.fullName?.split(" ")[0]}, I'm interested in having you join our team...`}
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        onClick={handleSendInvite}
                        disabled={!inviteMessage.trim()}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                      <Button 
                        variant="outline" 
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
              </CardContent>
            </Card>

            {/* Industries of Interest */}
            {talent.interests && talent.interests.length > 0 && (
              <Card className="border-0 bg-white">
                <CardContent className="p-6">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <Heart className="w-4 h-4 text-rose-500" />
                    Interested Industries
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {talent.interests.map((interest, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="border-rose-200 text-rose-700 bg-rose-50"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Professional Links */}
            {(talent.linkedinUrl || talent.githubUrl || talent.portfolioWebsite) && (
              <Card className="border-0 bg-white">
                <CardContent className="p-6">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <ExternalLink className="w-4 h-4 text-primary" />
                    Professional Links
                  </h3>
                  <div className="space-y-2">
                    {talent.linkedinUrl && (
                      <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                        <a href={talent.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="w-4 h-4 mr-2 text-[#0A66C2]" />
                          LinkedIn Profile
                        </a>
                      </Button>
                    )}
                    {talent.githubUrl && (
                      <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                        <a href={talent.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4 mr-2 text-slate-700" />
                          GitHub Profile
                        </a>
                      </Button>
                    )}
                    {talent.portfolioWebsite && (
                      <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                        <a href={talent.portfolioWebsite} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-4 h-4 mr-2 text-emerald-600" />
                          Portfolio Website
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Availability & Preferences */}
            {(talent.availabilityStatus || talent.preferredCommitment) && (
              <Card className="border-0 bg-white">
                <CardContent className="p-6">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-primary" />
                    Availability
                  </h3>
                  <div className="space-y-3">
                    {talent.availabilityStatus && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Status</p>
                        <p className="font-medium text-slate-900">{talent.availabilityStatus}</p>
                      </div>
                    )}
                    {talent.preferredCommitment && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Preferred Commitment</p>
                        <p className="font-medium text-slate-900">{talent.preferredCommitment}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
