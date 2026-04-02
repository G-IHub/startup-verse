# Jitsi Self-Hosting Guide for StartupVerse

## 🎯 Why Self-Host Jitsi?

**Current Setup (Free Public Jitsi):**

- ❌ Jitsi branding visible
- ❌ 5-minute embedded call limit
- ❌ No customization control
- ✅ Free
- ✅ Works immediately

**Self-Hosted Jitsi:**

- ✅ **100% white-label** - Remove ALL Jitsi branding
- ✅ **Unlimited call duration**
- ✅ **Full customization** - Colors, logos, features
- ✅ **Better performance** - Dedicated resources
- ✅ **Privacy & control** - Your data, your server
- ❌ ~$30-40/month hosting cost
- ❌ ~2-3 hours initial setup

---

## 💰 Cost Breakdown

### Recommended: DigitalOcean Droplet

- **$24/month** - 4GB RAM, 2 vCPUs (recommended minimum)
- **$48/month** - 8GB RAM, 4 vCPUs (better for 10+ concurrent users)
- **Domain**: $10-15/year (if you don't have one)
- **SSL Certificate**: FREE (Let's Encrypt)

**Total Monthly Cost: $24-48**

### Alternatives:

- **AWS EC2**: t3.medium (~$30/month)
- **Vultr**: $24/month (4GB plan)
- **Linode**: $24/month (4GB plan)
- **Hetzner**: €18/month (~$20) - Europe only

---

## 🛠️ Requirements

### Server Requirements:

- **OS**: Ubuntu 20.04 or 22.04 LTS (recommended)
- **RAM**: Minimum 4GB (8GB for production)
- **CPU**: 2+ cores
- **Bandwidth**: Unmetered or high limit
- **Public IP**: Static IP address
- **Ports**: 80, 443, 10000 (UDP), 4443, 5349 open

### Domain Requirements:

- A domain name you own (e.g., `call.startupverse.com`)
- DNS access to create A records

### Your Skills Needed:

- Basic command line knowledge
- SSH access to server
- 2-3 hours for initial setup

---

## 📋 Step-by-Step Installation

### Step 1: Create Your Server (DigitalOcean Example)

1. **Sign up at DigitalOcean** (or your preferred provider)
2. **Create a Droplet:**
   - Choose: Ubuntu 22.04 LTS
   - Plan: 4GB RAM / 2 vCPUs ($24/month)
   - Region: Closest to your users
   - Enable: IPv4
   - Add SSH key for secure access
3. **Note your server IP address** (e.g., 147.182.123.45)

### Step 2: Configure DNS

1. **Go to your domain registrar** (Namecheap, GoDaddy, Cloudflare, etc.)
2. **Add an A record:**
   ```
   Type: A
   Host: call (or meet, video, jitsi - your choice)
   Value: YOUR_SERVER_IP
   TTL: 300
   ```
3. **Wait 5-10 minutes** for DNS to propagate
4. **Verify:** `ping call.startupverse.com` should return your server IP

### Step 3: SSH into Your Server

```bash
# From your local terminal
ssh root@YOUR_SERVER_IP

# You're now in your server!
```

### Step 4: Install Jitsi Meet

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Set hostname
sudo hostnamectl set-hostname call.startupverse.com

# Add hostname to hosts file
echo "127.0.0.1 call.startupverse.com" | sudo tee -a /etc/hosts

# Install required packages
sudo apt install -y gnupg2 nginx-full

# Add Jitsi repository
curl https://download.jitsi.org/jitsi-key.gpg.key | sudo sh -c 'gpg --dearmor > /usr/share/keyrings/jitsi-keyring.gpg'
echo 'deb [signed-by=/usr/share/keyrings/jitsi-keyring.gpg] https://download.jitsi.org stable/' | sudo tee /etc/apt/sources.list.d/jitsi-stable.list > /dev/null

# Update and install Jitsi
sudo apt update
sudo apt install -y jitsi-meet

# During installation:
# - Enter your domain: call.startupverse.com
# - Choose "Generate a new self-signed certificate" (we'll replace with Let's Encrypt)
```

### Step 5: Install SSL Certificate (Let's Encrypt)

```bash
# Install Let's Encrypt SSL
sudo /usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh

# Enter your email when prompted
# Accept terms of service
```

✅ **Your Jitsi server is now live at:** `https://call.startupverse.com`

---

## 🎨 Step 6: White-Label Customization

### Remove Jitsi Branding & Customize

#### A. Edit Interface Config

```bash
sudo nano /etc/jitsi/meet/call.startupverse.com-config.js
```

Add/modify these settings:

```javascript
var config = {
  // ... existing config ...

  // Branding
  defaultLocalDisplayName: "me",
  defaultRemoteDisplayName: "Team Member",

  // Hide Jitsi watermark
  enableWelcomePage: false,

  // Disable pre-join page (faster joining)
  prejoinConfig: {
    enabled: false,
  },

  // Hide invite links
  disableInviteFunctions: true,

  // Customize toolbar
  toolbarButtons: [
    "camera",
    "chat",
    "closedcaptions",
    "desktop",
    "filmstrip",
    "fullscreen",
    "hangup",
    "microphone",
    "participants-pane",
    "raisehand",
    "recording",
    "settings",
    "shareaudio",
    "sharedvideo",
    "shortcuts",
    "stats",
    "tileview",
    "toggle-camera",
    "videoquality",
  ],
};
```

#### B. Edit Interface Settings

```bash
sudo nano /usr/share/jitsi-meet/interface_config.js
```

Modify these settings:

```javascript
var interfaceConfig = {
  // App name
  APP_NAME: "StartupVerse",

  // Remove Jitsi branding
  SHOW_JITSI_WATERMARK: false,
  SHOW_WATERMARK_FOR_GUESTS: false,
  SHOW_BRAND_WATERMARK: false,

  // Remove powered by
  SHOW_POWERED_BY: false,

  // Hide invite more
  HIDE_INVITE_MORE_HEADER: true,

  // Mobile app promo
  MOBILE_APP_PROMO: false,

  // Custom brand
  JITSI_WATERMARK_LINK: "https://startupverse.com",

  // Toolbar customization
  TOOLBAR_BUTTONS: [
    "microphone",
    "camera",
    "closedcaptions",
    "desktop",
    "fullscreen",
    "fodeviceselection",
    "hangup",
    "profile",
    "chat",
    "recording",
    "livestreaming",
    "etherpad",
    "sharedvideo",
    "settings",
    "raisehand",
    "videoquality",
    "filmstrip",
    "feedback",
    "stats",
    "shortcuts",
    "tileview",
    "videobackgroundblur",
    "download",
    "help",
    "mute-everyone",
    "security",
  ],

  // Customize colors (optional)
  DEFAULT_BACKGROUND: "#0F172A", // Slate-900 from StartupVerse
  DEFAULT_REMOTE_DISPLAY_NAME: "Team Member",
  DEFAULT_LOCAL_DISPLAY_NAME: "You",
};
```

#### C. Add Your Logo (Optional)

```bash
# Upload your logo to the server
# Replace the default Jitsi logo
sudo cp /path/to/your/logo.png /usr/share/jitsi-meet/images/watermark.png

# For the favicon
sudo cp /path/to/your/favicon.ico /usr/share/jitsi-meet/favicon.ico
```

#### D. Restart Services

```bash
sudo systemctl restart prosody
sudo systemctl restart jicofo
sudo systemctl restart jitsi-videobridge2
sudo nginx -t && sudo systemctl restart nginx
```

---

## 🔗 Step 7: Update StartupVerse Code

Update `/components/office/SimpleJitsiCall.tsx`:

```typescript
// Change this line:
const baseUrl = "https://meet.jit.si";

// To your domain:
const baseUrl = "https://call.startupverse.com";
```

That's it! Your calls now go to YOUR server with NO Jitsi branding! 🎉

---

## 🔒 Step 8: Secure Your Server (Optional but Recommended)

### Enable Authentication (Prevent Random People from Using Your Server)

```bash
# Install auth modules
sudo apt install -y lua5.2 liblua5.2-dev luarocks
sudo luarocks install luacrypto

# Configure Prosody for authentication
sudo nano /etc/prosody/conf.avail/call.startupverse.com.cfg.lua
```

Find and change:

```lua
authentication = "anonymous"
```

To:

```lua
authentication = "internal_hashed"
```

Add after the VirtualHost section:

```lua
VirtualHost "guest.call.startupverse.com"
    authentication = "anonymous"
    c2s_require_encryption = false
```

```bash
# Update Jitsi config
sudo nano /etc/jitsi/meet/call.startupverse.com-config.js
```

Add:

```javascript
var config = {
  hosts: {
    domain: "call.startupverse.com",
    anonymousdomain: "guest.call.startupverse.com",
    // ... other settings
  },
  // ... rest of config
};
```

```bash
# Update Jicofo
sudo nano /etc/jitsi/jicofo/sip-communicator.properties
```

Add:

```properties
org.jitsi.jicofo.auth.URL=XMPP:call.startupverse.com
```

```bash
# Create users (room creators)
sudo prosodyctl register admin call.startupverse.com YOUR_PASSWORD

# Restart services
sudo systemctl restart prosody jicofo jitsi-videobridge2
```

Now only authenticated users can **create** rooms, but anyone can **join** them.

---

## 📊 Step 9: Monitoring & Performance

### Check Server Health

```bash
# Check all services
sudo systemctl status prosody
sudo systemctl status jicofo
sudo systemctl status jitsi-videobridge2
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/jitsi/jvb.log
sudo tail -f /var/log/prosody/prosody.log
```

### Monitor Resource Usage

```bash
# Install htop
sudo apt install htop

# Run it
htop
```

**Guidelines:**

- RAM usage should stay under 70%
- CPU spikes during calls are normal
- If consistently over 80% RAM → upgrade server

### Enable Statistics (Optional)

```bash
sudo nano /etc/jitsi/meet/call.startupverse.com-config.js
```

Add:

```javascript
var config = {
  // ... other config

  // Enable stats
  callStatsID: "",
  enableDisplayNameInStats: true,
  enableEmailInStats: true,
};
```

---

## 🚀 Performance Optimization

### For 10+ Concurrent Users

#### Increase JVB Memory

```bash
sudo nano /etc/jitsi/videobridge/config
```

Change:

```bash
JVB_OPTS="--apis=rest"
```

To:

```bash
JVB_OPTS="--apis=rest -Xmx3072m -Xms1024m"
```

#### Enable OCTO (Multiple JVB Servers - Advanced)

For scaling beyond 50 users, you can add multiple video bridge servers. See: https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-scalable

---

## 🐛 Troubleshooting

### Problem: Can't connect to server

```bash
# Check firewall
sudo ufw status

# Open required ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 10000/udp
sudo ufw allow 4443/tcp
sudo ufw allow 5349/tcp
sudo ufw enable
```

### Problem: SSL certificate issues

```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal
```

### Problem: Audio/Video not working

```bash
# Check JVB config
sudo nano /etc/jitsi/videobridge/sip-communicator.properties

# Ensure this line has your PUBLIC IP:
org.ice4j.ice.harvest.NAT_HARVESTER_PUBLIC_ADDRESS=YOUR_PUBLIC_IP
```

### Problem: High CPU usage

- Upgrade to 4 vCPU server
- Enable hardware encoding (requires newer CPU)
- Add multiple JVB servers

---

## 📱 Mobile App Support

Your self-hosted Jitsi works with:

- ✅ **Web browsers** (Chrome, Firefox, Safari)
- ✅ **Jitsi Meet mobile apps** (iOS/Android) - Users can enter your domain
- ✅ **Embedded iframes** (what StartupVerse uses)

---

## 💡 Advanced Features

### Enable Recording (Requires Jibri)

Recording requires additional setup:

- Separate server or container for Jibri
- More resources (8GB+ RAM recommended)
- Storage for recordings
- Guide: https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-quickstart

### Enable Live Streaming

Jitsi supports streaming to:

- YouTube Live
- Facebook Live
- Custom RTMP endpoints

Same requirements as recording (Jibri).

### Enable Screen Sharing

Already enabled by default! Users can share:

- Entire screen
- Specific window
- Browser tab

---

## 🔄 Maintenance

### Weekly Tasks:

- Check server resource usage
- Review logs for errors

### Monthly Tasks:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check disk space
df -h

# Review backup status (if configured)
```

### Quarterly Tasks:

- Review and optimize costs
- Consider scaling if user base grows
- Update Jitsi version (if needed)

---

## 💰 Cost Optimization Tips

1. **Start small**: 4GB droplet for MVP
2. **Scale on demand**: Upgrade when you hit 80% resource usage
3. **Use snapshots**: DigitalOcean snapshots = easy backups ($0.05/GB/month)
4. **Monitor bandwidth**: Most providers include plenty
5. **Consider reserved instances**: AWS/GCP offer discounts for 1-year commits

---

## 🎯 Migration Checklist

When you're ready to move from free Jitsi to self-hosted:

- [ ] Purchase domain or choose subdomain
- [ ] Create server (DigitalOcean/AWS/etc)
- [ ] Configure DNS A record
- [ ] Install Jitsi via SSH
- [ ] Install SSL certificate
- [ ] White-label configuration
- [ ] Test video calls work
- [ ] Update StartupVerse baseUrl
- [ ] Deploy to production
- [ ] Monitor for 24 hours
- [ ] Celebrate! 🎉

---

## 📚 Additional Resources

- **Official Jitsi Docs**: https://jitsi.github.io/handbook/
- **Community Forum**: https://community.jitsi.org/
- **GitHub**: https://github.com/jitsi/jitsi-meet
- **DigitalOcean Tutorial**: https://www.digitalocean.com/community/tutorials/how-to-install-jitsi-meet-on-ubuntu-20-04
- **Scalability Guide**: https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-scalable

---

## 🤝 Need Help?

- **Jitsi Community**: Very active and helpful
- **DigitalOcean Support**: Good for server issues
- **Stack Overflow**: Search "jitsi" tag

---

## ✅ Summary

**Free Jitsi (Current):**

- Zero cost
- Jitsi branding
- 5-min embedded limit
- Perfect for MVP

**Self-Hosted ($24-48/month):**

- Full white-label
- Unlimited calls
- Your control
- Perfect for production

**Timeline:**

- Setup: 2-3 hours (one time)
- Maintenance: ~30 min/month
- ROI: Kicks in when branding matters to users

---

**Recommendation**:
Keep free Jitsi for MVP launch. Self-host when:

- You have 50+ active users
- Users request longer calls
- Brand consistency becomes important
- You need recording/streaming features

Good luck! 🚀
