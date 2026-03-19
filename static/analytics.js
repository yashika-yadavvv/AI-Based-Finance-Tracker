let monthlyChart = null;
let categoryChart = null;
let incomeSourceChart = null;
let savingsTrendChart = null;

document.addEventListener("DOMContentLoaded", () => {
    loadAnalytics();
    document.getElementById("timeFilter")?.addEventListener("change", loadAnalytics);
});


/* ===============================
   LOAD ANALYTICS
=============================== */

function loadAnalytics(){

fetch("/api/analytics-data")
.then(res=>res.json())
.then(data=>{

const filter = document.getElementById("timeFilter")?.value || "all";

const filteredIncome = applyTimeFilter(data.incomes,filter);
const filteredExpense = applyTimeFilter(data.expenses,filter);

calculateAndRender(filteredIncome,filteredExpense);

})

}


/* ===============================
   TIME FILTER
=============================== */

function applyTimeFilter(data,filter){

const now = new Date();

return data.filter(item=>{

const itemDate = new Date(item.date);

if(filter==="month"){
return itemDate.getMonth()===now.getMonth() &&
itemDate.getFullYear()===now.getFullYear();
}

if(filter==="3months"){
const past = new Date();
past.setMonth(now.getMonth()-3);
return itemDate>=past;
}

if(filter==="year"){
return itemDate.getFullYear()===now.getFullYear();
}

return true;

})

}


/* ===============================
   CALCULATE DATA
=============================== */

function calculateAndRender(incomeData,expenseData){

const totalIncome = incomeData.reduce((s,i)=>s+Number(i.amount),0);
const totalExpense = expenseData.reduce((s,e)=>s+Number(e.amount),0);

const savings = totalIncome-totalExpense;

const rate =
totalIncome>0 ? ((savings/totalIncome)*100).toFixed(1) : 0;

updateSummaryUI(totalIncome,totalExpense,savings,rate);
generateAIInsights(rate,totalIncome,totalExpense);

renderCharts(incomeData,expenseData,savings);

}


/* ===============================
   UPDATE CARDS
=============================== */

function updateSummaryUI(income,expense,savings,rate){

document.getElementById("totalIncome").innerHTML =
`₹ ${income.toLocaleString("en-IN")}`;

document.getElementById("totalExpense").innerHTML =
`₹ ${expense.toLocaleString("en-IN")}`;

document.getElementById("netSavings").innerHTML =
`₹ ${savings.toLocaleString("en-IN")}<br><small>${rate}% savings rate</small>`;

}


/* ===============================
   AI INSIGHTS
=============================== */

function generateAIInsights(rate,income,expense){

const box = document.getElementById("aiInsights");
box.innerHTML="";

if(income===0){
box.innerHTML+="<li>⚠ No income recorded.</li>";
return;
}

if(rate>=50){
box.innerHTML+="<li>📈 Excellent savings performance.</li>";
}
else if(rate>=25){
box.innerHTML+="<li>👍 Good savings stability.</li>";
}
else if(rate>=10){
box.innerHTML+="<li>⚠ Savings are low.</li>";
}
else{
box.innerHTML+="<li>🚨 Very low savings. Control expenses.</li>";
}

if(expense>income*0.8){
box.innerHTML+="<li>⚠ Expenses exceed 80% of income.</li>";
}

}


/* ===============================
   RENDER CHARTS
=============================== */

