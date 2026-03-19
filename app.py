import os
from flask import Flask, render_template, request, redirect, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
from datetime import datetime

app = Flask(__name__)
app.secret_key = "supersecretkey"

UPLOAD_FOLDER = os.path.join(app.root_path,"static","uploads")
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

if not os.path.exists(app.config["UPLOAD_FOLDER"]):
    os.makedirs(app.config["UPLOAD_FOLDER"])

def allowed_file(filename):
    return "." in filename and filename.rsplit(".",1)[1].lower() in ALLOWED_EXTENSIONS

db = SQLAlchemy(app)

# ======================
# LOGIN REQUIRED DECORATOR
# ======================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function


# ======================
# MODELS
# ======================

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    age = db.Column(db.Integer)
    gender = db.Column(db.String(200))

    profile_image = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    incomes = db.relationship("Income", backref="user", cascade="all, delete")
    expenses = db.relationship("Expense", backref="user", cascade="all, delete")
    goals = db.relationship("Goal", backref="user", cascade="all, delete")


class Income(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    source = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)


class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)



# ======================
# AUTH ROUTES
# ======================

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form["name"]
        email = request.form["email"]
        password = request.form["password"]

        if User.query.filter_by(email=email).first():
            return "Email already exists"

        new_user = User(
            name=name,
            email=email,
            password=generate_password_hash(password)
        )

        db.session.add(new_user)
        db.session.commit()
        return redirect("/login")

    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):
            session["user_id"] = user.id
            session["user_name"] = user.name
            return redirect("/")

        return "Invalid credentials"

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")


# ======================
# PAGE ROUTES
# ======================

@app.route("/")
@login_required
def dashboard():
    user = User.query.get(session["user_id"])
    return render_template("dashboard.html", user=user)

@app.route("/income")
@login_required
def income_page():
    return render_template("income.html", active="income")

@app.route("/expense")
@login_required
def expense_page():
    return render_template("expense.html", active="expense")

@app.route("/analytics")
@login_required
def analytics():
    return render_template("analytics.html", active="analytics")

@app.route("/savings")
@login_required
def savings():
    return render_template("savings.html", active="savings")

@app.route("/ai")
@login_required
def ai():
    return render_template("ai.html", active="ai")

@app.route("/profile")
@login_required
def profile():
    return render_template("profile.html", active="profile")


# ======================
# API ROUTES
# ======================

@app.route("/api/dashboard-data")
@login_required
def dashboard_data():
    user_id = session["user_id"]

    incomes = Income.query.filter_by(user_id=user_id).all()
    expenses = Expense.query.filter_by(user_id=user_id).all()

    total_income = sum(i.amount for i in incomes)
    total_expense = sum(e.amount for e in expenses)

    return jsonify({
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense
    })


@app.route("/api/incomes")
@login_required
def get_incomes():
    user_id = session["user_id"]
    incomes = Income.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "id": i.id,
            "amount": i.amount,
            "source": i.source,
            "date": i.date.strftime("%Y-%m-%d")
        } for i in incomes
    ])


@app.route("/api/expenses")
@login_required
def get_expenses():
    user_id = session["user_id"]
    expenses = Expense.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "id": e.id,
            "amount": e.amount,
            "category": e.category,
            "date": e.date.strftime("%Y-%m-%d")
        } for e in expenses
    ])


@app.route("/add-income", methods=["POST"])
@login_required
def add_income():
    amount = float(request.form["amount"])
    source = request.form["source"]
    date = datetime.strptime(request.form["date"], "%Y-%m-%d")

    new_income = Income(
        amount=amount,
        source=source,
        date=date,
        user_id=session["user_id"]
    )

    db.session.add(new_income)
    db.session.commit()

    return jsonify({"message": "Income added"})


@app.route("/add-expense", methods=["POST"])
@login_required
def add_expense():
    amount = float(request.form["amount"])
    category = request.form["category"]
    date = datetime.strptime(request.form["date"], "%Y-%m-%d")

    new_expense = Expense(
        amount=amount,
        category=category,
        date=date,
        user_id=session["user_id"]
    )

    db.session.add(new_expense)
    db.session.commit()

    return jsonify({"message": "Expense added"})

