import { MdOutlineHeadsetMic, MdOutlineHelpOutline, MdOutlineArticle } from 'react-icons/md';
import StatsCard from '../../StatsCard';
import { useNotification } from '../../../ui/NotificationProvider';

const SupportCenter = () => {
    const notify = useNotification();
    const supportStats = [
        { icon: <MdOutlineHeadsetMic />, label: 'Open Tickets', value: 12, growth: '+2', description: 'since yesterday', bgColor: 'blue', iconColor: 'blue' },
        { icon: <MdOutlineHelpOutline />, label: 'Pending Help', value: 5, growth: 'Normal', description: 'wait time', bgColor: 'orange', iconColor: 'orange' },
        { icon: <MdOutlineArticle />, label: 'Help Articles', value: 48, growth: '+5', description: 'new added', bgColor: 'green', iconColor: 'green' },
    ];

    return (
        <div className="space-y-8 font-aeonik">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Support Center</h1>
                <p className="text-slate-500">Manage support tickets, help articles, and user assistance.</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {supportStats.map((stat, idx) => (
                    <StatsCard key={idx} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div 
                    onClick={() => notify.info('Support Tickets', 'Redirecting to Ticket Management...')}
                    className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                        <MdOutlineHeadsetMic className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Ticket Management</h3>
                    <p className="text-slate-500 mb-6 text-sm">Review and resolve user complaints, technical issues, and general inquiries.</p>
                    <button className="text-indigo-600 font-bold text-sm hover:underline cursor-pointer">Go to Tickets →</button>
                </div>

                <div 
                    onClick={() => notify.info('Help Center', 'Opening Knowledge Base...')}
                    className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
                        <MdOutlineArticle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Help Center Articles</h3>
                    <p className="text-slate-500 mb-6 text-sm">Create and edit knowledge base articles to help users self-serve their problems.</p>
                    <button className="text-green-600 font-bold text-sm hover:underline cursor-pointer">Manage Articles →</button>
                </div>
            </div>
        </div>
    );
};

export default SupportCenter;
