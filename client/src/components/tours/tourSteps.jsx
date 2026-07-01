// Welcome tour for founders on the homepage
export const homepageTourSteps = [
  {
    target: "body",
    content: (
      <div>
        <h3
          style={{
            marginBottom: "12px",
          }}
        >
          Welcome to StartupVerse! 🚀
        </h3>
        <p
          style={{
            marginBottom: "8px",
          }}
        >
          Your complete virtual company operating system for building startups
          from idea to operating company.
        </p>
        <p
          style={{
            fontSize: "13px",
            opacity: 0.8,
          }}
        >
          Let's take a quick tour to show you around. This will only take 2
          minutes!
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="dashboard"]',
    content: (
      <div>
        <h3
          style={{
            marginBottom: "8px",
          }}
        >
          Home Dashboard
        </h3>
        <p>
          Your command center. See your weekly outcomes, team activity, and
          quick actions all in one place.
        </p>
      </div>
    ),
    placement: "right",
    spotlightClicks: true,
  },
  {
    target: '[data-tour="virtual-office"]',
    content: (
      <div>
        <h3
          style={{
            marginBottom: "8px",
          }}
        >
          Virtual Office 🏢
        </h3>
        <p>
          Your immersive workspace with video calls, messaging, team
          collaboration, and more. Work with your team in real-time.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="team-matching"]',
    content: (
      <div>
        <h3
          style={{
            marginBottom: "8px",
          }}
        >
          Smart Team Matching 🤝
        </h3>
        <p>
          AI-powered matching to find co-founders, developers, designers, and
          other talent for your startup.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="inbox"]',
    content: (
      <div>
        <h3
          style={{
            marginBottom: "8px",
          }}
        >
          Inbox 📬
        </h3>
        <p>
          Manage all your invitations, interests, and team communications in one
          place.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="profile-menu"]',
    content: (
      <div>
        <h3
          style={{
            marginBottom: "8px",
          }}
        >
          Profile & Settings ⚙️
        </h3>
        <p
          style={{
            marginBottom: "8px",
          }}
        >
          Access your profile and account settings here.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="theme-toggle"]',
    content: (
      <div>
        <h3
          style={{
            marginBottom: "8px",
          }}
        >
          Dark Mode Toggle 🌓
        </h3>
        <p>Switch between light and dark modes to match your preference.</p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: "body",
    content: (
      <div>
        <h3
          style={{
            marginBottom: "12px",
          }}
        >
          You're All Set! ✨
        </h3>
        <p
          style={{
            marginBottom: "8px",
          }}
        >
          Ready to start building your startup? Here's what to do next:
        </p>
        <ol
          style={{
            marginLeft: "20px",
            fontSize: "14px",
          }}
        >
          <li
            style={{
              marginBottom: "8px",
            }}
          >
            <strong>Click "Office"</strong>
            {" to enter your Virtual Office"}
          </li>
          <li
            style={{
              marginBottom: "8px",
            }}
          >
            <strong>Use the Execution Engine</strong>
            {" to plan your weekly outcomes"}
          </li>
          <li
            style={{
              marginBottom: "8px",
            }}
          >
            <strong>Build your team</strong>
            {" with Smart Team Matching"}
          </li>
          <li>
            <strong>Export your data</strong>
            {" regularly from Settings"}
          </li>
        </ol>
      </div>
    ),
    placement: "center",
  },
];

// Virtual Office tour
export const virtualOfficeTourSteps = [
  {
    target: "body",
    content: (
      <div>
        <h3
          style={{
            marginBottom: "12px",
          }}
        >
          Welcome to the Virtual Office! 🏢
        </h3>
        <p>
          Your immersive workspace for collaboration. Let's explore the key
          features!
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="team-hub-button"]',
    content: (
      <div>
        <h3
          style={{
            marginBottom: "8px",
          }}
        >
          ✨ Team Hub
        </h3>
        <p
          style={{
            marginBottom: "8px",
          }}
        >
          Central place for team communication:
        </p>
        <ul
          style={{
            marginLeft: "20px",
            fontSize: "13px",
          }}
        >
          <li>Create and vote on polls</li>
          <li>Post announcements with priority levels</li>
          <li>View unified team feed</li>
          <li>Filter by type or priority</li>
        </ul>
        <p
          style={{
            fontSize: "12px",
            marginTop: "8px",
            opacity: 0.8,
          }}
        >
          {"Shortcut: Press "}
          <strong>⌘H</strong>
          {" or "}
          <strong>Ctrl+H</strong>
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="video-call-button"]',
    content: (
      <div>
        <h3
          style={{
            marginBottom: "8px",
          }}
        >
          Video Calls 📹
        </h3>
        <p>
          Start video calls with your team. The video interface floats over your
          workspace so you can multitask.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="messages-button"]',
    content: (
      <div>
        <h3
          style={{
            marginBottom: "8px",
          }}
        >
          Team Messages 💬
        </h3>
        <p>
          Open the messaging panel to chat with team members. Supports real-time
          messaging and notifications.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="tasks-button"]',
    content: (
      <div>
        <h3
          style={{
            marginBottom: "8px",
          }}
        >
          Task Management ✅
        </h3>
        <p>
          Manage your tasks and team assignments. Create, assign, and track
          progress all in one place.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: "body",
    content: (
      <div>
        <h3
          style={{
            marginBottom: "12px",
          }}
        >
          Virtual Office Tour Complete! 🎉
        </h3>
        <p
          style={{
            marginBottom: "8px",
          }}
        >
          You now know all the key features of the Virtual Office.
        </p>
        <p
          style={{
            fontSize: "13px",
            opacity: 0.8,
          }}
        >
          <strong>Pro Tip:</strong>
          {
            " Use keyboard shortcuts to work faster. Hover over buttons to see shortcuts!"
          }
        </p>
      </div>
    ),
    placement: "center",
  },
];

// Journey tour (when user first clicks Startup Journey)
export const journeyTourSteps = [
  {
    target: "body",
    content: (
      <div>
        <h3
          style={{
            marginBottom: "12px",
          }}
        >
          Your Startup Journey 🗺️
        </h3>
        <p>
          This is your complete roadmap from idea to operating company. Let's
          explore how it works!
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="journey-stages"]',
    content: (
      <div>
        <h3
          style={{
            marginBottom: "8px",
          }}
        >
          6 Guided Stages
        </h3>
        <p
          style={{
            marginBottom: "8px",
          }}
        >
          Each stage represents a critical phase in building your startup:
        </p>
        <ul
          style={{
            marginLeft: "20px",
            fontSize: "13px",
          }}
        >
          <li>
            {"Work through stages "}
            <strong>sequentially</strong>
          </li>
          <li>Each stage has specific tools and templates</li>
          <li>Track your progress with completion percentages</li>
        </ul>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="journey-progress"]',
    content: (
      <div>
        <h3
          style={{
            marginBottom: "8px",
          }}
        >
          Overall Progress
        </h3>
        <p>
          Watch your overall completion percentage grow as you work through each
          stage. This shows how far you've come!
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="stage-card-first"]',
    content: (
      <div>
        <h3
          style={{
            marginBottom: "8px",
          }}
        >
          Click to Enter a Stage
        </h3>
        <p>
          Click on any stage card to dive in. Each stage has 50+ tools including
          templates, checklists, and frameworks.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: "body",
    content: (
      <div>
        <h3
          style={{
            marginBottom: "12px",
          }}
        >
          Ready to Start! 🚀
        </h3>
        <p
          style={{
            marginBottom: "8px",
          }}
        >
          {"Begin with "}
          <strong>Stage 1: Ideation & Validation</strong>
          {" to validate your startup idea before building."}
        </p>
        <p
          style={{
            fontSize: "13px",
            opacity: 0.8,
          }}
        >
          Remember: Building a startup is a journey, not a sprint. Take your
          time with each stage!
        </p>
      </div>
    ),
    placement: "center",
  },
];
