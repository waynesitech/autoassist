# Deploy: Main site (frontend) at /, Admin at /admin

So that **https://autoassist.com.my/** opens the main site (frontend) and **https://autoassist.com.my/admin** opens the admin dashboard (without redirecting the root to admin).

## 1. Build frontend and admin

```bash
cd /var/www/autoassist/frontend && npm run build
cd /var/www/autoassist/admin   && npm run build
```

## 2. Apache2 (recommended for this setup)

- Copy `apache-autoassist.conf` to `/etc/apache2/sites-available/autoassist.com.my.conf`.
- Enable required modules and site:
  ```bash
  sudo a2enmod rewrite proxy proxy_http headers ssl
  sudo a2ensite autoassist.com.my.conf
  ```
- Uncomment and set the SSL directives in the config if you use HTTPS (e.g. Let's Encrypt paths).
- **Remove any existing site or redirect** that sends `/` to `/admin` or `/admin/login`.
- Test and reload:
  ```bash
  sudo apache2ctl configtest && sudo systemctl reload apache2
  ```

## 3. Nginx (alternative)

- Copy `nginx-autoassist.conf` to your nginx site config (e.g. `/etc/nginx/sites-available/autoassist.com.my`).
- Ensure **root (/) serves the frontend** and **/admin** serves the admin app. Remove any redirect from `/` to `/admin/login`.
- Test and reload: `sudo nginx -t && sudo systemctl reload nginx`.

## 4. Troubleshooting: / still redirects to /admin

If typing the domain still sends you to `/admin`, **another Apache site is handling the request** or the active config still has the old DocumentRoot. Do this on the server:

### A. See which site is used for your domain

```bash
sudo apache2ctl -S
```

Look at **port 443**: the **first** (default) vhost listed for your domain is the one that serves https://autoassist.com.my. For example, if you see:

- `default server autoassist.com.my (.../autoassist.com.my-le-ssl.conf:2)`
- `port 443 namevhost autoassist.com.my (.../autoassist.com.my.conf:16)`

then **`autoassist.com.my-le-ssl.conf`** is the one actually serving HTTPS (certbot created it). You must edit **that** file and set `DocumentRoot` to `frontend/dist` there. Use the ready-made content in **`deploy/apache-autoassist-le-ssl.conf`** and replace the content of the `-le-ssl` file with it (see step C below).

### B. List enabled sites and disable the wrong one

```bash
ls -la /etc/apache2/sites-enabled/
```

If you have both `000-default.conf` and `autoassist.com.my.conf` (or similar), the **first** one in the list may be the default for HTTPS. Disable the one that should not handle autoassist.com.my (often the default site):

```bash
sudo a2dissite 000-default.conf
# or whatever filename is serving admin at /
sudo systemctl reload apache2
```

### C. Fix the SSL vhost (the one that actually serves HTTPS)

If `apache2ctl -S` shows **`autoassist.com.my-le-ssl.conf`** as the default for 443, that file is serving your domain. Update it:

1. Backup: `sudo cp /etc/apache2/sites-available/autoassist.com.my-le-ssl.conf /etc/apache2/sites-available/autoassist.com.my-le-ssl.conf.bak`
2. Replace its content with **`deploy/apache-autoassist-le-ssl.conf`** from this repo (or edit and set `DocumentRoot /var/www/autoassist/frontend/dist` and remove any redirect to `/admin`).
3. Keep existing `SSLCertificateFile`/`SSLCertificateKeyFile` if paths differ.
4. Reload: `sudo apache2ctl configtest && sudo systemctl reload apache2`

To find which file has the wrong DocumentRoot:

```bash
sudo grep -rn "DocumentRoot\|Redirect.*admin\|RewriteRule.*admin" /etc/apache2/sites-enabled/
```

If the wrong file is not the `-le-ssl` one, edit it and set `DocumentRoot /var/www/autoassist/frontend/dist` and remove any redirect to `/admin`.

### D. If you still get `302` to `/admin`

The SSL vhost file still has a **Redirect** or **RewriteRule** sending `/` to `/admin`. Find and remove it:

```bash
# Show lines that might redirect / to /admin
sudo grep -n "Redirect\|RewriteRule" /etc/apache2/sites-enabled/autoassist.com.my-le-ssl.conf
```

**Remove or comment out** any line that redirects root to admin, for example:

- `Redirect 302 / https://autoassist.com.my/admin`
- `Redirect permanent / /admin`
- `RewriteRule ^/$ /admin [R=302,L]`
- `RewriteRule ^/$ https://%{HTTP_HOST}/admin [R=302,L]`

Then: `sudo apache2ctl configtest && sudo systemctl reload apache2`

**Or** replace the **entire** content of `/etc/apache2/sites-available/autoassist.com.my-le-ssl.conf` with the content of **`deploy/apache-autoassist-le-ssl.conf`** (no redirect from `/` to `/admin` in that file).

### F. `/phpmyadmin` shows the main website instead of phpMyAdmin

The frontend vhost uses `FallbackResource /index.html`, so any path that is **not** a real file under `frontend/dist` (including `/phpmyadmin`) is served as the SPA unless Apache maps that URL elsewhere.

1. Install phpMyAdmin and Apache integration (Debian/Ubuntu):
   ```bash
   sudo apt update && sudo apt install phpmyadmin
   ```
   Complete the installer (dbconfig, web server: apache). That creates `/etc/phpmyadmin/apache.conf`.
2. Ensure the deploy configs include it: **`deploy/apache-autoassist.conf`** and **`deploy/apache-autoassist-le-ssl.conf`** use `IncludeOptional /etc/phpmyadmin/apache.conf` inside the `*:443` vhost. Copy or merge that into the file Apache actually uses (often `autoassist.com.my-le-ssl.conf` after certbot).
3. PHP for Apache: e.g. `sudo apt install libapache2-mod-php` (or configure `php-fpm` + proxy for `/usr/share/phpmyadmin`).
4. Test and reload:
   ```bash
   sudo apache2ctl configtest && sudo systemctl reload apache2
   ```
   If `configtest` errors with **duplicate Alias** for `/phpmyadmin`, disable the global snippet and keep only the vhost include:
   ```bash
   sudo a2disconf phpmyadmin
   ```

### E. Confirm the right site is serving

After reloading Apache:

```bash
curl -I https://autoassist.com.my/
```

You should see `X-AutoAssist-Site: frontend` and **no** `Location: .../admin`. If you still see a redirect, repeat D (remove the redirect line or replace the whole -le-ssl file).