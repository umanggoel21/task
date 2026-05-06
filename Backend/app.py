# flask routing, parsing data, cors for frontend, and jwt for auth stuff
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Project, ProjectMember, Task
from dotenv import load_dotenv
from datetime import datetime
import os

load_dotenv()

app = Flask(__name__)
# loading db url and secret from .env so they don't get pushed to github
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

CORS(app)
db.init_app(app)
jwt = JWTManager(app)

with app.app_context():
    db.create_all()


# ─── AUTH ROUTES 

# signup route - grabs user details and hashes password before saving
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'All fields required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

    user = User(
        name=data['name'],
        email=data['email'],
        password=generate_password_hash(data['password']),
        role=data.get('role', 'member')
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created successfully'}), 201


# login route - checks email and password, gives back a token if credentials match.
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    # jwt basically gives us a secure user id
    token = create_access_token(identity=str(user.id))
    return jsonify({
        'token': token,
        'user': {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role}
    })


# ─── PROJECT ROUTES 

# gets all projects the logged in user either owns or is a member of
@app.route('/api/projects', methods=['GET'])
@jwt_required()
def get_projects():
    # get the user id from the token — jwt stores it as string so converting to int
    user_id = int(get_jwt_identity())
    
    # grabbing projects I made
    owned = Project.query.filter_by(owner_id=user_id).all()
    
    # tricky query: joining projects with members to find ones I was added to
    # not sure if this is the best way but it works
    member_of = db.session.query(Project).join(ProjectMember).filter(ProjectMember.user_id == user_id).all()
    
    all_projects = {p.id: p for p in owned + member_of}.values()
    
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'owner_id': p.owner_id,
        'is_owner': p.owner_id == user_id
    } for p in all_projects])


# creates a new project. the person who makes it automatically becomes the owner.
@app.route('/api/projects', methods=['POST'])
@jwt_required()
def create_project():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data.get('name'):
        return jsonify({'error': 'Project name required'}), 400

    project = Project(
        name=data['name'],
        description=data.get('description', ''),
        owner_id=user_id
    )
    db.session.add(project)
    db.session.commit()
    return jsonify({
        'id': project.id,
        'name': project.name,
        'description': project.description,
        'owner_id': project.owner_id,
        'is_owner': True
    }), 201


# deletes a project - but only if you are the owner
@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)

    if not project:
        return jsonify({'error': 'Project not found'}), 404
        
    # had to add this check, only owner should delete whole project
    if project.owner_id != user_id:
        return jsonify({'error': 'Only project owner can delete'}), 403

    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted'})


# ─── MEMBER ROUTES 

# lets the project owner add someone else using their email
@app.route('/api/projects/<int:project_id>/members', methods=['POST'])
@jwt_required()
def add_member(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)

    if not project:
        return jsonify({'error': 'Project not found'}), 404
        
    # only owner can invite people
    if project.owner_id != user_id:
        return jsonify({'error': 'Only owner can add members'}), 403

    data = request.get_json()
    member = User.query.filter_by(email=data['email']).first()
    if not member:
        return jsonify({'error': 'User not found'}), 404

    existing = ProjectMember.query.filter_by(project_id=project_id, user_id=member.id).first()
    if existing:
        return jsonify({'error': 'User already a member'}), 400

    pm = ProjectMember(project_id=project_id, user_id=member.id, role=data.get('role', 'member'))
    db.session.add(pm)
    db.session.commit()
    return jsonify({'message': 'Member added successfully'}), 201


# gets all tasks inside a single project
@app.route('/api/projects/<int:project_id>/tasks', methods=['GET'])
@jwt_required()
def get_tasks(project_id):
    tasks = Task.query.filter_by(project_id=project_id).all()
    return jsonify([{
        'id': t.id,
        'title': t.title,
        'description': t.description,
        'status': t.status,
        'priority': t.priority,
        'due_date': t.due_date.isoformat() if t.due_date else None,
        'assigned_to': t.assigned_to
    } for t in tasks])


