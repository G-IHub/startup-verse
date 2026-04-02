import React from "react";
import ProfileCompletionForm from "./ProfileCompletionForm";
export default function InlineProfileCompletion({
  user,
  role,
  onBack,
  onComplete,
  onUpdateUser,
}) {
  return (
    <ProfileCompletionForm
      user={user}
      role={role}
      onBack={onBack}
      onComplete={onComplete}
      onUpdateUser={onUpdateUser}
    />
  );
}
