let projectionChart = null;

document.addEventListener("DOMContentLoaded", () => {
    loadSavings();
    document.getElementById("timeFilter")?.addEventListener("change", loadSavings);
});


/* ======================================
   LOAD SAVINGS FROM DATABASE
====================================== */

function loadSavings() {

    fetch("/api/savings-data")
    .then(res => res.json())
    .then(data => {

        const filter = document.getElementById("timeFilter")?.value || "all";

        const incomes = applyFilter(data.incomes, filter);
        const expenses = applyFilter(data.expenses, filter);

        const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
        const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const totalSavings = totalIncome - totalExpense;

        const savingsRate =
            totalIncome > 0
                ? ((totalSavings / totalIncome) * 100).toFixed(1)
                : 0;

        const avgSavings = calculateAverageMonthlySavings(incomes, expenses);
        const stabilityScore = calculateStabilityScore(incomes, expenses);

        document.getElementById("totalSavings").innerText =
            "₹ " + totalSavings.toLocaleString("en-IN");

        document.getElementById("savingsRate").innerText =
            savingsRate + "%";

        document.getElementById("avgSavings").innerText =
            "₹ " + avgSavings.toLocaleString("en-IN");

        document.getElementById("stabilityScore").innerText =
            stabilityScore + " / 100";

        renderProjectionChart(totalSavings, avgSavings);
        generateAISuggestions(savingsRate, stabilityScore);
        renderGoals(data.goals, totalSavings, avgSavings);
    });
}


/* ======================================
   FILTER
====================================== */

function applyFilter(data, filter) {

    const now = new Date();

    return data.filter(item => {

        const date = new Date(item.date);

        if (filter === "month")
            return date.getMonth() === now.getMonth() &&
                   date.getFullYear() === now.getFullYear();

        if (filter === "3months")
            return (now - date) <= 90 * 24 * 60 * 60 * 1000;

        if (filter === "year")
            return date.getFullYear() === now.getFullYear();

        return true;
    });
}


/* ======================================
   CALCULATIONS
====================================== */

function calculateAverageMonthlySavings(incomes, expenses) {

    if (incomes.length === 0) return 0;

    const monthly = {};

    incomes.forEach(i => {
        const key = i.date.substring(0,7);
        monthly[key] = (monthly[key] || 0) + Number(i.amount);
    });

    expenses.forEach(e => {
        const key = e.date.substring(0,7);
        monthly[key] = (monthly[key] || 0) - Number(e.amount);
    });

    const values = Object.values(monthly);

    if (values.length === 0) return 0;

    const total = values.reduce((a,b) => a + b, 0);
    return Math.round(total / values.length);
}


function calculateStabilityScore(incomes, expenses) {

    const monthly = {};

    incomes.forEach(i => {
        const key = i.date.substring(0,7);
        monthly[key] = (monthly[key] || 0) + Number(i.amount);
    });

    expenses.forEach(e => {
        const key = e.date.substring(0,7);
        monthly[key] = (monthly[key] || 0) - Number(e.amount);
    });

    const values = Object.values(monthly);
    if (values.length <= 1) return 100;

    const avg = values.reduce((a,b) => a + b, 0) / values.length;

    const variance =
        values.reduce((sum,val) => sum + Math.pow(val - avg,2), 0)
        / values.length;

    return Math.max(0, Math.round(100 - (variance / 1000)));
}


/* ======================================
   PROJECTION CHART
====================================== */

function renderProjectionChart(currentSavings, avgMonthlySavings) {

    const ctx = document.getElementById("projectionChart").getContext("2d");

    const labels = [];
    const data = [];

    for (let i = 0; i <= 6; i++) {
        labels.push("Month " + i);
        data.push(currentSavings + (avgMonthlySavings * i));
    }

    if (projectionChart) projectionChart.destroy();

    projectionChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Projected Savings",
                data,
                borderWidth: 2,
                tension: 0.3
            }]
        }
    });
}


/* ======================================
   GOALS
====================================== */

function addGoal() {

    const name = document.getElementById("goalName").value.trim();
    const amount = document.getElementById("goalAmount").value;

    if (!name || !amount) return;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("amount", amount);

    fetch("/add-goal", {
        method: "POST",
        body: formData
    })
    .then(() => {
        document.getElementById("goalName").value = "";
        document.getElementById("goalAmount").value = "";
        loadSavings();
    });
}


function renderGoals(goals, currentSavings, avgMonthlySavings) {

    const container = document.getElementById("goalList");
    container.innerHTML = "";

    goals.forEach(goal => {

        const progress = Math.min(
            100,
            ((currentSavings / goal.amount) * 100).toFixed(1)
        );

        let monthsNeeded = "∞";

        if (avgMonthlySavings > 0) {
            const remaining = goal.amount - currentSavings;

            if (remaining <= 0) {
                monthsNeeded = "Achieved 🎉";
            } else {
                monthsNeeded =
                    (remaining / avgMonthlySavings).toFixed(1);
            }
        }

        container.innerHTML += `
            <div style="margin-top:15px;">
                <strong>${goal.name}</strong><br>
                Target: ₹${goal.amount.toLocaleString("en-IN")}<br>
                Progress: ${progress}%<br>
                Est. Months to Achieve: ${monthsNeeded}<br><br>

                <button onclick="deleteGoal(${goal.id})"
                    class="delete-btn action-btn">
                    Delete
                </button>
                <hr>
            </div>
        `;
    });
}


function deleteGoal(id) {

    fetch(`/delete-goal/${id}`, {
        method: "DELETE"
    })
    .then(() => loadSavings());
}


/* ======================================
   AI SUGGESTIONS
====================================== */

function generateAISuggestions(rate, stability) {

    const list = document.getElementById("aiSuggestions");
    list.innerHTML = "";

    if (rate < 20) {
        list.innerHTML += "<li>⚠️ Savings rate is low.</li>";
    } else if (rate > 50) {
        list.innerHTML += "<li>🔥 Excellent savings discipline.</li>";
    }

    if (stability < 50) {
        list.innerHTML += "<li>⚠️ Savings pattern unstable.</li>";
    } else {
        list.innerHTML += "<li>✅ Savings pattern stable.</li>";
    }
}