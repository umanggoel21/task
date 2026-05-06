import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('member');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/api/auth/signup', { name, email, password, role });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Signup failed');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.box}>
                <h2 style={styles.title}>Create Account</h2>
                {error && <p style={styles.error}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                    <input
                        style={styles.input}
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <input
                        style={styles.input}
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <select
                        style={styles.input}
                        value={role}
                        onChange={e => setRole(e.target.value)}
                    >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button style={styles.button} type="submit">Sign Up</button>
                </form>
                <p style={styles.link}>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
    box: { background: '#fff', padding: '40px', borderRadius: '8px', width: '360px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
    title: { marginBottom: '20px', textAlign: 'center' },
    input: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
    button: { width: '100%', padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' },
    error: { color: 'red', marginBottom: '10px', fontSize: '13px' },
    link: { marginTop: '16px', textAlign: 'center', fontSize: '13px' }
};

export default Signup;