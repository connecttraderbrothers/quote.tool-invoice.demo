var statementItems = [];
var currentStatementRateType = 'job';
var statementNumber = 1;
var editingStatementIndex = -1;

// Define category order (matches dropdown menu order)
var statementCategoryOrder = [
    'Downtakings',
    'General Building',
    'Building work',
    'Carpentry',
    'Joinery',
    'Electrical',
    'Electricals',
    'Plumbing',
    'Gas work/Plumbing',
    'Plastering',
    'Skimming /Painting',
    'Painting & Decorating',
    'Tiling',
    'Roofing',
    'Kitchen Fitting',
    'Bathroom Fitting',
    'Bathrooms',
    'Flooring',
    'Bricklaying',
    'HVAC',
    'Groundworks',
    'Scaffolding',
    'Glazing',
    'Insulation',
    'Materials'
];

// Edinburgh 2025 standard trade rates
var statementTradeRates = {
    'Downtakings': { hourly: 30, daily: 220, job: 0 },
    'General Building': { hourly: 30, daily: 230, job: 0 },
    'Building work': { hourly: 30, daily: 230, job: 0 },
    'Carpentry': { hourly: 32, daily: 240, job: 0 },
    'Joinery': { hourly: 32, daily: 240, job: 0 },
    'Electrical': { hourly: 45, daily: 320, job: 200 },
    'Electricals': { hourly: 45, daily: 320, job: 200 },
    'Plumbing': { hourly: 45, daily: 300, job: 200 },
    'Gas work/Plumbing': { hourly: 50, daily: 340, job: 250 },
    'Plastering': { hourly: 30, daily: 240, job: 0 },
    'Skimming /Painting': { hourly: 28, daily: 220, job: 0 },
    'Painting & Decorating': { hourly: 28, daily: 220, job: 0 },
    'Tiling': { hourly: 32, daily: 250, job: 0 },
    'Roofing': { hourly: 35, daily: 260, job: 0 },
    'Kitchen Fitting': { hourly: 32, daily: 250, job: 3000 },
    'Bathroom Fitting': { hourly: 32, daily: 250, job: 2200 },
    'Bathrooms': { hourly: 32, daily: 250, job: 2200 },
    'Flooring': { hourly: 28, daily: 220, job: 0 },
    'Bricklaying': { hourly: 32, daily: 250, job: 0 },
    'HVAC': { hourly: 40, daily: 300, job: 0 },
    'Groundworks': { hourly: 30, daily: 230, job: 0 },
    'Scaffolding': { hourly: 0, daily: 200, job: 0 },
    'Glazing': { hourly: 32, daily: 250, job: 0 },
    'Insulation': { hourly: 28, daily: 220, job: 0 },
    'Materials': { hourly: 0, daily: 0, job: 0 }
};

// Load statement counter
if (localStorage.getItem('traderBrosStatementCount')) {
    statementNumber = parseInt(localStorage.getItem('traderBrosStatementCount')) + 1;
}
updateStatementCounter();

function updateStatementCounter() {
    document.getElementById('statementCounter').textContent = '#' + String(statementNumber).padStart(4, '0');
}

function editStatementNumber() {
    var current = statementNumber;
    var input = prompt('Enter new statement number:', current);
    if (input === null) return;
    var num = parseInt(input, 10);
    if (isNaN(num) || num < 1) {
        alert('Please enter a valid number (1 or greater).');
        return;
    }
    statementNumber = num;
    localStorage.setItem('traderBrosStatementCount', num - 1);
    updateStatementCounter();
}

// Auto-generate Customer ID from client name
document.getElementById('statementClientName').addEventListener('input', function() {
    var name = this.value.trim();
    if (name) {
        var parts = name.split(' ');
        var customerId = '';

        if (parts.length >= 2) {
            var firstName = parts[0].substring(0, 3).toUpperCase();
            var lastName = parts[parts.length - 1].substring(0, 3).toUpperCase();
            var randomNum = Math.floor(1000 + Math.random() * 9000);
            customerId = firstName + lastName + randomNum;
        } else if (parts.length === 1) {
            var singleName = parts[0].substring(0, 6).toUpperCase();
            var randomNum = Math.floor(1000 + Math.random() * 9000);
            customerId = singleName + randomNum;
        }

        document.getElementById('statementCustomerId').value = customerId;
    } else {
        document.getElementById('statementCustomerId').value = '';
    }
});

