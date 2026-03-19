document.addEventListener("DOMContentLoaded", () => {

    loadProfile();
    loadGoals();
    loadFinanceData();
    loadStreakCalendar();

});



/* ================= PROFILE ================= */

function loadProfile(){

fetch("/api/profile")
.then(res=>res.json())
.then(data=>{

document.getElementById("userName").value = data.name || "";
document.getElementById("userAge").value = data.age || "";
document.getElementById("userGender").value = data.gender || "";
document.getElementById("userEmail").value = data.email || "";

if(data.image){
const img = document.getElementById("profileImage").src =
"/static/uploads/" + data.image + "?" + Date.now();
}

setGreeting(
data.name.replace(/\b\w/g,l => l.toUpperCase())
);

});

}



/* ================= PHOTO OPTIONS ================= */

function togglePhotoOptions(){

const menu = document.getElementById("photoOptions");

menu.style.display = menu.style.display === "block" ? "none" : "block";

}



/* ================= SAVE PROFILE ================= */

function saveProfile(){

fetch("/api/profile/update",{

method:"POST",
headers:{"Content-Type":"application/json"},

body:JSON.stringify({

name:document.getElementById("userName").value,
age:document.getElementById("userAge").value,
gender:document.getElementById("userGender").value,
email:document.getElementById("userEmail").value,
password:document.getElementById("newPassword").value


})

})
.then(res=>res.json())
.then(()=>{

loadProfile();
alert("Profile Updated Successfully!");

});

}



/* ================= UPLOAD PHOTO ================= */

function uploadPhoto(){

let file = document.getElementById("uploadPhoto").files[0];

if(!file){
alert("Please select a photo first");
return;
}

let formData = new FormData();
formData.append("photo",file);

fetch("/api/profile/upload",{

method:"POST",
body:formData

})
.then(res=>res.json())
.then(data=>{

if(data.image){

document.getElementById("profileImage").src =
"/static/uploads/" + data.image + "?" + Date.now();

alert("Photo uploaded successfully");

}

})
.catch(err=>{

console.error(err);
alert("Upload failed");

});

}



/* ================= GREETING ================= */

function setGreeting(name){

let hour = new Date().getHours();
let greet = "Hello";

if(hour < 12) greet = "Good Morning";
else if(hour < 18) greet = "Good Afternoon";
else greet = "Good Evening";

document.getElementById("greeting").innerText =
greet + ", " + name + " 👋";

}



/* ================= GOALS ================= */

function loadGoals(){

fetch("/api/savings-data")
.then(res=>res.json())
.then(data=>{

let container = document.getElementById("goalCards");
container.innerHTML = "";

data.goals.forEach(goal=>{

container.innerHTML += `

<div class="goal-card">

<h4>${goal.name}</h4>
<p>₹ ${goal.amount}</p>

</div>`;

});

});

}



/* ================= FINANCE DATA ================= */
function loadFinanceData(){
    fetch("/api/full-finance-data")
    .then(res => res.json())
    .then(data => {

        let table = document.getElementById("financeTable");
        table.innerHTML = "";

        function formatDate(dateStr){
            const d = new Date(dateStr);
            const day = d.getDate();
            const suffix = (day===1||day===21||day===31)?"st":
                           (day===2||day===22)?"nd":
                           (day===3||day===23)?"rd":"th";
            const months = ["January","February","March","April",
                            "May","June","July","August",
                            "September","October","November","December"];
            return day+suffix+" "+months[d.getMonth()]+" "+d.getFullYear();
        }

        // Totals calculate karo
        const totalIncome = data.incomes.reduce((s,i) => s+Number(i.amount), 0);
        const totalExpense = data.expenses.reduce((s,e) => s+Number(e.amount), 0);

        // Same date merge karo
        let merged = {};
        data.incomes.forEach(i => {
            if(!merged[i.date]) merged[i.date] = {income:0, expense:0};
            merged[i.date].income += Number(i.amount);
        });
        data.expenses.forEach(e => {
            if(!merged[e.date]) merged[e.date] = {income:0, expense:0};
            merged[e.date].expense += Number(e.amount);
        });

        // Sort latest first
        Object.keys(merged)
        .sort((a,b) => new Date(b)-new Date(a))
        .forEach(date => {
            let row = merged[date];
            table.innerHTML += `
            <tr>
                <td>${formatDate(date)}</td>
                <td>${row.income>0 ? "₹ "+row.income.toLocaleString("en-IN") : "-"}</td>
                <td>${row.expense>0 ? "₹ "+row.expense.toLocaleString("en-IN") : "-"}</td>
            </tr>`;
        });

        // Charts draw karo
        drawCharts(totalIncome, totalExpense, data.incomes, data.expenses);

        // AI Summary update karo
       const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0;
       const balance = totalIncome - totalExpense;

       let summaryText = "";

       if(savingsRate > 60){
           summaryText = `💚 Excellent! Your savings rate is ${savingsRate}% . You are saving ₹${balance.toLocaleString("en-IN")}. Keep it up!`;
        } else if(savingsRate > 30){
           summaryText = `⚡ Good going! Savings rate is ${savingsRate}% . Balance is ₹${balance.toLocaleString("en-IN")}. Limit Your expenses!`;
        } else if(savingsRate > 0){
           summaryText = `⚠️ Savings rate is only ${savingsRate}% . Expenses are high — ₹${totalExpense.toLocaleString("en-IN")} . Control it!`;
        } else {
           summaryText = `🚨 Expenses are more than income! Balance is in negative. Immediately reduce your expenses!`;
        }

        const aiSummaryEl = document.getElementById("aiProfileSummary");
        if(aiSummaryEl) aiSummaryEl.innerText = summaryText;

    });
}

