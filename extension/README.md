# Trackr Chrome extension

Save the current job listing to your Trackr dashboard from any job board.

## How to test (load unpacked)

1. **Run Trackr**  
   From the project root: `npm run dev` (app at http://localhost:3000).

2. **Get your API key**  
   Sign in at http://localhost:3000 → **Dashboard** → **Save from browser** → **Generate API key** → copy the key.

3. **Load the extension in Chrome**  
   - Open `chrome://extensions`.
   - Turn on **Developer mode** (top right).
   - Click **Load unpacked** and choose the `extension` folder in this repo.

4. **Configure the extension**  
   - Click the Trackr extension icon in the toolbar.
   - **Trackr URL**: leave as `http://localhost:3000` (or set your deployed app URL).
   - **API key**: paste the key you copied from the dashboard.
   - Click **Save key**.

5. **Save a job**  
   - Open any job listing page (e.g. a job on LinkedIn, Greenhouse, or any site with a URL).
   - Click the Trackr extension icon.
   - **Job URL** is filled from the current tab. Enter **Job title** and **Company** (or edit if needed).
   - Click **Save to Trackr**. You should see “Saved to Trackr.”
   - Open **Trackr** (or click “Open Trackr” in the popup) and confirm the job appears in your list.

## Production

For a deployed Trackr app, set **Trackr URL** to your app’s origin (e.g. `https://trackr.example.com`) and use an API key generated from that dashboard. Ensure `host_permissions` in `manifest.json` includes your origin (the manifest currently allows `https://*/*` for flexibility).