// Trade category change handler
document.getElementById('statementTradeCategory').addEventListener('change', function() {
    var selectedTrade = this.value;
    var rateInfo = document.getElementById('statementTradeRateInfo');
    var customCategoryGroup = document.getElementById('statementCustomCategoryGroup');

    // Show/hide custom category name input
    if (selectedTrade === 'Custom') {
        customCategoryGroup.classList.remove('hidden');
        rateInfo.textContent = '';
        document.getElementById('statementUnitPrice').value = '';
        return;
    } else {
        customCategoryGroup.classList.add('hidden');
    }

    if (selectedTrade && statementTradeRates[selectedTrade]) {
        var rates = statementTradeRates[selectedTrade];
        var infoText = 'Standard rates: ';
        var rateParts = [];

        if (rates.hourly > 0) rateParts.push('£' + rates.hourly + '/hr');
        if (rates.daily > 0) rateParts.push('£' + rates.daily + '/day');
        if (rates.job > 0) rateParts.push('£' + rates.job + '/job');

        if (rateParts.length > 0) {
            infoText += rateParts.join(' | ');
            rateInfo.textContent = infoText;
        } else {
            rateInfo.textContent = '';
        }

        updateStatementPriceFromTrade();
    } else {
        rateInfo.textContent = '';
        document.getElementById('statementUnitPrice').value = '';
    }
});

function updateStatementPriceFromTrade() {
    var selectedTrade = document.getElementById('statementTradeCategory').value;
    if (selectedTrade && statementTradeRates[selectedTrade]) {
        var rates = statementTradeRates[selectedTrade];
        var price = 0;

        if (currentStatementRateType === 'hourly' && rates.hourly > 0) {
            price = rates.hourly;
        } else if (currentStatementRateType === 'daily' && rates.daily > 0) {
            price = rates.daily;
        } else if (currentStatementRateType === 'job' && rates.job > 0) {
            price = rates.job;
        }

        if (price > 0) {
            document.getElementById('statementUnitPrice').value = price;
        }
    }
}

// Rate type selector
document.querySelectorAll('.statement-rate-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.statement-rate-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        this.classList.add('active');
        currentStatementRateType = this.getAttribute('data-type');

        var customUnitGroup = document.getElementById('statementCustomUnitGroup');
        var rateLabel = document.getElementById('statementRateLabel');

        if (currentStatementRateType === 'custom') {
            customUnitGroup.classList.remove('hidden');
            rateLabel.textContent = 'Unit Price (£) *';
        } else if (currentStatementRateType === 'daily') {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Day Rate (£) *';
        } else if (currentStatementRateType === 'job') {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Per Job Rate (£) *';
        } else {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Hourly Rate (£) *';
        }

        updateStatementPriceFromTrade();
    });
});

function addStatementItem() {
    var categorySelect = document.getElementById('statementTradeCategory').value;
    var category = '';
    if (categorySelect === 'Custom') {
        category = document.getElementById('statementCustomCategoryName').value.trim();
        if (!category) {
            alert('Please enter a custom category name');
            return;
        }
    } else {
        category = categorySelect || 'General';
    }

    var description = document.getElementById('statementDescription').value;
    var quantity = parseFloat(document.getElementById('statementQuantity').value);
    var unitPrice = parseFloat(document.getElementById('statementUnitPrice').value);
    var customUnit = document.getElementById('statementCustomUnit').value;

    if (!description || !unitPrice) {
        alert('Please enter description and unit price');
        return;
    }

    var unit = '';
    if (currentStatementRateType === 'hourly') {
        unit = 'hour';
    } else if (currentStatementRateType === 'daily') {
        unit = 'day';
    } else if (currentStatementRateType === 'job') {
        unit = 'job';
    } else {
        unit = customUnit || 'item';
    }

    var lineTotal = unitPrice * quantity;

    statementItems.push({
        category: category,
        description: description,
        quantity: quantity,
        unit: unit,
        unitPrice: unitPrice,
        lineTotal: lineTotal
    });

    updateStatementTable();
    clearStatementForm();
}

function clearStatementForm() {
    document.getElementById('statementDescription').value = '';
    document.getElementById('statementQuantity').value = '1';
    document.getElementById('statementUnitPrice').value = '';
    document.getElementById('statementCustomUnit').value = '';
    document.getElementById('statementCustomCategoryName').value = '';
    document.getElementById('statementTradeCategory').selectedIndex = 0;
    document.getElementById('statementTradeRateInfo').textContent = '';
    document.getElementById('statementCustomCategoryGroup').classList.add('hidden');
}

