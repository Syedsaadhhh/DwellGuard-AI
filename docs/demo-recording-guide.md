# DwellGuard demo: real-call final route

## What the video proves

The main recording is a real DwellGuard coordination run using CALL-E. The deterministic `/demo` replay remains the safe judge path and the final guardrail proof; it is not presented as a live call.

DwellGuard handles a delayed truck without inventing a solution:

1. Dispatch freezes the time and fee limits.
2. CALL-E asks the driver for a workable arrival interval.
3. That structured answer constrains the dock call.
4. Code checks the dock commitment against the driver's interval and the operator's authority.
5. A valid plan becomes a signed driver handoff; an excessive fee or uncertain answer stops for a person.

## Recording setup

- Sign in before recording; never show the operator password.
- Record the laptop screen separately from the phone shots.
- Use only team-controlled or explicitly consented E.164 phone numbers.
- Phone A receives the driver call.
- Phone B receives the dock call.
- Phone B can film Phone A for the first call; swap devices for the second call.
- Blur phone numbers, call-account details, call IDs, and webhook URLs.
- Cut all typing, loading, ringing wait, and hold time.

## 1:58 edit

| Time | Picture | Proof |
| --- | --- | --- |
| 0:00–0:08 | Late-truck problem clip | Disconnected calls and unapproved fees |
| 0:08–0:18 | Real shipment desk | One bounded coordination run |
| 0:18–0:28 | Frozen authority; start coordination | Time and fee limits exist before dialing |
| 0:28–0:48 | Phone A receives the real driver call | Workable interval and permission |
| 0:48–0:59 | Driver evidence enters the live timeline | The first answer changes the second task |
| 0:59–1:19 | Phone B receives the real dock call | Concrete time, door, and fee |
| 1:19–1:36 | Appointment Pass appears | Deterministic policy check passes |
| 1:36–1:47 | Driver opens and acknowledges handoff | The confirmed plan reaches the driver |
| 1:47–1:55 | `/demo` fee-refusal outcome | $350 request exceeds $150 authority |
| 1:55–1:58 | End card | DwellGuard: the plan kept moving |

## Driver answer

Use the same future date and times entered in the incident form. Example:

> My earliest workable arrival is 4:10 PM, and the latest is 4:35 PM. You may select any dock appointment inside that window.

If CALL-E confirms:

> Yes. 4:10 to 4:35 is correct, and I approve a time inside that window.

## Dock answer

Keep the commitment inside the driver interval:

> We can confirm 4:20 PM at Door 7. There is no additional fee, and the appointment is approved for this load.

If CALL-E confirms:

> Confirmed: 4:20 PM, Door 7, zero fee, with no additional conditions.

## Narration

> A late truck does not create one problem. It creates disconnected calls, conflicting times, and fees nobody approved.

> DwellGuard turns that exception into one bounded coordination run.

> Before any call, dispatch freezes the workable window, fee ceiling, and escalation boundary.

> CALL-E returns the driver's real window as structured evidence. That answer changes what happens next.

> Code checks the dock commitment against the driver's window and the dispatcher's authority. Only a valid plan becomes a pass.

> The driver receives one final appointment—not another loose message.

> And when a dock asks for 350 dollars against a 150-dollar ceiling, DwellGuard stops instead of pretending the deal is safe.

> DwellGuard. The delay happened. The plan kept moving.

## Judge fallback

Open `/demo`, run Positive Flow at 2x, open and acknowledge the generated handoff, then run Fee Refusal Flow. The page is explicitly labeled as an offline replay and places no calls.

## Do not show

- Password entry
- Personal phone numbers
- Environment variables or credentials
- Antigravity or terminal windows
- Long dashboard tours
- The replay page described as a live call