# create a task inside a project - requires user to be owner or member
@app.route('/api/projects/<int:project_id>/tasks', methods=['POST'])
@jwt_required()
def create_task(project_id):
    user_id = int(get_jwt_identity())
    
    # check if user belongs to this project before they can make a task
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    is_member = ProjectMember.query.filter_by(
        project_id=project_id, user_id=user_id
    ).first()
    
    # if you aren't the owner and not in the members list, you get blocked
    if project.owner_id != user_id and not is_member:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    
    # checking all mandatory fields to prevent broken data
    if not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    if not data.get('description'):
        return jsonify({'error': 'Description is required'}), 400
    if not data.get('due_date'):
        return jsonify({'error': 'Due date is required'}), 400
    if not data.get('priority'):
        return jsonify({'error': 'Priority is required'}), 400
    
    # making sure priority is only one of these three
    allowed_priorities = ['high', 'medium', 'low']
    if data['priority'] not in allowed_priorities:
        return jsonify({'error': 'Priority must be high, medium or low'}), 400

    task = Task(
        title=data['title'],
        description=data['description'],
        status=data.get('status', 'todo'),
        priority=data['priority'],
        project_id=project_id,
        assigned_to=data.get('assigned_to'),
        due_date=datetime.strptime(data['due_date'], '%Y-%m-%d')
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'id': task.id, 'title': task.title, 'status': task.status}), 201


# updates an existing task - owner can update anything, member only their own stuff
@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    project = Project.query.get(task.project_id)
    is_member = ProjectMember.query.filter_by(
        project_id=task.project_id, user_id=user_id
    ).first()

    # blocking random users who aren't in the project
    if project.owner_id != user_id and not is_member:
        return jsonify({'error': 'Access denied'}), 403

    # if member tries to update a task not assigned to them, block it
    # owners bypass this check
    if is_member and project.owner_id != user_id:
        if task.assigned_to != user_id:
            return jsonify({'error': 'Members can only update their assigned tasks'}), 403

    data = request.get_json()
    
    # checking allowed statuses so we don't get junk data
    allowed_statuses = ['todo', 'in-progress', 'done']
    if data.get('status') and data['status'] not in allowed_statuses:
        return jsonify({'error': 'Status must be todo, in-progress or done'}), 400

    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.status = data.get('status', task.status)
    task.priority = data.get('priority', task.priority)
    task.assigned_to = data.get('assigned_to', task.assigned_to)
    db.session.commit()
    return jsonify({'message': 'Task updated'})


# deletes a task - completely restricted to owner only
@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    project = Project.query.get(task.project_id)

    # only owner has delete rights
    if project.owner_id != user_id:
        return jsonify({'error': 'Only project owner can delete tasks'}), 403

    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted'})


# ─── DASHBOARD

# returns all stats for the dashboard
@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user_id = int(get_jwt_identity())

    # get all tasks from projects where current user is the owner
    tasks = Task.query.join(Project).filter(Project.owner_id == user_id).all()

    total = len(tasks)
    todo = len([t for t in tasks if t.status == 'todo'])
    in_progress = len([t for t in tasks if t.status == 'in-progress'])
    done = len([t for t in tasks if t.status == 'done'])
    overdue = len([t for t in tasks if t.due_date and t.due_date < datetime.utcnow() and t.status != 'done'])

    # loop through tasks to count how many tasks each user has
    # this took me a while to figure out but basically grouping by name
    tasks_per_user = {}
    for t in tasks:
        if t.assigned_to:
            assigned_user = User.query.get(t.assigned_to)
            if assigned_user:
                name = assigned_user.name
                if name not in tasks_per_user:
                    tasks_per_user[name] = 0
                tasks_per_user[name] += 1

    return jsonify({
        'total': total,
        'todo': todo,
        'in_progress': in_progress,
        'done': done,
        'overdue': overdue,
        'tasks_per_user': tasks_per_user
    })


# gets list of members in a project
@app.route('/api/projects/<int:project_id>/members', methods=['GET'])
@jwt_required()
def get_members(project_id):
    members = db.session.query(User).join(ProjectMember).filter(ProjectMember.project_id == project_id).all()
    owner = User.query.get(Project.query.get(project_id).owner_id)
    all_members = {m.id: m for m in members + [owner]}.values()
    return jsonify([{
        'id': m.id,
        'name': m.name,
        'email': m.email
    } for m in all_members])


# removes a member from a project - owner only
@app.route('/api/projects/<int:project_id>/members/<int:member_user_id>', methods=['DELETE'])
@jwt_required()
def remove_member(project_id, member_user_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)

    if not project:
        return jsonify({'error': 'Project not found'}), 404

    # checking if it's actually the owner trying to kick someone
    if project.owner_id != user_id:
        return jsonify({'error': 'Only project owner can remove members'}), 403

    membership = ProjectMember.query.filter_by(project_id=project_id, user_id=member_user_id).first()
    if not membership:
        return jsonify({'error': 'User is not a member of this project'}), 400

    db.session.delete(membership)
    db.session.commit()
    return jsonify({'message': 'Member removed successfully'})


if __name__ == '__main__':
    app.run(debug=True)