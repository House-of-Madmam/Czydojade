import IncidentForm from '../components/IncidentForm';

export default function IncidentReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 flex justify-center pt-40">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center flex flex-col justify-end pb-3">
          <h2 className="text-3xl font-bold text-slate-900 leading-tight">Report an Incident</h2>
        </div>

        {/* Form Container */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl shadow-slate-900/5 p-6">
          <IncidentForm />
        </div>
      </div>
    </div>
  );
}