function editStatementItem(index) {
    if (editingStatementIndex >= 0) {
        cancelStatementEdit();
    }

    editingStatementIndex = index;
    var item = statementItems[index];

    var categoryOptions = '';
    var categories = Object.keys(statementTradeRates);
    categories.unshift('General');
    for (var i = 0; i < categories.length; i++) {
        var selected = categories[i] === item.category ? 'selected' : '';
        categoryOptions += '<option value="' + categories[i] + '" ' + selected + '>' + categories[i] + '</option>';
    }
    // Add the item's category if it's a custom one not in the list
    var isCustom = categories.indexOf(item.category) === -1;
    if (isCustom) {
        categoryOptions += '<option value="' + item.category + '" selected>' + item.category + '</option>';
    }

    var row = document.getElementById('statementItemsBody').rows[index];
    row.classList.add('editing-row');
    row.innerHTML = '<td>' +
        '<select class="inline-edit-input" id="edit-statement-category-' + index + '" style="width: 100%;">' +
        categoryOptions +
        '</select>' +
        '</td>' +
        '<td>' +
        '<input type="text" class="inline-edit-input" id="edit-statement-description-' + index + '" value="' + item.description + '" style="width: 100%;">' +
        '</td>' +
        '<td class="text-center">' +
        '<input type="number" class="inline-edit-input" id="edit-statement-quantity-' + index + '" value="' + item.quantity + '" step="0.1" min="0.1" style="width: 80px;">' +
        '</td>' +
        '<td class="text-right">' +
        '<input type="number" class="inline-edit-input" id="edit-statement-price-' + index + '" value="' + item.unitPrice + '" step="0.01" min="0" style="width: 100px;">' +
        '</td>' +
        '<td class="text-right" style="font-weight: 600;">£' + item.lineTotal.toFixed(2) + '</td>' +
        '<td class="text-center">' +
        '<div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">' +
        '<button class="btn-action btn-save" onclick="saveStatementEdit(' + index + ')" title="Save">Save</button>' +
        '<button class="btn-action btn-cancel" onclick="cancelStatementEdit()" title="Cancel">Cancel</button>' +
        '</div>' +
        '</td>';

    document.getElementById('edit-statement-quantity-' + index).addEventListener('input', function() {
        updateStatementEditTotal(index);
    });
    document.getElementById('edit-statement-price-' + index).addEventListener('input', function() {
        updateStatementEditTotal(index);
    });
}

function updateStatementEditTotal(index) {
    var quantity = parseFloat(document.getElementById('edit-statement-quantity-' + index).value) || 0;
    var price = parseFloat(document.getElementById('edit-statement-price-' + index).value) || 0;
    var total = quantity * price;

    var row = document.getElementById('statementItemsBody').rows[index];
    row.cells[4].textContent = '£' + total.toFixed(2);
}

function saveStatementEdit(index) {
    var category = document.getElementById('edit-statement-category-' + index).value;
    var description = document.getElementById('edit-statement-description-' + index).value;
    var quantity = parseFloat(document.getElementById('edit-statement-quantity-' + index).value);
    var unitPrice = parseFloat(document.getElementById('edit-statement-price-' + index).value);

    if (!description || !unitPrice || !quantity) {
        alert('Please fill in all fields');
        return;
    }

    var lineTotal = unitPrice * quantity;

    statementItems[index] = {
        category: category,
        description: description,
        quantity: quantity,
        unit: statementItems[index].unit,
        unitPrice: unitPrice,
        lineTotal: lineTotal
    };

    editingStatementIndex = -1;
    updateStatementTable();
}

function cancelStatementEdit() {
    editingStatementIndex = -1;
    updateStatementTable();
}

function removeStatementItem(index) {
    if (confirm('Are you sure you want to delete this item?')) {
        statementItems.splice(index, 1);
        editingStatementIndex = -1;
        updateStatementTable();
    }
}

function moveStatementItem(index, direction) {
    if (editingStatementIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }

    if (direction === 'up' && index > 0) {
        var temp = statementItems[index];
        statementItems[index] = statementItems[index - 1];
        statementItems[index - 1] = temp;
    } else if (direction === 'down' && index < statementItems.length - 1) {
        var temp = statementItems[index];
        statementItems[index] = statementItems[index + 1];
        statementItems[index + 1] = temp;
    }
    updateStatementTable();
}

