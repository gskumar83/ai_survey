export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden font-sans text-[#12315B]"
         style={{
           background: 'radial-gradient(1200px 700px at 15% 10%, rgba(38, 198, 218, 0.18), transparent 70%), radial-gradient(1000px 700px at 85% 85%, rgba(15, 174, 170, 0.16), transparent 65%), linear-gradient(135deg, #DCEAF4 0%, #C8E0F0 45%, #BBD9EB 100%)'
         }}>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[#12315B]/15 px-6 py-3.5">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-4 text-inherit no-underline">
            <img
              src="/assets/visteria-logo.png"
              alt="Visteria Consulting Services Logo"
              className="h-11 w-auto object-contain block"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-[#102A43] tracking-wide uppercase">
                Visteria Consulting Services
              </span>
              <span className="text-[11.5px] font-semibold text-[#0D8F8A] italic tracking-wide">
                Vision Changes Everything.
              </span>
            </div>
          </a>

          <nav className="flex items-center gap-3">
            <a
              href="/admin/visteria-admin-panel.html"
              id="navAdminBtn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13.5px] font-bold text-[#12315B] bg-white/70 border border-[#12315B]/15 hover:bg-white hover:border-[#12315B] transition shadow-sm"
            >
              Admin Portal
            </a>
            <a
              href="/employee/index.html"
              id="navEmployeeBtn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13.5px] font-bold text-white bg-gradient-to-r from-[#0FAEAA] to-[#0D8F8A] hover:from-[#14B8A6] hover:to-[#0F766E] transition shadow-md shadow-[#0FAEAA]/30"
            >
              Employee Portal
            </a>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1360px] mx-auto w-full px-6 py-12 md:py-16">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0FAEAA]/10 border border-[#0FAEAA]/30 text-[#0D8F8A] text-xs font-bold uppercase tracking-wider mb-5">
            <span className="w-2 h-2 rounded-full bg-[#0FAEAA] inline-block"></span>
            <span>PEOPLE & PROCESS EXCELLENCE PLATFORM</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-[#102A43] leading-tight tracking-tight mb-4">
            Transforming Workplace Culture & Process Excellence
          </h1>
          <p className="text-base md:text-lg text-[#486581] leading-relaxed">
            A unified platform powering comprehensive organizational diagnostics, anonymous employee surveys, and strategic decision analytics. Select your portal to continue.
          </p>
        </section>

        {/* Two Portals Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-7 max-w-4xl mx-auto mb-16">
          {/* Card 1: Admin Portal */}
          <article className="bg-white/90 backdrop-blur-xl border border-white/90 rounded-2xl p-8 shadow-lg shadow-[#102A43]/5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#102A43]/10 border border-[#102A43]/15 text-[#102A43] flex items-center justify-center mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
              </div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#102A43]/10 text-[#102A43] mb-3">
                Enterprise Governance
              </span>
              <h2 className="text-2xl font-extrabold text-[#102A43] mb-2">Admin Portal</h2>
              <p className="text-[14.5px] text-[#486581] leading-relaxed mb-6">
                Unified administration console for Super Administrators and Organization Administrators to configure diagnostic cycles and analyze results.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2.5 text-[13.5px] text-[#12315B]">
                  <span className="text-[#0FAEAA] font-bold text-sm">✓</span>
                  <span><strong>Unified Sign In:</strong> Super Admin and Organization Admin authenticate via a single form.</span>
                </li>
                <li className="flex items-start gap-2.5 text-[13.5px] text-[#12315B]">
                  <span className="text-[#0FAEAA] font-bold text-sm">✓</span>
                  <span><strong>Strict Organization Isolation:</strong> Role-based data boundaries protecting company privacy.</span>
                </li>
                <li className="flex items-start gap-2.5 text-[13.5px] text-[#12315B]">
                  <span className="text-[#0FAEAA] font-bold text-sm">✓</span>
                  <span><strong>Real-Time Analytics:</strong> Executive reporting, department health metrics, and strategic insights.</span>
                </li>
              </ul>
            </div>

            <a
              href="/admin/visteria-admin-panel.html"
              id="cardAdminBtn"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-bold text-white bg-[#102A43] hover:bg-[#1B3A5A] transition shadow-md"
            >
              <span>Admin Login</span>
              <span className="text-lg">→</span>
            </a>
          </article>

          {/* Card 2: Employee Portal */}
          <article className="bg-white/90 backdrop-blur-xl border border-white/90 rounded-2xl p-8 shadow-lg shadow-[#102A43]/5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#0FAEAA]/15 border border-[#0FAEAA]/30 text-[#0D8F8A] flex items-center justify-center mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#0FAEAA]/15 text-[#0D8F8A] mb-3">
                Confidential Feedback
              </span>
              <h2 className="text-2xl font-extrabold text-[#102A43] mb-2">Employee Portal</h2>
              <p className="text-[14.5px] text-[#486581] leading-relaxed mb-6">
                Secure, confidential survey portal for enterprise team members to participate in scheduled organization excellence cycles.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2.5 text-[13.5px] text-[#12315B]">
                  <span className="text-[#0FAEAA] font-bold text-sm">✓</span>
                  <span><strong>Confidential Survey Participation:</strong> Strict aggregation safeguards protect individual identities.</span>
                </li>
                <li className="flex items-start gap-2.5 text-[13.5px] text-[#12315B]">
                  <span className="text-[#0FAEAA] font-bold text-sm">✓</span>
                  <span><strong>Direct Cycle Links:</strong> Seamlessly resume or start your assigned organization survey cycle.</span>
                </li>
                <li className="flex items-start gap-2.5 text-[13.5px] text-[#12315B]">
                  <span className="text-[#0FAEAA] font-bold text-sm">✓</span>
                  <span><strong>Multilingual Experience:</strong> Complete questionnaires in your preferred organizational language.</span>
                </li>
              </ul>
            </div>

            <a
              href="/employee/index.html"
              id="cardEmployeeBtn"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-[#0FAEAA] to-[#0D8F8A] hover:from-[#14B8A6] hover:to-[#0F766E] transition shadow-md shadow-[#0FAEAA]/30"
            >
              <span>Employee Login</span>
              <span className="text-lg">→</span>
            </a>
          </article>
        </section>

        {/* Capabilities Section */}
        <section className="bg-white/70 backdrop-blur-md border border-[#12315B]/15 rounded-2xl p-8 max-w-4xl mx-auto">
          <h3 className="text-center text-xs font-extrabold text-[#0D8F8A] uppercase tracking-widest mb-7">
            Core Platform Capabilities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="font-bold text-[#102A43] flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#0FAEAA]"></span>
                <span>Diagnostic Frameworks</span>
              </div>
              <p className="text-[13.5px] text-[#486581] leading-relaxed">
                Standardized cross-functional surveys measuring process adherence, collaboration, leadership alignment, and operational clarity.
              </p>
            </div>
            <div>
              <div className="font-bold text-[#102A43] flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#0FAEAA]"></span>
                <span>Organizational Privacy</span>
              </div>
              <p className="text-[13.5px] text-[#486581] leading-relaxed">
                Guaranteed data isolation between organizations, enterprise identity validation, and anonymized feedback aggregation.
              </p>
            </div>
            <div>
              <div className="font-bold text-[#102A43] flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#0FAEAA]"></span>
                <span>Executive Intelligence</span>
              </div>
              <p className="text-[13.5px] text-[#486581] leading-relaxed">
                Automated executive dashboards, department benchmarking, trend tracking, and downloadable PDF summary reports.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#102A43]/95 text-[#D2E4F0] border-t border-white/10 px-6 py-8 mt-auto text-center">
        <div className="max-w-[1360px] mx-auto flex flex-col items-center gap-3">
          <div className="text-sm font-bold text-white tracking-wide">
            Visteria Consulting Services Private Limited
          </div>
          <div className="text-xs text-[#80DEEA] italic">
            PEOPLE & PROCESS EXCELLENCE • Vision Changes Everything.
          </div>
          <div className="text-xs text-[#9FB3C8] max-w-xl leading-relaxed">
            © 2026 Visteria Consulting Services Private Limited. All rights reserved. Authorized access only.
          </div>
        </div>
      </footer>
    </div>
  );
}
