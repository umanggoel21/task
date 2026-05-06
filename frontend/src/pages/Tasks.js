import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [project, setProject] = useState({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchProjectDetails();
    fetchTasks();
    fetchMembers();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const res = await api.get('/api/projects');
      const current = res.data.find(p => p.id === parseInt(id));
      if (current) setProject(current);
    } catch {
      console.log('Could not fetch project details');
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/api/projects/${id}/tasks`);
      setTasks(res.data);
    } catch {
      navigate('/login');
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get(`/api/projects/${id}/members`);
      setMembers(res.data);
    } catch {
      console.log('Could not fetch members');
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/api/projects/${id}/tasks`, {
        title,
        description,
        due_date: dueDate,
        status: 'todo',
        assigned_to: assignedTo || null
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setAssignedTo('');
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch {
      setError('Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/api/tasks/${taskId}`);
      fetchTasks();
    } catch {
      setError('Failed to delete task');
    }
  };

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : 'Unassigned';
  };

  const todo = tasks.filter(t => t.status === 'todo');
  const inProgress = tasks.filter(t => t.status === 'in-progress');
  const done = tasks.filter(t => t.status === 'done');

  // Determine if the current user is the owner of this project
  const isOwner = project.is_owner;

  const TaskCard = ({ task }) => {
    // Can current user move this task?
    // Owner: yes, always. Member: only if task is assigned to them.
    const canEdit = isOwner || task.assigned_to === user?.id;

    return (
      <div style={styles.taskCard}>
        <strong>{task.title}</strong>
        <p style={styles.taskDesc}>{task.description}</p>
        <p style={styles.assignedTo}>👤 {getMemberName(task.assigned_to)}</p>
        {task.due_date && (
          <p style={styles.dueDate}>📅 Due: {new Date(task.due_date).toLocaleDateString()}</p>
        )}
        {/* Only show action buttons if user has permission */}
        {canEdit && (
          <div style={styles.taskActions}>
            {task.status !== 'todo' && (
              <button style={styles.moveBtn} onClick={() => updateStatus(task.id, 'todo')}>← Todo</button>
            )}
            {task.status !== 'in-progress' && (
              <button style={styles.moveBtn} onClick={() => updateStatus(task.id, 'in-progress')}>In Progress</button>
            )}
            {task.status !== 'done' && (
              <button style={styles.moveBtn} onClick={() => updateStatus(task.id, 'done')}>Done ✓</button>
            )}
            {/* Only project owner can delete tasks */}
            {isOwner && (
              <button style={styles.deleteBtn} onClick={() => deleteTask(task.id)}>✕</button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <Navbar />

      <div style={styles.content}>
        <h2 style={styles.heading}>Task Board</h2>
        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.formCard}>
          <h3 style={styles.subheading}>Add New Task</h3>
          <form onSubmit={createTask} style={styles.form}>
            <input
              style={styles.input}
              type="text"
              placeholder="Task Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <input
              style={styles.input}
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
            <select
              style={styles.input}
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
            >
              <option value="">Assign to...</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <button style={styles.button} type="submit">Add Task</button>
          </form>
        </div>

        <div style={styles.board}>
          <div style={styles.column}>
            <h3 style={{ ...styles.columnTitle, background: '#f59e0b' }}>Todo ({todo.length})</h3>
            {todo.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
          <div style={styles.column}>
            <h3 style={{ ...styles.columnTitle, background: '#3b82f6' }}>In Progress ({inProgress.length})</h3>
            {inProgress.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
          <div style={styles.column}>
            <h3 style={{ ...styles.columnTitle, background: '#10b981' }}>Done ({done.length})</h3>
            {done.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
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
  formCard: { background: '#fff', padding: '24px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  form: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', flex: '1', minWidth: '150px' },
  button: { padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  board: { display: 'flex', gap: '20px' },
  column: { flex: 1, background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  columnTitle: { padding: '12px 16px', color: '#fff', fontSize: '16px' },
  taskCard: { padding: '12px 16px', borderBottom: '1px solid #eee' },
  taskDesc: { fontSize: '13px', color: '#666', marginTop: '4px' },
  assignedTo: { fontSize: '12px', color: '#4f46e5', marginTop: '4px' },
  dueDate: { fontSize: '12px', color: '#999', marginTop: '4px' },
  taskActions: { display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' },
  moveBtn: { padding: '4px 8px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  deleteBtn: { padding: '4px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  error: { color: 'red', marginBottom: '10px' }
};

export default Tasks;