import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  AuthField,
  authBtnPrimary,
  authFieldClass,
} from "../auth/AuthPrimitives";
import { cn } from "../ui/utils";
import {
  TALENT_SKILL_OPTIONS,
  TALENT_SKILL_OPTION_SET,
} from "../../domains/talent/talentSkillOptions";

const TalentOnboardingForm = forwardRef(function TalentOnboardingForm(
  { loading, onSubmit, initialData },
  ref,
) {
  const d = initialData || {};

  const [fullName, setFullName] = useState(
    () => d.fullName ?? d.name ?? "",
  );
  const [professionalTitle, setProfessionalTitle] = useState(
    () => d.professionalTitle ?? "",
  );
  const [skills, setSkills] = useState(() => {
    if (Array.isArray(d.skills)) return [...d.skills];
    return [];
  });
  const [customSkillDraft, setCustomSkillDraft] = useState("");

  const extraSkills = useMemo(
    () => skills.filter((s) => !TALENT_SKILL_OPTION_SET.has(s)),
    [skills],
  );

  const buildSubmissionData = () => ({
    fullName: fullName.trim(),
    professionalTitle: professionalTitle.trim(),
    skills: [...new Set(skills.map((s) => String(s).trim()).filter(Boolean))],
    email: initialData?.email || "",
  });

  const validate = () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return false;
    }
    if (!professionalTitle.trim()) {
      toast.error("Please enter your professional title.");
      return false;
    }
    if (skills.length === 0) {
      toast.error("Select at least one skill.");
      return false;
    }
    return true;
  };

  const submit = () => {
    if (!validate()) return;
    onSubmit(buildSubmissionData());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  useImperativeHandle(ref, () => ({
    triggerSubmit: submit,
    requestSubmit: submit,
  }));

  const addCustomSkill = () => {
    const skill = customSkillDraft.trim();
    if (!skill) return;
    setSkills((prev) => (prev.includes(skill) ? prev : [...prev, skill]));
    setCustomSkillDraft("");
  };

  const removeSkill = (skill) => {
    setSkills((prev) => prev.filter((x) => x !== skill));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" id="talent-onboarding-form">
      <AuthField id="fullName" label="Full name *">
        <Input
          id="fullName"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          disabled={loading}
          className={authFieldClass}
        />
      </AuthField>

      <AuthField id="professionalTitle" label="Professional title *">
        <Input
          id="professionalTitle"
          placeholder="e.g., Senior Full-Stack Developer"
          value={professionalTitle}
          onChange={(e) => setProfessionalTitle(e.target.value)}
          required
          disabled={loading}
          className={authFieldClass}
        />
      </AuthField>

      <div className="space-y-3">
        <p className="font-body text-sm text-text-heading">Skills *</p>
        <p className="text-xs text-text-muted -mt-1">
          Pick everything that applies — founders use this to find you.
        </p>
        <div className="grid max-h-[min(280px,45vh)] grid-cols-1 gap-x-3 gap-y-2 overflow-y-auto rounded-input border border-surface-border bg-surface-page p-3 sm:grid-cols-2">
          {TALENT_SKILL_OPTIONS.map((skill, idx) => {
            const id = `onboard-skill-${idx}`;
            return (
              <div key={skill} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={skills.includes(skill)}
                  onCheckedChange={(checked) => {
                    setSkills((prev) => {
                      if (checked === true) {
                        return prev.includes(skill) ? prev : [...prev, skill];
                      }
                      return prev.filter((x) => x !== skill);
                    });
                  }}
                  disabled={loading}
                />
                <label
                  htmlFor={id}
                  className="cursor-pointer select-none font-body text-sm leading-snug text-text-body"
                >
                  {skill}
                </label>
              </div>
            );
          })}
        </div>

        {extraSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {extraSkills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="flex items-center gap-1 rounded-full pr-1"
              >
                {skill}
                <button
                  type="button"
                  className="rounded-sm p-0.5 hover:bg-surface-border hover:text-destructive"
                  onClick={() => removeSkill(skill)}
                  disabled={loading}
                  aria-label={`Remove ${skill}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Input
            value={customSkillDraft}
            onChange={(e) => setCustomSkillDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomSkill();
              }
            }}
            placeholder="Add another skill…"
            disabled={loading}
            className={cn(authFieldClass, "text-sm")}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn("shrink-0", authFieldClass, "w-10 px-0")}
            onClick={addCustomSkill}
            disabled={loading || !customSkillDraft.trim()}
            aria-label="Add skill"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-center font-body text-xs text-text-muted">
        Bio, experience, and availability can be added anytime from Settings →
        Profile.
      </p>

      <Button
        type="submit"
        disabled={loading}
        className={cn("w-full", authBtnPrimary)}
      >
        {loading ? "Saving…" : "Continue to dashboard"}
      </Button>
    </form>
  );
});

export default TalentOnboardingForm;
