let editId = null;
let actionToConfirm = null;

document.addEventListener("DOMContentLoaded", () => {
    loadIncomes();

    document.getElementById("incomeSearch")?.addEventListener("input", loadIncomes);
    document.getElementById("incomeSort")?.addEventListener("change", loadIncomes);
    document.getElementById("incomeFromDate")?.addEventListener("change", loadIncomes);
    document.getElementById("incomeToDate")?.addEventListener("change", loadIncomes);
});


/* ================================
   LOAD INCOMES FROM DATABASE
================================ */

function loadIncomes() {

    fetch("/api/incomes")
    .then(res => res.json())
    .then(data => {

        let filtered = [...data];

        const search = document.getElementById("incomeSearch")?.value.toLowerCase() || "";
        const sortType = document.getElementById("incomeSort")?.value;
        const fromDate = document.getElementById("incomeFromDate")?.value;
        const toDate = document.getElementById("incomeToDate")?.value;

        // SEARCH
        if (search) {
            filtered = filtered.filter(item =>
                item.source.toLowerCase().includes(search)
            );
        }

        // DATE FILTER
        if (fromDate) {
            filtered = filtered.filter(item => item.date >= fromDate);
        }

        if (toDate) {
            filtered = filtered.filter(item => item.date <= toDate);
        }

        // SORT
        if (sortType === "amountHigh") {
            filtered.sort((a, b) => b.amount - a.amount);
        }
        else if (sortType === "amountLow") {
            filtered.sort((a, b) => a.amount - b.amount);
        }
        else if (sortType === "latest") {
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        else if (sortType === "oldest") {
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        renderTable(filtered);
    });
}


/* ================================
   RENDER TABLE
================================ */

function renderTable(incomes) {

    const incomeList = document.getElementById("incomeList");
    const totalIncome = document.getElementById("totalIncome");

    if (!incomeList) return;

    incomeList.innerHTML = "";

    let total = 0;

    incomes.forEach(item => {

        total += Number(item.amount);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.source}</td>
            <td>₹ ${Number(item.amount).toLocaleString("en-IN")}</td>
            <td>${item.date}</td>
            <td>
                <button class="action-btn delete-btn"
                    onclick="openDeleteModal(${item.id})">
                    Delete
                </button>
            </td>
            <td>
                <button class="action-btn edit-btn"
                    onclick="editIncome(${item.id}, '${item.source}', ${item.amount}, '${item.date}')">
                    Edit
                </button>
            </td>
        `;

        incomeList.appendChild(row);
    });

    if (totalIncome)
        totalIncome.innerText = "₹ " + total.toLocaleString("en-IN");
}


/* ================================
   ADD / UPDATE INCOME
================================ */

function addIncome() {

    const source = document.getElementById("source").value.trim();
    const amount = document.getElementById("amount").value;
    const date = document.getElementById("date").value;

    if (!source || !amount || !date) {
        alert("Please fill all fields");
        return;
    }

    if (editId) {

        fetch(`/update-income/${editId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source, amount, date })
        })
        .then(() => {
            editId = null;
            document.querySelector("button[onclick='addIncome()']").innerText = "Add Income";
            clearForm();
            loadIncomes();
        });

    } else {

        const formData = new FormData();
        formData.append("source", source);
        formData.append("amount", amount);
        formData.append("date", date);

        fetch("/add-income", {
            method: "POST",
            body: formData
        })
        .then(() => {
            clearForm();
            loadIncomes();
        });
    }
}


/* ================================
   EDIT
================================ */

function editIncome(id, source, amount, date) {

    document.getElementById("source").value = source;
    document.getElementById("amount").value = amount;
    document.getElementById("date").value = date;

    editId = id;

    document.querySelector("button[onclick='addIncome()']").innerText = "Update Income";
}


/* ================================
   DELETE
================================ */

function openDeleteModal(id) {

    actionToConfirm = () => deleteIncome(id);
    document.getElementById("confirmModal").style.display = "flex";
}

function deleteIncome(id) {

    fetch(`/delete-income/${id}`, {
        method: "DELETE"
    })
    .then(() => {
        loadIncomes();
        closeModal();
    });
}


/* ================================
   MODAL
================================ */

function closeModal() {
    document.getElementById("confirmModal").style.display = "none";
    actionToConfirm = null;
}

function confirmAction() {
    if (actionToConfirm) {
        actionToConfirm();
    }
}


/* ================================
   CLEAR FORM
================================ */

function clearForm() {
    document.getElementById("source").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("date").value = "";
}