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

    // Calculate stats from dashboard stats with backend data
    const totalBookings = (dashboardStats?.bookings?.total) ?? (dashboardStats?.totalBookings) ?? bookings.length ?? 0;
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



    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar activeMenu={activeMenu} onMenuSelect={setActiveMenu} />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navbar - Pass active menu */}
                <Navbar activeMenu={activeMenu} onMenuSelect={setActiveMenu} />

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6 lg:p-7">
                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                                </div>
                            </div>
                        )}
                        
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <p className="text-red-800 font-semibold">Error</p>
                                <p className="text-red-700 text-sm">{error}</p>
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