@app.route("/delete-income/<int:id>", methods=["DELETE"])
@login_required
def delete_income(id):
    income = Income.query.get_or_404(id)

    if income.user_id != session["user_id"]:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(income)
    db.session.commit()

    return jsonify({"message": "Deleted"})

@app.route("/update-income/<int:id>", methods=["PUT"])
@login_required
def update_income(id):
    income = Income.query.get_or_404(id)

    if income.user_id != session["user_id"]:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()

    income.amount = float(data["amount"])
    income.source = data["source"]
    income.date = datetime.strptime(data["date"], "%Y-%m-%d")

    db.session.commit()

    return jsonify({"message": "Updated"})

@app.route("/update-expense/<int:id>", methods=["PUT"])
@login_required
def update_expense(id):
    expense = Expense.query.get_or_404(id)

    if expense.user_id != session["user_id"]:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()

    expense.amount = float(data["amount"])
    expense.category = data["category"]
    expense.date = datetime.strptime(data["date"], "%Y-%m-%d")

    db.session.commit()

    return jsonify({"message": "Updated"})

@app.route("/delete-expense/<int:id>", methods=["DELETE"])
@login_required
def delete_expense(id):
    expense = Expense.query.get_or_404(id)

    if expense.user_id != session["user_id"]:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(expense)
    db.session.commit()

    return jsonify({"message": "Deleted"})

@app.route("/api/full-finance-data")
@login_required
def full_finance_data():
    user_id = session["user_id"]

    incomes = Income.query.filter_by(user_id=user_id).all()
    expenses = Expense.query.filter_by(user_id=user_id).all()

    income_data = [
        {
            "id": i.id,
            "amount": i.amount,
            "source": i.source,
            "date": i.date.strftime("%Y-%m-%d")
        } for i in incomes
    ]

    expense_data = [
        {
            "id": e.id,
            "amount": e.amount,
            "category": e.category,
            "date": e.date.strftime("%Y-%m-%d")
        } for e in expenses
    ]

    return jsonify({
        "incomes": income_data,
        "expenses": expense_data
    })

@app.route("/api/analytics-data")
@login_required
def analytics_data():
    user_id = session["user_id"]

    incomes = Income.query.filter_by(user_id=user_id).all()
    expenses = Expense.query.filter_by(user_id=user_id).all()

    income_data = [
        {
            "amount": i.amount,
            "source": i.source,
            "date": i.date.strftime("%Y-%m-%d")
        } for i in incomes
    ]

    expense_data = [
        {
            "amount": e.amount,
            "category": e.category,
            "date": e.date.strftime("%Y-%m-%d")
        } for e in expenses
    ]

    return jsonify({
        "incomes": income_data,
        "expenses": expense_data
    })

@app.route("/api/savings-data")
@login_required
def savings_data():
    user_id = session["user_id"]

    incomes = Income.query.filter_by(user_id=user_id).all()
    expenses = Expense.query.filter_by(user_id=user_id).all()
    goals = Goal.query.filter_by(user_id=user_id).all()

    income_data = [
        {"amount": i.amount, "date": i.date.strftime("%Y-%m-%d")}
        for i in incomes
    ]

    expense_data = [
        {"amount": e.amount, "date": e.date.strftime("%Y-%m-%d")}
        for e in expenses
    ]

    goal_data = [
        {"id": g.id, "name": g.name, "amount": g.amount}
        for g in goals
    ]

    return jsonify({
        "incomes": income_data,
        "expenses": expense_data,
        "goals": goal_data
    })

@app.route("/add-goal", methods=["POST"])
@login_required
def add_goal():
    name = request.form["name"]
    amount = float(request.form["amount"])

    goal = Goal(
        name=name,
        amount=amount,
        user_id=session["user_id"]
    )

    db.session.add(goal)
    db.session.commit()

    return jsonify({"message": "Goal added"})

@app.route("/delete-goal/<int:id>", methods=["DELETE"])
@login_required
def delete_goal(id):
    goal = Goal.query.get_or_404(id)

    if goal.user_id != session["user_id"]:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(goal)
    db.session.commit()

    return jsonify({"message": "Deleted"})

@app.route("/api/ai-finance-data")
@login_required
def ai_finance_data():
    user_id = session["user_id"]

    incomes = Income.query.filter_by(user_id=user_id).all()
    expenses = Expense.query.filter_by(user_id=user_id).all()

    total_income = sum(i.amount for i in incomes)
    total_expense = sum(e.amount for e in expenses)

    return jsonify({
        "income": total_income,
        "expense": total_expense,
        "savings": total_income - total_expense
    })

