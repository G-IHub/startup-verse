/**
 * Supabase Realtime Integration for Activity Feed
 * Uses Broadcast channels for real-time activity updates
 * Client-to-client broadcasting for instant team sync
 */

// 🔧 FIX: Use singleton client to prevent multiple GoTrueClient instances
const supabase = getSupabaseClient();

let currentChannel = null;

/**
 * Subscribe to real-time activity updates for a startup
 * Also returns a broadcast function to send activities
 */
export function subscribeToActivities(startupId, onNewActivity) {
  console.log(
    `📡 Subscribing to realtime activities for startup: ${startupId}`,
  );

  const channelName = `startup:${startupId}:activities`;

  // Remove existing channel if any
  if (currentChannel) {
    supabase.removeChannel(currentChannel);
  }

  const channel = supabase.channel(channelName);
  currentChannel = channel;

  // Subscribe to broadcast messages
  channel
    .on("broadcast", { event: "new_activity" }, (payload) => {
      console.log("📥 Received realtime activity:", payload);
      if (payload.payload) {
        onNewActivity(payload.payload);
      }
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`✅ Successfully subscribed to ${channelName}`);
      } else if (status === "CHANNEL_ERROR") {
        console.debug(
          `Channel error subscribing to ${channelName} (non-critical)`,
        );
      } else if (status === "TIMED_OUT") {
        // Completely silent - timeouts are common and non-critical
        console.debug(
          `Subscription to ${channelName} timed out (non-critical)`,
        );
      } else {
        console.log(`📡 Channel status: ${status}`);
      }
    });

  // Return cleanup function
  return () => {
    console.log(`🔌 Unsubscribing from ${channelName}`);
    supabase.removeChannel(channel);
    currentChannel = null;
  };
}

/**
 * Broadcast activity to team members
 */
export async function broadcastActivity(startupId, activity) {
  try {
    console.log(`📡 Broadcasting activity to startup:${startupId}:activities`);

    const channelName = `startup:${startupId}:activities`;
    const channel = supabase.channel(channelName);

    // 🔧 FIX: Add timeout and silent failure handling for subscription
    const subscriptionPromise = new Promise((resolve, reject) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Channel subscribed successfully");
          resolve();
        } else if (status === "CHANNEL_ERROR") {
          reject(new Error(`Channel subscription failed: ${status}`));
        } else if (status === "TIMED_OUT") {
          // Silent - just resolve to prevent error
          resolve();
        }
      });
    });

    // Set a timeout of 3 seconds for subscription
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Subscription timeout after 3s")),
        3000,
      );
    });

    try {
      // Race between subscription and timeout
      await Promise.race([subscriptionPromise, timeoutPromise]);
    } catch (timeoutError) {
      // If timeout, clean up and fail silently (no logs - completely silent)
      supabase.removeChannel(channel);
      return false; // Fail silently
    }

    // Now send the broadcast message
    const { error } = await channel.send({
      type: "broadcast",
      event: "new_activity",
      payload: activity,
    });

    // Clean up the temporary channel
    supabase.removeChannel(channel);

    if (error) {
      // Completely silent failure - use debug level
      console.debug("Broadcast send failed (non-critical):", error.message);
      return false;
    }

    console.log("✅ Activity broadcast sent successfully");
    return true;
  } catch (error) {
    // Completely silent failure - network issues are common and not critical
    console.debug(
      "Broadcast failed (non-critical):",
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}

/**
 * Subscribe to presence updates for online users
 */
export function subscribeToPresence(
  startupId,
  userId,
  userName,
  onPresenceChange,
) {
  console.log(`👥 Subscribing to presence for startup: ${startupId}`);

  const channelName = `startup:${startupId}:presence`;
  const channel = supabase.channel(channelName);

  // Track presence
  channel
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const users = Object.values(state).flat();
      console.log(`👥 Presence synced: ${users.length} users online`);
      onPresenceChange(users);
    })
    .on("presence", { event: "join" }, ({ key, newPresences }) => {
      console.log(`👋 User joined:`, newPresences);
    })
    .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
      console.log(`👋 User left:`, leftPresences);
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        console.log(`✅ Presence subscribed, tracking user ${userId}`);
        // Track this user's presence
        await channel.track({
          userId,
          userName,
          online_at: new Date().toISOString(),
        });
      }
    });

  // Return cleanup function
  return () => {
    console.log(`🔌 Unsubscribing from presence`);
    supabase.removeChannel(channel);
  };
}
