/* Nomix: where each detail comes from in each tool, using the tool's own field and report names.
   Only names published in each vendor's documentation are listed. Anything else shows as
   "Mapped with you": Nomix confirms it with the owner during setup.
   '=' means Nomix works the value out from other details (for example, net sales). */
window.NOMIX_MAP = (function () {
  'use strict';
  const all = (fields, src) => Object.fromEntries(fields.map(f => [f, src]));

  // Toast: Orders (Order → checks → selections, payments), Labor (TimeEntry), Menus and Stock.
  const toast = {
    orders: { 'Order number': 'checks[].displayNumber', 'Time placed': 'openedDate', Store: 'Toast location', Channel: 'diningOption', Total: 'checks[].totalAmount', Server: 'server' },
    items: { 'Item name': 'selections[].displayName', Quantity: 'selections[].quantity', Price: 'selections[].price', Options: 'selections[].modifiers', 'Order number': 'checks[].displayNumber', Store: 'Toast location' },
    sales: { 'Business day': 'businessDate', Store: 'Toast location', 'Gross sales': 'checks[].amount', Discounts: 'checks[].appliedDiscounts', 'Net sales': '=', Tax: 'checks[].taxAmount' },
    menu: { 'Item name': 'menuItems[].name', 'Menu section': 'menuGroups[].name', Price: 'menuItems[].price', 'Available': 'stock status' },
    discounts: { 'Promo name': 'appliedDiscounts[].name', Amount: 'appliedDiscounts[].discountAmount', 'Order number': 'checks[].displayNumber', Store: 'Toast location' },
    voids: { 'Item name': 'selections[].displayName', Amount: 'selections[].price', Reason: 'selections[].voidReason', Store: 'Toast location' },
    payments: { 'Order number': 'checks[].displayNumber', Amount: 'payments[].amount', Tip: 'payments[].tipAmount', 'Paid with': 'payments[].type', 'Card brand': 'payments[].cardType', 'Time paid': 'payments[].paidDate' },
    refunds: { 'Order number': 'checks[].displayNumber', 'Amount refunded': 'payments[].refund.refundAmount', Time: 'payments[].refund.refundDate' },
    tips: { 'Team member': 'employeeReference', 'Card tips': 'nonCashTips', 'Cash tips': 'declaredCashTips', 'Business day': 'businessDate', Store: 'Toast location' },
    staff: { 'Team member': 'employeeReference', Role: 'jobReference', 'Clock in': 'inDate', 'Clock out': 'outDate', Breaks: 'breaks', Store: 'Toast location' },
    labor: { 'Business day': 'businessDate', Store: 'Toast location', 'Hours worked': 'regularHours', 'Overtime hours': 'overtimeHours', Wages: '=' },
    guests: { 'Guest ID': 'checks[].customer', Visits: '=', 'Total spent': '=' },
    inventory: { 'Amount on hand': 'stock quantity', Store: 'Toast location' }
  };

  // Square: Orders, Payments, Refunds, Labor (Timecard), Catalog, Inventory, Customers, Cash drawers, Gift cards.
  const square = {
    orders: { 'Order number': 'id', 'Time placed': 'created_at', Store: 'location_id', Channel: 'fulfillments[].type', Total: 'total_money' },
    items: { 'Item name': 'line_items[].name', Quantity: 'line_items[].quantity', Price: 'line_items[].base_price_money', Options: 'line_items[].modifiers', 'Order number': 'id', Store: 'location_id' },
    sales: { 'Business day': '=', Store: 'location_id', 'Gross sales': 'line_items[].gross_sales_money', Discounts: 'total_discount_money', 'Net sales': '=', Tax: 'total_tax_money' },
    menu: { 'Item name': 'item_data.name', 'Menu section': 'item_data.categories', Price: 'price_money', 'Options and add-ons': 'modifier_list_info', Available: 'sold_out' },
    discounts: { 'Promo name': 'discounts[].name', Amount: 'discounts[].applied_money', 'Order number': 'id', Store: 'location_id' },
    payments: { 'Order number': 'order_id', Amount: 'amount_money', Tip: 'tip_money', 'Paid with': 'source_type', 'Card brand': 'card_details.card.card_brand', 'Time paid': 'created_at' },
    refunds: { 'Order number': 'order_id', 'Amount refunded': 'amount_money', Reason: 'reason', Time: 'created_at' },
    tips: { 'Team member': 'team_member_id', 'Card tips': 'tip_money', 'Cash tips': 'declared_cash_tip_money', 'Business day': '=', Store: 'location_id' },
    cash: { 'Opening cash': 'opened_cash_money', 'Expected cash': 'expected_cash_money', 'Counted cash': 'closed_cash_money', 'Over or short': '=', Store: 'location_id' },
    giftcards: { Card: 'gift_card_id', Activity: 'type', Balance: 'gift_card_balance_money', Time: 'created_at' },
    guests: { 'Guest ID': 'customer id', 'First visit': 'created_at', Visits: '=', 'Total spent': '=', 'Loyalty points': 'loyalty balance' },
    staff: { 'Team member': 'team_member_id', Role: 'wage.title', 'Clock in': 'start_at', 'Clock out': 'end_at', Breaks: 'breaks', Store: 'location_id' },
    labor: { 'Business day': '=', Store: 'location_id', 'Hours worked': '=', Wages: '=' },
    team: { Name: 'given_name, family_name', Role: 'job_assignments[].job_title', Store: 'assigned_locations', 'Pay rate': 'job_assignments[].hourly_rate' },
    inventory: { Item: 'catalog_object_id', 'Amount on hand': 'quantity', Store: 'location_id', 'Counted on': 'calculated_at' }
  };

  // Clover: orders, line items, payments, refunds, shifts, items and stock.
  const clover = {
    orders: { 'Order number': 'id', 'Time placed': 'createdTime', Store: 'merchant', Channel: 'orderType', Total: 'total', Server: 'employee' },
    items: { 'Item name': 'lineItems[].name', Price: 'lineItems[].price', Options: 'lineItems[].modifications', 'Order number': 'id', Store: 'merchant' },
    sales: { 'Business day': '=', Store: 'merchant', 'Gross sales': '=', Discounts: 'discounts', 'Net sales': '=' },
    menu: { 'Item name': 'name', 'Menu section': 'categories', Price: 'price', 'Options and add-ons': 'modifierGroups' },
    payments: { 'Order number': 'order.id', Amount: 'amount', Tip: 'tipAmount', 'Paid with': 'tender.label', 'Time paid': 'createdTime' },
    refunds: { 'Amount refunded': 'amount', Time: 'createdTime' },
    staff: { 'Team member': 'employee', 'Clock in': 'inTime', 'Clock out': 'outTime', Store: 'merchant' },
    inventory: { Item: 'item', 'Amount on hand': 'item_stocks.quantity', Store: 'merchant' }
  };

  // Revel and SpotOn publish record types rather than single fields; Nomix maps the fields inside them with you.
  const revel = {
    orders: all(['Order number', 'Time placed', 'Store', 'Total'], 'Order'), items: all(['Item name', 'Quantity', 'Price'], 'OrderItem'),
    payments: all(['Amount', 'Tip', 'Paid with'], 'Payment'), staff: all(['Team member', 'Clock in', 'Clock out'], 'TimeSheetEntry'),
    menu: all(['Item name', 'Price'], 'Product'), guests: { 'Loyalty points': 'loyalty_account_id' }
  };
  const spoton = {
    orders: all(['Order number', 'Time placed', 'Total'], 'orders'), items: all(['Item name', 'Options'], 'menu items, modifiers'),
    staff: all(['Team member', 'Clock in', 'Clock out'], 'time clock entries'), labor: all(['Hours worked', 'Wages'], 'labor reports'),
    team: all(['Name', 'Role'], 'employees'), payments: { 'Paid with': 'payment options' }
  };
  const lightspeed = {
    sales: all(['Business day', 'Gross sales', 'Net sales', 'Tax'], 'sales-daily'), payments: { 'Paid with': 'payment-methods' }
  };

  // Delivery apps share their data as reports.
  const doordash = {
    orders: { 'Order number': 'ORDER_DETAIL', 'Time placed': 'ORDER_DETAIL', Store: 'ORDER_DETAIL', Channel: '=', Total: 'ORDER_DETAIL' },
    items: { 'Item name': 'ORDER_DETAIL', Options: 'ORDER_DETAIL', 'Order number': 'ORDER_DETAIL', Store: 'ORDER_DETAIL' },
    sales: { 'Business day': '=', Store: 'PAYOUT_SUMMARY', 'Gross sales': 'PAYOUT_SUMMARY', 'Net sales': '=' },
    payouts: { App: '=', 'Payout date': 'PAYOUT_SUMMARY', Sales: 'PAYOUT_SUMMARY', Commission: 'TRANSACTION_DETAIL', Fees: 'TRANSACTION_DETAIL', 'Marketing spend': 'PAYOUT_SUMMARY', 'Net payout': 'PAYOUT_SUMMARY' },
    apperrors: { App: '=', 'Item name': 'Menu item error report', Store: 'Menu item error report' },
    refunds: { 'Order number': 'CANCELLED_ORDERS', Reason: 'CANCELLED_ORDERS' },
    ratings: { App: '=', Rating: 'Customer feedback report', Comment: 'Customer feedback report' }
  };
  const ubereats = {
    orders: { 'Order number': 'Order History report', 'Time placed': 'Order History report', Store: 'Order History report', Channel: '=', Total: 'Order History report' },
    items: { 'Item name': 'Orders and Items report', Quantity: 'Orders and Items report', Price: 'Orders and Items report', 'Order number': 'Orders and Items report', Store: 'Orders and Items report' },
    sales: { 'Business day': '=', Store: 'Finance Summary report', 'Gross sales': 'Finance Summary report', 'Net sales': '=' },
    payouts: { App: '=', 'Payout date': 'Payment Details report', Sales: 'Payment Details report', Commission: 'Payment Details report', Fees: 'Payment Details report', 'Marketing spend': 'Billing Details report', 'Net payout': 'Payment Details report' },
    apperrors: { App: '=', 'Order number': 'Order Errors Transaction report', 'Item name': 'Order Errors Menu Item report', 'Error charge': 'Order Errors Transaction report', Store: 'Order Errors Transaction report' },
    downtime: { App: '=', Store: 'Downtime report', 'Paused from': 'Downtime report', 'Paused until': 'Downtime report', 'Minutes offline': 'Downtime report' },
    ratings: { App: '=', Rating: 'Customer and Delivery Feedback report', Comment: 'Menu Item Feedback report' }
  };
  const deliverect = {
    orders: { 'Order number': 'channelOrderDisplayId', Store: 'location', Channel: 'orderType', Total: 'payment.amount' },
    items: { 'Item name': 'items[].name', Quantity: 'items[].quantity', Options: 'items[].subItems', 'Order number': 'channelOrderDisplayId' }
  };
  const olo = { orders: all(['Order number', 'Time placed', 'Store', 'Total'], 'Vendor export'), items: all(['Item name', 'Quantity'], 'Vendor export') };

  // 7shifts: time punches and shifts.
  const sevenshifts = {
    staff: { 'Team member': 'user_id', Role: 'role_id', 'Clock in': 'clocked_in', 'Clock out': 'clocked_out', Breaks: 'breaks', Store: 'location_id' },
    schedules: { 'Team member': 'user_id', Role: 'role_id', 'Shift start': 'start', 'Shift end': 'end', Store: 'location_id' },
    labor: { 'Business day': '=', Store: 'location_id', 'Hours worked': '=' },
    team: { Name: 'first_name, last_name', Role: 'role_id', Store: 'location_id' }
  };

  // Restaurant365: its reporting feed shares whole record types.
  const r365 = {
    staff: all(['Team member', 'Role', 'Clock in', 'Clock out', 'Store'], 'LaborDetail'),
    labor: all(['Business day', 'Store', 'Hours worked', 'Overtime hours', 'Wages'], 'PayrollSummary'),
    team: { Name: 'POSEmployee', Role: 'JobTitle', Store: 'Location' },
    sales: all(['Business day', 'Store', 'Gross sales', 'Discounts', 'Net sales', 'Tax'], 'SalesEmployee'),
    invoices: all(['Supplier', 'Invoice number', 'Date', 'Total'], 'Transaction'),
    inventory: { Item: 'Item', Store: 'Location' }
  };
  Object.assign(r365.invoices, all(['Item', 'Quantity', 'Unit cost'], 'TransactionDetail'));

  return { toast, square, clover, revel, spoton, lightspeed, doordash, ubereats, deliverect, olo, '7shifts': sevenshifts, r365 };
})();
