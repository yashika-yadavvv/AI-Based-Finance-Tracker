💸 SpendSync – AI-Powered Personal Finance Tracker
A full-stack web application that helps users track income, expenses, savings goals, and get intelligent AI-powered financial insights.
🚀 Live Demo
Run locally using Flask (setup instructions below)
✨ Features
📊 Dashboard
Real-time financial overview — Total Balance, Income, Expenses, Savings
Interactive charts — Expense Distribution, Savings Rate, Monthly Overview, Weekly Trend
Time filters — Today, This Week, This Month, All Time
Smart AI Watcher — auto-analyzes financial health on load
💰 Income & Expense Tracking
Add, edit, delete income and expense entries
Category-based expense tracking
Date-wise filtering and sorting
📈 Analytics Page
Monthly Income vs Expense bar chart
Expense category pie chart
Income sources donut chart
Net Savings Trend — monthly line chart across full year
🎯 Savings Goals
Set and track personal savings goals
Visual goal cards with target amounts
👤 Profile Page
Personal info management
Profile photo upload
Activity charts — Area charts with real date labels
Saving Streak calendar — last 30 days
Finance History table — merged by date, formatted dates
AI Financial Summary — real-time analysis
Confirm modals for update and logout
🤖 AI Page
Financial Health Score — animated score circle
Smart Insights — savings rate, spending analysis, risk level
What-If Simulator — predict savings if expenses change
AI Chat — keyword-based intelligent responses using real financial data
🤖 Smart AI Floater (Global)
Available on every page
Mood Indicator — 😎 Chill / 🙂 Stable / 😐 Warning / 😨 Danger
Insights Tab — real-time financial alerts
Predict Tab — 3-month savings forecast
Chat Tab — ask anything about your finances
🛠️ Tech Stack
Layer
Technology
Frontend
HTML5, CSS3, Vanilla JavaScript
Backend
Python, Flask
Database
SQLite (via Flask-SQLAlchemy)
Charts
Chart.js
Auth
Flask Sessions + Werkzeug Password Hashing
Styling
Custom CSS with glassmorphism & animations
📁 Project Structure
SpendSync/
│
├── app.py                  # Flask backend — all routes & APIs
├── static/
│   ├── style.css           # Global styles
│   ├── Dashboard.js        # Dashboard logic & charts
│   ├── profile.js          # Profile page logic
│   ├── analytics.js        # Analytics charts
│   ├── savings.js          # Savings & goals
│   ├── income.js           # Income management
│   ├── expense.js          # Expense management
│   └── ai.js               # AI page logic
│
├── templates/
│   ├── dashboard.html      # Base template + Dashboard
│   ├── profile.html        # Profile page
│   ├── analytics.html      # Analytics page
│   ├── savings.html        # Savings page
│   ├── income.html         # Income page
│   ├── expense.html        # Expense page
│   ├── ai.html             # AI page
│   ├── login.html          # Login page
│   └── register.html       # Register page
│
└── README.md
⚙️ Setup & Installation
1. Clone the repository
git clone https://github.com/yashika-yadavvv/AI-Based-Finance-Tracker.git
cd AI-Based-Finance-Tracker
2. Install dependencies
pip install flask flask-sqlalchemy werkzeug
3. Run the application
python app.py
4. Open in browser
http://127.0.0.1:5000
📸 Screenshots
Dashboard Overview
�
Load image
AI Floater with Smart Insights
�
Load image
Analytics Page
�
Load image
Profile Page
�
🔑 Key Highlights
✅ Multi-user support — each user has isolated data
✅ Secure authentication — hashed passwords
✅ Fully responsive UI
✅ Real database-connected AI insights
✅ Animated charts with Chart.js
✅ Glassmorphism design with purple theme
👩‍💻 Developer
Yashika Yadav
GitHub: @yashika-yadavvv
📄 License
This project is open source and available under the MIT License.