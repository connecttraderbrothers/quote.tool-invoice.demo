var invoiceItems = [];
var currentInvoiceRateType = 'job';
var invoiceNumber = 1;
var editingInvoiceIndex = -1;

// Edinburgh 2025 standard trade rates (same as quotation tool)
var invoiceTradeRates = {
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

// Load invoice counter
if (localStorage.getItem('traderBrosInvoiceCount')) {
    invoiceNumber = parseInt(localStorage.getItem('traderBrosInvoiceCount')) + 1;
}
updateInvoiceCounter();

function updateInvoiceCounter() {
    document.getElementById('invoiceCounter').textContent = '#' + String(invoiceNumber).padStart(4, '0');
}

// Auto-generate Customer ID from client name
document.getElementById('invoiceClientName').addEventListener('input', function() {
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
        
        document.getElementById('invoiceCustomerId').value = customerId;
    } else {
        document.getElementById('invoiceCustomerId').value = '';
    }
});

// Trade category change handler
document.getElementById('invoiceTradeCategory').addEventListener('change', function() {
    var selectedTrade = this.value;
    var rateInfo = document.getElementById('invoiceTradeRateInfo');
    
    if (selectedTrade && invoiceTradeRates[selectedTrade]) {
        var rates = invoiceTradeRates[selectedTrade];
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
        
        updateInvoicePriceFromTrade();
    } else {
        rateInfo.textContent = '';
        document.getElementById('invoiceUnitPrice').value = '';
    }
});

function updateInvoicePriceFromTrade() {
    var selectedTrade = document.getElementById('invoiceTradeCategory').value;
    if (selectedTrade && invoiceTradeRates[selectedTrade]) {
        var rates = invoiceTradeRates[selectedTrade];
        var price = 0;
        
        if (currentInvoiceRateType === 'hourly' && rates.hourly > 0) {
            price = rates.hourly;
        } else if (currentInvoiceRateType === 'daily' && rates.daily > 0) {
            price = rates.daily;
        } else if (currentInvoiceRateType === 'job' && rates.job > 0) {
            price = rates.job;
        }
        
        if (price > 0) {
            document.getElementById('invoiceUnitPrice').value = price;
        }
    }
}

// Rate type selector
document.querySelectorAll('.invoice-rate-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.invoice-rate-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        this.classList.add('active');
        currentInvoiceRateType = this.getAttribute('data-type');
        
        var customUnitGroup = document.getElementById('invoiceCustomUnitGroup');
        var rateLabel = document.getElementById('invoiceRateLabel');
        
        if (currentInvoiceRateType === 'custom') {
            customUnitGroup.classList.remove('hidden');
            rateLabel.textContent = 'Unit Price (£) *';
        } else if (currentInvoiceRateType === 'daily') {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Day Rate (£) *';
        } else if (currentInvoiceRateType === 'job') {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Per Job Rate (£) *';
        } else {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Hourly Rate (£) *';
        }
        
        updateInvoicePriceFromTrade();
    });
});

function addInvoiceItem() {
    var category = document.getElementById('invoiceTradeCategory').value || 'General';
    var description = document.getElementById('invoiceDescription').value;
    var quantity = parseFloat(document.getElementById('invoiceQuantity').value);
    var unitPrice = parseFloat(document.getElementById('invoiceUnitPrice').value);
    var customUnit = document.getElementById('invoiceCustomUnit').value;

    if (!description || !unitPrice) {
        alert('Please enter description and unit price');
        return;
    }

    var unit = '';
    if (currentInvoiceRateType === 'hourly') {
        unit = 'hour';
    } else if (currentInvoiceRateType === 'daily') {
        unit = 'day';
    } else if (currentInvoiceRateType === 'job') {
        unit = 'job';
    } else {
        unit = customUnit || 'item';
    }

    var lineTotal = unitPrice * quantity;

    invoiceItems.push({
        category: category,
        description: description,
        quantity: quantity,
        unit: unit,
        unitPrice: unitPrice,
        lineTotal: lineTotal
    });

    updateInvoiceTable();
    clearInvoiceForm();
}

