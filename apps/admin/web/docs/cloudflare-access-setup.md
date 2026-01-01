# Cloudflare Access Setup for Admin Dashboard

This guide documents how to set up Cloudflare Zero Trust/Access authentication for the QuestLock Admin dashboard.

## Overview

The admin dashboard uses Cloudflare Access for authentication instead of Auth0. Cloudflare Access:

- Sets a `CF_Authorization` cookie containing a JWT token
- Provides user identity via `/cdn-cgi/access/get-identity` endpoint
- Handles authentication before requests reach the application

## Frontend Implementation

### 1. Authentication Hook

Created `services/dashboard/src/hooks/useCloudflareAccess.ts`:

**Key Features:**

- Reads `CF_Authorization` cookie to get the Bearer token
- Fetches user identity from `/cdn-cgi/access/get-identity`
- Provides logout function that redirects to `/cdn-cgi/access/logout`
- Returns `{ token, user, isLoading, error, logout }`

**Usage:**

```typescript
const { token, user, isLoading, error, logout } = useCloudflareAccess();
```

### 2. Updated Components

**AdminDashboard** (`services/dashboard/src/views/AdminDashboard.tsx`):

- Uses `useCloudflareAccess()` hook
- Includes Bearer token in API requests: `Authorization: Bearer ${token}`
- Shows loading/error states for authentication
- Removed Auth0's `withAuthenticationRequired` wrapper

**Header** (`services/dashboard/src/components/dashboard/Header.tsx`):

- Updated to use `CloudflareAccessIdentity` type instead of Auth0 user
- Removed Auth0-specific imports and picture handling
- Uses logout function from hook

## Local Development Setup with Cloudflare Tunnel

### Prerequisites

Install cloudflared:

```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Step 1: Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This opens a browser to select your Cloudflare account and authorize cloudflared.

### Step 2: Create a Named Tunnel

```bash
cloudflared tunnel create admin-local
```

**Output example:**

```
Created tunnel admin-local with id: abc123-def456-ghi789
Tunnel credentials written to /home/kieran/.cloudflared/abc123-def456-ghi789.json
```

Save the tunnel ID for the next steps.

### Step 3: Configure the Tunnel

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: admin-local
credentials-file: /home/kieran/.cloudflared/abc123-def456-ghi789.json

ingress:
  - hostname: admin-local.fernlabour.com
    service: http://localhost:5173
  - service: http_status:404
```

**Important:**

- Replace tunnel ID in credentials-file path
- Use `http://localhost:5173` (not https)
- The catch-all `service: http_status:404` is required

### Step 4: Configure DNS Route

```bash
cloudflared tunnel route dns admin-local admin-local.fernlabour.com
```

This creates a CNAME record in Cloudflare DNS automatically:

- **Type**: CNAME
- **Name**: admin-local
- **Target**: abc123-def456-ghi789.cfargotunnel.com
- **Proxy**: Enabled (orange cloud)

**Verify in Cloudflare Dashboard:**

1. Go to your domain → DNS → Records
2. Confirm the CNAME exists and points to `<tunnel-id>.cfargotunnel.com`

### Step 5: Configure Cloudflare Access Application

1. **Navigate to Zero Trust Dashboard:**

   - https://one.dash.cloudflare.com/
   - Select your Cloudflare account

2. **Create Access Application:**

   - Go to **Access** → **Applications** → **Add an application**
   - Select **Self-hosted**

3. **Application Configuration:**

   ```
   Application name: QuestLock Admin Local
   Session Duration: 24 hours
   Application domain: admin-local.fernlabour.com
   ```

4. **Configure Access Policy:**

   - **Policy name**: Allow Developers
   - **Action**: Allow
   - **Include rule**:
     - Emails → Add your email address
     - Or: Emails ending in `@yourdomain.com`

5. **Save the application**

### Step 6: Start the Dev Server and Tunnel

```bash
# Terminal 1: Start the admin app
cd /home/kieran/Documents/fern-labour
npm run dev:admin

# Terminal 2: Start the tunnel
cloudflared tunnel run admin-local
```

**Tunnel logs should show:**

```
Registered tunnel connection
```

### Step 7: Access the Application

Visit `https://admin-local.fernlabour.com` in your browser.

**Expected flow:**

1. Cloudflare Access login page appears
2. Authenticate with your email
3. Redirected to the admin app
4. `CF_Authorization` cookie is set
5. App fetches user identity and loads

## Troubleshooting

### DNS Not Resolving (NXDOMAIN)

**Symptom:** Browser shows "We're having trouble finding that site"

**Cause:** Local DNS cache not updated

**Fix:**

```bash
# Flush DNS cache
sudo resolvectl flush-caches

# Restart systemd-resolved
sudo systemctl restart systemd-resolved
```

**If still not working, add to /etc/hosts:**

```bash
# Get Cloudflare IP
dig @1.1.1.1 admin-local.fernlabour.com +short

# Add to /etc/hosts (replace X.X.X.X with actual IP)
echo "X.X.X.X admin-local.fernlabour.com" | sudo tee -a /etc/hosts
```

**Permanent fix - Use Cloudflare DNS:**

```bash
sudo nano /etc/systemd/resolved.conf
```

Add:

```ini
[Resolve]
DNS=1.1.1.1 1.0.0.1
FallbackDNS=8.8.8.8 8.8.4.4
```

Then restart:

```bash
sudo systemctl restart systemd-resolved
```

### Tunnel Connects But Site Won't Load

**Check local dev server:**

```bash
lsof -i :5173
curl http://localhost:5173
```

**Verify tunnel config:**

```bash
cat ~/.cloudflared/config.yml
```

**Check tunnel logs for errors** in the terminal where `cloudflared tunnel run` is running.

### CF_Authorization Cookie Not Set

- Ensure you're accessing via the Cloudflare URL (not localhost)
- Check Access policy allows your email
- Clear browser cookies and try again

### `/cdn-cgi/access/get-identity` Returns 404

- Verify you're accessing through the Cloudflare tunnel URL
- Confirm Access application is enabled in Zero Trust dashboard

## Production Deployment

For production, the same authentication flow works automatically when:

1. **DNS is configured** to point to your production deployment
2. **Cloudflare Access application** is set up for the production domain
3. **Frontend code** remains the same (no environment-specific changes needed)

The authentication hook automatically:

- Works in production with real Cloudflare Access
- Can be mocked in development (if needed) by checking `import.meta.env.DEV`

## Useful Commands

```bash
# List all tunnels
cloudflared tunnel list

# Get tunnel info
cloudflared tunnel info admin-local

# Check tunnel routes
cloudflared tunnel route dns

# Delete a tunnel (if needed)
cloudflared tunnel delete admin-local

# View real-time tunnel logs
cloudflared tunnel run admin-local
```

## Architecture Notes

### Token Flow

1. User authenticates with Cloudflare Access
2. Cloudflare sets `CF_Authorization` cookie containing JWT
3. Frontend reads cookie value
4. Frontend includes as `Authorization: Bearer <token>` in API requests
5. Backend validates JWT using authentication service

### User Identity

- User identity is fetched from `/cdn-cgi/access/get-identity`
- This endpoint is provided by Cloudflare Access automatically
- Returns: `{ email, name, user_uuid, ... }`
- No profile pictures available (unlike Auth0)

### Logout

- Logout redirects to `/cdn-cgi/access/logout`
- This is a Cloudflare-provided endpoint
- Clears the `CF_Authorization` cookie and session
