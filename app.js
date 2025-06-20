// DOM Elements
const groupNameInput = document.getElementById('group-name');
const createGroupBtn = document.getElementById('create-group-btn');
const deleteGroupBtn = document.getElementById('delete-group-btn');
const resetAppBtn = document.getElementById('reset-app-btn');
const toggleThemeBtn = document.getElementById('toggle-theme');
const groupsList = document.getElementById('groups-list');

const membersSection = document.getElementById('members-section');
const memberNameInput = document.getElementById('member-name');
const addMemberBtn = document.getElementById('add-member-btn');
const membersList = document.getElementById('members-list');

const paymentSection = document.getElementById('payment-section');
const paymentAmountInput = document.getElementById('payment-amount');
const payerSelect = document.getElementById('payer-select');
const paymentDescInput = document.getElementById('payment-desc');
const paymentDateInput = document.getElementById('payment-date');
const paymentCategorySelect = document.getElementById('payment-category');
const addPaymentBtn = document.getElementById('add-payment-btn');
const splitEquallyCheckbox = document.getElementById('split-equally');
const customSplitInputsDiv = document.getElementById('custom-split-inputs');

const splitSection = document.getElementById('split-section');
const splitTableBody = document.querySelector('#split-table tbody');

const pdfSection = document.getElementById('pdf-section');
const downloadPdfBtn = document.getElementById('download-pdf-btn');
const printBtn = document.getElementById('print-btn');
const singleMemberSelect = document.getElementById('single-member-select');
const downloadSinglePdfBtn = document.getElementById('download-single-pdf-btn');
const printSingleBtn = document.getElementById('print-single-btn');
const currentGroupNameSpan = document.getElementById('current-group-name');

// Data
let groups = JSON.parse(localStorage.getItem('splitAppData')) || [];
let currentGroupIdx = groups.length > 0 ? 0 : null;
let splitDetails = [];

// Save to localStorage
function saveData() {
    localStorage.setItem('splitAppData', JSON.stringify(groups));
}

// Sidebar group list
function renderGroupsList() {
    groupsList.innerHTML = '';
    groups.forEach((g, idx) => {
        const li = document.createElement('li');
        li.textContent = g.name;
        if (idx === currentGroupIdx) li.classList.add('active');
        li.onclick = () => switchGroup(idx);
        groupsList.appendChild(li);
    });
}

function switchGroup(idx) {
    currentGroupIdx = idx;
    renderGroupsList();
    updateGroupUI();
}

createGroupBtn.addEventListener('click', () => {
    const name = groupNameInput.value.trim();
    if (!name) return alert('Enter group name');
    if (groups.some(g => g.name === name)) return alert('Group exists');
    groups.push({ name, members: [], payments: [] });
    groupNameInput.value = '';
    currentGroupIdx = groups.length - 1;
    saveData();
    renderGroupsList();
    updateGroupUI();
});

deleteGroupBtn.addEventListener('click', () => {
    if (currentGroupIdx !== null && groups.length > 0) {
        if (confirm('Are you sure you want to delete this group?')) {
            groups.splice(currentGroupIdx, 1);
            if (groups.length === 0) {
                currentGroupIdx = null;
            } else {
                currentGroupIdx = 0;
            }
            saveData();
            renderGroupsList();
            updateGroupUI();
        }
    }
});

resetAppBtn.addEventListener('click', () => {
    if (confirm('Reset everything? This cannot be undone.')) {
        groups = [];
        currentGroupIdx = null;
        localStorage.removeItem('splitAppData');
        renderGroupsList();
        updateGroupUI();
    }
});

toggleThemeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

function updateGroupUI() {
    if (currentGroupIdx === null || !groups[currentGroupIdx]) {
        membersSection.style.display = 'none';
        paymentSection.style.display = 'none';
        splitSection.style.display = 'none';
        pdfSection.style.display = 'none';
        currentGroupNameSpan.textContent = '';
        return;
    }
    membersSection.style.display = '';
    currentGroupNameSpan.textContent = groups[currentGroupIdx].name;
    renderMembers();
    updatePayerSelect();
    updateSingleMemberSelect();
    if (groups[currentGroupIdx].members.length > 1) {
        paymentSection.style.display = '';
        if (!splitEquallyCheckbox.checked) renderCustomSplitInputs();
    } else {
        paymentSection.style.display = 'none';
        customSplitInputsDiv.style.display = 'none';
    }
    if (groups[currentGroupIdx].payments.length > 0) {
        splitSection.style.display = '';
        pdfSection.style.display = '';
        calculateSplit();
    } else {
        splitSection.style.display = 'none';
        pdfSection.style.display = 'none';
    }
}