function clearInvoiceForm() {
    document.getElementById('invoiceDescription').value = '';
    document.getElementById('invoiceQuantity').value = '1';
    document.getElementById('invoiceUnitPrice').value = '';
    document.getElementById('invoiceCustomUnit').value = '';
    document.getElementById('invoiceTradeCategory').selectedIndex = 0;
    document.getElementById('invoiceTradeRateInfo').textContent = '';
}

function editInvoiceItem(index) {
    if (editingInvoiceIndex >= 0) {
        cancelInvoiceEdit();
    }
    
    editingInvoiceIndex = index;
    var item = invoiceItems[index];
    
    var categoryOptions = '';
    var categories = Object.keys(invoiceTradeRates);
    categories.unshift('General');
    for (var i = 0; i < categories.length; i++) {
        var selected = categories[i] === item.category ? 'selected' : '';
        categoryOptions += '<option value="' + categories[i] + '" ' + selected + '>' + categories[i] + '</option>';
    }
    
    var row = document.getElementById('invoiceItems').rows[index];
    row.classList.add('editing-row');
    row.innerHTML = `
        <td>
            <select class="inline-edit-input" id="edit-invoice-category-${index}" style="width: 100%;">
                ${categoryOptions}
            </select>
        </td>
        <td>
            <input type="text" class="inline-edit-input" id="edit-invoice-description-${index}" value="${item.description}" style="width: 100%;">
        </td>
        <td class="text-center">
            <input type="number" class="inline-edit-input" id="edit-invoice-quantity-${index}" value="${item.quantity}" step="0.1" min="0.1" style="width: 80px;">
        </td>
        <td class="text-right">
            <input type="number" class="inline-edit-input" id="edit-invoice-price-${index}" value="${item.unitPrice}" step="0.01" min="0" style="width: 100px;">
        </td>
        <td class="text-right" style="font-weight: 600;">£${item.lineTotal.toFixed(2)}</td>
        <td class="text-center">
            <div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                <button class="btn-action btn-save" onclick="saveInvoiceEdit(${index})" title="Save">Save</button>
                <button class="btn-action btn-cancel" onclick="cancelInvoiceEdit()" title="Cancel">Cancel</button>
            </div>
        </td>
    `;
    
    document.getElementById('edit-invoice-quantity-' + index).addEventListener('input', function() {
        updateInvoiceEditTotal(index);
    });
    document.getElementById('edit-invoice-price-' + index).addEventListener('input', function() {
        updateInvoiceEditTotal(index);
    });
}

function updateInvoiceEditTotal(index) {
    var quantity = parseFloat(document.getElementById('edit-invoice-quantity-' + index).value) || 0;
    var price = parseFloat(document.getElementById('edit-invoice-price-' + index).value) || 0;
    var total = quantity * price;
    
    var row = document.getElementById('invoiceItems').rows[index];
    row.cells[4].textContent = '£' + total.toFixed(2);
}

function saveInvoiceEdit(index) {
    var category = document.getElementById('edit-invoice-category-' + index).value;
    var description = document.getElementById('edit-invoice-description-' + index).value;
    var quantity = parseFloat(document.getElementById('edit-invoice-quantity-' + index).value);
    var unitPrice = parseFloat(document.getElementById('edit-invoice-price-' + index).value);
    
    if (!description || !unitPrice || !quantity) {
        alert('Please fill in all fields');
        return;
    }
    
    var lineTotal = unitPrice * quantity;
    
    invoiceItems[index] = {
        category: category,
        description: description,
        quantity: quantity,
        unit: invoiceItems[index].unit,
        unitPrice: unitPrice,
        lineTotal: lineTotal
    };
    
    editingInvoiceIndex = -1;
    updateInvoiceTable();
}

