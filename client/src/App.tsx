import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

function RedirectToHtml({ target }: { target: string }) {
  const location = useLocation();

  useEffect(() => {
    const search = location.search || '';
    const hash = location.hash || '';
    window.location.replace(`${target}${search}${hash}`);
  }, [target, location]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 font-sans">
      <div className="text-center p-8">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-medium">Loading Visteria Portal...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Routes>
        {/* Default route -> Unified Sign In / Employee Landing (Screenshot 1) */}
        <Route path="/" element={<RedirectToHtml target="/employee/" />} />
        <Route path="/index.html" element={<RedirectToHtml target="/employee/" />} />

        {/* Employee Routes */}
        <Route path="/employee" element={<RedirectToHtml target="/employee/" />} />
        <Route path="/employee/login" element={<RedirectToHtml target="/employee/" />} />
        <Route path="/employee/register" element={<RedirectToHtml target="/employee/" />} />
        <Route path="/employee/welcome" element={<RedirectToHtml target="/employee/welcome.html" />} />
        <Route path="/employee/instructions" element={<RedirectToHtml target="/employee/survey.html" />} />
        <Route path="/employee/survey/:id" element={<RedirectToHtml target="/employee/survey.html" />} />
        <Route path="/employee/survey" element={<RedirectToHtml target="/employee/survey.html" />} />
        <Route path="/employee/feedback" element={<RedirectToHtml target="/employee/feedback.html" />} />
        <Route path="/employee/confirmation" element={<RedirectToHtml target="/employee/confirmation.html" />} />
        <Route path="/employee/confrimation" element={<RedirectToHtml target="/employee/confirmation.html" />} />
        <Route path="/employee/*" element={<RedirectToHtml target="/employee/" />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<RedirectToHtml target="/admin/visteria-admin-panel.html" />} />
        <Route path="/admin/*" element={<RedirectToHtml target="/admin/visteria-admin-panel.html" />} />
        <Route path="/src/pages/admin" element={<RedirectToHtml target="/admin/visteria-admin-panel.html" />} />
        <Route path="/src/pages/admin/*" element={<RedirectToHtml target="/admin/visteria-admin-panel.html" />} />

        {/* Catch-all */}
        <Route path="*" element={<RedirectToHtml target="/employee/" />} />
      </Routes>
    </div>
  );
}

export default App;
