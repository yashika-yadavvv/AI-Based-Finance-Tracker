let expenseChart = null;
let savingsChart = null;
let monthlyChart = null;
let categoryChart = null;
let weeklyChart = null;

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();

    const timeFilter = document.getElementById("timeFilter");
    timeFilter?.addEventListener("change", loadDashboard);
});


/* ================================
   LOAD DASHBOARD
================================ */

function loadDashboard(){

fetch("/api/full-finance-data")
.then(res => res.json())
.then(data => {

let incomes = data.incomes;
let expenses = data.expenses;

const filterType = document.getElementById("timeFilter")?.value || "all";

incomes = filterData(incomes,filterType);
expenses = filterData(expenses,filterType);

const totalIncome = incomes.reduce((sum,i)=>sum + Number(i.amount),0);
const totalExpense = expenses.reduce((sum,e)=>sum + Number(e.amount),0);
const balance = totalIncome - totalExpense;

const savingsRate =
totalIncome > 0 ? ((balance/totalIncome)*100).toFixed(1) : 0;

updateCounters(totalIncome,totalExpense,balance);
updateSavingsRate(savingsRate);

renderExpenseChart(expenses);
renderSavingsChart(totalIncome,totalExpense);
renderMonthlyChart(incomes,expenses);
renderCategoryChart(expenses);
renderWeeklyChart(expenses);

runAIWatcher({
totalIncome,
totalExpense,
balance,
savingsRate
});

})

}


/* ================================
   TIME FILTER
================================ */

function filterData(data,type){

const now = new Date();

return data.filter(item => {

const itemDate = new Date(item.date);

if(type === "today"){
return itemDate.toDateString() === now.toDateString();
}

if(type === "week"){
const firstDay = new Date();
firstDay.setDate(now.getDate() - now.getDay());
return itemDate >= firstDay;
}

if(type === "month"){
return (
itemDate.getMonth() === now.getMonth() &&
itemDate.getFullYear() === now.getFullYear()
);
}

return true;

})

}


/* ================================
   COUNTERS
================================ */

function updateCounters(income,expense,balance){

const incomeEl = document.querySelector(".total-income");
const expenseEl = document.querySelector(".total-expense");
const balanceEl = document.querySelector(".total-balance");
const savingsEl = document.querySelector(".total-savings");

if(incomeEl)
incomeEl.innerText = "₹ " + income.toLocaleString("en-IN");

if(expenseEl)
expenseEl.innerText = "₹ " + expense.toLocaleString("en-IN");

if(balanceEl)
balanceEl.innerText = "₹ " + balance.toLocaleString("en-IN");

if(savingsEl)
savingsEl.innerText = "₹ " + balance.toLocaleString("en-IN");

}


function updateSavingsRate(rate){
const savingsRateEl = document.getElementById("savingsRate");
if(savingsRateEl)
savingsRateEl.innerText = rate + "%";
}


/* ================================
   EXPENSE DONUT
================================ */

function renderExpenseChart(expenses){

const ctx = document.getElementById("expenseDonut");
if(!ctx) return;

let categoryTotals = {};

expenses.forEach(item=>{
categoryTotals[item.category] =
(categoryTotals[item.category] || 0) + Number(item.amount);
});

if(expenseChart) expenseChart.destroy();

expenseChart = new Chart(ctx,{
type:"doughnut",

data:{
labels:Object.keys(categoryTotals),
datasets:[{
label:"Expense Distribution",
data:Object.values(categoryTotals),
backgroundColor:[
"#7b2ff7",
"#9f44d3",
"#ff6a00",
"#00c6ff",
"#00ff94"
],
rotation:-90,
circumference:360,
borderWidth:0
}]
},

options:{
responsive:true,

animation:{
animationRotate:true,
animationScale:true,
duration:2500
},

plugins:{
legend:{
labels:{color:"white"}
}
},
cutout:"70%"

}

});

}


/* ================================
   SAVINGS DONUT
================================ */

