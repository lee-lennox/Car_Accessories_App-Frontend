import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    getAllUsers,
    getUsersByRole,
    deleteUser,
    toggleUserStatus,
    resetUserPassword,
    getUserStatistics,
    getSuperAdminProfile,
    getSystemHealth
} from '../services/superAdminApi';

export default function SuperAdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [statistics, setStatistics] = useState({});
    const [profile, setProfile] = useState({});
    const [systemHealth, setSystemHealth] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRole, setSelectedRole] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [userToResetPassword, setUserToResetPassword] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        // Check if user is SuperAdmin
        if (!user || user.role !== 'SUPER_ADMIN') {
            navigate('/');
            return;
        }

        loadDashboardData();
    }, [user, navigate]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [usersResult, statsResult, profileResult, healthResult] = await Promise.all([
                getAllUsers(),
                getUserStatistics(),
                getSuperAdminProfile(user.email),
                getSystemHealth()
            ]);

            if (usersResult.success) {
                setUsers(usersResult.users);
            }

            if (statsResult.success) {
                setStatistics(statsResult.statistics);
            }

            if (profileResult.success) {
                setProfile(profileResult.profile);
            }

            if (healthResult.success) {
                setSystemHealth(healthResult.health);
            }
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            const result = await deleteUser(userId);
            if (result.success) {
                setUsers(users.filter(u => u.userId !== userId));
                setShowDeleteModal(false);
                setUserToDelete(null);
                // Reload statistics
                const statsResult = await getUserStatistics();
                if (statsResult.success) {
                    setStatistics(statsResult.statistics);
                }
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to delete user');
            console.error('Delete user error:', err);
        }
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        try {
            const result = await toggleUserStatus(userId, !currentStatus);
            if (result.success) {
                setUsers(users.map(u =>
                    u.userId === userId ? { ...u, active: !currentStatus } : u
                ));
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to update user status');
            console.error('Toggle status error:', err);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        try {
            const result = await resetUserPassword(userToResetPassword.userId, newPassword);
            if (result.success) {
                setShowPasswordModal(false);
                setUserToResetPassword(null);
                setNewPassword('');
                setError('');
                alert('Password reset successfully');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to reset password');
            console.error('Reset password error:', err);
        }
    };

    const filterUsers = () => {
        let filtered = users;

        if (selectedRole !== 'ALL') {
            filtered = filtered.filter(user => user.role === selectedRole);
        }

        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'SUPER_ADMIN': return '#dc3545';
            case 'ADMIN': return '#fd7e14';
            case 'BUYER': return '#28a745';
            default: return '#6c757d';
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>
                    <div style={styles.spinner}></div>
                    <p>Loading SuperAdmin Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1> SuperAdmin Dashboard</h1>
                <div style={styles.headerActions}>
                    <span style={styles.welcomeText}>Welcome, {profile.name}</span>
                    <button style={styles.logoutButton} onClick={logout}>
                        Logout
                    </button>
                </div>
            </div>

            {error && (
                <div style={styles.error}>
                    {error}
                    <button style={styles.closeError} onClick={() => setError('')}>×</button>
                </div>
            )}

            <div style={styles.tabs}>
                <button
                    style={{...styles.tab, ...(activeTab === 'overview' ? styles.activeTab : {})}}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    style={{...styles.tab, ...(activeTab === 'users' ? styles.activeTab : {})}}
                    onClick={() => setActiveTab('users')}
                >
                    User Management
                </button>
                <button
                    style={{...styles.tab, ...(activeTab === 'system' ? styles.activeTab : {})}}
                    onClick={() => setActiveTab('system')}
                >
                    System Health
                </button>
            </div>

            <div style={styles.content}>
                {activeTab === 'overview' && (
                    <div style={styles.overview}>
                        <div style={styles.statsGrid}>
                            <div style={styles.statCard}>
                                <h3>Total Users</h3>
                                <div style={styles.statNumber}>{statistics.totalUsers || 0}</div>
                            </div>
                            <div style={styles.statCard}>
                                <h3>Active Users</h3>
                                <div style={styles.statNumber}>{statistics.activeUsers || 0}</div>
                            </div>
                            <div style={styles.statCard}>
                                <h3>Admins</h3>
                                <div style={styles.statNumber}>{statistics.totalAdmins || 0}</div>
                            </div>
                            <div style={styles.statCard}>
                                <h3>Buyers</h3>
                                <div style={styles.statNumber}>{statistics.totalBuyers || 0}</div>
                            </div>
                        </div>

                        <div style={styles.profileCard}>
                            <h3>Your Profile</h3>
                            <div style={styles.profileInfo}>
                                <p><strong>Name:</strong> {profile.name}</p>
                                <p><strong>Email:</strong> {profile.email}</p>
                                <p><strong>Role:</strong> {profile.role}</p>
                                <p><strong>Access Level:</strong> {profile.systemAccessLevel}</p>
                                <p><strong>Last Login:</strong> {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div style={styles.userManagement}>
                        <div style={styles.userControls}>
                            <div style={styles.searchContainer}>
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={styles.searchInput}
                                />
                            </div>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                style={styles.roleFilter}
                            >
                                <option value="ALL">All Roles</option>
                                <option value="SUPER_ADMIN">Super Admins</option>
                                <option value="ADMIN">Admins</option>
                                <option value="BUYER">Buyers</option>
                            </select>
                        </div>

                        <div style={styles.userTable}>
                            <table style={styles.table}>
                                <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Last Login</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filterUsers().map(user => (
                                    <tr key={user.userId}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                                <span style={{
                                                    ...styles.roleBadge,
                                                    backgroundColor: getRoleColor(user.role)
                                                }}>
                                                    {user.role}
                                                </span>
                                        </td>
                                        <td>
                                                <span style={{
                                                    ...styles.statusBadge,
                                                    backgroundColor: user.active ? '#28a745' : '#dc3545'
                                                }}>
                                                    {user.active ? 'Active' : 'Inactive'}
                                                </span>
                                        </td>
                                        <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                                        <td>
                                            <div style={styles.actionButtons}>
                                                <button
                                                    style={styles.actionButton}
                                                    onClick={() => handleToggleUserStatus(user.userId, user.active)}
                                                >
                                                    {user.active ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    style={styles.actionButton}
                                                    onClick={() => {
                                                        setUserToResetPassword(user);
                                                        setShowPasswordModal(true);
                                                    }}
                                                >
                                                    Reset Password
                                                </button>
                                                <button
                                                    style={{...styles.actionButton, ...styles.deleteButton}}
                                                    onClick={() => {
                                                        setUserToDelete(user);
                                                        setShowDeleteModal(true);
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div style={styles.systemHealth}>
                        <div style={styles.healthCard}>
                            <h3>System Status</h3>
                            <div style={styles.healthInfo}>
                                <p><strong>Status:</strong> <span style={{color: '#28a745'}}>{systemHealth.status}</span></p>
                                <p><strong>Database:</strong> <span style={{color: '#28a745'}}>{systemHealth.database}</span></p>
                                <p><strong>Active Users:</strong> {systemHealth.activeUsers}</p>
                                <p><strong>Last Check:</strong> {new Date(systemHealth.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete user <strong>{userToDelete?.name}</strong>?</p>
                        <p style={{color: '#dc3545', fontSize: '14px'}}>This action cannot be undone.</p>
                        <div style={styles.modalActions}>
                            <button
                                style={styles.cancelButton}
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setUserToDelete(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                style={styles.confirmButton}
                                onClick={() => handleDeleteUser(userToDelete.userId)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {showPasswordModal && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h3>Reset Password</h3>
                        <p>Reset password for <strong>{userToResetPassword?.name}</strong></p>
                        <input
                            type="password"
                            placeholder="Enter new password (min 8 characters)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={styles.passwordInput}
                        />
                        <div style={styles.modalActions}>
                            <button
                                style={styles.cancelButton}
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setUserToResetPassword(null);
                                    setNewPassword('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                style={styles.confirmButton}
                                onClick={handleResetPassword}
                                disabled={!newPassword || newPassword.length < 8}
                            >
                                Reset Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '20px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px',
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    welcomeText: {
        fontSize: '16px',
        color: '#666',
    },
    logoutButton: {
        padding: '8px 16px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '50vh',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px',
    },
    error: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeError: {
        background: 'none',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        color: '#721c24',
    },
    tabs: {
        display: 'flex',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '4px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    tab: {
        flex: 1,
        padding: '12px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        borderRadius: '4px',
        transition: 'background-color 0.3s',
    },
    activeTab: {
        backgroundColor: '#007bff',
        color: 'white',
    },
    content: {
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    overview: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
    },
    statCard: {
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center',
    },
    statNumber: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#007bff',
        marginTop: '10px',
    },
    profileCard: {
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
    },
    profileInfo: {
        marginTop: '15px',
    },
    userManagement: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    userControls: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
    },
    searchContainer: {
        flex: 1,
    },
    searchInput: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
    },
    roleFilter: {
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
    },
    userTable: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    roleBadge: {
        padding: '4px 8px',
        borderRadius: '12px',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
    },
    statusBadge: {
        padding: '4px 8px',
        borderRadius: '12px',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
    },
    actionButtons: {
        display: 'flex',
        gap: '5px',
        flexWrap: 'wrap',
    },
    actionButton: {
        padding: '4px 8px',
        border: '1px solid #007bff',
        backgroundColor: 'transparent',
        color: '#007bff',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
    },
    deleteButton: {
        borderColor: '#dc3545',
        color: '#dc3545',
    },
    systemHealth: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    healthCard: {
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
    },
    healthInfo: {
        marginTop: '15px',
    },
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '90%',
    },
    modalActions: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end',
        marginTop: '20px',
    },
    cancelButton: {
        padding: '8px 16px',
        border: '1px solid #6c757d',
        backgroundColor: 'transparent',
        color: '#6c757d',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    confirmButton: {
        padding: '8px 16px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    passwordInput: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        marginTop: '10px',
        marginBottom: '10px',
        boxSizing: 'border-box',
    },
};
//end of a class