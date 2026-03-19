"""
SpendSync - 1 Year Data Seeder
1 year realistic fake data of my account
Run: python seed_data.py
"""

import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

# =====================
# Flask app import
# =====================
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, User, Income, Expense, Goal

# =====================
# CONFIG
# =====================
USER_EMAIL = "nainayadav2311@gmail.com"  # Yashika ka email

# =====================
# DATE RANGE - 1 saal
# =====================
END_DATE = datetime.today()
START_DATE = END_DATE - timedelta(days=365)

def random_date(start, end):
    delta = end - start
    random_days = random.randint(0, delta.days)
    return start + timedelta(days=random_days)

def run_seed():
    with app.app_context():

        # User dhundho
        user = User.query.filter_by(email=USER_EMAIL).first()
        if not user:
            print(f"❌ User not found: {USER_EMAIL}")
            print("Please check email in seed_data.py line 18")
            return

        print(f"✅ User found: {user.name}")

        # Purana data clear karo (optional - comment karo agar nahi karna)
        Income.query.filter_by(user_id=user.id).delete()
        Expense.query.filter_by(user_id=user.id).delete()
        Goal.query.filter_by(user_id=user.id).delete()
        db.session.commit()
        print("🗑️ Old data cleared!")

        # =====================
        # INCOME DATA
        # Business owner - irregular but high income
        # =====================
        income_sources = [
            "Business Revenue",
            "Client Payment",
            "Consulting Fee",
            "Product Sales",
            "Service Income",
            "Partnership Income",
            "Online Sales",
            "Contract Payment"
        ]

        # Monthly income pattern - up and down realistic
        monthly_income_base = {
            1:  (45000, 90000),   # January - slow start
            2:  (60000, 120000),  # February - picking up
            3:  (80000, 150000),  # March - good month
            4:  (50000, 100000),  # April - dip
            5:  (70000, 130000),  # May - recovery
            6:  (90000, 180000),  # June - peak
            7:  (40000, 80000),   # July - summer slow
            8:  (55000, 110000),  # August - moderate
            9:  (85000, 160000),  # September - festival season
            10: (100000, 200000), # October - Diwali peak
            11: (70000, 140000),  # November - post festival
            12: (80000, 160000),  # December - year end
        }

        incomes_added = 0

        # 12 mahine ka data
        current = START_DATE
        while current <= END_DATE:
            month = current.month
            min_inc, max_inc = monthly_income_base[month]

            # Har mahine 3-6 income entries
            num_entries = random.randint(3, 6)
            month_start = current.replace(day=1)
            if month == 12:
                month_end = current.replace(day=31)
            else:
                month_end = current.replace(month=month+1, day=1) - timedelta(days=1)

            # Cap to end date
            if month_end > END_DATE:
                month_end = END_DATE

            for _ in range(num_entries):
                amount = round(random.uniform(min_inc/num_entries * 0.7,
                                             max_inc/num_entries * 1.3), 2)
                date = random_date(month_start, month_end)
                source = random.choice(income_sources)

                income = Income(
                    amount=amount,
                    source=source,
                    date=date,
                    user_id=user.id
                )
                db.session.add(income)
                incomes_added += 1

            # Next month
            if month == 12:
                current = current.replace(year=current.year+1, month=1, day=1)
            else:
                current = current.replace(month=month+1, day=1)

        print(f"💰 {incomes_added} income entries added!")

        # =====================
        # EXPENSE DATA
        # Business owner - high expenses, various categories
        # =====================
        expense_categories = {
            "Office Rent":      (15000, 25000, 1),   # (min, max, times_per_month)
            "Staff Salary":     (20000, 40000, 1),
            "Marketing":        (5000,  15000, 2),
            "Food & Dining":    (2000,  8000,  4),
            "Travel":           (3000,  12000, 3),
            "Shopping":         (2000,  10000, 3),
            "Utilities":        (2000,  5000,  1),
            "Software Tools":   (1000,  5000,  2),
            "Entertainment":    (1000,  4000,  2),
            "Medical":          (500,   5000,  1),
            "Fuel":             (2000,  5000,  4),
            "Groceries":        (3000,  7000,  3),
            "Equipment":        (5000,  20000, 1),
            "Miscellaneous":    (500,   3000,  3),
        }

        # Monthly expense multiplier - up and down
        monthly_expense_mult = {
            1:  0.4,   # January
            2:  0.45,   # February
            3:  0.5,   # March - tax season
            4:  0.38,  # April - cut down
            5:  0.45,   # May
            6:  0.55,   # June - high spending
            7:  0.35,   # July - saving mode
            8:  0.42,  # August
            9:  0.8,  # September - festival prep
            10: 0.6,   # October - Diwali shopping
            11: 0.45,   # November
            12: 0.5,   # December - year end
        }

        expenses_added = 0

        current = START_DATE
        while current <= END_DATE:
            month = current.month
            mult = monthly_expense_mult[month]

            month_start = current.replace(day=1)
            if month == 12:
                month_end = current.replace(day=31)
            else:
                month_end = current.replace(month=month+1, day=1) - timedelta(days=1)

            if month_end > END_DATE:
                month_end = END_DATE

            for category, (min_amt, max_amt, freq) in expense_categories.items():
                # Some categories skip some months (realistic)
                if random.random() < 0.15:  # 15% chance skip karo
                    continue

                for _ in range(freq):
                    amount = round(random.uniform(min_amt, max_amt) * mult, 2)
                    date = random_date(month_start, month_end)

                    expense = Expense(
                        amount=amount,
                        category=category,
                        date=date,
                        user_id=user.id
                    )
                    db.session.add(expense)
                    expenses_added += 1

            # Next month
            if month == 12:
                current = current.replace(year=current.year+1, month=1, day=1)
            else:
                current = current.replace(month=month+1, day=1)

        print(f"💸 {expenses_added} expense entries added!")

        # =====================
        # GOALS DATA
        # =====================
        goals = [
            ("iPhone 16 Pro", 134900),
            ("Europe Trip", 250000),
            ("New Laptop", 85000),
            ("Emergency Fund", 500000),
            ("Office Upgrade", 150000),
        ]

        for name, amount in goals:
            goal = Goal(
                name=name,
                amount=amount,
                user_id=user.id
            )
            db.session.add(goal)

        print(f"🎯 {len(goals)} goals added!")

        # =====================
        # COMMIT
        # =====================
        db.session.commit()
        print("\n✅ ALL DONE! Database filled successfully!")
        print(f"📊 Total: {incomes_added} incomes + {expenses_added} expenses + {len(goals)} goals")
        print("\n🚀 Ab browser mein reload karo aur sab dekho!")

if __name__ == "__main__":
    run_seed()