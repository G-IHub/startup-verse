import React, { useState, useEffect } from "react";

import AppLayout from "./layout/AppLayout";
import MessagingSystem from "./messaging/MessagingSystem";
import VideoCallSystem from "./video/VideoCallSystem";
import AdaptiveVirtualOffice from "./office/AdaptiveVirtualOffice";
import TeamManagement from "./team/TeamManagement";
import TaskBoard from "./tasks/TaskBoard";
import TeamMatching from "./TeamMatching";
import FounderJourney from "./FounderJourney";
import IdeationValidation from "./stages/IdeationValidation";
import CompanyFormation from "./stages/CompanyFormation";
import TeamBuilding from "./stages/TeamBuilding";
import ProductDevelopment from "./stages/ProductDevelopment";
import GoToMarket from "./stages/GoToMarket";
import Operations from "./stages/Operations";
import ProfileSetup from "./stages/ProfileSetup";
import PitchDeck from "./PitchDeck";
import SettingsPage from "./SettingsPage";

// Import updated dashboard components
import FounderDashboard from "./dashboards/FounderDashboard";
import TeamMemberDashboard from "./dashboards/TeamMemberDashboard";
import TalentDashboard from "./dashboards/TalentDashboard";
import MentorDashboard from "./dashboards/MentorDashboard";
import InvestorDashboard from "./dashboards/InvestorDashboard";
import FreelancerDashboard from "./dashboards/FreelancerDashboard";

