import { useState } from 'react';
import { submitPartyDetails } from '../../shared/services/api';

export default function PartyDetailsForm({ user, onComplete }) {
    const [totalMembers, setTotalMembers] = useState(1);
    const [membersData, setMembersData] = useState([{ name: '', college: '' }]);
    const [logoUrl, setLogoUrl] = useState('');
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleTotalMembersChange = (e) => {
        const rawVal = e.target.value;
        if (rawVal === '') {
            setTotalMembers('');
            setMembersData([]);
            return;
        }

        let val = parseInt(rawVal, 10);
        if (isNaN(val)) return;
        if (val > 50) val = 50;

        setTotalMembers(val);

        // Adjust membersData array size
        const newData = [...membersData];
        if (val > 0) {
            if (val > newData.length) {
                for (let i = newData.length; i < val; i++) {
                    newData.push({ name: '', college: '' });
                }
            } else if (val < newData.length) {
                newData.length = val;
            }
        } else {
            newData.length = 0;
        }
        setMembersData(newData);
    };

    const handleMemberDataChange = (index, field, value) => {
        const newData = [...membersData];
        newData[index][field] = value;
        setMembersData(newData);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
            setError('Image size must be 1MB or less.');
            // Clear the file input so they can select again
            e.target.value = '';
            return;
        }

        setUploadingLogo(true);
        setError('');

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            setError('Cloudinary configuration is missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env files.');
            setUploadingLogo(false);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.secure_url) {
                setLogoUrl(data.secure_url);
            } else {
                setError('Failed to upload logo.');
            }
        } catch (err) {
            setError('Error uploading logo.');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!logoUrl) {
            return setError('Please upload a party logo.');
        }
        for (let i = 0; i < membersData.length; i++) {
            if (!membersData[i].name || !membersData[i].college) {
                return setError(`Please fill out name and college for member ${i + 1}.`);
            }
        }

        setSubmitting(true);
        try {
            await submitPartyDetails({
                party: user.party,
                total_members: totalMembers,
                members_data: membersData,
                logo_url: logoUrl
            });
            onComplete();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit party details.');
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-background-light z-[100] overflow-y-auto px-4 py-8 md:py-12">
            <div className="bg-white rounded-2xl w-full max-w-xl p-6 md:p-8 shadow-2xl border border-gray-100 relative mx-auto my-auto shrink-0 flex flex-col">
                {/* Decorative header */}
                <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-saffron via-white to-india-green rounded-t-2xl" />

                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-black text-neutral-dark tracking-tight">Party Registration</h2>
                    <p className="text-gray-500 font-medium mt-2">Welcome, <span className="text-india-green font-bold">{user.party}</span> delegate!</p>
                </div>

                <div className="bg-saffron/10 border-l-4 border-saffron p-4 mb-8 rounded-r-xl">
                    <p className="text-sm text-saffron-dark font-bold text-center">
                        **form should be filled correctly as would be used in grading participants**
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Logo Upload */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-neutral-dark">Party Logo <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-4">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Party Logo" className="h-16 w-16 object-contain rounded-lg border border-gray-200 p-1" />
                            ) : (
                                <div className="h-16 w-16 bg-gray-50 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
                                    <span className="material-symbols-outlined text-gray-400">image</span>
                                </div>
                            )}
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    id="logo-upload"
                                    disabled={uploadingLogo}
                                />
                                <label
                                    htmlFor="logo-upload"
                                    className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${uploadingLogo
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-accent/20 text-accent-dark hover:bg-accent/30'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        {uploadingLogo ? 'hourglass_empty' : 'upload'}
                                    </span>
                                    {uploadingLogo ? 'Uploading...' : (logoUrl ? 'Change Logo' : 'Upload Logo')}
                                </label>
                                <p className="text-[10px] text-gray-400 mt-1 font-medium">JPEG, PNG, GIF up to 1MB</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Members */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-neutral-dark">Total Members in Party <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={totalMembers}
                            onChange={handleTotalMembersChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all font-medium text-neutral-dark"
                            required
                        />
                    </div>

                    {/* Dynamic Member Fields */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-neutral-dark">Member Details</h3>
                        {membersData.map((member, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Member {index + 1} Name</label>
                                    <input
                                        type="text"
                                        value={member.name}
                                        onChange={(e) => handleMemberDataChange(index, 'name', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all bg-white"
                                        required
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">College</label>
                                    <input
                                        type="text"
                                        value={member.college}
                                        onChange={(e) => handleMemberDataChange(index, 'college', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all bg-white"
                                        required
                                        placeholder="College Name"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || uploadingLogo}
                        className="w-full py-4 rounded-xl bg-neutral-dark text-white font-black uppercase tracking-wide hover:bg-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                Complete Registration
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
