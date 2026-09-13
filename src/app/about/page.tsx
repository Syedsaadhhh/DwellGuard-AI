import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="border-b border-edge pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink-primary">
          How DwellGuard Works
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          The delay happened. The plan kept moving.
        </p>
      </div>

      <div className="bg-canvas-paper border border-edge rounded-lg p-6 space-y-4 text-xs sm:text-sm text-ink-secondary leading-relaxed">
        <h2 className="text-base font-bold text-ink-primary">
          Sequential Authority Architecture
        </h2>
        <p>
          Freight delay tools frequently stop at sending an alert or placing an uncoordinated call.
          DwellGuard establishes a strict sequential authority chain:
        </p>

        <ol className="list-decimal list-inside space-y-2 pl-2 text-ink-primary font-medium">
          <li>
            <strong>Dispatcher Limits:</strong> The dispatcher freezes acceptable arrival times, maximum allowable accessorial fees, and a hard 2-call budget.
          </li>
          <li>
            <strong>Driver Verification:</strong> CALL-E calls the late driver to verify their actual workable check-in window and asks if they authorize automated scheduling inside that interval.
          </li>
          <li>
            <strong>Interval Reshaping:</strong> The driver&apos;s verified window is mathematically intersected with dispatcher limits. Impossible times fade on the Plan Rail, and the dock request is rewritten with the real overlap.
          </li>
          <li>
            <strong>Dock Commitment:</strong> CALL-E calls the receiving dock to confirm an explicit time and designated door within the driver&apos;s approved range, verifying fee boundaries.
          </li>
          <li>
            <strong>Driver Handoff:</strong> When confirmed, an official appointment pass is generated and delivered directly to the driver&apos;s mobile page for tap acknowledgment.
          </li>
        </ol>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-canvas-paper border border-edge rounded-lg p-5 space-y-2">
          <h3 className="font-bold uppercase text-ink-primary">Truthful Outcomes</h3>
          <ul className="space-y-1.5 text-ink-secondary">
            <li>
              <strong className="text-state-confirmed-text">Plan Confirmed:</strong> Both parties verified explicit slot inside approved boundaries.
            </li>
            <li>
              <strong className="text-action-primary">Driver Received:</strong> Driver tapped acknowledgment on scoped mobile handoff link.
            </li>
            <li>
              <strong className="text-state-failure-text">Dispatcher Needed:</strong> Fee exceeded, driver refused permission, or times conflicted. Never false green.
            </li>
          </ul>
        </div>

        <div className="bg-canvas-paper border border-edge rounded-lg p-5 space-y-2">
          <h3 className="font-bold uppercase text-ink-primary">Real vs. Simulated Replay</h3>
          <p className="text-ink-secondary">
            The public <Link href="/demo" className="text-action-primary font-semibold underline">/demo</Link> replay
            executes the full production domain state machine, interval math, and validation engine using an in-memory fixture transport.
            It cannot dial or consume telephony credits.
          </p>
          <p className="text-ink-muted text-[11px] pt-1">
            Live deployment connects to official <code className="text-ink-primary font-mono font-bold">@call-e/calle</code> server SDK when credentials are configured.
          </p>
        </div>
      </div>
    </div>
  );
}