function renderCharts(incomeData,expenseData,savings){

if(monthlyChart) monthlyChart.destroy();
if(categoryChart) categoryChart.destroy();
if(incomeSourceChart) incomeSourceChart.destroy();
if(savingsTrendChart) savingsTrendChart.destroy();

const totalIncome = incomeData.reduce((s,i)=>s+Number(i.amount),0);
const totalExpense = expenseData.reduce((s,e)=>s+Number(e.amount),0);

/* ===== MONTHLY BAR ===== */
const monthlyIncome = {};
const monthlyExpense = {};

incomeData.forEach(i => {
    const d = new Date(i.date);
    const key = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
    monthlyIncome[key] = (monthlyIncome[key]||0) + Number(i.amount);
});

expenseData.forEach(e => {
    const d = new Date(e.date);
    const key = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
    monthlyExpense[key] = (monthlyExpense[key]||0) + Number(e.amount);
});

const allKeys = [...new Set([...Object.keys(monthlyIncome), ...Object.keys(monthlyExpense)])].sort();
const barLabels = allKeys.map(k => {
    const [y,m] = k.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[parseInt(m)-1] + " " + y;
});

monthlyChart = new Chart(
    document.getElementById("monthlyChart"),
    {
        type: "bar",
        data:{
            labels: barLabels,
            datasets:[
                {
                    label: "Income",
                    data: allKeys.map(k => monthlyIncome[k]||0),
                    backgroundColor: "#00c6ff"
                },
                {
                    label: "Expense",
                    data: allKeys.map(k => monthlyExpense[k]||0),
                    backgroundColor: "#7b2ff7"
                }
            ]
        },
        options:{
            responsive: true,
            maintainAspectRatio: false,
            animation:{ duration:1500, easing:"easeOutQuart" },
            plugins:{
                legend:{ labels:{ color:"white" } }
            },
            scales:{
                x:{ ticks:{ color:"white", maxRotation:45 } },
                y:{ ticks:{ color:"white" } }
            }
        }
    }
);


/* ===== EXPENSE PIE ===== */

const expenseCategories={};

expenseData.forEach(item=>{
expenseCategories[item.category] =
(expenseCategories[item.category]||0) +
Number(item.amount);
});

categoryChart = new Chart(
document.getElementById("categoryChart"),
{
type:"pie",

data:{
labels:Object.keys(expenseCategories),
datasets:[{
data:Object.values(expenseCategories),
backgroundColor:[
"#7b2ff7",
"#ff6a00",
"#00c6ff",
"#00ff94",
"#f7971e"
]
}]
},

options:{
responsive:true,
maintainAspectRatio:false,

animation:{
animateRotate:true,
duration:1600
},

plugins:{
legend:{labels:{color:"white"}}
}
}

});


/* ===== INCOME SOURCES DONUT ===== */

const incomeSources={};

incomeData.forEach(item=>{
incomeSources[item.source] =
(incomeSources[item.source]||0)+
Number(item.amount);
});

incomeSourceChart = new Chart(
document.getElementById("incomeSourceChart"),
{
type:"doughnut",

data:{
labels:Object.keys(incomeSources),
datasets:[{
data:Object.values(incomeSources),
backgroundColor:[
"#00c6ff",
"#ff6a00",
"#7b2ff7",
"#00ff94"
]
}]
},

options:{
responsive:true,
maintainAspectRatio:false,

animation:{
animateRotate:true,
duration:1600
},

plugins:{
legend:{labels:{color:"white"}}
}
}

});

/* ===== SAVINGS TREND - MONTHLY ===== */

// Month wise savings nikalo
const monthlySavings = {};

incomeData.forEach(i => {
    const d = new Date(i.date);
    const key = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
    if(!monthlySavings[key]) monthlySavings[key] = {income:0, expense:0};
    monthlySavings[key].income += Number(i.amount);
});

expenseData.forEach(e => {
    const d = new Date(e.date);
    const key = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
    if(!monthlySavings[key]) monthlySavings[key] = {income:0, expense:0};
    monthlySavings[key].expense += Number(e.amount);
});

const sortedKeys = Object.keys(monthlySavings).sort();
const trendLabels = sortedKeys.map(k => {
    const [y, m] = k.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[parseInt(m)-1] + " " + y;
});
const trendData = sortedKeys.map(k => 
    monthlySavings[k].income - monthlySavings[k].expense
);

savingsTrendChart = new Chart(
    document.getElementById("savingsTrendChart"),
    {
        type: "line",
        data: {
            labels: trendLabels,
            datasets:[{
                label: "Monthly Savings",
                data: trendData,
                borderColor: "#00ff94",
                backgroundColor: "rgba(0,255,148,0.15)",
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: "#00ff94",
                borderWidth: 3
            }]
        },
        options:{
            responsive: true,
            maintainAspectRatio: false,
            animation:{ duration:1500 },
            plugins:{
                legend:{ labels:{ color:"white" } }
            },
            scales:{
                x:{ ticks:{ color:"white", maxRotation:45 } },
                y:{ ticks:{ color:"white" } }
            }
        }
    }
);


}