function cancelInvoiceEdit() {
    editingInvoiceIndex = -1;
    updateInvoiceTable();
}

function removeInvoiceItem(index) {
    if (confirm('Are you sure you want to delete this item?')) {
        invoiceItems.splice(index, 1);
        editingInvoiceIndex = -1;
        updateInvoiceTable();
    }
}

function moveInvoiceItem(index, direction) {
    if (editingInvoiceIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }
    
    if (direction === 'up' && index > 0) {
        var temp = invoiceItems[index];
        invoiceItems[index] = invoiceItems[index - 1];
        invoiceItems[index - 1] = temp;
    } else if (direction === 'down' && index < invoiceItems.length - 1) {
        var temp = invoiceItems[index];
        invoiceItems[index] = invoiceItems[index + 1];
        invoiceItems[index + 1] = temp;
    }
    updateInvoiceTable();
}

function repositionInvoiceItem(index) {
    if (editingInvoiceIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }
    
    var newPosition = prompt('Enter new position (1 to ' + invoiceItems.length + '):', (index + 1));
    if (newPosition === null) return;
    
    newPosition = parseInt(newPosition);
    if (isNaN(newPosition) || newPosition < 1 || newPosition > invoiceItems.length) {
        alert('Invalid position. Please enter a number between 1 and ' + invoiceItems.length);
        return;
    }
    
    var item = invoiceItems.splice(index, 1)[0];
    invoiceItems.splice(newPosition - 1, 0, item);
    updateInvoiceTable();
}

function updateInvoiceTable() {
    var tbody = document.getElementById('invoiceItems');
    var itemsSection = document.getElementById('invoiceItemsSection');
    var generateSection = document.getElementById('generateInvoiceSection');

    if (invoiceItems.length === 0) {
        itemsSection.style.display = 'none';
        generateSection.style.display = 'none';
        return;
    }

    itemsSection.style.display = 'block';
    generateSection.style.display = 'block';

    var html = '';
    for (var i = 0; i < invoiceItems.length; i++) {
        var item = invoiceItems[i];
        html += '<tr>';
        html += '<td>' + item.category + '</td>';
        html += '<td>' + item.description + '</td>';
        html += '<td class="text-center">' + item.quantity + '</td>';
        html += '<td class="text-right">£' + item.unitPrice.toFixed(2) + '</td>';
        html += '<td class="text-right" style="font-weight: 600;">£' + item.lineTotal.toFixed(2) + '</td>';
        html += '<td class="text-center">';
        html += '<div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">';
        html += '<button class="btn-action btn-edit" onclick="editInvoiceItem(' + i + ')" title="Edit">Edit</button>';
        html += '<button class="btn-action btn-move" onclick="moveInvoiceItem(' + i + ', \'up\')" title="Move Up" ' + (i === 0 ? 'disabled' : '') + '>↑</button>';
        html += '<button class="btn-action btn-move" onclick="moveInvoiceItem(' + i + ', \'down\')" title="Move Down" ' + (i === invoiceItems.length - 1 ? 'disabled' : '') + '>↓</button>';
        html += '<button class="btn-action btn-reposition" onclick="repositionInvoiceItem(' + i + ')" title="Move to Position">#</button>';
        html += '<button class="btn-action btn-delete" onclick="removeInvoiceItem(' + i + ')" title="Delete">Del</button>';
        html += '</div>';
        html += '</td>';
        html += '</tr>';
    }

    var subtotal = 0;
    for (var j = 0; j < invoiceItems.length; j++) {
        subtotal += invoiceItems[j].lineTotal;
    }

    var vat = subtotal * 0.20;
    var total = subtotal + vat;
    
    html += '<tr class="total-row">';
    html += '<td colspan="4" class="text-right">Subtotal:</td>';
    html += '<td class="text-right">£' + subtotal.toFixed(2) + '</td>';
    html += '<td></td>';
    html += '</tr>';
    html += '<tr class="total-row">';
    html += '<td colspan="4" class="text-right">VAT (20%):</td>';
    html += '<td class="text-right">£' + vat.toFixed(2) + '</td>';
    html += '<td></td>';
    html += '</tr>';
    html += '<tr class="total-row">';
    html += '<td colspan="4" class="text-right" style="font-size: 16px;"><strong>TOTAL:</strong></td>';
    html += '<td class="text-right" style="font-size: 16px;"><strong>£' + total.toFixed(2) + '</strong></td>';
    html += '<td></td>';
    html += '</tr>';

    tbody.innerHTML = html;
}

