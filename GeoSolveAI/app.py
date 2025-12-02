from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import io
import base64
import sympy as sp
from sympy import *
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from PIL import Image
import math
import sqlite3
from datetime import datetime
import hashlib

app = Flask(__name__, static_folder='client/build', static_url_path='')
CORS(app)

UPLOAD_FOLDER = 'uploads'
DATABASE = 'geosolve.db'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def init_db():
    """Initialize SQLite database with required tables."""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  email TEXT UNIQUE NOT NULL,
                  password TEXT NOT NULL,
                  phone TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS feedback
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_email TEXT NOT NULL,
                  message TEXT NOT NULL,
                  resolved INTEGER DEFAULT 0,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS quizzes
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT NOT NULL,
                  description TEXT,
                  created_by TEXT NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS quiz_questions
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  quiz_id INTEGER NOT NULL,
                  question_text TEXT NOT NULL,
                  option_a TEXT NOT NULL,
                  option_b TEXT NOT NULL,
                  option_c TEXT NOT NULL,
                  option_d TEXT NOT NULL,
                  correct_answer TEXT NOT NULL,
                  FOREIGN KEY(quiz_id) REFERENCES quizzes(id))''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS quiz_submissions
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  quiz_id INTEGER NOT NULL,
                  user_email TEXT NOT NULL,
                  responses TEXT NOT NULL,
                  score INTEGER,
                  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY(quiz_id) REFERENCES quizzes(id))''')
    
    conn.commit()
    conn.close()

init_db()

def get_gemini_model():
    """Return the valid Gemini model for GeoSolve"""
    return 'gemini-2.5-flash'

def verify_admin_key(request):
    """Verify if the request has valid admin key in header."""
    admin_email = os.environ.get('ADMIN_EMAIL')
    admin_key = request.headers.get('X-Admin-Key')
    return admin_key == admin_email

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

def clean_expression(expr_str):
    """
    Clean and normalize mathematical expressions for SymPy parsing.
    Handles: ^ to **, missing parentheses, implicit multiplication, function calls, angle expressions
    """
    import re
    
    expr = expr_str.strip()
    
    # Replace ^ with **
    expr = expr.replace('^', '**')
    
    # Function names that need auto-parenthesis
    functions = ['sin', 'cos', 'tan', 'log', 'exp', 'sqrt', 'abs', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh']
    
    # SPECIAL HANDLING: Detect angle expressions like "sin45" or "cos30"
    # Pattern: function name followed immediately by number (no space, no paren)
    # E.g., "sin45" -> "sin(radians(45))", but "sin(x)" stays as is
    for func in functions:
        # Match pattern like: sin45, cos30, tan60, but NOT sin(x) or sinx
        pattern = rf'\b{func}(\d+(?:\.\d+)?)\b'
        matches = re.finditer(pattern, expr)
        for match in matches:
            angle_value = match.group(1)
            # Replace sin45 with sin(radians(45))
            expr = expr[:match.start()] + f'{func}(radians({angle_value}))' + expr[match.end():]
    
    # Fix function calls: sin x -> sin(x), cos 30 -> cos(30)
    for func in functions:
        # Pattern: function followed by space or immediate value (but not already parenthesized)
        pattern = rf'{func}\s+(?![\(\[])'
        expr = re.sub(pattern, f'{func}(', expr)
    
    # Handle implicit multiplication: 3x -> 3*x, 2(x+1) -> 2*(x+1), etc.
    expr_processed = ''
    for i, char in enumerate(expr):
        expr_processed += char
        if i < len(expr) - 1:
            curr = char
            next_char = expr[i + 1]
            # Add * between: digit-letter, digit-paren, paren-letter, )-(, )-digit, )-(
            if ((curr.isdigit() or curr == ')') and (next_char.isalpha() or next_char == '(')) or \
               (curr.isalpha() and next_char == '(' and not curr.isspace()) or \
               (curr == ')' and (next_char == '(' or next_char.isdigit())):
                # But don't add * if one already exists
                if expr_processed[-2:] != '* ':
                    expr_processed += '*'
    
    expr = expr_processed
    
    # Remove extra spaces
    expr = ' '.join(expr.split())
    
    return expr

@app.route('/api/register', methods=['POST'])
def register():
    """User registration endpoint - creates new student account."""
    try:
        data = request.json
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        
        # Validation
        if not name or not email or not password:
            return jsonify({'message': 'All fields are required'}), 400
        
        if len(password) < 8:
            return jsonify({'message': 'Password must be at least 8 characters'}), 400
        
        if '@' not in email:
            return jsonify({'message': 'Invalid email format'}), 400
        
        # Hash password
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        # Save to database
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        
        try:
            c.execute('''INSERT INTO users (name, email, password)
                         VALUES (?, ?, ?)''',
                      (name, email, hashed_password))
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'Account created successfully'
            }), 200
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({'message': 'Email already registered'}), 409
        except Exception as e:
            conn.close()
            return jsonify({'message': f'Registration failed: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Admin login endpoint - verifies credentials against environment variables."""
    try:
        data = request.json
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        
        admin_email = os.environ.get('ADMIN_EMAIL', '')
        admin_pass = os.environ.get('ADMIN_PASS', '')
        
        if email == admin_email and password == admin_pass:
            return jsonify({
                'success': True,
                'role': 'admin',
                'message': 'Admin login successful'
            }), 200
        else:
            # Return generic error to prevent email enumeration
            return jsonify({
                'success': False,
                'message': 'Invalid credentials'
            }), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
def get_admin_users():
    """Get all registered users - requires admin key."""
    if not verify_admin_key(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        c.execute('SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC')
        rows = c.fetchall()
        conn.close()
        
        users = [dict(row) for row in rows]
        return jsonify({'users': users, 'total': len(users)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/feedback', methods=['GET'])
def get_admin_feedback():
    """Get all user feedback/complaints - requires admin key."""
    if not verify_admin_key(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        c.execute('SELECT id, user_email, message, created_at FROM feedback ORDER BY created_at DESC')
        rows = c.fetchall()
        conn.close()
        
        feedback_list = [dict(row) for row in rows]
        return jsonify({'feedback': feedback_list, 'total': len(feedback_list)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register_user():
    """Register a new user."""
    try:
        data = request.json
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        phone = data.get('phone', '').strip()
        
        if not all([name, email, password]):
            return jsonify({'error': 'Name, email, and password are required'}), 400
        
        # Hash password
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        
        try:
            c.execute('INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
                     (name, email, hashed_password, phone))
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'User registered successfully'}), 201
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({'error': 'Email already registered'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """Submit user feedback/complaint."""
    try:
        data = request.json
        user_email = data.get('user_email', '').strip()
        message = data.get('message', '').strip()
        
        if not all([user_email, message]):
            return jsonify({'error': 'Email and message are required'}), 400
        
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        
        c.execute('INSERT INTO feedback (user_email, message) VALUES (?, ?)',
                 (user_email, message))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Feedback submitted successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def format_textbook_solution(steps_list, solution):
    """Format solution steps in textbook style: each step on new line, no markdown."""
    formatted = []
    for i, step in enumerate(steps_list, 1):
        if step and step.strip():
            formatted.append(f"{i}. {step.strip()}")
    formatted.append("")
    formatted.append(f"Final Answer: {solution}")
    return '\n'.join(formatted)

def handle_trig_constant(func_name, angle_str):
    """Handler for trig functions with constants like sin45, cos90, tan30"""
    try:
        angle = float(angle_str)
        angle_rad = math.radians(angle)
        
        sin_val = math.sin(angle_rad)
        cos_val = math.cos(angle_rad)
        tan_val = math.tan(angle_rad) if abs(cos_val) > 1e-10 else None
        
        exact_vals = {0: '0', 30: '1/2', 45: '√(2)/2', 60: '√(3)/2', 90: '1', 120: '√(3)/2', 135: '√(2)/2', 150: '1/2', 180: '0'}
        
        if func_name == 'sin':
            exact = exact_vals.get(int(angle)) if angle == int(angle) else None
            steps = [f"Finding sin({angle}°)", f"sin({angle}°) = {sin_val:.6f}"]
            if exact:
                steps.append(f"Exact value: sin({angle}°) = {exact}")
            steps.append(f"Note: sin(constant) is a fixed number with no variable, so it is NOT differentiable")
            return {
                'type': 'Trigonometric Function',
                'solution': exact if exact else f'{sin_val:.6f}',
                'steps': steps
            }
        elif func_name == 'cos':
            exact = exact_vals.get(int(angle)) if angle == int(angle) else None
            steps = [f"Finding cos({angle}°)", f"cos({angle}°) = {cos_val:.6f}"]
            if exact:
                steps.append(f"Exact value: cos({angle}°) = {exact}")
            steps.append(f"Note: cos(constant) is a fixed number with no variable, so it is NOT differentiable")
            return {
                'type': 'Trigonometric Function',
                'solution': exact if exact else f'{cos_val:.6f}',
                'steps': steps
            }
        elif func_name == 'tan':
            if abs(cos_val) < 1e-10:
                steps = [
                    "Finding tan(θ) using the formula:",
                    "tan(θ) = sin(θ) / cos(θ)",
                    "",
                    f"sin({angle}°) = {sin_val:.6f}",
                    f"cos({angle}°) ≈ 0",
                    "",
                    "Division by zero is NOT DEFINED",
                    "tan(θ) is UNDEFINED when cos(θ) = 0",
                    "",
                    "Note: tan(constant) is not defined here, so it is NOT differentiable"
                ]
                return {'type': 'Trigonometric Function', 'solution': 'UNDEFINED', 'steps': steps}
            exact = {30: '1/√(3)', 45: '1', 60: '√(3)'}.get(int(angle))
            steps = [
                "Finding tan(θ) using the formula:",
                "tan(θ) = sin(θ) / cos(θ)",
                "",
                f"sin({angle}°) = {sin_val:.6f}",
                f"cos({angle}°) = {cos_val:.6f}",
                "",
                f"tan({angle}°) = {sin_val:.6f} / {cos_val:.6f}",
                f"tan({angle}°) = {tan_val:.6f}",
            ]
            if exact:
                steps.append(f"Exact value: tan({angle}°) = {exact}")
            steps.append(f"Note: tan(constant) is a fixed number with no variable, so it is NOT differentiable")
            return {
                'type': 'Trigonometric Function',
                'solution': exact if exact else f'{tan_val:.6f}',
                'steps': steps
            }
    except:
        return None

@app.route('/api/solve', methods=['POST'])
def solve():
    try:
        data = request.json
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
        
        result = {
            'query': query,
            'solution': None,
            'steps': [],
            'type': None
        }
        
        query_lower = query.lower().strip()
        x = sp.Symbol('x')
        
        # SOLVE: solve x^2 - 5*x + 6
        if 'solve' in query_lower or '=' in query:
            eq_str = query.replace('solve', '').replace('Solve', '').strip()
            result['type'] = 'equation'
            
            try:
                cleaned = clean_expression(eq_str)
                if '=' in cleaned:
                    lhs, rhs = cleaned.split('=')
                    lhs_expr = parse_expr(lhs, transformations=(standard_transformations + (implicit_multiplication_application,)))
                    rhs_expr = parse_expr(rhs, transformations=(standard_transformations + (implicit_multiplication_application,)))
                    equation = lhs_expr - rhs_expr
                else:
                    equation = parse_expr(cleaned, transformations=(standard_transformations + (implicit_multiplication_application,)))
                
                solutions = sp.solve(equation, x)
                result['solution'] = [str(sol.evalf() if sol.is_number else sol) for sol in solutions]
                result['steps'] = [
                    f"Original equation: {eq_str}",
                    f"Cleaned form: {cleaned}",
                    f"Parsed: {equation} = 0",
                    f"Solutions: {result['solution']}"
                ]
            except Exception as e:
                return jsonify({'error': f'Error solving equation: {str(e)}'}), 400
                
        # INTEGRATE: integrate x^2 * sin x
        elif 'integrate' in query_lower or '∫' in query:
            expr_str = query.replace('integrate', '').replace('Integrate', '').replace('∫', '').strip()
            result['type'] = 'integration'
            
            try:
                cleaned = clean_expression(expr_str)
                expr = parse_expr(cleaned, transformations=(standard_transformations + (implicit_multiplication_application,)))
                integral = sp.integrate(expr, x)
                result['solution'] = str(integral)
                result['steps'] = [
                    f"Original: {expr_str}",
                    f"Cleaned: {cleaned}",
                    f"Parsed: {expr}",
                    f"Integrating with respect to x",
                    f"Result: {integral} + C"
                ]
            except Exception as e:
                return jsonify({'error': f'Error integrating: {str(e)}'}), 400
                
        # DIFFERENTIATE: diff x^3 cos x
        elif 'differentiate' in query_lower or 'diff' in query_lower or 'derivative' in query_lower or "d/dx" in query_lower:
            expr_str = query.replace('differentiate', '').replace('Differentiate', '').replace('diff', '').replace('Diff', '').replace('derivative', '').replace('Derivative', '').replace('d/dx', '').strip()
            result['type'] = 'differentiation'
            
            try:
                cleaned = clean_expression(expr_str)
                expr = parse_expr(cleaned, transformations=(standard_transformations + (implicit_multiplication_application,)))
                derivative = sp.diff(expr, x)
                result['solution'] = str(derivative)
                result['steps'] = [
                    f"Original: {expr_str}",
                    f"Cleaned: {cleaned}",
                    f"Parsed: {expr}",
                    f"Differentiating with respect to x",
                    f"Result: {derivative}"
                ]
            except Exception as e:
                return jsonify({'error': f'Error differentiating: {str(e)}'}), 400
        
        # FACTOR: factor x^2 - 9
        elif 'factor' in query_lower:
            expr_str = query.replace('factor', '').replace('Factor', '').strip()
            result['type'] = 'factorization'
            
            try:
                cleaned = clean_expression(expr_str)
                expr = parse_expr(cleaned, transformations=(standard_transformations + (implicit_multiplication_application,)))
                factored = sp.factor(expr)
                result['solution'] = str(factored)
                result['steps'] = [
                    f"Original: {expr_str}",
                    f"Cleaned: {cleaned}",
                    f"Parsed: {expr}",
                    f"Factored: {factored}"
                ]
            except Exception as e:
                return jsonify({'error': f'Error factoring: {str(e)}'}), 400
        
        # TRIG FUNCTIONS: sin45, cos90, tan30, etc.
        elif any(t in query_lower for t in ['sin', 'cos', 'tan']):
            import re
            for func in ['sin', 'cos', 'tan']:
                match = re.search(rf'{func}\s*\(?\s*(\d+(?:\.\d+)?)\s*\)?', query_lower)
                if match:
                    angle_str = match.group(1)
                    trig_result = handle_trig_constant(func, angle_str)
                    if trig_result:
                        trig_result['steps'] = [step for step in trig_result.get('steps', []) if step.strip()]
                        return jsonify(trig_result)
        
        # DEFAULT: Simplify or evaluate
        else:
            result['type'] = 'simplification'
            
            try:
                cleaned = clean_expression(query)
                
                # Try to detect if it's a pure number expression (no x)
                if 'x' not in cleaned.lower():
                    # Try to evaluate numerically
                    try:
                        import math
                        allowed_names = {
                            'sin': math.sin, 'cos': math.cos, 'tan': math.tan,
                            'sqrt': math.sqrt, 'log': math.log, 'exp': math.exp,
                            'pi': math.pi, 'e': math.e,
                            'asin': math.asin, 'acos': math.acos, 'atan': math.atan,
                            'abs': abs, 'sinh': math.sinh, 'cosh': math.cosh, 'tanh': math.tanh
                        }
                        numerical_result = eval(cleaned, {"__builtins__": {}}, allowed_names)
                        result['solution'] = str(float(numerical_result))
                        result['steps'] = [
                            f"Original: {query}",
                            f"Cleaned: {cleaned}",
                            f"Numerical Result: {numerical_result}"
                        ]
                    except:
                        # Fall back to symbolic
                        expr = parse_expr(cleaned, transformations=(standard_transformations + (implicit_multiplication_application,)))
                        simplified = sp.simplify(expr)
                        result['solution'] = str(simplified)
                        result['steps'] = [
                            f"Original: {query}",
                            f"Cleaned: {cleaned}",
                            f"Simplified: {simplified}"
                        ]
                else:
                    # Contains x, do symbolic simplification
                    expr = parse_expr(cleaned, transformations=(standard_transformations + (implicit_multiplication_application,)))
                    simplified = sp.simplify(expr)
                    result['solution'] = str(simplified)
                    result['steps'] = [
                        f"Original: {query}",
                        f"Cleaned: {cleaned}",
                        f"Simplified: {simplified}"
                    ]
            except Exception as e:
                # Last resort: try sympify
                try:
                    sympified = sp.sympify(query, evaluate=True)
                    result['solution'] = str(sympified)
                    result['steps'] = [f"Input: {query}", f"Result: {sympified}"]
                except:
                    return jsonify({'error': f'Could not parse expression: {str(e)}'}), 400
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

@app.route('/api/plot', methods=['POST'])
def plot():
    try:
        data = request.json
        expr_str = data.get('expr', 'sin(x)').strip()
        x_from = data.get('from', None)
        x_to = data.get('to', None)
        mode = data.get('mode', 'degrees')
        
        # Set defaults if empty
        if x_from is None or x_from == '' or x_from == 0:
            x_from = 0 if mode == 'degrees' else 0
        else:
            x_from = float(x_from)
            
        if x_to is None or x_to == '' or x_to == 0:
            x_to = 360 if mode == 'degrees' else (2 * np.pi)
        else:
            x_to = float(x_to)
        
        if not expr_str:
            return jsonify({'error': 'Please enter a mathematical expression.'}), 400
        
        # Process input: add spaces around operators for better parsing
        expr_str = expr_str.replace('sin ', 'sin(').replace('cos ', 'cos(').replace('tan ', 'tan(')
        
        # Handle implicit multiplication: 3x -> 3*x, 2(x+1) -> 2*(x+1), etc.
        expr_processed = ''
        for i, char in enumerate(expr_str):
            expr_processed += char
            if i < len(expr_str) - 1:
                curr = char
                next_char = expr_str[i+1]
                # Add * between: digit-letter, digit-paren, paren-letter, )-(, )-digit
                if (curr.isdigit() and next_char.isalpha()) or \
                   (curr.isdigit() and next_char == '(') or \
                   (curr.isalpha() and next_char == '(') or \
                   (curr == ')' and next_char == '(') or \
                   (curr == ')' and next_char.isdigit()):
                    expr_processed += '*'
        
        expr_str = expr_processed
        
        # Detect if this is a single value (no 'x' variable) or a function
        is_single_value = 'x' not in expr_str.lower()
        
        # Calculate single value if applicable
        single_result = None
        if is_single_value:
            try:
                allowed_single = {
                    'sin': lambda v: np.sin(np.radians(v)) if mode == 'degrees' else np.sin(v),
                    'cos': lambda v: np.cos(np.radians(v)) if mode == 'degrees' else np.cos(v),
                    'tan': lambda v: np.tan(np.radians(v)) if mode == 'degrees' else np.tan(v),
                    'sqrt': np.sqrt,
                    'log': np.log,
                    'exp': np.exp,
                    'pi': np.pi,
                    'e': np.e,
                    'abs': abs,
                    'asin': np.arcsin,
                    'acos': np.arccos,
                    'atan': np.arctan
                }
                single_result = eval(expr_str, {"__builtins__": {}}, allowed_single)
            except Exception as e:
                return jsonify({'error': f'Invalid expression. Please check your function.'}), 400
        
        # For single values, use a tiny range (2 points)
        if is_single_value:
            x_display = np.array([0, 1])
            y_vals = np.array([float(single_result), float(single_result)])
            x_axis_label = 'Range'
        else:
            # Create x values for display
            x_display = np.linspace(x_from, x_to, 500)
            
            # Prepare x_eval based on mode
            if mode == 'degrees':
                x_eval = np.radians(x_display)
                x_axis_label = 'x (Degrees)'
            else:
                x_eval = x_display
                x_axis_label = 'x (Radians)'
            
            # Define allowed functions and constants
            allowed = {
                'sin': np.sin,
                'cos': np.cos,
                'tan': np.tan,
                'sqrt': np.sqrt,
                'log': np.log,
                'exp': np.exp,
                'pi': np.pi,
                'e': np.e,
                'x': x_eval,
                'abs': np.abs,
                'asin': np.arcsin,
                'acos': np.arccos,
                'atan': np.arctan
            }
            
            # Evaluate function
            try:
                y_vals = eval(expr_str, {"__builtins__": {}}, allowed)
            except:
                return jsonify({'error': 'Invalid expression. Please check your function.'}), 400
        
        # Create plot
        fig, ax = plt.subplots(figsize=(10, 6))
        
        if is_single_value:
            # For single values, show a horizontal line with dot
            ax.axhline(y=float(single_result), color='b', linewidth=2, linestyle='--', label=f'Value: {float(single_result):.6f}')
            ax.plot(0.5, float(single_result), 'ro', markersize=12, label='Result', zorder=5)
            ax.set_xlim(-0.5, 1.5)
        else:
            ax.plot(x_display, y_vals, 'b-', linewidth=2.5, label='f(x)')
        
        # Add coordinate grid with axes
        ax.grid(True, alpha=0.4, linestyle='--', linewidth=0.7)
        ax.axhline(y=0, color='k', linewidth=0.8, alpha=0.5)
        ax.axvline(x=0, color='k', linewidth=0.8, alpha=0.5)
        
        # Add axis labels
        if not is_single_value:
            ax.set_xlabel(x_axis_label, fontsize=12, fontweight='bold')
        ax.set_ylabel('y (Value)', fontsize=12, fontweight='bold')
        title_suffix = f' ({mode.capitalize()} Mode)' if not is_single_value else ''
        ax.set_title(f'Graph of {expr_str}{title_suffix}', fontsize=14, fontweight='bold', pad=15)
        
        # Add tick marks
        ax.tick_params(which='major', labelsize=10)
        ax.grid(True, which='major', alpha=0.3)
        ax.grid(True, which='minor', alpha=0.1)
        ax.legend()
        
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close()
        
        response = {
            'image': f'data:image/png;base64,{img_base64}',
            'expression': expr_str,
            'mode': mode
        }
        
        if single_result is not None:
            response['single_value'] = float(single_result)
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/api/geometry', methods=['POST'])
def geometry():
    try:
        data = request.json
        command = data.get('command', '').lower().strip()
        
        result = {
            'shape': None,
            'properties': {},
            'image': None
        }
        
        if 'triangle' in command:
            parts = command.replace('triangle', '').strip().split()
            if len(parts) >= 3:
                a, b, c = float(parts[0]), float(parts[1]), float(parts[2])
                
                if a + b > c and b + c > a and a + c > b:
                    s = (a + b + c) / 2
                    area = math.sqrt(s * (s - a) * (s - b) * (s - c))
                    perimeter = a + b + c
                    
                    angle_A = math.degrees(math.acos((b**2 + c**2 - a**2) / (2 * b * c)))
                    angle_B = math.degrees(math.acos((a**2 + c**2 - b**2) / (2 * a * c)))
                    angle_C = 180 - angle_A - angle_B
                    
                    result['shape'] = 'triangle'
                    result['properties'] = {
                        'sides': [a, b, c],
                        'area': round(area, 2),
                        'perimeter': round(perimeter, 2),
                        'angles': [round(angle_A, 2), round(angle_B, 2), round(angle_C, 2)]
                    }
                    
                    fig, ax = plt.subplots(figsize=(8, 8))
                    
                    x1, y1 = 0, 0
                    x2, y2 = c, 0
                    x3 = (c**2 + b**2 - a**2) / (2 * c)
                    y3 = math.sqrt(b**2 - x3**2)
                    
                    triangle = patches.Polygon([(x1, y1), (x2, y2), (x3, y3)], fill=True, alpha=0.3, edgecolor='blue', linewidth=2)
                    ax.add_patch(triangle)
                    
                    ax.plot([x1, x2, x3, x1], [y1, y2, y3, y1], 'bo-', markersize=8)
                    
                    ax.text((x1+x2)/2, (y1+y2)/2 - 0.3, f'{c}', ha='center', fontsize=12)
                    ax.text((x2+x3)/2 + 0.3, (y2+y3)/2, f'{a}', ha='center', fontsize=12)
                    ax.text((x1+x3)/2 - 0.3, (y1+y3)/2, f'{b}', ha='center', fontsize=12)
                    
                    ax.set_aspect('equal')
                    ax.grid(True, alpha=0.3)
                    ax.set_title(f'Triangle: sides = {a}, {b}, {c}', fontsize=14)
                    
                    buf = io.BytesIO()
                    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
                    buf.seek(0)
                    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
                    plt.close()
                    
                    result['image'] = f'data:image/png;base64,{img_base64}'
                else:
                    return jsonify({'error': 'Invalid triangle: sides do not satisfy triangle inequality'}), 400
            else:
                return jsonify({'error': 'Triangle requires 3 side lengths'}), 400
                
        elif 'circle' in command:
            parts = command.replace('circle', '').strip().split()
            if len(parts) >= 1:
                radius = float(parts[0])
                
                area = math.pi * radius ** 2
                circumference = 2 * math.pi * radius
                
                result['shape'] = 'circle'
                result['properties'] = {
                    'radius': radius,
                    'area': round(area, 2),
                    'circumference': round(circumference, 2),
                    'diameter': round(2 * radius, 2)
                }
                
                fig, ax = plt.subplots(figsize=(8, 8))
                circle = patches.Circle((0, 0), radius, fill=True, alpha=0.3, edgecolor='blue', linewidth=2)
                ax.add_patch(circle)
                
                ax.plot([0, radius], [0, 0], 'r-', linewidth=2)
                ax.plot(0, 0, 'ro', markersize=8)
                ax.text(radius/2, 0.2, f'r = {radius}', ha='center', fontsize=12)
                
                ax.set_aspect('equal')
                ax.grid(True, alpha=0.3)
                ax.set_xlim(-radius*1.5, radius*1.5)
                ax.set_ylim(-radius*1.5, radius*1.5)
                ax.set_title(f'Circle: radius = {radius}', fontsize=14)
                
                buf = io.BytesIO()
                plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
                buf.seek(0)
                img_base64 = base64.b64encode(buf.read()).decode('utf-8')
                plt.close()
                
                result['image'] = f'data:image/png;base64,{img_base64}'
            else:
                return jsonify({'error': 'Circle requires a radius'}), 400
        else:
            return jsonify({'error': 'Unknown geometry command. Use "triangle 3 4 5" or "circle 7"'}), 400
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ocr', methods=['POST'])
def ocr():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        img = Image.open(file.stream)
        
        try:
            import pytesseract
            text = pytesseract.image_to_string(img)
        except ImportError:
            return jsonify({'error': 'pytesseract library not available. Please install pytesseract.'}), 500
        except Exception as e:
            return jsonify({'error': f'OCR processing error: {str(e)}'}), 500
        
        return jsonify({
            'text': text.strip(),
            'success': True
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def clean_markdown(text):
    """Remove markdown formatting while preserving textbook structure."""
    import re
    # Remove markdown headers
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
    # Remove bold/italic markers
    text = re.sub(r'\*\*', '', text)
    text = re.sub(r'__', '', text)
    text = re.sub(r'\*', '', text)
    text = re.sub(r'_', '', text)
    # Remove backticks but keep the content
    text = re.sub(r'`', '', text)
    # Remove dollar signs for math
    text = re.sub(r'\$', '', text)
    # Clean up lines while preserving blank lines for readability
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        # Don't strip completely - preserve intentional spacing
        original_line = line
        stripped = line.strip()
        # Convert bullet points to indented content
        if stripped.startswith('-') or stripped.startswith('•'):
            cleaned_lines.append(stripped[1:].strip())
        elif stripped or not stripped:  # Keep blank lines for structure
            cleaned_lines.append(original_line.rstrip())
    # Remove excessive blank lines but keep some for readability
    result = []
    prev_blank = False
    for line in cleaned_lines:
        if not line.strip():
            if not prev_blank:
                result.append('')
            prev_blank = True
        else:
            result.append(line)
            prev_blank = False
    return '\n'.join(result).strip()

@app.route('/api/gemini', methods=['POST'])
def gemini_explain():
    try:
        data = request.json
        prompt = data.get('prompt', '').strip()
        difficulty = data.get('difficulty', 'Standard').strip()
        
        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400
        
        try:
            import google.generativeai as genai
            
            api_key = os.environ.get('GEMINI_API_KEY')
            if not api_key:
                return jsonify({'error': 'Gemini API key not configured'}), 500
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(get_gemini_model())
            
            geotutor_instruction = """You are "GeoTutor" — a friendly, expert exam-focused study assistant.

Your task is to explain concepts clearly and naturally, like ChatGPT or Gemini would.

PERSONALITY:
• Be conversational, warm, and encouraging
• Use emojis naturally: ✨📘🧠📌📚➗📝💡🔍⭐
• Keep language simple and exam-focused
• Make learning engaging and easy to understand
• Answer directly and comprehensively

FORMATTING RULES:
• Keep paragraphs SHORT (2-3 sentences max)
• Add a blank line between each paragraph
• Use bullet points or numbers only for lists
• Start with a brief greeting (1-2 lines)
• Then explain clearly with proper spacing
• End with a friendly follow-up question

RESPONSE STRUCTURE:
1. Brief warm greeting (1-2 lines)
2. Blank line
3. Main explanation in short paragraphs with blank lines between each
4. Blank line
5. Key points or examples if needed
6. Blank line
7. Friendly follow-up question

Keep it concise, readable, and well-spaced. Use your judgment on how to best present the information with proper formatting for easy reading.

Now answer this question:"""
            
            full_prompt = f"{geotutor_instruction}\n\nQuestion: {prompt}\n\nDifficulty level: {difficulty}"
            response = model.generate_content(full_prompt)
            
            cleaned_explanation = clean_markdown(response.text)
            
            return jsonify({
                'explanation': cleaned_explanation,
                'success': True
            })
        except ImportError:
            return jsonify({'error': 'google-generativeai library not available'}), 500
        except Exception as e:
            return jsonify({'error': f'AI error: {str(e)}'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        try:
            import google.generativeai as genai
            
            api_key = os.environ.get('GEMINI_API_KEY')
            if not api_key:
                return jsonify({'error': 'Gemini API key not configured'}), 500
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(get_gemini_model())
            
            response = model.generate_content(user_message)
            
            return jsonify({
                'message': user_message,
                'response': response.text,
                'success': True
            })
        except ImportError:
            return jsonify({'error': 'google-generativeai library not available'}), 500
        except Exception as e:
            return jsonify({'error': f'AI error: {str(e)}'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pdf', methods=['POST'])
def process_pdf():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No PDF file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        try:
            import pdfplumber
            
            text_content = []
            with pdfplumber.open(file.stream) as pdf:
                for page in pdf.pages:
                    text_content.append(page.extract_text())
            
            full_text = '\n'.join(text_content)
            
            return jsonify({
                'text': full_text,
                'pages': len(text_content),
                'success': True
            })
        except ImportError:
            return jsonify({'error': 'pdfplumber library not available'}), 500
        except Exception as e:
            return jsonify({'error': f'PDF processing error: {str(e)}'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Quiz Endpoints
@app.route('/api/admin/quizzes', methods=['POST'])
def create_quiz():
    """Create a new quiz - requires admin key."""
    if not verify_admin_key(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.json
        title = data.get('title')
        description = data.get('description', '')
        questions = data.get('questions', [])
        admin_email = request.headers.get('X-Admin-Key')
        
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('INSERT INTO quizzes (title, description, created_by) VALUES (?, ?, ?)',
                 (title, description, admin_email))
        quiz_id = c.lastrowid
        
        for q in questions:
            c.execute('''INSERT INTO quiz_questions 
                        (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
                        VALUES (?, ?, ?, ?, ?, ?, ?)''',
                     (quiz_id, q['text'], q['a'], q['b'], q['c'], q['d'], q['correct']))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'quiz_id': quiz_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/quizzes', methods=['GET'])
def get_admin_quizzes():
    """Get all quizzes - requires admin key."""
    if not verify_admin_key(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('''SELECT q.id, q.title, q.description, q.created_by, q.created_at, COUNT(qq.id) as q_count
                     FROM quizzes q
                     LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
                     GROUP BY q.id ORDER BY q.created_at DESC''')
        quizzes = [{'id': row[0], 'title': row[1], 'description': row[2], 'created_by': row[3], 
                   'created_at': row[4], 'question_count': row[5]} for row in c.fetchall()]
        conn.close()
        return jsonify({'quizzes': quizzes}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/quizzes/<int:quiz_id>', methods=['DELETE'])
def delete_quiz(quiz_id):
    """Delete a quiz - requires admin key."""
    if not verify_admin_key(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('DELETE FROM quiz_questions WHERE quiz_id = ?', (quiz_id,))
        c.execute('DELETE FROM quiz_submissions WHERE quiz_id = ?', (quiz_id,))
        c.execute('DELETE FROM quizzes WHERE id = ?', (quiz_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quizzes', methods=['GET'])
def get_quizzes_for_users():
    """Get available quizzes for users."""
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('SELECT id, title, description, created_at FROM quizzes ORDER BY created_at DESC')
        quizzes = [{'id': row[0], 'title': row[1], 'description': row[2], 'created_at': row[3]} 
                  for row in c.fetchall()]
        conn.close()
        return jsonify({'quizzes': quizzes}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quizzes/<int:quiz_id>', methods=['GET'])
def get_quiz_details(quiz_id):
    """Get quiz details with questions."""
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('SELECT id, title, description FROM quizzes WHERE id = ?', (quiz_id,))
        quiz_row = c.fetchone()
        
        if not quiz_row:
            return jsonify({'error': 'Quiz not found'}), 404
        
        c.execute('''SELECT id, question_text, option_a, option_b, option_c, option_d
                     FROM quiz_questions WHERE quiz_id = ? ORDER BY id''', (quiz_id,))
        questions = [{'id': row[0], 'text': row[1], 'options': {'a': row[2], 'b': row[3], 'c': row[4], 'd': row[5]}}
                    for row in c.fetchall()]
        
        conn.close()
        return jsonify({
            'id': quiz_row[0],
            'title': quiz_row[1],
            'description': quiz_row[2],
            'questions': questions
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz-submit', methods=['POST'])
def submit_quiz():
    """Submit quiz answers."""
    try:
        data = request.json
        quiz_id = data.get('quiz_id')
        user_email = data.get('user_email')
        responses = data.get('responses', {})
        
        # Validation
        if not quiz_id or not user_email:
            return jsonify({'error': 'Missing quiz_id or user_email'}), 400
        
        if not responses:
            return jsonify({'error': 'No answers provided'}), 400
        
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        
        # Verify quiz exists
        c.execute('SELECT id FROM quizzes WHERE id = ?', (quiz_id,))
        if not c.fetchone():
            conn.close()
            return jsonify({'error': 'Quiz not found'}), 404
        
        # Calculate score
        score = 0
        for qid_str, answer in responses.items():
            try:
                qid = int(qid_str)
                c.execute('SELECT correct_answer FROM quiz_questions WHERE id = ? AND quiz_id = ?', (qid, quiz_id))
                result = c.fetchone()
                if result and result[0] == answer:
                    score += 1
            except (ValueError, TypeError) as e:
                conn.close()
                return jsonify({'error': f'Invalid question ID: {qid_str}'}), 400
        
        import json
        c.execute('''INSERT INTO quiz_submissions (quiz_id, user_email, responses, score)
                     VALUES (?, ?, ?, ?)''',
                 (quiz_id, user_email, json.dumps(responses), score))
        
        conn.commit()
        submission_id = c.lastrowid
        conn.close()
        
        return jsonify({'success': True, 'score': score, 'submission_id': submission_id, 'total_questions': len(responses)}), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/quiz-submissions', methods=['GET'])
def get_quiz_submissions():
    """Get all quiz submissions - requires admin key."""
    if not verify_admin_key(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('''SELECT qs.id, q.title, qs.user_email, qs.score, qs.submitted_at,
                     (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as total_questions
                     FROM quiz_submissions qs
                     JOIN quizzes q ON qs.quiz_id = q.id
                     ORDER BY qs.submitted_at DESC''')
        
        submissions = [{'id': row[0], 'quiz_title': row[1], 'user_email': row[2], 'score': row[3],
                       'total': row[5], 'submitted_at': row[4]} for row in c.fetchall()]
        conn.close()
        
        return jsonify({'submissions': submissions}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/quiz-submission/<int:submission_id>', methods=['GET'])
def get_submission_details(submission_id):
    """Get detailed submission with answers - requires admin key."""
    if not verify_admin_key(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        
        c.execute('''SELECT qs.quiz_id, qs.user_email, qs.responses, qs.score, q.title
                     FROM quiz_submissions qs
                     JOIN quizzes q ON qs.quiz_id = q.id
                     WHERE qs.id = ?''', (submission_id,))
        
        row = c.fetchone()
        if not row:
            return jsonify({'error': 'Submission not found'}), 404
        
        import json
        quiz_id, user_email, responses_json, score, quiz_title = row
        responses = json.loads(responses_json)
        
        # Get all questions with correct answers
        c.execute('''SELECT id, question_text, option_a, option_b, option_c, option_d, correct_answer
                     FROM quiz_questions WHERE quiz_id = ? ORDER BY id''', (quiz_id,))
        
        questions = []
        for q_row in c.fetchall():
            qid, text, a, b, c_opt, d, correct = q_row
            selected = responses.get(str(qid), None)
            questions.append({
                'id': qid,
                'text': text,
                'options': {'a': a, 'b': b, 'c': c_opt, 'd': d},
                'correct_answer': correct,
                'user_answer': selected,
                'is_correct': selected == correct
            })
        
        conn.close()
        
        return jsonify({
            'submission_id': submission_id,
            'quiz_title': quiz_title,
            'user_email': user_email,
            'score': score,
            'total': len(questions),
            'questions': questions
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)

@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    """Get admin statistics and analytics - requires admin key."""
    if not verify_admin_key(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        
        c.execute('SELECT COUNT(*) FROM users')
        total_users = c.fetchone()[0]
        
        c.execute('SELECT COUNT(*) FROM feedback')
        total_feedback = c.fetchone()[0]
        
        c.execute('SELECT COUNT(*) FROM feedback WHERE resolved = 1')
        resolved_feedback = c.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'total_users': total_users,
            'total_feedback': total_feedback,
            'resolved_feedback': resolved_feedback
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user - requires admin key."""
    if not verify_admin_key(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('DELETE FROM users WHERE id = ?', (user_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'User deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/feedback/<int:feedback_id>', methods=['PUT'])
def update_feedback(feedback_id):
    """Update feedback status - requires admin key."""
    if not verify_admin_key(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.json
        resolved = data.get('resolved', False)
        
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('UPDATE feedback SET resolved = ? WHERE id = ?', (resolved, feedback_id))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Feedback updated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
