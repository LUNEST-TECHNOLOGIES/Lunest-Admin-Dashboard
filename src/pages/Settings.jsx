import { useNavigate } from 'react-router-dom';

export default function Settings() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white rounded-lg shadow p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Admin Settings</h2>
                    
                    <div className="space-y-6">
                        <div className="border-b pb-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Account Settings</h3>
                            <p className="text-slate-500">Manage your admin account preferences</p>
                        </div>
                        
                        <div className="border-b pb-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Notifications</h3>
                            <p className="text-slate-500">Configure notification preferences</p>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Security</h3>
                            <p className="text-slate-500">Manage security and privacy settings</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