function previewInvoice() {
    if (editingInvoiceIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }
    
    var clientName = document.getElementById('invoiceClientName').value || '[Client Name]';
    var clientPhone = document.getElementById('invoiceClientPhone').value;
    var clientEmail = document.getElementById('invoiceClientEmail').value;
    var projectAddress = document.getElementById('invoiceProjectAddress').value || '[Project Address]';
    var projectPostcode = document.getElementById('invoiceProjectPostcode').value;
    var customerId = document.getElementById('invoiceCustomerId').value || 'N/A';
    var paymentDueDays = document.getElementById('paymentDueDays').value || '30';
    var paymentStatus = document.getElementById('paymentStatus').value;
    
    var today = new Date();
    var invoiceDate = today.toLocaleDateString('en-GB');
    var dueDate = new Date(today.getTime() + parseInt(paymentDueDays) * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
    var invNumber = String(invoiceNumber).padStart(4, '0');
    
    var subtotal = 0;
    for (var j = 0; j < invoiceItems.length; j++) {
        subtotal += invoiceItems[j].lineTotal;
    }
    var vat = subtotal * 0.20;
    var total = subtotal + vat;

    var statusBadge = '';
    if (paymentStatus === 'paid') {
        statusBadge = '<span style="background: #10b981; color: white; padding: 5px 15px; border-radius: 4px; font-weight: bold;">PAID</span>';
    } else if (paymentStatus === 'partial') {
        statusBadge = '<span style="background: #f59e0b; color: white; padding: 5px 15px; border-radius: 4px; font-weight: bold;">PARTIALLY PAID</span>';
    } else {
        statusBadge = '<span style="background: #ef4444; color: white; padding: 5px 15px; border-radius: 4px; font-weight: bold;">UNPAID</span>';
    }

    var previewHtml = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      .invoice-container-preview { font-family: Arial, sans-serif; background: white; padding: 30px; max-width: 100%; }
      .header-preview { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }
      .company-info-preview { flex: 1; }
      .company-name-preview { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #333; }
      .company-name-preview .highlight-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .company-details-preview { font-size: 11px; line-height: 1.6; color: #666; }
      .logo-preview { width: 120px; height: auto; }
      .invoice-banner-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 15px 20px; margin-bottom: 25px; display: inline-block; font-weight: bold; font-size: 16px; color: white; }
      .info-section-preview { display: flex; justify-content: space-between; margin-bottom: 30px; align-items: flex-start; gap: 100px; }
      .client-info-preview { flex: 0 0 auto; }
      .invoice-details-preview { flex: 0 0 auto; }
      .info-row-preview { font-size: 13px; line-height: 2; display: flex; align-items: center; }
      .info-label-preview { color: #333; font-weight: bold; margin-right: 10px; min-width: 80px; }
      .info-value-preview { color: #333; font-weight: normal; }
      .due-date-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 5px 10px; display: inline-block; color: white; font-weight: normal; }
      .items-table-preview { width: 100%; border-collapse: collapse; margin: 30px 0; }
      .items-table-preview thead { background: #f5f5f5; }
      .items-table-preview th { padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #333; border-bottom: 2px solid #ddd; }
      .items-table-preview th:nth-child(2), .items-table-preview th:nth-child(3), .items-table-preview th:nth-child(4) { text-align: right; width: 100px; }
      .items-table-preview td { padding: 12px; font-size: 13px; border-bottom: 1px solid #eee; color: #333; }
      .items-table-preview td:nth-child(2), .items-table-preview td:nth-child(3), .items-table-preview td:nth-child(4) { text-align: right; }
      .notes-section-preview { margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 3px solid #bc9c22; }
      .notes-section-preview h3 { font-size: 13px; margin-bottom: 10px; color: #333; }
      .notes-section-preview p { font-size: 12px; line-height: 1.8; color: #666; }
      .totals-section-preview { margin-top: 30px; display: flex; justify-content: flex-end; }
      .totals-box-preview { width: 300px; }
      .total-row-preview { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 13px; }
      .total-row-preview.subtotal { border-top: 1px solid #ddd; }
      .total-row-preview.vat { color: #666; }
      .total-row-preview.final { background: linear-gradient(135deg, #bc9c22, #d4af37); color: white; font-weight: bold; font-size: 16px; border-top: 2px solid #333; margin-top: 5px; }
      .footer-note-preview { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #666; font-style: italic; }
      .thank-you-preview { margin-top: 15px; font-weight: bold; color: #333; font-size: 12px; }
    </style>
    <div class="invoice-container-preview">
      <div class="header-preview">
        <div class="company-info-preview">
          <div class="company-name-preview">TR<span class="highlight-preview">A</span>DER BROTHERS LTD</div>
          <div class="company-details-preview">
            8 Craigour Terrace<br>
            Edinburgh, EH17 7PB<br>
            07979309957<br>
            traderbrotherslimited@gmail.com
          </div>
        </div>
        <div class="logo-container-preview">
          <img src="https://github.com/infotraderbrothers-lgtm/traderbrothers-assets-logo/blob/main/Trader%20Brothers.png?raw=true" alt="Trader Brothers Logo" class="logo-preview">
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <div class="invoice-banner-preview">INVOICE</div>
        <div>${statusBadge}</div>
      </div>

      <div class="info-section-preview">
        <div class="client-info-preview">
          <div class="info-row-preview">
            <span class="info-label-preview">Name:</span>
            <span class="info-value-preview">${clientName}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Address:</span>
            <span class="info-value-preview">${projectAddress}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Postcode:</span>
            <span class="info-value-preview">${projectPostcode || 'N/A'}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Phone:</span>
            <span class="info-value-preview">${clientPhone || 'N/A'}</span>
          </div>
          ${clientEmail ? `<div class="info-row-preview"><span class="info-label-preview">Email:</span><span class="info-value-preview">${clientEmail}</span></div>` : ''}
        </div>

        <div class="invoice-details-preview">
          <div class="info-row-preview">
            <span class="info-label-preview">Date:</span>
            <span class="info-value-preview">${invoiceDate}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Invoice #:</span>
            <span class="info-value-preview">${invNumber}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Customer ID:</span>
            <span class="info-value-preview">${customerId}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Due Date:</span>
            <span class="due-date-preview">${dueDate}</span>
          </div>
        </div>
      </div>

      <table class="items-table-preview">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Total price</th>
          </tr>
        </thead>
        <tbody>`;

    for (var i = 0; i < invoiceItems.length; i++) {
        var item = invoiceItems[i];
        previewHtml += `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>£${item.unitPrice.toFixed(2)}</td>
            <td>£${item.lineTotal.toFixed(2)}</td>
          </tr>`;
    }

    previewHtml += `
        </tbody>
      </table>

      <div class="notes-section-preview">
        <h3>Payment Terms:</h3>
        <p>Payment due within ${paymentDueDays} days from invoice date. Please make payment to the account details provided separately.</p>
      </div>

      <div class="totals-section-preview">
        <div class="totals-box-preview">
          <div class="total-row-preview subtotal">
            <span>Subtotal</span>
            <span>£${subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row-preview vat">
            <span>VAT (20%)</span>
            <span>£${vat.toFixed(2)}</span>
          </div>
          <div class="total-row-preview final">
            <span>Amount Due</span>
            <span>£${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="footer-note-preview">
        If you have any questions about this invoice, please contact<br>
        Trader Brothers on 07979309957
        <div class="thank-you-preview">Thank you for your business</div>
      </div>
    </div>`;

    document.getElementById('invoicePreviewBody').innerHTML = previewHtml;
    document.getElementById('invoicePreviewModal').style.display = 'block';
}

function closeInvoicePreview() {
    document.getElementById('invoicePreviewModal').style.display = 'none';
}

function downloadInvoice() {
    if (invoiceItems.length === 0) {
        alert('Please add items to the invoice first');
        return;
    }

    var downloadBtn = event.target;
    var originalText = downloadBtn.textContent;
    downloadBtn.textContent = 'Generating PDF...';
    downloadBtn.disabled = true;

    try {
        var htmlContent = generateInvoiceHTML();
        var clientName = document.getElementById('invoiceClientName').value || 'Client';
        var invNumber = String(invoiceNumber).padStart(4, '0');
        var sanitizedClientName = clientName.replace(/[^a-z0-9]/gi, '_');
        var filename = 'Invoice_' + invNumber + '_' + sanitizedClientName + '.pdf';

        console.log('Sending invoice request to PDFShift...');

        fetch('https://api.pdfshift.io/v3/convert/pdf', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa('api:sk_baa46c861371ec5f60ab2e83221fdac1ccce517b'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source: htmlContent,
                landscape: false,
                use_print: true,
                margin: {
                    top: '20px',
                    bottom: '20px',
                    left: '20px',
                    right: '20px'
                }
            })
        })
        .then(function(response) {
            console.log('Response status:', response.status);

            if (!response.ok) {
                return response.json().then(function(errorData) {
                    if (response.status === 401) {
                        throw new Error('Authentication failed. Please check your PDFShift API key.');
                    } else if (response.status === 403) {
                        throw new Error('Access forbidden. Your API key may not have permission.');
                    } else if (response.status === 429) {
                        throw new Error('Rate limit exceeded. You may have used your free tier quota (250 PDFs/month).');
                    } else if (response.status === 400) {
                        throw new Error('Bad Request: ' + (errorData.error || errorData.message || 'Invalid request'));
                    } else {
                        throw new Error((errorData.error || errorData.message) || 'API Error (' + response.status + '): ' + response.statusText);
                    }
                });
            }

            return response.blob();
        })
        .then(function(blob) {
            if (blob.size === 0) {
                throw new Error('Received empty PDF from server');
            }

            console.log('PDF blob size:', blob.size, 'bytes');

            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();

            setTimeout(function() {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

            console.log('Invoice PDF downloaded successfully!');
            
            localStorage.setItem('traderBrosInvoiceCount', invoiceNumber);
            invoiceNumber++;
            updateInvoiceCounter();

            setTimeout(function() {
                alert('✓ Invoice PDF downloaded successfully!\n\nFile: ' + filename);
            }, 200);
        })
        .catch(function(error) {
            console.error('Error generating invoice PDF:', error);
            console.error('Error stack:', error.stack);

            var errorMessage = 'Error generating invoice PDF\n\n';
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage += 'Network Error - Cannot connect to PDFShift API.\n\n';
                errorMessage += 'Please check:\n';
                errorMessage += '• Your internet connection\n';
                errorMessage += '• Firewall or browser extensions blocking the request\n';
                errorMessage += '• Try using a different browser\n\n';
                errorMessage += 'Technical details are in the console (press F12)';
            } else {
                errorMessage += error.message;
                errorMessage += '\n\nCheck console for more details (press F12)';
            }
            alert(errorMessage);
        })
        .finally(function() {
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
        });

    } catch (error) {
        console.error('Error in downloadInvoice:', error);
        alert('Error: ' + error.message);
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    }
}

function generateInvoiceHTML() {
    var clientName = document.getElementById('invoiceClientName').value || '[Client Name]';
    var clientPhone = document.getElementById('invoiceClientPhone').value;
    var clientEmail = document.getElementById('invoiceClientEmail').value;
    var projectAddress = document.getElementById('invoiceProjectAddress').value || '[Project Address]';
    var projectPostcode = document.getElementById('invoiceProjectPostcode').value;
    var customerId = document.getElementById('invoiceCustomerId').value || 'N/A';
    var paymentDueDays = document.getElementById('paymentDueDays').value || '30';
    var paymentStatus = document.getElementById('paymentStatus').value;
    
    var today = new Date();
    var invoiceDate = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
    var dueDate = new Date(today.getTime() + parseInt(paymentDueDays) * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
    var invNumber = String(invoiceNumber).padStart(4, '0');
    
    var subtotal = 0;
    for (var j = 0; j < invoiceItems.length; j++) {
        subtotal += invoiceItems[j].lineTotal;
    }
    var vat = subtotal * 0.20;
    var total = subtotal + vat;

    var statusBadge = '';
    var statusColor = '';
    if (paymentStatus === 'paid') {
        statusColor = '#10b981';
        statusBadge = 'PAID';
    } else if (paymentStatus === 'partial') {
        statusColor = '#f59e0b';
        statusBadge = 'PARTIALLY PAID';
    } else {
        statusColor = '#ef4444';
        statusBadge = 'UNPAID';
    }

    var styles = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: Arial, sans-serif;
        background: #f5f5f5;
        padding: 20px;
      }
      .invoice-container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        padding: 40px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #333;
      }
      .company-info {
        flex: 1;
      }
      .company-name {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #333;
      }
      .company-name .highlight {
        background: linear-gradient(135deg, #bc9c22, #d4af37);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .company-details {
        font-size: 11px;
        line-height: 1.6;
        color: #666;
      }
      .logo {
        width: 120px;
        height: auto;
      }
      .invoice-header-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
      }
      .invoice-banner {
        background: linear-gradient(135deg, #bc9c22, #d4af37);
        padding: 15px 20px;
        display: inline-block;
        font-weight: bold;
        font-size: 16px;
        color: white;
      }
      .status-badge {
        background: ${statusColor};
        color: white;
        padding: 8px 20px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 13px;
      }
      .info-section {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        align-items: flex-start;
        gap: 100px;
      }
      .client-info {
        flex: 0 0 auto;
      }
      .invoice-details {
        flex: 0 0 auto;
      }
      .info-row {
        font-size: 13px;
        line-height: 2;
        display: flex;
        align-items: center;
      }
      .info-label {
        color: #333;
        font-weight: bold;
        margin-right: 10px;
        min-width: 80px;
      }
      .info-value {
        color: #333;
        font-weight: normal;
      }
      .due-date {
        background: linear-gradient(135deg, #bc9c22, #d4af37);
        padding: 5px 10px;
        display: inline-block;
        color: white;
        font-weight: normal;
      }
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 30px 0;
      }
      .items-table thead {
        background: #f5f5f5;
      }
      .items-table th {
        padding: 12px;
        text-align: left;
        font-size: 12px;
        font-weight: bold;
        color: #333;
        border-bottom: 2px solid #ddd;
      }
      .items-table th:nth-child(2),
      .items-table th:nth-child(3),
      .items-table th:nth-child(4) {
        text-align: right;
        width: 100px;
      }
      .items-table td {
        padding: 12px;
        font-size: 13px;
        border-bottom: 1px solid #eee;
        color: #333;
      }
      .items-table td:nth-child(2),
      .items-table td:nth-child(3),
      .items-table td:nth-child(4) {
        text-align: right;
      }
      .payment-terms {
        margin: 30px 0;
        padding: 20px;
        background: #f9f9f9;
        border-left: 3px solid #bc9c22;
      }
      .payment-terms h3 {
        font-size: 13px;
        margin-bottom: 10px;
        color: #333;
      }
      .payment-terms p {
        font-size: 12px;
        line-height: 1.8;
        color: #666;
      }
      .totals-section {
        margin-top: 30px;
        display: flex;
        justify-content: flex-end;
      }
      .totals-box {
        width: 300px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 15px;
        font-size: 13px;
      }
      .total-row.subtotal {
        border-top: 1px solid #ddd;
      }
      .total-row.vat {
        color: #666;
      }
      .total-row.final {
        background: linear-gradient(135deg, #bc9c22, #d4af37);
        color: white;
        font-weight: bold;
        font-size: 16px;
        border-top: 2px solid #333;
        margin-top: 5px;
      }
      .footer-note {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        text-align: center;
        font-size: 11px;
        color: #666;
        font-style: italic;
      }
      .thank-you {
        margin-top: 15px;
        font-weight: bold;
        color: #333;
        font-size: 12px;
      }
      @media print {
        body {
          background: white;
          padding: 0;
        }
        .invoice-container {
          box-shadow: none;
          padding: 20px;
        }
      }
    </style>
  `;

    var bodyContent = `
    <div class="invoice-container">
      <div class="header">
        <div class="company-info">
          <div class="company-name">TR<span class="highlight">A</span>DER BROTHERS LTD</div>
          <div class="company-details">
            8 Craigour Terrace<br>
            Edinburgh, EH17 7PB<br>
            07931 810557<br>
            traderbrotherslimited@gmail.com
          </div>
        </div>
        <div class="logo-container">
          <img src="https://github.com/infotraderbrothers-lgtm/traderbrothers-assets-logo/blob/main/Trader%20Brothers.png?raw=true" alt="Trader Brothers Logo" class="logo">
        </div>
      </div>

      <div class="invoice-header-section">
        <div class="invoice-banner">INVOICE</div>
        <div class="status-badge">${statusBadge}</div>
      </div>

      <div class="info-section">
        <div class="client-info">
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${clientName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span class="info-value">${projectAddress}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Postcode:</span>
            <span class="info-value">${projectPostcode || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${clientPhone || 'N/A'}</span>
          </div>
          ${clientEmail ? '<div class="info-row"><span class="info-label">Email:</span><span class="info-value">' + clientEmail + '</span></div>' : ''}
        </div>

        <div class="invoice-details">
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">${invoiceDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Invoice #:</span>
            <span class="info-value">${invNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Customer ID:</span>
            <span class="info-value">${customerId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Due Date:</span>
            <span class="due-date">${dueDate}</span>
          </div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Total price</th>
          </tr>
        </thead>
        <tbody>`;

    for (var i = 0; i < invoiceItems.length; i++) {
        var item = invoiceItems[i];
        bodyContent += `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>£${item.unitPrice.toFixed(2)}</td>
            <td>£${item.lineTotal.toFixed(2)}</td>
          </tr>`;
    }

    bodyContent += `
        </tbody>
      </table>

      <div class="payment-terms">
        <h3>Payment Terms:</h3>
        <p>Payment due within ${paymentDueDays} days from invoice date. Please make payment to the account details provided separately. Thank you for your business.</p>
      </div>

      <div class="totals-section">
        <div class="totals-box">
          <div class="total-row subtotal">
            <span>Subtotal</span>
            <span>£${subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row vat">
            <span>VAT (20%)</span>
            <span>£${vat.toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>Amount Due</span>
            <span>£${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="footer-note">
        If you have any questions about this invoice, please contact<br>
        us at traderbrotherslimited@gmail.com, or 07979 309957 
        <div class="thank-you">Thank you for your business</div>
      </div>
    </div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - Trader Brothers Ltd</title>
  ${styles}
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

window.onclick = function(event) {
    var modal = document.getElementById('invoicePreviewModal');
    if (event.target == modal) {
        closeInvoicePreview();
    }
}
