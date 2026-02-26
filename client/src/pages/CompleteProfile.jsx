import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import api from '../shared/services/api';

export default function CompleteProfile() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [constituency, setConstituency] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('abhimat_token');
            const { data } = await api.post('/auth/complete-profile', 
                { name, constituency },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Update local storage with new token and user data
            localStorage.setItem('abhimat_token', data.token);
            localStorage.setItem('abhimat_user', JSON.stringify(data.user));
            
            // Refresh auth context
            await refreshUser();
            
            // Navigate based on role
            if (data.user.member_id === 'DASHMOD') {
                navigate('/display');
            } else {
                navigate(data.user.role === 'moderator' ? '/moderator' : '/member');
            }
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to complete profile';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white font-display min-h-screen flex items-center justify-center overflow-hidden relative">
            {/* Background styling */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-white/80" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_white_100%)] opacity-40" />
                <div className="absolute inset-0 bg-pattern opacity-30" />
            </div>

            <main className="relative z-10 w-full max-w-[500px] px-6 py-12 flex flex-col items-center justify-center min-h-screen">
                <div className="w-full bg-white rounded-xl shadow-2xl p-8 relative overflow-hidden">
                    {/* Watermark */}
                    <div className="absolute bottom-4 right-4 opacity-[0.05] pointer-events-none select-none">
                        <span className="material-symbols-outlined text-[8rem] text-neutral-dark">account_circle</span>
                    </div>

                    <div className="relative z-10">
                        <header className="text-center mb-8">
                            {/* Icon */}
                            <div className="flex justify-center mb-4">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-saffron via-accent to-india-green flex items-center justify-center shadow-xl">
                                    <span className="material-symbols-outlined text-white text-3xl">person_add</span>
                                </div>
                            </div>
                            <h1 className="text-2xl font-black text-neutral-dark tracking-tight">Complete Your Profile</h1>
                            <p className="text-sm text-gray-500 mt-2">Welcome to ABHIMAT '26</p>
                            
                            {/* Party info */}
                            {user && (
                                <div className="mt-4 p-3 bg-gradient-to-r from-saffron/10 via-white to-india-green/10 rounded-lg border border-saffron/20">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Your Team</p>
                                    <p className="text-lg font-bold text-neutral-dark">{user.party}</p>
                                    {user.team_leader && (
                                        <p className="text-xs text-gray-600 mt-1">Leader: {user.team_leader}</p>
                                    )}
                                </div>
                            )}
                            
                            {/* Tricolor divider */}
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-saffron" />
                                <span className="material-symbols-outlined text-ashoka-blue text-2xl">edit_note</span>
                                <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-india-green" />
                            </div>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                                    Your Full Name
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-saffron text-lg">person</span>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Enter your full name"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron transition-colors text-neutral-dark placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                                    Constituency
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-india-green text-lg">location_on</span>
                                    <input
                                        type="text"
                                        value={constituency}
                                        onChange={e => setConstituency(e.target.value)}
                                        placeholder="Your constituency name"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-india-green focus:ring-1 focus:ring-india-green transition-colors text-neutral-dark placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                                    <span className="material-symbols-outlined text-alert-red text-lg">error</span>
                                    <p className="text-sm text-alert-red font-medium">{error}</p>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-wavy-tricolor rounded-lg px-6 py-3.5 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saffron active:scale-[0.98] disabled:opacity-70"
                                >
                                    <span className="text-white font-bold tracking-widest uppercase text-sm drop-shadow-md">
                                        {loading ? 'Saving...' : 'Complete Profile'}
                                    </span>
                                    <span className="material-symbols-outlined text-white text-lg drop-shadow-md">
                                        {loading ? 'hourglass_top' : 'check_circle'}
                                    </span>
                                </button>
                            </div>
                        </form>

                        <footer className="mt-8 text-center">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-saffron" />
                                Parliamentary Setup
                                <span className="w-1.5 h-1.5 rounded-full bg-india-green" />
                            </p>
                        </footer>
                    </div>
                </div>
            </main>
        </div>
    );
}
