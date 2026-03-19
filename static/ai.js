document.addEventListener("DOMContentLoaded", () => {
    initializeAI();

    const input = document.getElementById("user-input");
    input?.addEventListener("keydown", function(event){
        if(event.key === "Enter" && !event.shiftKey){
            event.preventDefault();
            sendMessage();
        }
    });
});


/* ======================================
   INITIALIZE AI (DB VERSION)
====================================== */

function initializeAI() {

    fetch("/api/ai-finance-data")
    .then(res => res.json())
    .then(data => {

        const score = calculateHealthScore(data.income, data.expense);
        animateScore(score);
        updateInsights(score, data.income, data.expense);
    });
}


/* ======================================
   HEALTH SCORE LOGIC
====================================== */

function calculateHealthScore(income, expense) {

    if (income === 0) return 0;

    const savings = income - expense;
    const savingsRate = (savings / income) * 100;
    const expenseRatio = (expense / income) * 100;

    let score = 0;

    score += savingsRate * 0.4;
    score += (100 - expenseRatio) * 0.3;
    score += 30;

    return Math.min(Math.round(score), 100);
}


/* ======================================
   SCORE UI
====================================== */

function animateScore(finalScore) {

    const scoreElement = document.getElementById("healthScore");
    const circle = document.getElementById("scoreCircle");

    let current = 0;

    const interval = setInterval(() => {

        current++;
        scoreElement.textContent = current;

        const degree = (current / 100) * 360;
        circle.style.background =
            `conic-gradient(#7c4dff ${degree}deg, #2a2a40 ${degree}deg)`;

        if (current >= finalScore) {
            clearInterval(interval);
            updateRiskStyle(finalScore);
        }

    }, 20);
}


function updateRiskStyle(score) {

    const status = document.getElementById("healthStatus");

    if (score >= 80) {
        status.textContent = "Financially Strong";
        status.style.color = "#4ade80";
    } else if (score >= 50) {
        status.textContent = "Moderate Stability";
        status.style.color = "#facc15";
    } else {
        status.textContent = "High Financial Risk";
        status.style.color = "#f87171";
    }
}


/* ======================================
   INSIGHTS
====================================== */

function updateInsights(score, income, expense) {

    const savings = income - expense;
    const savingsRate = income === 0 ? 0 : ((savings / income) * 100).toFixed(1);
    const expenseRatio = income === 0 ? 0 : ((expense / income) * 100).toFixed(1);

    document.getElementById("savingsInsight").textContent =
        `Your savings rate is ${savingsRate}%`;

    if (expenseRatio > 70) {
        document.getElementById("spendingInsight").textContent =
            "High spending detected. Immediate optimization required.";
    } else if (expenseRatio > 50) {
        document.getElementById("spendingInsight").textContent =
            "Spending is moderate. Monitor variable costs.";
    } else {
        document.getElementById("spendingInsight").textContent =
            "Spending is under control.";
    }

    document.getElementById("riskInsight").textContent =
        score >= 80 ? "Low Risk"
        : score >= 50 ? "Medium Risk"
        : "High Risk";

    generateRecommendation(score);
}


function generateRecommendation(score) {

    const rec = document.getElementById("aiRecommendation");

    if (score >= 80) {
        rec.textContent =
            "Strong financial health. Consider investing surplus.";
    } else if (score >= 50) {
        rec.textContent =
            "Increase savings by 10% and reduce variable expenses.";
    } else {
        rec.textContent =
            "Critical: Reduce expenses below 50% of income.";
    }
}


/* ======================================
   CHAT SYSTEM (DB CONNECTED)
====================================== */

function sendMessage() {

    let input = document.getElementById("user-input");
    let message = input.value.trim();
    if (!message) return;

    appendMessage("user", message);
    input.value = "";

    fetch("/api/ai-finance-data")
    .then(res => res.json())
    .then(finance => {

        showTyping();

        fetch("/ask-ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message,
                income: finance.income,
                expense: finance.expense
            })
        })
        .then(res => res.json())
        .then(data => {
            removeTyping();
            appendMessage("ai", data.response);
        });
    });
}


function quickAsk(text) {
    document.getElementById("user-input").value = text;
    sendMessage();
}


function appendMessage(type, text) {

    const chatWindow = document.getElementById("chatWindow");

    const div = document.createElement("div");
    div.className = `chat-message ${type}`;
    div.textContent = text;

    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}


function showTyping() {

    const chatWindow = document.getElementById("chatWindow");

    const div = document.createElement("div");
    div.className = "chat-message ai typing";
    div.innerHTML =
        "Typing<span class='dot'>.</span><span class='dot'>.</span><span class='dot'>.</span>";

    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}


function removeTyping() {

    const chatWindow = document.getElementById("chatWindow");
    const last = chatWindow.lastChild;

    if (last && last.classList.contains("typing")) {
        chatWindow.removeChild(last);
    }
}

function runSimulation(){
    const input = document.getElementById("simInput").value.trim();
    if(!input) return;

    const num = parseFloat(input);

    fetch("/api/ai-finance-data")
    .then(res => res.json())
    .then(data => {
        const income = data.income;
        const expense = data.expense;
        const savings = income - expense;

        let result = "";

        if(!isNaN(num)){
            const newSavings = savings + (income * num / 100);
            const newRate = income > 0 ? ((newSavings/income)*100).toFixed(1) : 0;
            result = `If you increase savings by ₹${num}% → New savings: ₹${newSavings.toLocaleString("en-IN")} (${newRate}% savings rate)!`;
        } else {
            result = "Please enter a number. Example: 5000";
        }

        // Result dikhao
        const resultEl = document.getElementById("simulationResult");
        if(resultEl){
            resultEl.innerText = result;
            resultEl.style.display = "block";
            resultEl.style.color = "#c084fc";
            resultEl.style.marginTop = "10px";
            resultEl.style.fontSize = "15px";
            resultEl.style.fontWeight = "600";
        } else {
            alert(result);
        }
    });
}