export default function Dashboard({ user, onLogout, onUpdateUser }) {
  const [currentPage, setCurrentPage] = useState("startup-office");
  const [initialProfileEditing, setInitialProfileEditing] = useState(false);

  const handleNavigate = (page, options) => {
    setInitialProfileEditing(page === "settings" && options?.editProfile === true);
    setCurrentPage(page);
  };

  // Check URL hash for pagination test page (disabled for now)
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === "#pagination-test") {
        console.warn("Pagination test page temporarily disabled");
        // setCurrentPage('pagination-test');
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  const renderPageContent = () => {
    // Global pages available to all users
    switch (currentPage) {
      case "pagination-test":
        // if (PaginationTestPage) {
        //   return <PaginationTestPage userId={user.id} userRole={user.role as 'founder' | 'talent' | 'team-member'} />;
        // } else {
        //   return (
        //     <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        //       <div className="text-center">
        //         <h1 className="text-xl font-bold text-white mb-2">Test Page Not Available</h1>
        //         <p className="text-gray-400 text-sm">Pagination test page is not loaded in this build.</p>
        //       </div>
        //     </div>
        //   );
        // }
        return (
          <div className="min-h-screen bg-background p-6 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl font-bold text-white mb-2">
                Test Page Not Available
              </h1>
              <p className="text-gray-400 text-sm">
                Pagination test page is not loaded in this build.
              </p>
            </div>
          </div>
        );
      case "messages":
        return <MessagingSystem user={user} />;
      case "video-call":
        return <VideoCallSystem user={user} />;
      case "settings":
        return (
          <SettingsPage
            user={user}
            onUpdateUser={onUpdateUser}
            initialProfileEditing={initialProfileEditing}
          />
        );

      default:
        return renderRoleSpecificContent();
    }
  };

  const renderRoleSpecificContent = () => {
    switch (user.role) {
      case "founder":
        return renderFounderContent();
      case "team-member":
        return renderTeamMemberContent();
      case "talent":
        return renderTalentContent();
      case "mentor":
        return renderMentorContent();
      case "investor":
        return renderInvestorContent();
      case "freelancer":
        return renderFreelancerContent();
      default:
        return <div>Unknown user role</div>;
    }
  };

  const renderFounderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <FounderDashboard
            user={user}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
            onNavigate={setCurrentPage}
          />
        );
      case "journey":
        return (
          <FounderJourney
            user={user}
            onNavigate={(stage) => setCurrentPage(stage)}
          />
        );
      case "ideation":
        return (
          <IdeationValidation
            user={user}
            onBack={() => setCurrentPage("journey")}
          />
        );
      case "formation":
        return (
          <CompanyFormation
            user={user}
            onBack={() => setCurrentPage("journey")}
          />
        );
      case "team-building":
        return (
          <TeamBuilding
            user={user}
            onBack={() => setCurrentPage("journey")}
            onNavigate={setCurrentPage}
          />
        );
      case "product-dev":
        return (
          <ProductDevelopment
            user={user}
            onBack={() => setCurrentPage("journey")}
          />
        );
      case "go-to-market":
        return (
          <GoToMarket user={user} onBack={() => setCurrentPage("journey")} />
        );
      case "operations":
        return (
          <Operations user={user} onBack={() => setCurrentPage("journey")} />
        );
      case "pitch-deck":
        return (
          <PitchDeck user={user} onBack={() => setCurrentPage("dashboard")} />
        );
      case "profile-setup":
        return <ProfileSetup />;
      case "startup-office":
        return (
          <AdaptiveVirtualOffice
            user={user}
            onNavigate={setCurrentPage}
            onUpdateUser={onUpdateUser}
            view="workspace"
          />
        );
      case "team-matching":
        // If founder has a startup (has companyName, startupName, or startupId), show Team Management
        // Otherwise show Team Matching to find co-founders
        const hasStartup =
          user.role === "founder" &&
          (user.startupId ||
            user.profile?.startupName ||
            user.startupName ||
            user.companyName ||
            user.companyId);
        if (hasStartup) {
          console.log("✅ Founder has startup - showing Team Management");
          return <TeamManagement user={user} initialTab="overview" />;
        }
        console.log("❌ Founder has no startup - showing Team Matching");
        return <TeamMatching user={user} onNavigate={setCurrentPage} />;
      case "team":
      case "team:members":
      case "team:invitations":
      case "team:overview":
      case "team:performance":
      case "team:find-talent":
        // Extract the tab from the page format "team:tabName"
        const tabPart = currentPage.split(":")[1] || "overview";
        return <TeamManagement user={user} initialTab={tabPart} />;
      case "tasks":
        return <TaskBoard user={user} />;
      default:
        return (
          <FounderDashboard
            user={user}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
            onNavigate={setCurrentPage}
          />
        );
    }
  };

  const renderTeamMemberContent = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <TeamMemberDashboard
            user={user}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
          />
        );
      case "startup-office":
        return (
          <VirtualStartupOffice
            user={user}
            onNavigate={setCurrentPage}
            onUpdateUser={onUpdateUser}
          />
        );
      case "tasks":
        return <TaskBoard user={user} />;
      default:
        return (
          <TeamMemberDashboard
            user={user}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
          />
        );
    }
  };

  const renderTalentContent = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <TalentDashboard
            user={user}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
            onNavigate={handleNavigate}
          />
        );
      case "team-matching":
        return <TeamMatching user={user} onNavigate={handleNavigate} />;
      default:
        return (
          <TalentDashboard
            user={user}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  const renderMentorContent = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <MentorDashboard
            user={user}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
          />
        );
      default:
        return (
          <MentorDashboard
            user={user}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
          />
        );
    }
  };

  const renderInvestorContent = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <InvestorDashboard
            user={user}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
          />
        );
      default:
        return (
          <InvestorDashboard
            user={user}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
          />
        );
    }
  };

  const renderFreelancerContent = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <FreelancerDashboard
            user={user}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
          />
        );
      default:
        return (
          <FreelancerDashboard
            user={user}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
          />
        );
    }
  };

  return (
    <>
      <AppLayout
        user={user}
        onLogout={onLogout}
        currentPage={currentPage}
        onPageChange={handleNavigate}
      >
        {renderPageContent()}
      </AppLayout>
    </>
  );
}