function drawCharts(income, expense, incomes, expenses){

    // ===== LABELS =====
    const incomeLabels = incomes.slice(-5).map(i => {
        const d = new Date(i.date);
        return d.getDate() + "/" + (d.getMonth()+1);
    });

    const expenseLabels = expenses.slice(-5).map(e => {
        const d = new Date(e.date);
        return d.getDate() + "/" + (d.getMonth()+1);
    });

    const incomeAmounts = incomes.slice(-5).map(i => Number(i.amount));
    const expenseAmounts = expenses.slice(-5).map(e => Number(e.amount));

    // ===== CHART 1 - Income vs Expense =====
    const ctx1 = document.getElementById("incomeExpenseChart");
    if(!ctx1) return;

    new Chart(ctx1, {
        type: "line",
        data: {
            labels: incomeLabels,
            datasets: [
                {
                    label: "Income",
                    data: incomeAmounts,
                    borderColor: "#7b2ff7",
                    backgroundColor: "rgba(123,47,247,0.3)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: "#7b2ff7",
                    borderWidth: 3
                },
                {
                    label: "Expense",
                    data: expenseAmounts,
                    borderColor: "#00e5ff",
                    backgroundColor: "rgba(0,229,255,0.15)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: "#00e5ff",
                    borderWidth: 3
                }
            ]
        },
        options:{
            responsive: true,
            animation:{
                duration: 2000,
                easing: "easeInOutQuart"
            },
            plugins:{
                legend:{
                    labels:{
                        color: "white",
                        font:{ size: 13 }
                    }
                },
                tooltip:{
                    callbacks:{
                        label: function(context){
                            return " ₹ " + context.parsed.y.toLocaleString("en-IN");
                        }
                    }
                }
            },
            scales:{
                x:{ ticks:{ color:"white" }, grid:{ color:"rgba(255,255,255,0.05)" } },
                y:{ ticks:{ color:"white" }, grid:{ color:"rgba(255,255,255,0.05)" } }
            }
        }
    });

    // ===== CHART 2 - Savings vs Expense =====
    const ctx2 = document.getElementById("savingsChart");
    if(!ctx2) return;

    new Chart(ctx2, {
        type: "line",
        data: {
            labels: expenseLabels,
            datasets: [
                {
                    label: "Savings",
                    data: incomeAmounts,
                    borderColor: "#00e5ff",
                    backgroundColor: "rgba(0,229,255,0.25)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: "#00e5ff",
                    borderWidth: 3
                },
                {
                    label: "Expense",
                    data: expenseAmounts,
                    borderColor: "#f107a3",
                    backgroundColor: "rgba(241,7,163,0.15)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: "#f107a3",
                    borderWidth: 3
                }
            ]
        },
        options:{
            responsive: true,
            animation:{
                duration: 2500,
                easing: "easeInOutQuart"
            },
            plugins:{
                legend:{
                    labels:{
                        color: "white",
                        font:{ size: 13 }
                    }
                },
                tooltip:{
                    callbacks:{
                        label: function(context){
                            return " ₹ " + context.parsed.y.toLocaleString("en-IN");
                        }
                    }
                }
            },
            scales:{
                x:{ ticks:{ color:"white" }, grid:{ color:"rgba(255,255,255,0.05)" } },
                y:{ ticks:{ color:"white" }, grid:{ color:"rgba(255,255,255,0.05)" } }
            }
        }
    });

}

/* ================= STREAK CALENDAR ================= */

function loadStreakCalendar(){
    fetch("/api/full-finance-data")
    .then(res => res.json())
    .then(data => {

        let container = document.getElementById("streakCalendar");
        container.innerHTML = "";

        // All income dates collect karo
        let incomeDates = data.incomes.map(x => {
            let d = new Date(x.date);
            return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
        });

        let today = new Date();

        for(let i = 29; i >= 0; i--){
            let d = new Date();
            d.setDate(today.getDate() - i);
            let key = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();

            let box = document.createElement("div");
            box.classList.add("streak-day");

            if(incomeDates.includes(key)){
                box.classList.add("streak-active");
            }

            // Tooltip
            box.title = d.toDateString();
            container.appendChild(box);
        }
    });
}



/* ================= CONFIRM MODAL ================= */

let actionToConfirm = null;


function openProfileConfirm(){

document.getElementById("modalTitle").innerText = "Confirm Action";
document.getElementById("modalMessage").innerText = "Update profile information?";

actionToConfirm = saveProfile;

document.getElementById("confirmModal").style.display = "flex";

}


function openLogoutConfirm(){

document.getElementById("modalTitle").innerText = "Logout";
document.getElementById("modalMessage").innerText = "Are you sure you want to logout?";

actionToConfirm = logoutUser;

document.getElementById("confirmModal").style.display = "flex";

}


function closeModal(){

document.getElementById("confirmModal").style.display = "none";
actionToConfirm = null;

}


function confirmAction(){

if(actionToConfirm){

actionToConfirm();
closeModal();

}

}



/* ================= LOGOUT ================= */

function logoutUser(){

window.location.href="/logout";

}