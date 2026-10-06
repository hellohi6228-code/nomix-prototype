/* Nomix: the tools a restaurant uses, what each one sends, and what Nomix keeps organized. */
window.NOMIX_DATA = (function () {
  'use strict';

  const GROUPS = [
    { id: 'pos', title: 'Point of sale', hint: 'Where you ring up orders', addKind: 'pos', addName: 'Other', addWhat: 'Another point of sale' },
    { id: 'orders', title: 'Delivery and online orders', hint: 'Apps and sites that send you orders', addKind: 'delivery', addName: 'Add a tool', addWhat: 'Anything we missed' },
    { id: 'team', title: 'Staff and back office', hint: 'Schedules, hours and invoices', addKind: 'schedule', addName: 'Add a tool', addWhat: 'Anything we missed' },
    { id: 'place', title: 'In the restaurant', hint: 'Sensors, cameras and kitchen gear', addKind: 'device', addName: 'Add a device', addWhat: 'Anything we missed' }
  ];

  const KINDS = {
    pos: { label: 'Point of sale', group: 'pos' },
    delivery: { label: 'Delivery orders', group: 'orders' },
    online: { label: 'Online ordering', group: 'orders' },
    hub: { label: 'All delivery orders in one place', group: 'orders' },
    deals: { label: 'Group deals and vouchers', group: 'orders' },
    schedule: { label: 'Staff schedules', group: 'team' },
    backoffice: { label: 'Accounting and inventory', group: 'team' },
    camera: { label: 'Lines and the pickup shelf', group: 'place' },
    sensor: { label: 'Fridge and freezer temperatures', group: 'place' },
    kitchen: { label: 'Kitchen screens, fryers and ovens', group: 'place' },
    robot: { label: 'Cooking and serving robots', group: 'place' },
    device: { label: 'Device in the restaurant', group: 'place' },
    other: { label: 'Something else', group: 'team' }
  };

  // Choices offered when the owner adds a tool we don't list.
  const CUSTOM_KINDS = ['pos', 'delivery', 'online', 'schedule', 'backoffice', 'device', 'other'];

  const t = (id, name, kind, extra) => Object.assign({ id, name, kind }, extra || {});
  // assisted: Nomix finishes the connection with the owner instead of a self-serve sign-in.
  const TOOLS = [
    t('toast', 'Toast', 'pos'),
    t('square', 'Square', 'pos'),
    t('clover', 'Clover', 'pos'),
    t('chowbus', 'Chowbus', 'pos'),
    t('menusifu', 'MenuSifu', 'pos'),
    t('lightspeed', 'Lightspeed', 'pos'),
    t('spoton', 'SpotOn', 'pos'),
    t('aloha', 'NCR Aloha', 'pos', { assisted: true }),
    t('simphony', 'Oracle Simphony', 'pos', { assisted: true }),
    t('brink', 'PAR Brink', 'pos'),
    t('touchbistro', 'TouchBistro', 'pos'),
    t('revel', 'Revel', 'pos'),
    t('keruyun', '客如云', 'pos', { alt: 'Keruyun' }),
    t('hualala', '哗啦啦', 'pos', { alt: 'Hualala' }),
    t('tcsl', '天财商龙', 'pos', { alt: 'TCSL', assisted: true }),
    t('acewill', '奥琦玮', 'pos', { alt: 'Acewill' }),
    t('2dfire', '二维火', 'pos', { alt: '2Dfire' }),
    t('meituan-pos', '美团餐饮系统', 'pos', { alt: 'Meituan' }),
    t('yinbao', '银豹', 'pos', { alt: 'Yinbao' }),

    t('doordash', 'DoorDash', 'delivery'),
    t('ubereats', 'Uber Eats', 'delivery'),
    t('grubhub', 'Grubhub', 'delivery'),
    t('olo', 'Olo', 'online'),
    t('chownow', 'ChowNow', 'online'),
    t('deliverect', 'Deliverect', 'hub'),
    t('meituan-waimai', '美团外卖', 'delivery', { alt: 'Meituan Waimai' }),
    t('eleme', '饿了么', 'delivery', { alt: 'Ele.me' }),
    t('douyin', '抖音', 'deals', { alt: 'Douyin' }),
    t('wechat', '微信小程序', 'online', { alt: 'WeChat Mini Program' }),

    t('7shifts', '7shifts', 'schedule'),
    t('r365', 'Restaurant365', 'backoffice'),

    t('sensors', 'Sensors', 'sensor', { plural: true }),
    t('cameras', 'Cameras', 'camera', { plural: true }),
    t('equipment', 'Kitchen equipment', 'kitchen', { assisted: true }),
    t('robots', 'Robots', 'robot', { assisted: true, plural: true })
  ];

  // "Nomix is receiving" for each kind of tool.
  const STREAMS = {
    pos: ['Orders', 'Order items', 'Payments', 'Refunds', 'Voids and discounts', 'Kitchen tickets', 'Clock-ins', 'Cash drawers', 'Gift cards'],
    delivery: ['Orders', 'Order items', 'Payouts and fees', 'Missing-item charges', 'Downtime', 'Ratings'],
    online: ['Orders', 'Order items', 'Payments', 'Pickup times'],
    hub: ['Orders', 'Order items', 'Which app each order came from'],
    deals: ['Vouchers sold', 'Vouchers used', 'Reviews'],
    schedule: ['Schedules', 'Clock-ins and clock-outs', 'Breaks', 'Team members'],
    backoffice: ['Invoices', 'Inventory counts', 'Recipes', 'Waste', 'Payroll'],
    camera: ['Line length', 'Wait at pickup', 'Foot traffic'],
    sensor: ['Temperature readings', 'Readings outside the safe range'],
    kitchen: ['Equipment status', 'Cook cycles', 'Cleaning'],
    robot: ['Dishes made', 'When a robot needs a hand'],
    device: [],
    other: []
  };

  // The tags Nomix can keep. Each tag is a set of details (name + type), the same for every store.
  // kinds = which tools fill it; words = how owners ask for it; core = the details a plain question needs.
  const tag = (id, name, about, f, kinds, words, core, extra) =>
    Object.assign({ id, name, about, fields: f.map(x => x[0]), types: Object.fromEntries(f), kinds, words, core: core || f.slice(0, 3).map(x => x[0]) }, extra || {});
  const T = 'Text', M = 'Money', TM = 'Time', DT = 'Date', NUM = 'Number', YN = 'Yes or no';
  const SALES = ['pos', 'delivery', 'online', 'hub'];
  const CATS = [
    // Sales and orders
    tag('orders', 'Orders', 'Every order from every store and app, in one list.',
      [['Order number', T], ['Time placed', TM], ['Store', T], ['Channel', T], ['Total', M], ['Server', T]],
      SALES.concat('deals'), ['order', 'pickup', 'takeout', 'to-go', 'channel', 'busy', 'slow hour', '订单', '外卖'], ['Order number', 'Time placed', 'Store', 'Total']),
    tag('items', 'Order items', 'Each dish on each order, with its options.',
      [['Item name', T], ['Quantity', NUM], ['Price', M], ['Options', T], ['Order number', T], ['Store', T]],
      SALES, ['dish', 'item', 'sell best', 'best seller', 'popular', 'most money', '菜品', '单品'], ['Item name', 'Quantity', 'Price', 'Store']),
    tag('sales', 'Daily sales', 'What each store sold each day, before and after discounts.',
      [['Business day', DT], ['Store', T], ['Gross sales', M], ['Discounts', M], ['Net sales', M], ['Tax', M]],
      SALES.concat('deals', 'backoffice'), ['sale', 'sold', 'revenue', 'how much', 'do yesterday', 'do today', 'each store', '营业额', '销售', '流水'], ['Business day', 'Store', 'Gross sales', 'Net sales']),
    tag('menu', 'Menu items', 'Each dish and drink you sell, with its price and options.',
      [['Item name', T], ['Menu section', T], ['Price', M], ['Options and add-ons', T], ['Available', YN]],
      SALES, ['menu', 'price', 'sold out', '86', '菜单'], ['Item name', 'Menu section', 'Price']),
    tag('discounts', 'Discounts and promos', 'Every discount and promotion used, and who applied it.',
      [['Promo name', T], ['Amount', M], ['Order number', T], ['Applied by', T], ['Store', T]],
      ['pos', 'delivery', 'online'], ['discount', 'promo', 'coupon', 'deal', '优惠', '折扣']),
    tag('voids', 'Voids and comps', 'Items taken off orders or given away, and why.',
      [['Item name', T], ['Amount', M], ['Reason', T], ['Approved by', T], ['Store', T], ['Time', TM]],
      ['pos'], ['void', 'comp', 'given away', 'theft', 'loss', '作废', '赠送'], ['Item name', 'Amount', 'Reason', 'Approved by']),
    // Money
    tag('payments', 'Payments', 'How each order was paid, including tips.',
      [['Order number', T], ['Amount', M], ['Tip', M], ['Paid with', T], ['Card brand', T], ['Time paid', TM]],
      ['pos', 'online'], ['payment', 'paid', 'card', 'cash', '支付', '付款', '收款']),
    tag('refunds', 'Refunds', 'Money given back, and why.',
      [['Order number', T], ['Amount refunded', M], ['Reason', T], ['Approved by', T], ['Time', TM]],
      SALES, ['refund', 'money back', '退款', '退单'], ['Amount refunded', 'Reason', 'Approved by']),
    tag('tips', 'Tips', 'Card and cash tips for each team member.',
      [['Team member', T], ['Card tips', M], ['Cash tips', M], ['Business day', DT], ['Store', T]],
      ['pos', 'schedule'], ['tip', 'gratuity', '小费']),
    tag('cash', 'Cash drawers', 'What each drawer should hold and what was counted.',
      [['Drawer', T], ['Opening cash', M], ['Expected cash', M], ['Counted cash', M], ['Over or short', M], ['Store', T]],
      ['pos'], ['drawer', 'over or short', 'short', 'cash count', '现金', '钱箱'], ['Drawer', 'Expected cash', 'Counted cash', 'Over or short']),
    tag('giftcards', 'Gift cards', 'Gift cards sold, loaded and used.',
      [['Card', T], ['Activity', T], ['Amount', M], ['Balance', M], ['Time', TM]],
      ['pos'], ['gift card', 'giftcard', '储值', '礼品卡']),
    tag('guests', 'Guests and loyalty', 'Who comes back, how often, and what they spend.',
      [['Guest ID', T], ['First visit', DT], ['Visits', NUM], ['Total spent', M], ['Loyalty points', NUM]],
      ['pos', 'online'], ['guest', 'customer', 'loyal', 'regular', 'come back', 'member', '会员', '顾客']),
    // Delivery apps
    tag('payouts', 'App payouts and fees', 'What each delivery app paid you, after commission and fees.',
      [['App', T], ['Payout date', DT], ['Sales', M], ['Commission', M], ['Fees', M], ['Marketing spend', M], ['Net payout', M]],
      ['delivery'], ['payout', 'commission', 'fee', 'app cost', 'costing us', 'earn', 'delivery app', '佣金', '抽成'], ['App', 'Sales', 'Commission', 'Fees', 'Net payout']),
    tag('apperrors', 'Missing and wrong items', 'Charges from delivery apps for missing or wrong items.',
      [['App', T], ['Order number', T], ['Item name', T], ['Error charge', M], ['Reason', T], ['Store', T]],
      ['delivery'], ['missing', 'wrong item', 'error charge', 'complaint', '漏餐', '错餐'], ['App', 'Error charge', 'Reason', 'Store']),
    tag('downtime', 'App downtime', 'When a store was paused or offline on a delivery app.',
      [['App', T], ['Store', T], ['Paused from', TM], ['Paused until', TM], ['Minutes offline', NUM]],
      ['delivery'], ['downtime', 'paused', 'offline', 'closed on', '下线', '暂停营业'], ['App', 'Store', 'Minutes offline']),
    tag('ratings', 'Ratings and reviews', 'What guests said about each order and dish.',
      [['App', T], ['Rating', NUM], ['Comment', T], ['Order number', T], ['Date', DT]],
      ['delivery', 'deals'], ['rating', 'review', 'star', 'feedback', '评价', '差评'], ['App', 'Rating', 'Comment']),
    // Team
    tag('staff', 'Staff hours', 'Who worked, when they clocked in and out, and their breaks.',
      [['Team member', T], ['Role', T], ['Clock in', TM], ['Clock out', TM], ['Breaks', T], ['Store', T]],
      ['pos', 'schedule', 'backoffice'], ['staff', 'hour', 'labor', 'labour', 'clock', 'overstaff', 'understaff', 'employee', '员工', '工时', '人手'], ['Team member', 'Clock in', 'Clock out', 'Store']),
    tag('schedules', 'Schedules', 'Who was scheduled to work, and when.',
      [['Team member', T], ['Role', T], ['Shift start', TM], ['Shift end', TM], ['Store', T]],
      ['schedule', 'pos'], ['schedule', 'shift', 'rota', 'overstaff', 'understaff', '排班'], ['Team member', 'Shift start', 'Shift end', 'Store']),
    tag('labor', 'Labor cost', 'Hours and wages for each store each day.',
      [['Business day', DT], ['Store', T], ['Hours worked', NUM], ['Overtime hours', NUM], ['Wages', M]],
      ['pos', 'schedule', 'backoffice'], ['labor cost', 'labour cost', 'wage', 'payroll', 'overtime', '人工成本', '工资']),
    tag('team', 'Team members', 'Everyone on the team, their role and pay rate.',
      [['Name', T], ['Role', T], ['Store', T], ['Pay rate', M], ['Start date', DT]],
      ['pos', 'schedule', 'backoffice'], ['team', 'who works', 'turnover', 'new hire', '团队']),
    // Kitchen and floor
    tag('tickets', 'Kitchen tickets', 'How long each ticket took from kitchen to ready.',
      [['Ticket number', T], ['Sent to kitchen', TM], ['Ready at', TM], ['Minutes to make', NUM], ['Station', T], ['Store', T]],
      ['pos', 'kitchen', 'robot'], ['kitchen', 'ticket', 'ready', 'speed', 'fast', 'slow', '出餐', '厨房'], ['Sent to kitchen', 'Ready at', 'Minutes to make', 'Station']),
    tag('lines', 'Lines and pickup wait', 'How long the line is and how long orders sit at pickup.',
      [['People in line', NUM], ['Wait at pickup', NUM], ['Orders on the shelf', NUM], ['Store', T], ['Time', TM]],
      ['camera'], ['line', 'queue', 'wait', 'pickup shelf', '排队', '等待'], ['People in line', 'Wait at pickup', 'Store']),
    tag('traffic', 'Foot traffic', 'How many people came in each hour.',
      [['Store', T], ['Hour', TM], ['People who came in', NUM]],
      ['camera'], ['foot traffic', 'walk-in guests', 'visitors', 'people came', '客流']),
    tag('temps', 'Temperature checks', 'Fridge and freezer readings through the day.',
      [['Fridge or freezer', T], ['Temperature', '°F'], ['Time checked', TM], ['Safe range', T], ['Inside the safe range', YN], ['Store', T]],
      ['sensor', 'kitchen'], ['temperature', 'temp', 'fridge', 'freezer', 'cooler', 'walk-in', 'cold', 'food safety', 'haccp', 'health inspect', '温度', '冰箱', '冷库'], ['Fridge or freezer', 'Temperature', 'Time checked', 'Inside the safe range']),
    tag('equipment', 'Equipment status', 'Whether fryers, ovens and other gear are working and clean.',
      [['Equipment', T], ['Status', T], ['Cook cycles', NUM], ['Last cleaned', DT], ['Store', T]],
      ['kitchen'], ['equipment', 'fryer', 'oven', 'machine', 'broken', 'repair', '设备']),
    tag('robots', 'Robot activity', 'What each robot made and when it needed help.',
      [['Robot', T], ['Dishes made', NUM], ['Needed a hand', NUM], ['Store', T], ['Time', TM]],
      ['robot'], ['robot', '机器人']),
    // Stock and suppliers
    tag('inventory', 'Inventory counts', 'What you have on hand at each store.',
      [['Item', T], ['Amount on hand', NUM], ['Unit', T], ['Store', T], ['Counted on', DT]],
      ['backoffice', 'pos'], ['inventory', 'stock', 'on hand', 'reorder', 'run out', '库存', '盘点'], ['Item', 'Amount on hand', 'Unit', 'Store']),
    tag('invoices', 'Purchases and invoices', 'What you bought, from whom, and at what price.',
      [['Supplier', T], ['Invoice number', T], ['Item', T], ['Quantity', NUM], ['Unit cost', M], ['Total', M], ['Date', DT]],
      ['backoffice'], ['invoice', 'supplier', 'purchase', 'vendor price', 'reorder', 'order more', '采购', '供应商', '进货'], ['Supplier', 'Item', 'Unit cost', 'Date']),
    tag('recipes', 'Recipes and food cost', 'What goes into each dish and what a plate costs.',
      [['Menu item', T], ['Ingredient', T], ['Amount per plate', T], ['Ingredient cost', M], ['Plate cost', M]],
      ['backoffice'], ['recipe', 'food cost', 'plate cost', 'margin', 'most money', 'profit', '成本', '毛利', '配方'], ['Menu item', 'Plate cost']),
    tag('waste', 'Waste', 'What was thrown away, and why.',
      [['Item', T], ['Amount', T], ['Reason', T], ['Store', T], ['Date', DT]],
      ['backoffice'], ['waste', 'thrown away', 'spoil', 'expired', '报损', '浪费'])
  ];
  // How the tag picker groups the tags.
  const TAG_GROUPS = [
    { title: 'Sales and orders', ids: ['orders', 'items', 'sales', 'menu', 'discounts', 'voids'] },
    { title: 'Money', ids: ['payments', 'refunds', 'tips', 'cash', 'giftcards', 'guests'] },
    { title: 'Delivery apps', ids: ['payouts', 'apperrors', 'downtime', 'ratings'] },
    { title: 'Team', ids: ['staff', 'schedules', 'labor', 'team'] },
    { title: 'Kitchen and floor', ids: ['tickets', 'lines', 'traffic', 'temps', 'equipment', 'robots'] },
    { title: 'Stock and suppliers', ids: ['inventory', 'invoices', 'recipes', 'waste'] }
  ];

  // A plain question can also name a single detail.
  const FIELD_WORDS = [
    ['orders', 'Channel', ['delivery', 'app', 'pickup', 'dine', 'channel']],
    ['orders', 'Server', ['server', 'who sold']],
    ['items', 'Options', ['option', 'add-on', 'modifier']],
    ['refunds', 'Time', ['when']],
    ['staff', 'Role', ['role', 'cook', 'server', 'position']],
    ['tickets', 'Store', ['store', 'location', 'each']],
    ['lines', 'Time', ['when', 'peak', 'busy']]
  ];

  // The examples on the setup screen: the questions owners ask most, each naming exactly the details that answer it.
  const QUESTIONS = [
    { text: 'How did each store do yesterday?', kinds: ['pos', 'delivery', 'online', 'hub'],
      need: { sales: ['Business day', 'Store', 'Gross sales', 'Discounts', 'Net sales'], orders: ['Store', 'Channel', 'Total'] } },
    { text: 'Which dishes make us the most money?', kinds: ['pos', 'backoffice'],
      need: { items: ['Item name', 'Quantity', 'Price', 'Store'], recipes: ['Menu item', 'Plate cost'] } },
    { text: 'Are we overstaffed in slow hours?', kinds: ['schedule', 'pos'],
      need: { staff: ['Team member', 'Clock in', 'Clock out', 'Store'], orders: ['Time placed', 'Store', 'Total'], labor: ['Business day', 'Store', 'Hours worked', 'Wages'] } },
    { text: 'What are delivery apps really costing us?', kinds: ['delivery'],
      need: { payouts: ['App', 'Sales', 'Commission', 'Fees', 'Marketing spend', 'Net payout'], apperrors: ['App', 'Error charge', 'Reason'], downtime: ['App', 'Store', 'Minutes offline'] } },
    { text: 'How long do guests wait for their food?', kinds: ['pos', 'camera', 'kitchen'],
      need: { tickets: ['Sent to kitchen', 'Ready at', 'Minutes to make', 'Station', 'Store'], lines: ['People in line', 'Wait at pickup', 'Store'] } },
    { text: 'Who gives the most refunds and voids?', kinds: ['pos'],
      need: { refunds: ['Amount refunded', 'Reason', 'Approved by'], voids: ['Item name', 'Amount', 'Reason', 'Approved by'], discounts: ['Promo name', 'Amount', 'Applied by'] } },
    { text: 'Is the walk-in staying cold?', kinds: ['sensor'],
      need: { temps: ['Fridge or freezer', 'Temperature', 'Time checked', 'Inside the safe range', 'Store'] } },
    { text: 'What should we reorder this week?', kinds: ['backoffice'],
      need: { inventory: ['Item', 'Amount on hand', 'Unit', 'Store'], invoices: ['Supplier', 'Item', 'Unit cost', 'Date'], items: ['Item name', 'Quantity'] } }
  ];

  const BACKUP_WORDS = ['backup', 'back up', 'back-up', 'copy', 'copies', 'everything', 'all of it', 'all my data', '备份', '全部'];

  // NOMIX Hospitality Group: its brands and operating stores, as listed on the group's own site.
  // Brands still opening or without a published address (Matcha Zen, Chilin, Viva Refresh) have no stores here yet.
  // Each sign-in returns the stores that account can see. Store: [store id, location].
  const COMPANY = {
    name: 'NOMIX Hospitality Group',
    brands: [
      { id: 'umiya', name: 'Umiya', stores: [
        ['umiya-houston-midtown', 'Houston Midtown'], ['umiya-houston-katy-fwy', 'Houston (Katy Fwy)'], ['umiya-humble', 'Humble'],
        ['umiya-frisco', 'Frisco'], ['umiya-san-antonio-huebner', 'San Antonio (Huebner Oaks)'], ['umiya-san-antonio-live-oak', 'Live Oak'],
        ['umiya-san-antonio-seaworld', 'San Antonio (SeaWorld)'], ['umiya-corpus-christi', 'Corpus Christi'], ['umiya-mcallen', 'McAllen'],
        ['umiya-pharr', 'Pharr'], ['umiya-lubbock', 'Lubbock'], ['umiya-leander', 'Leander'], ['umiya-lic', 'Long Island City'],
        ['umiya-edison', 'Edison'], ['umiya-las-vegas', 'Las Vegas'], ['umiya-alexandria', 'Alexandria'], ['umiya-memphis', 'Memphis'],
        ['umiya-jensen-beach', 'Jensen Beach']] },
      { id: 'surfing-crab', name: 'Surfing Crab', stores: [
        ['surfing-crab-cc-spid', 'Corpus Christi (SPID)'], ['surfing-crab-cc-staples', 'Corpus Christi (S Staples)'],
        ['surfing-crab-cc-calallen', 'Corpus Christi (Calallen)'], ['surfing-crab-portland', 'Portland (Express)'],
        ['surfing-crab-san-antonio', 'San Antonio (I-10 W)'], ['surfing-crab-round-rock', 'Round Rock'], ['surfing-crab-san-marcos', 'San Marcos'],
        ['surfing-crab-laredo', 'Laredo'], ['surfing-crab-brownsville', 'Brownsville'], ['surfing-crab-mcallen', 'McAllen (Nolana)'],
        ['surfing-crab-victoria', 'Victoria (Express)'], ['surfing-crab-escondido', 'Escondido'], ['surfing-crab-lewes', 'Lewes']] },
      { id: 'hibachi-buffet', name: 'Hibachi Grill & Supreme Buffet', stores: [['hibachi-buffet-corpus', 'Corpus Christi']] }
    ]
  };

  const DISHES = [
    ['Lobster King Roll', 18, 'Rolls'], ['Amazing Tuna Roll', 15, 'Rolls'], ['A5 Wagyu Sando', 28, 'Robata'],
    ['Cheese Baked Lobster', 24, 'Hot kitchen'], ['Toro & Uni Nigiri', 22, 'Nigiri'], ['AYCE Dinner', 38.99, 'All you can eat']
  ];
  // What each brand sells: its signature dishes.
  const MENUS = {
    umiya: DISHES,
    'surfing-crab': [['King Crab Leg Combo', 64.99, 'Combos'], ['Snow Crab Leg Combo', 39.99, 'Combos'], ['Surfing Special Boil', 49.99, 'Boils'],
      ['Surfing Crab Loaded Fries', 12.99, 'Sides'], ['Fried Jumbo Shrimp Basket', 16.99, 'Baskets']],
    'hibachi-buffet': [['Adult Dinner Buffet', 24.99, 'Buffet'], ['Hibachi Steak Fried Rice', 15.99, 'Hibachi'], ['Spicy Tuna Roll', 8.99, 'Sushi'],
      ["General Tso's Chicken", 13.99, 'Kitchen'], ['Crab Rangoon', 6.99, 'Appetizers'], ['House Special Lo Mein', 12.99, 'Kitchen']]
  };
  const OPTIONS = ['Extra spicy', 'Garlic butter', 'Cajun', 'No mayo', 'None'];
  const REASONS = ['Wrong item', 'Long wait', 'Item sold out', 'Guest changed their mind'];
  const MANAGERS = ['Lily C.', 'Marcus T.', 'Priya S.'];
  const STAFF = [['Maria L.', 'Line cook'], ['Kevin Z.', 'Server'], ['Ana P.', 'Pickup counter'], ['Jun W.', 'Wok station'], ['Dee R.', 'Dish'], ['Tomás G.', 'Prep']];
  const STATIONS = ['Sushi bar', 'Robata grill', 'Teppan', 'Boil station', 'Fryer'];
  const FRIDGES = [['Walk-in fridge', 34, 39, '33–40°F'], ['Prep fridge', 35, 40, '33–41°F'], ['Freezer', -4, 2, 'Below 5°F']];
  const STOCK = [['Salmon', 'lb', 'Coastal Seafood'], ['Snow crab clusters', 'lb', 'Coastal Seafood'], ['Crawfish', 'lb', 'Gulf Catch'], ['Sushi rice', 'bags', 'Golden Grain'], ['Takeout boxes', 'cases', 'PackRight']];
  const DEALS = ['Lunch set for one', 'Dinner for two', 'Dumpling combo', 'Family set for four'];
  const PROMOS = ['Happy hour', 'Lunch combo', '10% off pickup', 'Staff meal', 'Loyalty reward'];
  const COMMENTS = [[5, 'Fresh sushi, great value'], [4, 'Good, a little late'], [5, 'Crab legs were perfect'], [2, 'Missing the corn'], [3, 'Food was cold'], [5, 'Fast and friendly']];
  const RECIPES = [['Lobster King Roll', 'Lobster meat', '3 oz', 4.2], ['King Crab Leg Combo', 'King crab legs', '1 lb', 18.5], ['Spicy Tuna Roll', 'Tuna', '2 oz', 1.6], ['Surfing Special Boil', 'Crawfish', '1 lb', 4.8], ['Hibachi Steak Fried Rice', 'Sirloin', '5 oz', 2.9]];
  const WASTE_REASONS = ['Expired', 'Dropped', 'Overcooked', 'Made too much'];

  const PROVIDERS = ['Snowflake', 'BigQuery', 'Databricks', 'Amazon S3', 'Azure', 'Other'];

  // Each vendor's own icon, from its app store listing or website (in logos/).
  const LOGOS = { "2dfire": '2dfire.jpg', "7shifts": '7shifts.jpg', acewill: 'acewill.jpg', aloha: 'aloha.png', brink: 'brink.png', chowbus: 'chowbus.png', chownow: 'chownow.png', clover: 'clover.png', deliverect: 'deliverect.png', doordash: 'doordash.jpg', douyin: 'douyin.jpg', eleme: 'eleme.png', grubhub: 'grubhub.png', keruyun: 'keruyun.png', lightspeed: 'lightspeed.png', "meituan-pos": 'meituan-pos.jpg', "meituan-waimai": 'meituan-waimai.jpg', menusifu: 'menusifu.png', olo: 'olo.png', r365: 'r365.png', revel: 'revel.png', simphony: 'simphony.svg', spoton: 'spoton.jpg', square: 'square.jpg', tcsl: 'tcsl.png', toast: 'toast.jpg', touchbistro: 'touchbistro.png', ubereats: 'ubereats.png', wechat: 'wechat.jpg', yinbao: 'yinbao.jpg' };

  return { GROUPS, KINDS, CUSTOM_KINDS, TOOLS, STREAMS, CATS, TAG_GROUPS, FIELD_WORDS, QUESTIONS, BACKUP_WORDS, COMPANY,
    DISHES, MENUS, OPTIONS, REASONS, MANAGERS, STAFF, STATIONS, FRIDGES, STOCK, DEALS, PROMOS, COMMENTS, RECIPES, WASTE_REASONS, PROVIDERS, LOGOS };
})();