function renderMembers() {
    membersList.innerHTML = '';
    groups[currentGroupIdx].members.forEach(member => {
        const li = document.createElement('li');
        li.textContent = member;
        membersList.appendChild(li);
    });
}

function updatePayerSelect() {
    payerSelect.innerHTML = '';
    groups[currentGroupIdx].members.forEach(member => {
        const option = document.createElement('option');
        option.value = member;
        option.textContent = member;
        payerSelect.appendChild(option);
    });
}

function updateSingleMemberSelect() {
    singleMemberSelect.innerHTML = '';
    groups[currentGroupIdx].members.forEach(member => {
        const option = document.createElement('option');
        option.value = member;
        option.textContent = member;
        singleMemberSelect.appendChild(option);
    });
}

// Custom Split Logic
splitEquallyCheckbox.addEventListener('change', () => {
    if (splitEquallyCheckbox.checked) {
        customSplitInputsDiv.style.display = 'none';
    } else {
        renderCustomSplitInputs();
        customSplitInputsDiv.style.display = '';
    }
});

function renderCustomSplitInputs() {
    customSplitInputsDiv.innerHTML = '';
    if (!groups[currentGroupIdx]) return;
    groups[currentGroupIdx].members.forEach(member => {
        const div = document.createElement('div');
        div.className = 'custom-split-member';
        div.innerHTML = `<label>${member}: </label><input type="number" min="0" step="0.01" data-member="${member}" placeholder="0">`;
        customSplitInputsDiv.appendChild(div);
    });
}

addMemberBtn.addEventListener('click', () => {
    const name = memberNameInput.value.trim();
    if (!name) return alert('Enter member name');
    if (groups[currentGroupIdx].members.includes(name)) return alert('Already added');
    groups[currentGroupIdx].members.push(name);
    memberNameInput.value = '';
    saveData();
    updateGroupUI();
});

addPaymentBtn.addEventListener('click', () => {
    const amount = parseFloat(paymentAmountInput.value);
    const payer = payerSelect.value;
    const desc = paymentDescInput.value.trim();
    const date = paymentDateInput.value || new Date().toLocaleDateString();
    const category = paymentCategorySelect.value;
    if (!amount || amount <= 0) return alert('Enter valid amount');
    if (!payer) return alert('Select payer');
    if (!desc) return alert('Enter description');
    let customSplit = null;
    if (!splitEquallyCheckbox.checked) {
        customSplit = {};
        let total = 0;
        groups[currentGroupIdx].members.forEach(member => {
            const input = customSplitInputsDiv.querySelector(`input[data-member='${member}']`);
            const val = parseFloat(input.value) || 0;
            customSplit[member] = val;
            total += val;
        });
        if (Math.abs(total - amount) > 0.01) {
            alert('Custom split total must match the payment amount.');
            return;
        }
    }
    const payment = { amount, payer, desc, date, category, received: {}, customSplit };
    groups[currentGroupIdx].payments.push(payment);
    paymentAmountInput.value = '';
    paymentDescInput.value = '';
    if (customSplitInputsDiv) customSplitInputsDiv.querySelectorAll('input').forEach(i => i.value = '');
    saveData();
    updateGroupUI();
});

function calculateSplit() {
    const group = groups[currentGroupIdx];
    splitDetails = group.payments.map(payment => {
        return group.members.map(member => ({
            payment,
            member,
            owes: member === payment.payer ? 0 : (payment.customSplit ? +(payment.customSplit[member] || 0) : +(payment.amount / group.members.length).toFixed(2)),
            received: member === payment.payer
        }));
    });
    renderSplitTable();
}

