import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import {
  Plus,
  Trash2,
  FileText,
  Award,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  Globe,
  Github,
  Linkedin,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

const STEP_TITLES = [
  "Professional profile",
  "Skills, links & experience",
  "Availability & goals",
];

const TalentProfileForm = forwardRef(function TalentProfileForm(
  { loading, onSubmit, initialData },
  ref,
) {
  const formRef = useRef(null);
  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState(initialData?.name || "");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  const [skillsInput, setSkillsInput] = useState("");

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioWebsite, setPortfolioWebsite] = useState("");

  const [workExperiences, setWorkExperiences] = useState([]);

  const [educationList, setEducationList] = useState([]);

  const [certifications, setCertifications] = useState([]);

  const [portfolioItems, setPortfolioItems] = useState([]);

  const [availabilityStatus, setAvailabilityStatus] = useState("");
  const [preferredCommitment, setPreferredCommitment] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");

  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");
  const [interests, setInterests] = useState([]);

  const [professionalGoals, setProfessionalGoals] = useState("");
  const [industryPreferences, setIndustryPreferences] = useState([]);

  const wizardPercent = Math.round((step / 3) * 100);

  const validateStep1 = () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return false;
    }
    if (!professionalTitle.trim()) {
      toast.error("Please enter your professional title.");
      return false;
    }
    if (!String(yearsOfExperience).trim()) {
      toast.error("Please enter years of experience.");
      return false;
    }
    if (!bio.trim()) {
      toast.error("Please enter your professional bio.");
      return false;
    }
    return true;
  };

  const buildSubmissionData = () => ({
    fullName,
    professionalTitle,
    location,
    bio,
    skills: skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    linkedinUrl,
    githubUrl,
    portfolioWebsite,
    workExperiences,
    educationList,
    certifications,
    portfolioItems,
    availabilityStatus,
    preferredCommitment,
    yearsOfExperience,
    experience,
    availability,
    interests,
    professionalGoals,
    industryPreferences,
    email: initialData?.email || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    onSubmit(buildSubmissionData());
  };

  const submitFromParent = () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    setStep(3);
    queueMicrotask(() => {
      onSubmit(buildSubmissionData());
    });
  };

  useImperativeHandle(ref, () => ({
    triggerSubmit: submitFromParent,
    requestSubmit: submitFromParent,
  }));

  const addWorkExperience = () => {
    setWorkExperiences([
      ...workExperiences,
      {
        id: Date.now().toString(),
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
      },
    ]);
  };
  const removeWorkExperience = (id) => {
    setWorkExperiences(workExperiences.filter((exp) => exp.id !== id));
  };
  const updateWorkExperience = (id, field, value) => {
    setWorkExperiences(
      workExperiences.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              [field]: value,
            }
          : exp,
      ),
    );
  };

  const addEducation = () => {
    setEducationList([
      ...educationList,
      {
        id: Date.now().toString(),
        institution: "",
        degree: "",
        field: "",
        graduationYear: "",
      },
    ]);
  };
  const removeEducation = (id) => {
    setEducationList(educationList.filter((edu) => edu.id !== id));
  };
  const updateEducation = (id, field, value) => {
    setEducationList(
      educationList.map((edu) =>
        edu.id === id
          ? {
              ...edu,
              [field]: value,
            }
          : edu,
      ),
    );
  };

  const addCertification = () => {
    setCertifications([
      ...certifications,
      {
        id: Date.now().toString(),
        name: "",
        issuer: "",
        issueYear: "",
        credentialId: "",
        credentialUrl: "",
      },
    ]);
  };
  const removeCertification = (id) => {
    setCertifications(certifications.filter((cert) => cert.id !== id));
  };
  const updateCertification = (id, field, value) => {
    setCertifications(
      certifications.map((cert) =>
        cert.id === id
          ? {
              ...cert,
              [field]: value,
            }
          : cert,
      ),
    );
  };

  const addPortfolioItem = () => {
    setPortfolioItems([
      ...portfolioItems,
      {
        id: Date.now().toString(),
        title: "",
        description: "",
        url: "",
        type: "project",
      },
    ]);
  };
  const removePortfolioItem = (id) => {
    setPortfolioItems(portfolioItems.filter((item) => item.id !== id));
  };
  const updatePortfolioItem = (id, field, value) => {
    setPortfolioItems(
      portfolioItems.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-6"
      id="talent-profile-form"
      aria-live="polite"
    >
      <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">
            Step {step} of 3 — {STEP_TITLES[step - 1]}
          </p>
          <span className="text-xs text-muted-foreground tabular-nums">
            {wizardPercent}%
          </span>
        </div>
        <Progress value={wizardPercent} className="h-2" />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h3>Professional Profile</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="professionalTitle">Professional Title *</Label>
              <Input
                id="professionalTitle"
                placeholder="e.g., Senior Full-Stack Developer"
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
              <Input
                id="yearsOfExperience"
                placeholder="e.g., 5"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Professional Bio *</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about your professional background, expertise, and what drives you..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
              disabled={loading}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              A compelling bio helps founders understand your value
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <>
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-primary" />
              <h3>Skills & Expertise</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Technical & Professional Skills</Label>
              <Textarea
                id="skills"
                placeholder="e.g., React, Node.js, TypeScript, Product Strategy, Agile, Team Leadership"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                disabled={loading}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Separate skills with commas. Be specific!
              </p>
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-primary" />
              <h3>Professional Links</h3>
            </div>
            <p className="text-sm text-muted-foreground -mt-2 mb-3">
              These links help validate your professional background
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label
                  htmlFor="linkedinUrl"
                  className="flex items-center gap-2"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn Profile
                </Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="githubUrl" className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  GitHub Profile (recommended for technical roles)
                </Label>
                <Input
                  id="githubUrl"
                  type="url"
                  placeholder="https://github.com/yourusername"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="portfolioWebsite"
                  className="flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Portfolio / Personal Website
                </Label>
                <Input
                  id="portfolioWebsite"
                  type="url"
                  placeholder="https://yourportfolio.com"
                  value={portfolioWebsite}
                  onChange={(e) => setPortfolioWebsite(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <h3>Work Experience</h3>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addWorkExperience}
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
            </div>
            <p className="text-sm text-muted-foreground -mt-2 mb-4">
              Add your professional work history to validate your experience
            </p>
            {workExperiences.length === 0 && (
              <div className="p-6 border border-dashed rounded-lg text-center text-muted-foreground">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No work experience added yet</p>
                <p className="text-xs mt-1">
                  Click &quot;Add Experience&quot; to showcase your professional
                  background
                </p>
              </div>
            )}
            {workExperiences.map((exp, index) => (
              <div
                key={exp.id}
                className="p-4 border rounded-lg space-y-3 bg-muted/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">Experience #{index + 1}</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeWorkExperience(exp.id)}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      placeholder="e.g., TechCorp Inc"
                      value={exp.company}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "company", e.target.value)
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input
                      placeholder="e.g., Senior Developer"
                      value={exp.position}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "position", e.target.value)
                      }
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="month"
                      value={exp.startDate}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "startDate", e.target.value)
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="month"
                      value={exp.endDate}
                      onChange={(e) =>
                        updateWorkExperience(exp.id, "endDate", e.target.value)
                      }
                      disabled={exp.current || loading}
                    />
                  </div>
                  <div className="flex items-center pt-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) =>
                          updateWorkExperience(
                            exp.id,
                            "current",
                            e.target.checked,
                          )
                        }
                        className="w-4 h-4"
                        disabled={loading}
                      />
                      <span className="text-sm">Current Role</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description & Achievements</Label>
                  <Textarea
                    placeholder="Describe your responsibilities, achievements, and impact..."
                    value={exp.description}
                    onChange={(e) =>
                      updateWorkExperience(exp.id, "description", e.target.value)
                    }
                    rows={3}
                    disabled={loading}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h3>Education</h3>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addEducation}
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Education
              </Button>
            </div>
            {educationList.length === 0 && (
              <div className="p-6 border border-dashed rounded-lg text-center text-muted-foreground">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No education added yet</p>
              </div>
            )}
            {educationList.map((edu, index) => (
              <div
                key={edu.id}
                className="p-4 border rounded-lg space-y-3 bg-muted/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">Education #{index + 1}</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeEducation(edu.id)}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <Input
                      placeholder="e.g., Stanford University"
                      value={edu.institution}
                      onChange={(e) =>
                        updateEducation(edu.id, "institution", e.target.value)
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Degree</Label>
                    <Input
                      placeholder="e.g., Bachelor of Science"
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(edu.id, "degree", e.target.value)
                      }
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Field of Study</Label>
                    <Input
                      placeholder="e.g., Computer Science"
                      value={edu.field}
                      onChange={(e) =>
                        updateEducation(edu.id, "field", e.target.value)
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Graduation Year</Label>
                    <Input
                      placeholder="e.g., 2020"
                      value={edu.graduationYear}
                      onChange={(e) =>
                        updateEducation(
                          edu.id,
                          "graduationYear",
                          e.target.value,
                        )
                      }
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <h3>Certifications & Credentials</h3>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addCertification}
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Certification
              </Button>
            </div>
            <p className="text-sm text-muted-foreground -mt-2 mb-4">
              Professional certifications help validate your expertise
            </p>
            {certifications.length === 0 && (
              <div className="p-6 border border-dashed rounded-lg text-center text-muted-foreground">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No certifications added yet</p>
              </div>
            )}
            {certifications.map((cert, index) => (
              <div
                key={cert.id}
                className="p-4 border rounded-lg space-y-3 bg-muted/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">Certification #{index + 1}</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCertification(cert.id)}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Certification Name</Label>
                    <Input
                      placeholder="e.g., AWS Certified Solutions Architect"
                      value={cert.name}
                      onChange={(e) =>
                        updateCertification(cert.id, "name", e.target.value)
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Issuing Organization</Label>
                    <Input
                      placeholder="e.g., Amazon Web Services"
                      value={cert.issuer}
                      onChange={(e) =>
                        updateCertification(cert.id, "issuer", e.target.value)
                      }
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Issue Year</Label>
                    <Input
                      placeholder="e.g., 2023"
                      value={cert.issueYear}
                      onChange={(e) =>
                        updateCertification(cert.id, "issueYear", e.target.value)
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Credential ID</Label>
                    <Input
                      placeholder="e.g., ABC123XYZ"
                      value={cert.credentialId}
                      onChange={(e) =>
                        updateCertification(
                          cert.id,
                          "credentialId",
                          e.target.value,
                        )
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Credential URL</Label>
                    <Input
                      type="url"
                      placeholder="Verification link"
                      value={cert.credentialUrl}
                      onChange={(e) =>
                        updateCertification(
                          cert.id,
                          "credentialUrl",
                          e.target.value,
                        )
                      }
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3>Portfolio & Projects</h3>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addPortfolioItem}
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </div>
            <p className="text-sm text-muted-foreground -mt-2 mb-4">
              Showcase your best work to stand out to founders
            </p>
            {portfolioItems.length === 0 && (
              <div className="p-6 border border-dashed rounded-lg text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No portfolio items added yet</p>
              </div>
            )}
            {portfolioItems.map((item, index) => (
              <div
                key={item.id}
                className="p-4 border rounded-lg space-y-3 bg-muted/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">Project #{index + 1}</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removePortfolioItem(item.id)}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Project Title</Label>
                  <Input
                    placeholder="e.g., E-commerce Platform Redesign"
                    value={item.title}
                    onChange={(e) =>
                      updatePortfolioItem(item.id, "title", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe what you built, technologies used, and the impact..."
                    value={item.description}
                    onChange={(e) =>
                      updatePortfolioItem(item.id, "description", e.target.value)
                    }
                    rows={3}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project URL</Label>
                  <Input
                    type="url"
                    placeholder="https://github.com/... or live demo link"
                    value={item.url}
                    onChange={(e) =>
                      updatePortfolioItem(item.id, "url", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h3>Availability & Preferences</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">
                  Years of Experience (for display)
                </Label>
                <select
                  id="experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  disabled={loading}
                  className="w-full h-10 px-3 rounded-md border border-border/70 bg-background text-foreground text-sm"
                >
                  <option value="">Select experience level...</option>
                  <option value="0-1 years">0-1 years</option>
                  <option value="1-3 years">1-3 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5-10 years">5-10 years</option>
                  <option value="10+ years">10+ years</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Displayed on your profile card
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability">When can you start?</Label>
                <select
                  id="availability"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  disabled={loading}
                  className="w-full h-10 px-3 rounded-md border border-border/70 bg-background text-foreground text-sm"
                >
                  <option value="">Select availability...</option>
                  <option value="Immediately">Immediately</option>
                  <option value="In 1 week">In 1 week</option>
                  <option value="In 2 weeks">In 2 weeks</option>
                  <option value="In 1 month">In 1 month</option>
                  <option value="Flexible">Flexible</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Displayed on your profile card
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availabilityStatus">Current status</Label>
                <select
                  id="availabilityStatus"
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value)}
                  disabled={loading}
                  className="w-full h-10 px-3 rounded-md border border-border/70 bg-background text-foreground text-sm"
                >
                  <option value="">Select status...</option>
                  <option value="actively-looking">Actively Looking</option>
                  <option value="open-to-offers">Open to Offers</option>
                  <option value="casually-browsing">Casually Browsing</option>
                  <option value="not-looking">
                    Not Looking (Just Networking)
                  </option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredCommitment">Preferred commitment</Label>
                <select
                  id="preferredCommitment"
                  value={preferredCommitment}
                  onChange={(e) => setPreferredCommitment(e.target.value)}
                  disabled={loading}
                  className="w-full h-10 px-3 rounded-md border border-border/70 bg-background text-foreground text-sm"
                >
                  <option value="">Select commitment...</option>
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="contract">Contract/Freelance</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h3>Career Goals & Industry Preferences</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="professionalGoals">Professional goals</Label>
              <Textarea
                id="professionalGoals"
                placeholder="Describe your career goals, aspirations, and what you're looking for in your next role..."
                value={professionalGoals}
                onChange={(e) => setProfessionalGoals(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interests">
                Industry interests (shown on profile card)
              </Label>
              <Input
                id="interests"
                placeholder="e.g., FinTech, HealthTech, AI/ML, SaaS"
                value={interests.join(", ")}
                onChange={(e) =>
                  setInterests(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Separate industries with commas. These will be shown on your
                profile card.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industryPreferences">
                Other industry preferences (optional)
              </Label>
              <Input
                id="industryPreferences"
                placeholder="e.g., Technology, Healthcare, Finance"
                value={industryPreferences.join(", ")}
                onChange={(e) =>
                  setIndustryPreferences(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Additional industries you&apos;re interested in beyond your
                primary interests.
              </p>
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-primary" />
              <h3>Resume / CV</h3>
            </div>
            <div className="border-2 border-dashed border-border/70 rounded-lg p-8 text-center bg-muted/30">
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">
                Upload your resume to provide complete work history
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
              >
                Choose File
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, DOC, or DOCX (max 5MB)
              </p>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-border/70 pt-4 sm:flex-row sm:justify-between sm:items-center">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            Back
          </Button>
        ) : (
          <span className="hidden sm:block sm:w-24" aria-hidden />
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:ml-auto">
          {step === 1 && (
            <Button
              type="button"
              disabled={loading}
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
            >
              Next
            </Button>
          )}
          {step === 2 && (
            <Button type="button" disabled={loading} onClick={() => setStep(3)}>
              Next
            </Button>
          )}
          {step === 3 && (
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Complete profile"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
});

export default TalentProfileForm;