function renderSavingsChart(income,expense){

const ctx = document.getElementById("savingsDonut");
if(!ctx) return;

if(savingsChart) savingsChart.destroy();

savingsChart = new Chart(ctx,{
type:"doughnut",

data:{
labels:["Savings","Expense"],
datasets:[{
label:"Savings vs Expense",
data:[income-expense,expense],
backgroundColor:["#00ff94","#ff6a00"],
rotation:-90,
circumference:360,
borderWidth:0
}]
},

options:{
responsive:true,
animation:{
animationRotate:true,
animationScale:true,
duration:2500
},

plugins:{
legend:{
labels:{color:"white"}
}
},
cutout:"70%"

}

})

}


/* ================================
   MONTHLY LINE
================================ */

function renderMonthlyChart(incomes, expenses){

    const ctx = document.getElementById("miniLineChart");
    if(!ctx) return;

    if(monthlyChart) monthlyChart.destroy();

    // Real data se weekly groups
    const weeks = ["Week 1","Week 2","Week 3","Week 4"];
    const weeklyExp = [0,0,0,0];

    expenses.forEach(e => {
        const day = new Date(e.date).getDate();
        const weekIndex = Math.min(Math.floor((day-1)/7), 3);
        weeklyExp[weekIndex] += Number(e.amount);
    });

    monthlyChart = new Chart(ctx,{
        type:"line",
        data:{
            labels: weeks,
            datasets:[{
                label:"Expenses",
                data: weeklyExp,
                borderColor:"#7b2ff7",
                backgroundColor:"rgba(123,47,247,0.2)",
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                borderWidth: 3
            }]
        },
        options:{
            responsive: true,
            plugins:{
                legend:{ labels:{ color:"white" } }
            },
            scales:{
                x:{ ticks:{ color:"white" } },
                y:{ ticks:{ color:"white" } }
            }
        }
    });
}


/* ================================
   CATEGORY BAR
================================ */

function renderCategoryChart(expenses){

const ctx = document.getElementById("categoryBarChart");
if(!ctx) return;

let categories = {};

expenses.forEach(e=>{
categories[e.category] =
(categories[e.category] || 0) + Number(e.amount);
});

if(categoryChart) categoryChart.destroy();

categoryChart = new Chart(ctx,{
type:"bar",

data:{
labels:Object.keys(categories),
datasets:[{
label:"Expense Amount",
data:Object.values(categories),
backgroundColor:"#7b2ff7"
}]
},

options:{
animation:{
y:{
duration:2000,
from:500
}
},

plugins:{
legend:{
labels:{color:"white"}
}
},

scales:{
x:{ticks:{color:"white"}},
y:{ticks:{color:"white"}}
}

}

})

}


/* ================================
   WEEKLY TREND
================================ */

function renderWeeklyChart(expenses){

    const ctx = document.getElementById("weeklyTrendChart");
    if(!ctx) return;

    if(weeklyChart) weeklyChart.destroy();

    // Real data se weekly totals nikalo
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const weeklyTotals = [0,0,0,0,0,0,0];

    expenses.forEach(e => {
        const d = new Date(e.date);
        const day = d.getDay(); // 0=Sun, 1=Mon...
        const index = day === 0 ? 6 : day - 1; // Mon=0, Sun=6
        weeklyTotals[index] += Number(e.amount);
    });

    weeklyChart = new Chart(ctx,{
        type:"line",
        data:{
            labels: days,
            datasets:[{
                label:"Weekly Expense",
                data: weeklyTotals,
                borderColor:"#00c6ff",
                backgroundColor:"rgba(0,198,255,0.2)",
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                borderWidth: 3
            }]
        },
        options:{
            responsive: true,
            animation:{
                x:{ duration:2000, from:0 },
                y:{ duration:2200, from:500 }
            },
            plugins:{
                legend:{ labels:{ color:"white" } }
            },
            scales:{
                x:{ ticks:{ color:"white" } },
                y:{ ticks:{ color:"white" } }
            }
        }
    });
}

function toggleAIPanel(){
    const panel = document.getElementById("aiPanelSmart");
    panel.classList.toggle("open");
}

function switchTab(tab){
    document.querySelectorAll(".ai-tab-content").forEach(t => t.style.display = "none");
    document.querySelectorAll(".ai-tab").forEach(t => t.classList.remove("active"));
    document.getElementById("tab-" + tab).style.display = "block";
    event.target.classList.add("active");
}