function renderSplitTable() {
    const group = groups[currentGroupIdx];
    splitTableBody.innerHTML = '';
    group.payments.forEach((payment, payIdx) => {
        group.members.forEach((member, memIdx) => {
            const owes = member === payment.payer ? 0 : (payment.customSplit ? +(payment.customSplit[member] || 0) : +(payment.amount / group.members.length).toFixed(2));
            const received = payment.received?.[member];
            const tr = document.createElement('tr');
            if (memIdx === 0) {
                tr.innerHTML += `<td rowspan="${group.members.length}"><b>${payment.desc}</b><br><small>${payment.payer} paid $${payment.amount} on ${payment.date}</small></td>`;
            }
            tr.innerHTML += `
                <td>${member}</td>
                <td>${owes}</td>
                <td>${received || member === payment.payer ? 'Yes' : 'No'}</td>
                <td>${member !== payment.payer && !received ? `<button onclick=\"markReceived(${payIdx}, '${member}')\">Mark Received</button>` : ''}</td>
            `;
            splitTableBody.appendChild(tr);
        });
    });
}

window.markReceived = function(payIdx, member) {
    const payment = groups[currentGroupIdx].payments[payIdx];
    payment.received[member] = true;
    saveData();
    updateGroupUI();
};

downloadPdfBtn.addEventListener('click', () => {
    const group = groups[currentGroupIdx];
    downloadPDF(group.payments, group.members, group.name);
});

function generatePrintTable(payments, members, filterMember = null) {
    let html = `<table border='1' cellspacing='0' cellpadding='4' style='width:100%;border-collapse:collapse;'>`;
    html += `<thead><tr><th>Description</th><th>Member</th><th>Owes</th><th>Received</th></tr></thead><tbody>`;
    payments.forEach(payment => {
        members.forEach((member, idx) => {
            if (filterMember && member !== filterMember) return;
            const owes = member === payment.payer ? 0 : (payment.customSplit ? +(payment.customSplit[member] || 0) : +(payment.amount / members.length).toFixed(2));
            const received = payment.received?.[member];
            html += `<tr>`;
            if (idx === 0 && (!filterMember || members.filter(m => !filterMember || m === filterMember).length > 0)) {
                html += `<td rowspan='${filterMember ? 1 : members.length}'><b>${payment.desc}</b><br><small>${payment.payer} paid $${payment.amount} on ${payment.date}</small></td>`;
            }
            html += `<td>${member}</td><td>${owes}</td><td>${received || member === payment.payer ? 'Yes' : 'No'}</td></tr>`;
        });
    });
    html += `</tbody></table>`;
    return html;
}

printBtn.addEventListener('click', () => {
    const group = groups[currentGroupIdx];
    const win = window.open('', '', 'width=900,height=700');
    win.document.write(`<html><head><title>Print - ${group.name}</title></head><body>`);
    win.document.write(`<h2>${group.name} - Split Details</h2>`);
    win.document.write(generatePrintTable(group.payments, group.members));
    win.document.write('</body></html>');
    win.document.close();
    win.print();
});

downloadSinglePdfBtn.addEventListener('click', () => {
    const group = groups[currentGroupIdx];
    const member = singleMemberSelect.value;
    downloadPDF(group.payments, group.members, group.name, member);
});


printSingleBtn.addEventListener('click', () => {
    const group = groups[currentGroupIdx];
    const member = singleMemberSelect.value;
    const win = window.open('', '', 'width=900,height=700');
    win.document.write(`<html><head><title>Print - ${group.name} - ${member}</title></head><body>`);
    win.document.write(`<h2>${group.name} - ${member} - Split Details</h2>`);
    win.document.write(generatePrintTable(group.payments, group.members, member));
    win.document.write('</body></html>');
    win.document.close();
    win.print();
});

function downloadPDF(payments, members, groupName, filterMember = null) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Group: ${groupName}`, 10, 10);
    let y = 20, totalDue = 0;
    payments.forEach((payment, i) => {
        doc.setFontSize(12);
        doc.text(`Payment #${i+1}: ${payment.payer} paid $${payment.amount} on ${payment.date}`, 10, y);
        doc.text(`Description: ${payment.desc}`, 10, y + 7);
        y += 15;
        members.forEach(member => {
            if (filterMember && member !== filterMember) return;
            const owes = member === payment.payer ? 0 : (payment.customSplit ? +(payment.customSplit[member] || 0) : +(payment.amount / members.length).toFixed(2));
            const received = payment.received?.[member];
            doc.setFontSize(10);
            doc.text(`${member}: Owes $${owes} - Received: ${received || member === payment.payer ? 'Yes' : 'No'}`, 12, y);
            if (member !== payment.payer && (!filterMember || member === filterMember) && !received) {
                totalDue += owes;
            }
            y += 6;
        });
        if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.setFontSize(12);
    y += 10;
    doc.text(`Remaining Due Payment: $${totalDue.toFixed(2)}`, 10, y);
    doc.save(`split_payment_${filterMember || 'all'}.pdf`);
}

// Initial render
renderGroupsList();
updateGroupUI();