function repositionStatementItem(index) {
    if (editingStatementIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }

    var newPosition = prompt('Enter new position (1 to ' + statementItems.length + '):', (index + 1));
    if (newPosition === null) return;

    newPosition = parseInt(newPosition);
    if (isNaN(newPosition) || newPosition < 1 || newPosition > statementItems.length) {
        alert('Invalid position. Please enter a number between 1 and ' + statementItems.length);
        return;
    }

    var item = statementItems.splice(index, 1)[0];
    statementItems.splice(newPosition - 1, 0, item);
    updateStatementTable();
}

// Helper function to sort items by category order
function sortStatementItemsByCategory(itemsArray) {
    return itemsArray.slice().sort(function(a, b) {
        var indexA = statementCategoryOrder.indexOf(a.category);
        var indexB = statementCategoryOrder.indexOf(b.category);

        // Custom categories go after all standard ones
        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;

        return indexA - indexB;
    });
}

// Helper function to group items by category
function groupStatementItemsByCategory(itemsArray) {
    var grouped = {};
    itemsArray.forEach(function(item) {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });
    return grouped;
}

function updateStatementTable() {
    var tbody = document.getElementById('statementItemsBody');
    var itemsSection = document.getElementById('statementItemsSection');
    var generateSection = document.getElementById('generateStatementSection');

    if (statementItems.length === 0) {
        itemsSection.style.display = 'none';
        generateSection.style.display = 'none';
        return;
    }

    itemsSection.style.display = 'block';
    generateSection.style.display = 'block';

    var html = '';
    for (var i = 0; i < statementItems.length; i++) {
        var item = statementItems[i];
        html += '<tr>';
        html += '<td>' + item.category + '</td>';
        html += '<td>' + item.description + '</td>';
        html += '<td class="text-center">' + item.quantity + '</td>';
        html += '<td class="text-right">£' + item.unitPrice.toFixed(2) + '</td>';
        html += '<td class="text-right" style="font-weight: 600;">£' + item.lineTotal.toFixed(2) + '</td>';
        html += '<td class="text-center">';
        html += '<div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">';
        html += '<button class="btn-action btn-edit" onclick="editStatementItem(' + i + ')" title="Edit">Edit</button>';
        html += '<button class="btn-action btn-move" onclick="moveStatementItem(' + i + ', \'up\')" title="Move Up" ' + (i === 0 ? 'disabled' : '') + '>↑</button>';
        html += '<button class="btn-action btn-move" onclick="moveStatementItem(' + i + ', \'down\')" title="Move Down" ' + (i === statementItems.length - 1 ? 'disabled' : '') + '>↓</button>';
        html += '<button class="btn-action btn-reposition" onclick="repositionStatementItem(' + i + ')" title="Move to Position">#</button>';
        html += '<button class="btn-action btn-delete" onclick="removeStatementItem(' + i + ')" title="Delete">Del</button>';
        html += '</div>';
        html += '</td>';
        html += '</tr>';
    }

    var subtotal = 0;
    for (var j = 0; j < statementItems.length; j++) {
        subtotal += statementItems[j].lineTotal;
    }

    var removeVat = document.getElementById('statementRemoveVat').checked;
    var vat = removeVat ? 0 : subtotal * 0.20;
    var total = subtotal + vat;

    html += '<tr class="total-row">';
    html += '<td colspan="4" class="text-right">Subtotal:</td>';
    html += '<td class="text-right">£' + subtotal.toFixed(2) + '</td>';
    html += '<td></td>';
    html += '</tr>';
    if (!removeVat) {
        html += '<tr class="total-row">';
        html += '<td colspan="4" class="text-right">VAT (20%):</td>';
        html += '<td class="text-right">£' + vat.toFixed(2) + '</td>';
        html += '<td></td>';
        html += '</tr>';
    }
    html += '<tr class="total-row">';
    html += '<td colspan="4" class="text-right" style="font-size: 16px;"><strong>TOTAL:</strong></td>';
    html += '<td class="text-right" style="font-size: 16px;"><strong>£' + total.toFixed(2) + '</strong></td>';
    html += '<td></td>';
    html += '</tr>';

    tbody.innerHTML = html;
}

function closeStatementPreview() {
    document.getElementById('statementPreviewModal').style.display = 'none';
}
