let editId = null;
let actionToConfirm = null;

document.addEventListener("DOMContentLoaded", () => {
    loadExpenses();

    document.getElementById("Expensesearch")?.addEventListener("input", loadExpenses);
    document.getElementById("Expensesort")?.addEventListener("change", loadExpenses);
    document.getElementById("ExpensefromDate")?.addEventListener("change", loadExpenses);
    document.getElementById("ExpensetoDate")?.addEventListener("change", loadExpenses);

    const categorySelect = document.getElementById("expenseCategory");
    const customCategory = document.getElementById("customCategory");

    categorySelect?.addEventListener("change", function() {
        if (this.value === "other") {
            customCategory.style.display = "block";
        } else {
            customCategory.style.display = "none";
        }
    });
});


/* ================================
   LOAD EXPENSES FROM DATABASE
================================ */

function loadExpenses() {

    fetch("/api/expenses")
    .then(res => res.json())
    .then(data => {

        let filtered = [...data];

        const search = document.getElementById("Expensesearch")?.value.toLowerCase() || "";
        const sortType = document.getElementById("Expensesort")?.value;
        const fromDate = document.getElementById("ExpensefromDate")?.value;
        const toDate = document.getElementById("ExpensetoDate")?.value;

        // SEARCH
        if (search) {
            filtered = filtered.filter(item =>
                item.category.toLowerCase().includes(search)
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

function renderTable(expenses) {

    const list = document.getElementById("expenseList");
    const totalExpense = document.getElementById("totalExpense");

    if (!list) return;

    list.innerHTML = "";

    let total = 0;

    expenses.forEach(expense => {

        total += Number(expense.amount);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${expense.category}</td>
            <td>₹ ${Number(expense.amount).toLocaleString("en-IN")}</td>
            <td>${expense.date}</td>
            <td>
                <button class="action-btn delete-btn"
                    onclick="openDeleteModal(${expense.id})">
                    Delete
                </button>
            </td>
            <td>
                <button class="action-btn edit-btn"
                    onclick="editExpense(${expense.id}, '${expense.category}', ${expense.amount}, '${expense.date}')">
                    Edit
                </button>
            </td>
        `;

        list.appendChild(row);
    });

    if (totalExpense)
        totalExpense.innerText = "₹ " + total.toLocaleString("en-IN");
}


/* ================================
   ADD / UPDATE EXPENSE
================================ */

function addExpense() {

    let category = document.getElementById("expenseCategory").value;
    const amount = document.getElementById("expenseAmount").value;
    const date = document.getElementById("expenseDate").value;

    if (category === "other") {
        category = document.getElementById("customCategory").value;
    }

    if (!category || !amount || !date) {
        alert("Please fill all fields");
        return;
    }

    if (editId) {

        fetch(`/update-expense/${editId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category, amount, date })
        })
        .then(() => {
            editId = null;
            document.querySelector("button[onclick='addExpense()']").innerText = "Add Expense";
            clearForm();
            loadExpenses();
        });

    } else {

        const formData = new FormData();
        formData.append("category", category);
        formData.append("amount", amount);
        formData.append("date", date);

        fetch("/add-expense", {
            method: "POST",
            body: formData
        })
        .then(() => {
            clearForm();
            loadExpenses();
        });
    }
}


/* ================================
   EDIT
================================ */

function editExpense(id, category, amount, date) {

    document.getElementById("expenseCategory").value = category;
    document.getElementById("expenseAmount").value = amount;
    document.getElementById("expenseDate").value = date;

    editId = id;

    document.querySelector("button[onclick='addExpense()']").innerText = "Update Expense";
}


/* ================================
   DELETE
================================ */

function openDeleteModal(id) {
    actionToConfirm = () => deleteExpense(id);
    document.getElementById("confirmModal").style.display = "flex";
}

function deleteExpense(id) {

    fetch(`/delete-expense/${id}`, {
        method: "DELETE"
    })
    .then(() => {
        loadExpenses();
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
    document.getElementById("expenseCategory").value = "";
    document.getElementById("customCategory").value = "";
    document.getElementById("customCategory").style.display = "none";
    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseDate").value = "";
}