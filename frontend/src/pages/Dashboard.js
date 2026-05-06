import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/api/dashboard')
            .then(res => setStats(res.data))
            .catch(() => navigate('/login'));
    }, [navigate]);

    return (
        <div style={styles.container}>
            <Navbar />

            <div style={styles.content}>
                <h2 style={styles.heading}>Dashboard</h2>
                {stats ? (
                    <>
                        <div style={styles.cards}>
                            <div style={{ ...styles.card, background: '#4f46e5' }}>
                                <h3>Total Tasks</h3>
                                <p style={styles.number}>{stats.total}</p>
                            </div>
                            <div style={{ ...styles.card, background: '#f59e0b' }}>
                                <h3>Todo</h3>
                                <p style={styles.number}>{stats.todo}</p>
                            </div>
                            <div style={{ ...styles.card, background: '#3b82f6' }}>
                                <h3>In Progress</h3>
                                <p style={styles.number}>{stats.in_progress}</p>
                            </div>
                            <div style={{ ...styles.card, background: '#10b981' }}>
                                <h3>Done</h3>
                                <p style={styles.number}>{stats.done}</p>
                            </div>
                            <div style={{ ...styles.card, background: '#ef4444' }}>
                                <h3>Overdue</h3>
                                <p style={styles.number}>{stats.overdue}</p>
                            </div>
                        </div>

                        {/* Tasks Per User Section */}
                        {stats.tasks_per_user && Object.keys(stats.tasks_per_user).length > 0 && (
                            <div style={styles.userSection}>
                                <h3 style={styles.subheading}>Tasks Per User</h3>
                                <div style={styles.userList}>
                                    {Object.entries(stats.tasks_per_user).map(([name, count]) => (
                                        <div key={name} style={styles.userRow}>
                                            <span style={styles.userName}>{name}</span>
                                            <span style={styles.userCount}>{count} tasks</span>
                                            {/* simple progress bar */}
                                            <div style={styles.barBg}>
                                                <div style={{
                                                    ...styles.barFill,
                                                    width: `${(count / stats.total) * 100}%`
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: { minHeight: '100vh', background: '#f0f2f5' },
    content: { padding: '40px' },
    heading: { marginBottom: '24px', fontSize: '24px' },
    cards: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
    card: { padding: '24px', borderRadius: '8px', color: '#fff', minWidth: '160px', textAlign: 'center' },
    number: { fontSize: '48px', fontWeight: 'bold', marginTop: '8px' },
    userSection: { marginTop: '40px' },
    subheading: { fontSize: '18px', marginBottom: '16px' },
    userList: { background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
    userRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
    userName: { width: '140px', fontSize: '14px', fontWeight: 'bold' },
    userCount: { width: '70px', fontSize: '13px', color: '#666' },
    barBg: { flex: 1, background: '#e5e7eb', borderRadius: '4px', height: '8px' },
    barFill: { background: '#4f46e5', borderRadius: '4px', height: '8px' }
};

export default Dashboard;