function runAIWatcher(data){
    const { totalIncome, totalExpense, balance, savingsRate } = data;
    const rate = parseFloat(savingsRate);

    // ===== MOOD =====
    let mood = "", moodColor = "", emoji = "";
    if(rate > 50){ mood = "Chill Mode — Great savings!"; moodColor = "#00ff9c"; emoji = "😎"; }
    else if(rate > 25){ mood = "Stable — Keep going!"; moodColor = "#c084fc"; emoji = "🙂"; }
    else if(rate > 10){ mood = "Warning — Watch spending!"; moodColor = "#ffaa00"; emoji = "😐"; }
    else { mood = "Danger — Overspending!"; moodColor = "#ff4d4d"; emoji = "😨"; }

    document.getElementById("aiMoodEmoji").innerText = emoji;
    document.getElementById("aiMoodText").innerText = mood;
    document.getElementById("aiMoodText").style.color = moodColor;

    // ===== INSIGHTS =====
    let insights = [];
    let alertCount = 0;

    if(rate > 50) insights.push({text: `💚 Excellent! ${rate}% savings rate. Consider investing surplus.`, type:"good"});
    else if(rate > 25) insights.push({text: `✅ Savings rate is ${rate}%. Try to push it above 50%.`, type:""});
    else { insights.push({text: `⚠️ Savings rate only ${rate}%! Reduce variable expenses.`, type:"warning"}); alertCount++; }

    if(totalExpense > totalIncome * 0.7){ insights.push({text: `🚨 Expenses are ${((totalExpense/totalIncome)*100).toFixed(0)}% of income — very high!`, type:"danger"}); alertCount++; }
    else if(totalExpense > totalIncome * 0.5) insights.push({text: `📊 Expenses at ${((totalExpense/totalIncome)*100).toFixed(0)}% of income. Monitor carefully.`, type:"warning"});

    if(balance < 0){ insights.push({text: `🚨 Negative balance! Expenses exceed income by ₹${Math.abs(balance).toLocaleString("en-IN")}.`, type:"danger"}); alertCount++; }

    const insightsList = document.getElementById("aiInsightsList");
    insightsList.innerHTML = insights.map(i => `<div class="ai-insight-item ${i.type}">${i.text}</div>`).join("");

    // ===== PREDICT =====
    const monthly = totalExpense;
    const saved3 = balance * 3;
    const saved3cut = (balance + totalIncome * 0.2) * 3;
    document.getElementById("aiPredictContent").innerHTML = `
        <div class="ai-insight-item">🔮 At current pace → ₹${saved3.toLocaleString("en-IN")} saved in 3 months</div>
        <div class="ai-insight-item good">✂️ Cut 20% expenses → ₹${saved3cut.toLocaleString("en-IN")} in 3 months</div>
        <div class="ai-insight-item ${monthly > totalIncome ? 'danger' : ''}">📅 Monthly burn rate: ₹${monthly.toLocaleString("en-IN")}</div>
    `;

    // ===== BADGE =====
    const badge = document.getElementById("aiBadge");
    badge.innerText = alertCount;
    badge.style.background = alertCount > 0 ? "#ff4d4d" : "#00ff9c";
}

function sendFloatChat(){
    const input = document.getElementById("aiFloatInput");
    const msg = input.value.trim();
    if(!msg) return;

    const win = document.getElementById("aiFloatChatWindow");
    win.innerHTML += `<div class="ai-float-msg user">${msg}</div>`;
    input.value = "";

    fetch("/api/full-finance-data")
    .then(res => res.json())
    .then(finance => {
        const income = finance.incomes.reduce((s,i) => s+Number(i.amount),0);
        const expense = finance.expenses.reduce((s,e) => s+Number(e.amount),0);

        fetch("/ask-ai", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({message: msg, income, expense})
        })
        .then(res => res.json())
        .then(data => {
            win.innerHTML += `<div class="ai-float-msg ai">🤖 ${data.response}</div>`;
            win.scrollTop = win.scrollHeight;
        });
    });
}

function loadDashboardProfile(){

fetch("/api/profile")
.then(res=>res.json())
.then(data=>{

const img = document.getElementById("dashboardAvatar")
const nameEl = document.getElementById("dashboardName")

if(img){
if(data.image){
img.src = "/static/uploads/" + data.image + "?" + Date.now()
}else{
img.src = "/static/images/default.png"
}

if(nameEl && data.name){
   nameEl.innerText = data.name
}}

})

}

loadDashboardProfile()