# DwellGuard demo: fast recording route

## What you are demonstrating

DwellGuard handles a delayed truck arrival without making up a solution.

1. Dispatcher sets strict limits.
2. The driver gives a realistic arrival window.
3. DwellGuard asks the dock for an appointment only inside that window.
4. If it is valid, it issues a driver-ready appointment pass.
5. If the dock asks for an unapproved fee, it stops and escalates to a dispatcher.

The calls in this public demo are a deterministic offline replay. No live calls are placed and no real phone numbers are needed.

## Setup

- Use the deployed site.
- Open `/demo` on the laptop in a normal browser window.
- Set browser zoom to 90% if needed.
- Select **Positive Flow** and **Speed: 2x**.
- Start a screen recording.
- Do **not** log in and do **not** use the private dispatcher dashboard.
- A second phone is optional, not required.

## The main recording — 60 to 75 seconds

1. Start on **/demo**. Pause briefly on the banner: *Offline replay. No call is being placed*.
2. Say: “A late arrival normally creates disconnected calls and guesswork. DwellGuard carries one change into one confirmed dock plan.”
3. Point to the Play control and press **Play the 45-Second Flow**.
4. Let the four steps play without clicking elsewhere:
   - Authority frozen and driver call
   - Driver window changes the feasible appointment
   - Dock confirmation
   - Driver acknowledgement
5. Point to the Plan Rail and the Appointment Pass. Say: “The appointment is issued only after the driver’s workable window and the dock confirmation agree.”
6. Stop the main recording after the final confirmed pass is visible.

## Optional 10-second phone shot

Use this only as a cutaway after the laptop flow finishes.

- On the laptop, use the final driver handoff URL shown by the confirmed pass.
- Open that same URL on one phone.
- Record the phone showing the revised appointment and tap **Acknowledge appointment**.
- Cut back to the laptop final receipt/acknowledgement state.

You do **not** need two personal phones side by side. One phone is enough, and the entire demo still works with laptop screen recording only.

## Safety / edge-case proof — 15 seconds

After the main positive flow, select **Fee Refusal Flow**, keep 2x speed, and press Play.

Stop when the red *Dispatcher Needed* outcome appears. Say:
“DwellGuard does not turn a bad deal green. When the dock requests a $350 fee above the authorised $150 ceiling, it stops and escalates with the evidence.”

## Do not show

- Terminal commands
- Antigravity
- Login/password screens
- Environment variables
- Long waiting/loading sections
- Two phones pretending to receive live calls

## If a link looks invalid

Refresh the deployed site once, return to `/demo`, run the Positive Flow again, and use the freshly generated handoff link only after the confirmed pass appears. The public replay is intentionally isolated and deterministic.
