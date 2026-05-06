import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={styles.navbar}>
            <h2 style={styles.logo}>ProjectApp</h2>
            <div style={styles.navLinks}>
                <Link to="/dashboard" style={styles.navLink}>Dashboard</Link>
                <Link to="/projects" style={styles.navLink}>Projects</Link>
                <span style={styles.navLink}>Hello, {user?.name}</span>
                <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
            </div>
        </div>
    );
}

const styles = {
    navbar: { background: '#fff', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
    logo: { color: '#4f46e5', margin: 0 },
    navLinks: { display: 'flex', alignItems: 'center', gap: '20px' },
    navLink: { textDecoration: 'none', color: '#333', fontSize: '14px' },
    logoutBtn: { padding: '6px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
};

export default Navbar;
