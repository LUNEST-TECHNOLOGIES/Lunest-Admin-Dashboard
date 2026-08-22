import { useNavigate } from 'react-router-dom';
import { getListings, getBookings, getAdminTransactions, getDashboardStats } from '../services/adminService';
import { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { 
  StatsCard, 
  ChatCard, 
  AlertContainer
} from '../components/dashboard';
import { ContentRouter } from '../components/dashboard/ContentRouter';

export default function Dashboard() {
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Persist activeMenu in localStorage to survive page refresh
    const [activeMenu, setActiveMenu] = useState(() => {
        return localStorage.getItem('adminActiveMenu') || 'Dashboard';
    });

    // Update localStorage when activeMenu changes
    useEffect(() => {
        localStorage.setItem('adminActiveMenu', activeMenu);
    }, [activeMenu]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            console.log('Fetching dashboard data...');
            
            const [listingsRes, bookingsRes, transactionsRes, statsData] = await Promise.all([
                getListings(),
                getBookings(),
                getAdminTransactions({ limit: 100 }),
                getDashboardStats(),
            ]);
            
            console.log('Listings response:', listingsRes);
            console.log('Bookings response:', bookingsRes);
            console.log('Transactions response:', transactionsRes);
            console.log('Stats response:', statsData);
            
            setListings((listingsRes && listingsRes.body) || []);
            setBookings((bookingsRes && bookingsRes.body) || []);
            // Extract transactions array from nested response structure
            setTransactions((transactionsRes && transactionsRes.body?.transactions) || []);
            setDashboardStats(statsData || {});
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to fetch data: ' + (err.message || 'Unknown error'));
            // Set fallback empty stats
            setListings([]);
            setBookings([]);
            setTransactions([]);
            setDashboardStats({});
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    // Calculate stats from dashboard stats with backend data (exclude EXPIRED, FAILED, CANCELLED)
    const validBookings = (Array.isArray(bookings) ? bookings : []).filter(b => !['EXPIRED', 'FAILED', 'CANCELLED', 'PENDING_PAYMENT'].includes((b.status || '').toUpperCase()) && (b.paymentStatus || '').toUpperCase() !== 'FAILED');
    const totalBookings = (dashboardStats?.bookings?.total) ?? (dashboardStats?.totalBookings) ?? validBookings.length ?? 0;
    const totalRevenue = (dashboardStats?.platformFees) ?? (dashboardStats?.totalRevenue) ?? 0;
    const totalUsers = (dashboardStats?.users?.total) ?? (dashboardStats?.totalUsers) ?? 0;
    const totalGuests = (dashboardStats?.users?.guests) ?? (dashboardStats?.totalGuests) ?? 0;
    const totalHosts = (dashboardStats?.users?.hosts) ?? (dashboardStats?.totalHosts) ?? 0;
    const totalAdmins = (dashboardStats?.users?.admins) ?? (dashboardStats?.totalAdmins) ?? 0;
    const pendingKYC = (dashboardStats?.pendingKYC) ?? 0;
    const pendingHostApplications = (dashboardStats?.pendingHostApplications) ?? 0;
    
    // CRITICAL: Use backend-provided count for accuracy across entire DB, fallback to local filter only as last resort
    const openDisputes = (dashboardStats?.openDisputes) ?? (Array.isArray(transactions) ? transactions : []).filter(t => 
        t.category === 'SECURITY_DEPOSIT' && 
        (t.metadata?.isDisputed || t.description?.toUpperCase().includes('DISPUTED'))
    ).length;
    
    const activeListings = (dashboardStats?.listings?.active) ?? (dashboardStats?.activeListings) ?? listings.filter(l => l.status === 'AVAILABLE').length;
    const pendingListings = (dashboardStats?.listings?.pending) ?? (dashboardStats?.pendingListings) ?? listings.filter(l => l.status === 'PENDING').length;
    const totalListings = (dashboardStats?.listings?.total) ?? (dashboardStats?.totalListings) ?? listings.length;
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50/50 font-aeonik antialiased selection:bg-indigo-500 selection:text-white">
            {/* Sidebar */}
            <Sidebar 
                activeMenu={activeMenu} 
                onMenuSelect={setActiveMenu} 
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
            />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Navbar */}
                <Navbar 
                    activeMenu={activeMenu} 
                    onMenuSelect={setActiveMenu} 
                    onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
                />

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-3.5 sm:p-5 lg:p-7 max-w-[1600px] mx-auto w-full">
                        {loading && (
                            <div className="flex items-center justify-center py-16">
                                <div className="text-center bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
                                    <p className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Loading dashboard data...</p>
                                </div>
                            </div>
                        )}
                        
                        {error && (
                            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4 text-rose-800 animate-in fade-in">
                                <p className="font-bold text-xs uppercase tracking-wider">Error Encountered</p>
                                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
                            </div>
                        )}
                        
                        {!loading && (
                            <ContentRouter 
                                activeMenu={activeMenu} 
                                stats={{
                                    totalBookings,
                                    totalRevenue,
                                    totalUsers,
                                    totalGuests,
                                    activeHosts: totalHosts,
                                    totalAdmins,
                                    pendingKYC,
                                    pendingHostApplications,
                                    openDisputes,
                                    activeListings,
                                    pendingListings,
                                    totalListings,
                                    totalEscrowFunds: dashboardStats?.totalEscrowFunds || 0
                                }}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
