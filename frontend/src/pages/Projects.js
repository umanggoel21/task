import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

function Projects() {
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [projectMembers, setProjectMembers] = useState({});  // { projectId: [members] }
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    // Fetch members for a specific project and store by project id
    const fetchMembers = async (projectId) => {
        try {
            const res = await api.get(`/api/projects/${projectId}/members`);
            setProjectMembers(prev => ({ ...prev, [projectId]: res.data }));
        } catch {
            console.log('Could not fetch members for project', projectId);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/api/projects');
            setProjects(res.data);
        } catch {
            navigate('/login');
        }
    };

    const createProject = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/api/projects', { name, description });
            setName('');
            setDescription('');
            fetchProjects();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create project');
        }
    };

    const deleteProject = async (id) => {
        try {
            await api.delete(`/api/projects/${id}`);
            fetchProjects();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete project');
        }
    };

    const addMember = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.post(`/api/projects/${selectedProject}/members`,
                { email: memberEmail, role: 'member' }
            );
            setSuccess('Member added successfully');
            setMemberEmail('');
            // Refresh members list for this project
            fetchMembers(selectedProject);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add member');
        }
    };

    const removeMember = async (projectId, memberUserId) => {
        setError('');
        try {
            await api.delete(`/api/projects/${projectId}/members/${memberUserId}`);
            setSuccess('Member removed');
            // Refresh the members list for this project
            fetchMembers(projectId);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to remove member');
        }
    };

    return (
        <div style={styles.container}>
            <Navbar />

            <div style={styles.content}>
                <h2 style={styles.heading}>Projects</h2>

                {error && <p style={styles.error}>{error}</p>}
                {success && <p style={styles.success}>{success}</p>}

                {/* Create Project Form */}
                <div style={styles.card}>
                    <h3 style={styles.subheading}>Create New Project</h3>
                    <form onSubmit={createProject}>
                        <input
                            style={styles.input}
                            type="text"
                            placeholder="Project Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                        <input
                            style={styles.input}
                            type="text"
                            placeholder="Description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                        <button style={styles.button} type="submit">Create Project</button>
                    </form>
                </div>

                {/* Add Member Form */}
                <div style={styles.card}>
                    <h3 style={styles.subheading}>Add Member to Project</h3>
                    <form onSubmit={addMember}>
                        <select
                            style={styles.input}
                            value={selectedProject || ''}
                            onChange={e => {
                                setSelectedProject(e.target.value);
                                // Load members when owner picks a project
                                if (e.target.value) fetchMembers(e.target.value);
                            }}
                            required
                        >
                            <option value="">Select Project</option>
                            {projects.filter(p => p.is_owner).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <input
                            style={styles.input}
                            type="email"
                            placeholder="Member Email"
                            value={memberEmail}
                            onChange={e => setMemberEmail(e.target.value)}
                            required
                        />
                        <button style={styles.button} type="submit">Add Member</button>
                    </form>

                    {/* Members list — shown when a project is selected */}
                    {selectedProject && projectMembers[selectedProject] && (
                        <div style={{ marginTop: '16px' }}>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Current Members:</p>
                            {projectMembers[selectedProject].map(m => (
                                <div key={m.id} style={styles.memberRow}>
                                    <span style={{ fontSize: '14px' }}>👤 {m.name} — {m.email}</span>
                                    {/* Only show Remove button if current user is the owner */}
                                    {projects.find(p => p.id === parseInt(selectedProject))?.is_owner && (
                                        <button
                                            style={styles.removeBtn}
                                            onClick={() => removeMember(selectedProject, m.id)}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Projects List */}
                <div style={styles.card}>
                    <h3 style={styles.subheading}>Your Projects</h3>
                    {projects.length === 0 && <p>No projects yet.</p>}
                    {projects.map(p => (
                        <div key={p.id} style={styles.projectRow}>
                            <div>
                                <strong>{p.name}</strong>
                                <p style={styles.desc}>{p.description}</p>
                            </div>
                            <div style={styles.rowActions}>
                                <button
                                    style={styles.viewBtn}
                                    onClick={() => navigate(`/projects/${p.id}/tasks`)}
                                >
                                    View Tasks
                                </button>
                                {p.is_owner && (
                                    <button
                                        style={styles.deleteBtn}
                                        onClick={() => deleteProject(p.id)}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { minHeight: '100vh', background: '#f0f2f5' },
    content: { padding: '40px' },
    heading: { marginBottom: '24px', fontSize: '24px' },
    subheading: { marginBottom: '16px', fontSize: '18px' },
    card: { background: '#fff', padding: '24px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
    button: { padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    projectRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #eee' },
    rowActions: { display: 'flex', gap: '10px' },
    viewBtn: { padding: '6px 12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    deleteBtn: { padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    desc: { fontSize: '13px', color: '#666', marginTop: '4px' },
    error: { color: 'red', marginBottom: '10px' },
    success: { color: 'green', marginBottom: '10px' },
    memberRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' },
    removeBtn: { padding: '4px 10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }
};

export default Projects;