@app.route("/ask-ai", methods=["POST"])
@login_required
def ask_ai():
    data = request.get_json()

    message = data.get("message", "").lower()
    income = float(data.get("income", 0))
    expense = float(data.get("expense", 0))
    savings = income - expense
    savingsRate = round((savings / income * 100), 1) if income > 0 else 0

    # Simple rule-based AI logic

    if any(w in message for w in ["hi", "hey", "hello", "hy", "hii", "helo"]):
        response = f"Hey! 👋 I'm your SpendSync AI. Your current savings are ₹{savings:,.0f} ({savingsRate}% rate). How can I help you today?"
    
    elif any(w in message for w in ["save", "saving"]):
        response = f"Your current savings are ₹{savings:,.0f} ({savingsRate}%). Try the 50/30/20 rule — 50% needs, 30% wants, 20% savings!"

    elif any(w in message for w in ["invest", "investment", "stock", "mutual"]):
        if savingsRate > 40:
            response = f"Your savings rate is {savingsRate}% — excellent! Consider SIP or index funds with your surplus."
        else:
            response = f"First aim for 30% savings rate, then invest. Currently you're at {savingsRate}%."

    elif any(w in message for w in ["expense", "spend", "spending"]):
        response = f"Your total expenses are ₹{expense:,.0f} — that's {100-savingsRate:.1f}% of your income. Review subscriptions and dining out!"

    elif any(w in message for w in ["income", "salary", "earning"]):
        response = f"Your total income is ₹{income:,.0f}. You're saving ₹{savings:,.0f} from this."

    elif any(w in message for w in ["balance", "total"]):
        response = f"Your current balance is ₹{savings:,.0f}. Income: ₹{income:,.0f}, Expenses: ₹{expense:,.0f}."

    elif any(w in message for w in ["tip", "advice", "suggest", "help"]):
        if savingsRate > 50:
            response = "Excellent savings! Build an emergency fund — keep 6 months of expenses aside."
        elif savingsRate > 20:
            response = "Good progress! Cancel unused subscriptions and set a fixed grocery budget."
        else:
            response = "Savings are low. List your fixed expenses and try cutting variable costs by 20%."

    elif any(w in message for w in ["goal", "target", "buy"]):
        response = f"To reach your goal, keep saving ₹{savings:,.0f} consistently. Track your goals on the Savings page!"

    else:
        if savings <= 0:
            response = "Your expenses exceed your income! Reduce expenses immediately."
        elif savingsRate < 20:
            response = f"Savings rate is only {savingsRate}%. Try the quick action buttons below!"
        elif savingsRate > 50:
            response = f"Amazing {savingsRate}% savings rate! Consider investing your surplus."
        else:
            response = f"Finances look stable! Savings rate is {savingsRate}%. Ask me anything specific!"

    return jsonify({"response": response})

@app.route("/api/profile")
@login_required
def get_profile():
    user = User.query.get(session["user_id"])

    if not user:
        return jsonify({"error":"User not found"}),404

    return jsonify({
        "name": user.name,
        "age": user.age,
        "gender": user.gender,
        "email": user.email,
        "image": user.profile_image if user.profile_image else None,
        "member_since": user.created_at.strftime("%d %b %Y")
    })


@app.route("/api/profile/update", methods=["POST"])
@login_required
def update_profile():
    data = request.get_json()
    user = User.query.get(session["user_id"])

    user.name = data.get("name")
    user.age = data.get("age")
    user.gender = data.get("gender")
    user.email = data.get("email")

    if data.get("password"):
        user.password = generate_password_hash(data.get("password"))

    db.session.commit()
    return jsonify({"message": "Profile updated successfully"})

@app.route("/api/profile/upload", methods=["POST"])
@login_required
def upload_profile():

    if "photo" not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files["photo"]

    if file and allowed_file(file.filename):

        filename = secure_filename(file.filename)

        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)

        file.save(file_path)

        user = User.query.get(session["user_id"])
        user.profile_image = filename

        db.session.commit()

        return jsonify({
            "message": "Image updated",
            "image": filename
        })

    return jsonify({"error": "Invalid file type"}), 400



if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)