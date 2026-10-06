/* Nomix in Simplified Chinese. Loaded only by zh.html: it translates every piece of text the app shows,
   as it appears, so the Chinese page runs on exactly the same app. Vendor field names, brand names,
   people, store addresses and amounts stay as they are. */
(function () {
  'use strict';
  const N = window.Nomix;
  document.documentElement.lang = 'zh-CN';

  const EXACT = new Map(Object.entries({
    // Setup
    'Let’s connect your restaurant': '连接您的餐厅',
    'A few simple steps. You can finish the rest later.': '只需几个简单步骤,其余的可以稍后完成。',
    'What happens next': '接下来的步骤',
    'Choose the tools you use': '选择您正在使用的工具',
    'Connect them one at a time': '逐个连接',
    'Tell us what to keep track of': '告诉我们需要追踪什么',
    'Start': '开始', 'Back': '返回', 'Close': '关闭', 'Cancel': '取消', 'Done': '完成', 'Add': '添加', 'View': '查看',
    'What do you use?': '您在用哪些工具?',
    'Choose the tools you use every day.': '选择您每天使用的工具。',
    'Connect your tool(s)': '连接您的工具',
    'Find a tool': '查找工具', 'Skip for now': '暂时跳过',
    'Add a tool we don’t list': '添加列表中没有的工具',
    'What’s it called?': '它叫什么?', 'What does it do?': '它是做什么的?', 'Add tool': '添加工具',
    'Connected': '已连接', 'Being set up with you': '正在与您一起设置',
    'Sign in and choose your restaurant.': '登录并选择您的餐厅。',
    'Do this later': '稍后再说',
    'We’ll set this up with you': '我们会与您一起设置',
    'Anything we should know?': '有什么需要我们知道的吗?', 'Optional': '选填',
    'Like the best time to call': '例如方便来电的时间', 'Request help': '请求协助',
    'Keep this screen open. It only takes a moment.': '请保持此页面打开,马上就好。',
    'Choose your stores': '选择您的门店', 'Choose a store': '选择一家门店', 'Choose a tool': '选择一个工具',
    'Help is on the way': '协助马上就到',
    'Next: what to keep track of': '下一步:要追踪的内容',
    'What would you like to keep track of?': '您想追踪什么?',
    'Your prompts': '您的提示', 'Your prompt': '您的提示',
    'Write one below, tap an example, or pick tags.': '在下方输入,点一个示例,或直接选择标签。',
    'Write it in your own words, like “What sold best last weekend?”': '用您自己的话写,例如“上周末什么卖得最好?”',
    'Nomix will track': 'Nomix 将追踪',
    'Nomix will go over this one with you and set up the details.': 'Nomix 会和您一起梳理并设置细节。',
    'Nomix will go over this one with you': 'Nomix 会和您一起梳理',
    'Try one': '试一个', 'Or pick tags': '或直接选择标签', 'Your own': '您自建的', 'Make your own tag': '新建自定义标签',
    'Add this prompt': '添加这条提示', 'Review your data dictionary': '查看您的数据字典', 'Suggest for me': '帮我推荐',
    'Remove this prompt': '删除这条提示', 'Tap to add a tag': '点击添加标签', 'Your own tag': '自定义标签',
    'Like “catering orders”': '例如“团餐订单”', 'Done adding': '添加完成',
    'Your data dictionary': '您的数据字典',
    'How each tool’s data lines up with Nomix. Every store uses the same fields. Tap a tag to see its fields.': '每个工具的数据如何对应到 Nomix。所有门店使用同一套字段。点击标签查看字段。',
    'Answers': '可回答', 'Nomix field': 'Nomix 字段', 'Type': '类型', 'Latest value': '最新值',
    'Worked out by Nomix': '由 Nomix 计算', 'Mapped with you': '与您一起对应', 'Comes from': '来源',
    'Added by you · mapped with you': '您添加的 · 与您一起对应', 'Add a field, like “Table number”': '添加字段,例如“桌号”',
    'Add a tag': '添加标签', 'Looks right': '没问题', 'Add at least one tag': '至少添加一个标签',
    'No tags yet. Go back and write a prompt, or add a tag.': '还没有标签。返回写一条提示,或添加标签。',
    'No tool for this yet': '还没有工具提供这项数据', 'Waiting for the next one': '等待下一条数据',
    'You’re ready': '一切就绪', 'Nomix is set up.': 'Nomix 已设置好。',
    'Nomix is set up. Connect your first tool whenever you’re ready.': 'Nomix 已设置好。准备好后随时连接第一个工具。',
    'Dashed lines fill in as each tool is connected.': '每连接一个工具,虚线就会变成实线。',
    'Finish setup': '完成设置', 'Your tools': '您的工具',
    // Home
    'Your restaurant': '您的餐厅', 'No tools connected yet': '还没有连接工具', 'Choose a store': '选择一家门店',
    'Overview': '总览', 'Connected': '已连接', 'Data dictionary': '数据字典',
    'Your stores show up here as each tool connects.': '每连接一个工具,您的门店就会显示在这里。',
    'I use my own data account': '我使用自己的数据账户',
    'Each change you make is saved here, so you can look back or go back.': '您的每次更改都会保存在这里,可随时回看或恢复。',
    'Viewing': '正在查看', 'Restore this version': '恢复此版本', 'Back to now': '回到现在', 'Go back to this version': '恢复到此版本',
    'Which one do you use?': '您使用哪一个?', 'Never mind': '算了', 'Which one?': '哪一个?', 'Cancel this request': '取消此请求',
    'Working': '运行中', 'We’re setting this up with you': '我们正在与您一起设置', 'Not connected yet': '尚未连接',
    'Nomix is receiving:': 'Nomix 正在接收:', 'Nomix will receive:': 'Nomix 将接收:', 'Once connected, Nomix will receive:': '连接后,Nomix 将接收:',
    'Add something to receive': '添加要接收的数据', 'Like “tips” or “table numbers”': '例如“小费”或“桌号”',
    'Most recent': '最新数据', 'Change stores': '更改门店', 'Disconnect': '断开连接', 'Remove from list': '从列表移除',
    'No tools yet. Connect the ones you use every day.': '还没有工具。连接您每天使用的工具。',
    'Write a prompt': '写一条提示', 'Add prompt': '添加提示', 'Tags': '标签',
    'No tags yet. Write a prompt or add a tag.': '还没有标签。写一条提示或添加标签。',
    'Added by you': '您添加的', 'Add a field': '添加字段', 'Like “Table number”': '例如“桌号”',
    'When': '时间', 'From': '来源', 'Value': '数值',
    'Set up again': '重新设置', 'Start over? This clears your tools, choices and history.': '重新开始?这会清除您的工具、选择和历史。',
    'Start over': '重新开始', 'Keep everything': '保留全部', 'Prompt added': '已添加提示',
    'Setup finished': '设置完成', '· Requested': '· 已申请', 'Requested': '已申请', 'Latest': '最新',
    'Choose the stores': '选择门店',
    // Tool kinds and groups
    'Point of sale': '收银系统 (POS)', 'Where you ring up orders': '下单收银的地方', 'Other': '其他', 'Another point of sale': '其他收银系统',
    'Delivery and online orders': '外卖与线上订单', 'Apps and sites that send you orders': '给您发送订单的平台和网站',
    'Anything we missed': '我们遗漏的任何工具', 'Staff and back office': '员工与后台', 'Schedules, hours and invoices': '排班、工时与发票',
    'In the restaurant': '店内设备', 'Sensors, cameras and kitchen gear': '传感器、摄像头与厨房设备', 'Add a device': '添加设备',
    'Delivery orders': '外卖订单', 'Online ordering': '线上点餐', 'All delivery orders in one place': '所有外卖订单集中管理',
    'Group deals and vouchers': '团购与代金券', 'Staff schedules': '员工排班', 'Accounting and inventory': '财务与库存',
    'Lines and the pickup shelf': '排队与取餐架', 'Fridge and freezer temperatures': '冷藏与冷冻温度',
    'Kitchen screens, fryers and ovens': '厨房屏幕、炸炉与烤箱', 'Cooking and serving robots': '炒菜与送餐机器人',
    'Device in the restaurant': '店内设备', 'Something else': '其他',
    'Sensors': '传感器', 'Cameras': '摄像头', 'Kitchen equipment': '厨房设备', 'Robots': '机器人',
    // What tools send
    'Orders': '订单', 'Order items': '订单明细', 'Payments': '支付', 'Refunds': '退款', 'Voids and discounts': '作废与折扣',
    'Kitchen tickets': '厨房小票', 'Clock-ins': '打卡', 'Cash drawers': '钱箱', 'Gift cards': '储值卡',
    'Payouts and fees': '结算与费用', 'Missing-item charges': '漏餐扣款', 'Downtime': '下线时长', 'Ratings': '评分',
    'Pickup times': '取餐时间', 'Which app each order came from': '每笔订单来自哪个平台', 'Vouchers sold': '已售代金券',
    'Vouchers used': '已核销代金券', 'Reviews': '评价', 'Schedules': '排班', 'Clock-ins and clock-outs': '上下班打卡',
    'Breaks': '休息', 'Team members': '团队成员', 'Invoices': '发票', 'Inventory counts': '库存盘点', 'Recipes': '配方',
    'Waste': '报损', 'Payroll': '工资', 'Line length': '排队长度', 'Wait at pickup': '取餐等待 (分钟)', 'Foot traffic': '客流',
    'Temperature readings': '温度读数', 'Readings outside the safe range': '超出安全范围的读数', 'Equipment status': '设备状态',
    'Cook cycles': '烹饪次数', 'Cleaning': '清洁', 'Dishes made': '出菜数量', 'When a robot needs a hand': '机器人需要协助时',
    // Tags, descriptions and fields
    'Every order from every store and app, in one list.': '所有门店、所有平台的订单,汇总在一张表里。',
    'Order number': '订单号', 'Time placed': '下单时间', 'Store': '门店', 'Channel': '渠道', 'Total': '总额', 'Server': '服务员',
    'Text': '文本', 'Time': '时间', 'Money': '金额', 'Number': '数字', 'Date': '日期', 'Yes or no': '是/否',
    'Each dish on each order, with its options.': '每笔订单里的每道菜及其选项。',
    'Item name': '菜品名称', 'Quantity': '数量', 'Price': '价格', 'Options': '选项',
    'Daily sales': '每日销售', 'What each store sold each day, before and after discounts.': '每家门店每天的销售额,折扣前后都有。',
    'Business day': '营业日', 'Gross sales': '总销售额', 'Discounts': '折扣', 'Net sales': '净销售额', 'Tax': '税',
    'Menu items': '菜单菜品', 'Each dish and drink you sell, with its price and options.': '您售卖的每道菜和饮品,含价格和选项。',
    'Menu section': '菜单分类', 'Options and add-ons': '选项与加料', 'Available': '是否可售',
    'Discounts and promos': '折扣与促销', 'Every discount and promotion used, and who applied it.': '使用过的每个折扣和促销,以及操作人。',
    'Promo name': '促销名称', 'Amount': '金额', 'Applied by': '操作人',
    'Voids and comps': '作废与赠送', 'Items taken off orders or given away, and why.': '从订单中撤下或赠送的菜品,以及原因。',
    'Reason': '原因', 'Approved by': '批准人',
    'How each order was paid, including tips.': '每笔订单的支付方式,含小费。',
    'Tip': '小费', 'Paid with': '支付方式', 'Card brand': '卡组织', 'Time paid': '支付时间',
    'Money given back, and why.': '退回的金额及原因。', 'Amount refunded': '退款金额',
    'Tips': '小费', 'Card and cash tips for each team member.': '每位员工的刷卡和现金小费。',
    'Team member': '员工', 'Card tips': '刷卡小费', 'Cash tips': '现金小费',
    'What each drawer should hold and what was counted.': '每个钱箱应有金额与实点金额。',
    'Drawer': '钱箱', 'Opening cash': '开班现金', 'Expected cash': '应有现金', 'Counted cash': '实点现金', 'Over or short': '长短款',
    'Gift cards sold, loaded and used.': '储值卡的售出、充值与使用。', 'Card': '卡', 'Activity': '动作', 'Balance': '余额',
    'Guests and loyalty': '顾客与会员', 'Who comes back, how often, and what they spend.': '哪些顾客会回头、多久来一次、花多少钱。',
    'Guest ID': '顾客编号', 'First visit': '首次到店', 'Visits': '到店次数', 'Total spent': '累计消费', 'Loyalty points': '会员积分',
    'App payouts and fees': '平台结算与费用', 'What each delivery app paid you, after commission and fees.': '各外卖平台扣除佣金和费用后实际结算给您的金额。',
    'App': '平台', 'Payout date': '结算日期', 'Sales': '销售额', 'Commission': '佣金', 'Fees': '费用', 'Marketing spend': '营销支出', 'Net payout': '实际结算',
    'Missing and wrong items': '漏餐与错餐', 'Charges from delivery apps for missing or wrong items.': '外卖平台因漏餐或错餐扣的钱。', 'Error charge': '扣款',
    'App downtime': '平台下线', 'When a store was paused or offline on a delivery app.': '门店在外卖平台上暂停或下线的时间。',
    'Paused from': '暂停开始', 'Paused until': '暂停结束', 'Minutes offline': '下线分钟数',
    'Ratings and reviews': '评分与评价', 'What guests said about each order and dish.': '顾客对每笔订单和每道菜的评价。', 'Rating': '评分', 'Comment': '评论',
    'Staff hours': '员工工时', 'Who worked, when they clocked in and out, and their breaks.': '谁上了班、几点上下班打卡、休息了多久。',
    'Role': '岗位', 'Clock in': '上班打卡', 'Clock out': '下班打卡',
    'Who was scheduled to work, and when.': '谁被排了班,什么时间。', 'Shift start': '班次开始', 'Shift end': '班次结束',
    'Labor cost': '人工成本', 'Hours and wages for each store each day.': '每家门店每天的工时和工资。',
    'Hours worked': '工作时长', 'Overtime hours': '加班时长', 'Wages': '工资',
    'Everyone on the team, their role and pay rate.': '团队里的每个人、岗位和时薪。', 'Name': '姓名', 'Pay rate': '时薪', 'Start date': '入职日期',
    'How long each ticket took from kitchen to ready.': '每张小票从下厨到出餐用了多久。',
    'Ticket number': '小票号', 'Sent to kitchen': '下厨时间', 'Ready at': '出餐时间', 'Minutes to make': '制作分钟数', 'Station': '档口',
    'Lines and pickup wait': '排队与取餐等待', 'How long the line is and how long orders sit at pickup.': '排队有多长,订单在取餐处放了多久。',
    'People in line': '排队人数', 'Orders on the shelf': '取餐架订单数',
    'How many people came in each hour.': '每小时进店人数。', 'Hour': '小时', 'People who came in': '进店人数',
    'Temperature checks': '温度检查', 'Fridge and freezer readings through the day.': '冷藏和冷冻设备全天的温度读数。',
    'Fridge or freezer': '冷藏/冷冻设备', 'Temperature': '温度', 'Time checked': '检查时间', 'Safe range': '安全范围', 'Inside the safe range': '是否在安全范围内',
    'Whether fryers, ovens and other gear are working and clean.': '炸炉、烤箱等设备是否正常、是否已清洁。',
    'Equipment': '设备', 'Status': '状态', 'Last cleaned': '上次清洁',
    'Robot activity': '机器人运行', 'What each robot made and when it needed help.': '每台机器人做了什么、什么时候需要协助。',
    'Robot': '机器人', 'Needed a hand': '需协助次数',
    'What you have on hand at each store.': '每家门店的现有库存。', 'Item': '物料', 'Amount on hand': '现有数量', 'Unit': '单位', 'Counted on': '盘点日期',
    'Purchases and invoices': '采购与发票', 'What you bought, from whom, and at what price.': '买了什么、从谁那里买、什么价格。',
    'Supplier': '供应商', 'Invoice number': '发票号', 'Unit cost': '单价',
    'Recipes and food cost': '配方与食材成本', 'What goes into each dish and what a plate costs.': '每道菜用了什么、每份成本多少。',
    'Menu item': '菜品', 'Ingredient': '食材', 'Amount per plate': '每份用量', 'Ingredient cost': '食材成本', 'Plate cost': '每份成本',
    'What was thrown away, and why.': '扔掉了什么,以及原因。',
    'Inventory counts': '库存盘点',
    // Tag groups and example prompts
    'Sales and orders': '销售与订单', 'Money': '资金', 'Delivery apps': '外卖平台', 'Team': '团队', 'Kitchen and floor': '厨房与前厅', 'Stock and suppliers': '库存与供应商',
    'How did each store do yesterday?': '昨天各门店经营得怎么样?',
    'Which dishes make us the most money?': '哪些菜最赚钱?',
    'Are we overstaffed in slow hours?': '淡时段是不是排了太多人?',
    'What are delivery apps really costing us?': '外卖平台到底花了我们多少钱?',
    'How long do guests wait for their food?': '顾客等餐要多久?',
    'Who gives the most refunds and voids?': '谁的退款和作废最多?',
    'Is the walk-in staying cold?': '冷库温度一直达标吗?',
    'What should we reorder this week?': '这周该补哪些货?',
    // Sample data
    'Dan Dan Noodles': '担担面', 'Noodles': '面类', 'Mapo Tofu': '麻婆豆腐', 'Mains': '主菜', 'Pork Dumplings': '猪肉饺子', 'Dumplings': '饺子',
    'Scallion Pancake': '葱油饼', 'Small plates': '小吃', 'Kung Pao Chicken': '宫保鸡丁', 'Beef Chow Fun': '干炒牛河', 'Xiao Long Bao': '小笼包',
    'Jasmine Milk Tea': '茉莉奶茶', 'Drinks': '饮品', 'Salt and Pepper Wings': '椒盐鸡翅', 'Garlic Bok Choy': '蒜蓉青菜', 'Vegetables': '蔬菜',
    'Hot and Sour Soup': '酸辣汤', 'Soups': '汤', 'Fried Rice': '炒饭', 'Rice': '饭类',
    'Extra spicy': '加辣', 'No scallions': '不要葱', 'Add egg': '加蛋', 'Less sugar': '少糖', 'None': '无',
    'Wrong item': '送错菜', 'Long wait': '等太久', 'Item sold out': '已售罄', 'Guest changed their mind': '顾客改主意',
    'Line cook': '厨师', 'Pickup counter': '取餐台', 'Wok station': '炒锅档', 'Dish': '洗碗', 'Prep': '备菜', 'Front of house': '前厅',
    'Wok': '炒锅', 'Fryer': '炸炉', 'Dumpling': '饺子', 'Noodle': '面',
    'Walk-in fridge': '冷库', 'Prep fridge': '备菜冰箱', 'Freezer': '冷冻柜',
    'Bok choy': '青菜', 'Pork shoulder': '猪肩肉', 'Jasmine rice': '香米', 'Takeout boxes': '外卖盒', 'Soy sauce': '酱油',
    'cases': '箱', 'lb': '磅', 'bags': '袋', 'gallons': '加仑',
    'Lunch set for one': '单人午市套餐', 'Dinner for two': '双人晚餐', 'Dumpling combo': '饺子套餐', 'Family set for four': '四人家庭套餐',
    'Happy hour': '欢乐时光', 'Lunch combo': '午市套餐', '10% off pickup': '自取九折', 'Staff meal': '员工餐', 'Loyalty reward': '会员奖励',
    'Hot and fresh, great noodles': '热乎新鲜,面很好吃', 'Good, a little late': '不错,稍微晚了点', 'Dumplings were perfect': '饺子很完美',
    'Missing the soup': '少了汤', 'Food was cold': '饭菜凉了', 'Fast and friendly': '又快又热情',
    'Wheat noodles': '小麦面', 'Silken tofu': '嫩豆腐', 'Chicken thigh': '鸡腿肉', 'Ground pork': '猪肉末', 'Flank steak': '牛腩',
    'Expired': '过期', 'Dropped': '掉落', 'Overcooked': '做过头', 'Made too much': '做多了',
    'Sent wrong': '上错菜', 'Guest complaint': '顾客投诉', 'Rang in twice': '重复下单',
    'Item was missing': '漏餐', 'Order arrived late': '送达太晚',
    'Dine-in': '堂食', 'Pickup': '自取', 'Delivery': '外卖', 'Voucher': '代金券', 'Cash': '现金', 'Gift card': '储值卡',
    'Still on shift': '仍在班上', 'None yet': '暂无', 'Yes': '是', 'No': '否', 'Used': '已使用', 'Sold': '已售出',
    'Front 1': '前台 1', 'Front 2': '前台 2', 'Bar': '吧台', 'Balanced': '无差额', 'Drawer closed': '钱箱已结', 'Update received': '收到更新',
    'Voucher used': '代金券已核销', 'Shift scheduled': '已排班', 'Inventory count saved': '已保存盘点', 'Recipe cost updated': '配方成本已更新',
    'Waste logged': '已记录报损', 'Line and pickup shelf': '排队与取餐架', 'Charge for a missing item': '漏餐扣款', 'Store was paused': '门店暂停营业',
    'Payout sent': '已结算', 'Gift card sold': '储值卡已售出', 'Gift card used': '储值卡已使用',
    'Snowflake': 'Snowflake', 'just now': '刚刚', 'Updated just now': '刚刚更新',
    'Stores': '门店', 'Working ·': '运行中 ·', 'Add a tool': '添加工具', 'your account': '您的账户', 'Past version': '过往版本', 'Your stores': '您的门店', 'How each store flows into Nomix': '每家门店的数据如何流入 Nomix'
  }));

  // Lists: "A and B" → "A和B", "A, B and C" → "A、B和C".
  function items(s) {
    if (EXACT.has(s)) return [s];
    const seps = [...s.matchAll(/, | and /g)];
    if (!seps.length) return [s];
    for (const m of seps) { const left = s.slice(0, m.index); if (EXACT.has(left)) return [left, ...items(s.slice(m.index + m[0].length))]; }
    const m = seps[0];
    return [s.slice(0, m.index), ...items(s.slice(m.index + m[0].length))];
  }
  function J(s) {
    const parts = items(s).map(x => core(x));
    return parts.length < 2 ? parts[0] : parts.slice(0, -1).join('、') + '和' + parts[parts.length - 1];
  }
  const T = s => core(s);
  const n = (k, one, many) => (k === '1' ? one : many);
  const WEEK = { Mon: '周一', Tue: '周二', Wed: '周三', Thu: '周四', Fri: '周五', Sat: '周六', Sun: '周日' };
  const MONTH = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
  const TIME = '(\\d{1,2}:\\d{2}(?::\\d{2})? ?[AP]M)';
  const P = [
    // Time
    [/^(\d+) min ago$/, (m, a) => `${a} 分钟前`],
    [/^(\d+) hr ago$/, (m, a) => `${a} 小时前`],
    [/^Updated (.+)$/, (m, a) => (a === 'just now' ? '刚刚更新' : `${T(a)}更新`)],
    [new RegExp('^today at ' + TIME + '$'), (m, a) => `今天 ${a}`],
    [new RegExp('^Today ' + TIME + '$'), (m, a) => `今天 ${a}`],
    [new RegExp('^([A-Z][a-z]{2}) (\\d{1,2}),? (?:at )?' + TIME + '$'), (m, mo, d, t) => `${MONTH[mo]}月${d}日 ${t}`],
    [/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), ([A-Z][a-z]{2}) (\d{1,2})$/, (m, w, mo, d) => `${MONTH[mo]}月${d}日 ${WEEK[w]}`],
    [/^([A-Z][a-z]{2}) (\d{1,2})$/, (m, mo, d) => (MONTH[mo] ? `${MONTH[mo]}月${d}日` : m)],
    [/^(\d+) min$/, (m, a) => `${a} 分钟`],
    // Steps, counts and buttons
    [/^Step (\d+) of (\d+)$/, (m, a, b) => `第 ${a} 步,共 ${b} 步`],
    [/^Tool (\d+) of (\d+)$/, (m, a, b) => `第 ${a} 个工具,共 ${b} 个`],
    [/^Continue with (\d+) tools?$/, (m, a) => `继续(已选 ${a} 个工具)`],
    [/^(\d+) chosen$/, (m, a) => `已选 ${a} 个`],
    [/^(\d+) tools$/, (m, a) => `${a} 个工具`],
    [/^(\d+) fields? · (.+)$/, (m, a, b) => `${a} 个字段 · ${T(b)}`],
    [/^Connect (\d+) tools?$/, (m, a) => `连接 ${a} 个工具`],
    [/^Connect (\d+) stores?$/, (m, a) => `连接 ${a} 家门店`],
    [/^Save (\d+) stores?$/, (m, a) => `保存 ${a} 家门店`],
    [/^All (\d+) stores$/, (m, a) => `全部 ${a} 家门店`],
    [/^History · (\d+) versions?$/, (m, a) => `历史 · ${a} 个版本`],
    [/^(\d+) tools? working(?: at ([^·]+))?$/, (m, a, s) => (s ? `${s} 有 ${a} 个工具在运行` : `${a} 个工具在运行`)],
    [/^(\d+) waiting for you$/, (m, a) => `${a} 个待您连接`],
    [/^(\d+) being set up with you$/, (m, a) => `${a} 个正在与您一起设置`],
    // Connecting
    [/^Continue to (.+)$/, (m, a) => `前往 ${T(a)}`],
    [/^Signing in to (.+)$/, (m, a) => `正在登录 ${T(a)}`],
    [/^Waiting for (.+)$/, (m, a) => `等待 ${T(a)}`],
    [/^Choose stores for (.+)$/, (m, a) => `为 ${T(a)} 选择门店`],
    [/^We found (\d+) (.+) stores on (.+)\.$/, (m, k, b, a) => `在 ${T(a)} 上找到 ${k} 家 ${b} 门店。`],
    [/^Nomix keeps (.+) data from the stores you choose\.$/, (m, a) => `Nomix 会保存您所选门店的 ${a} 数据。`],
    [/^When (.+) (?:is|are) connected$/, (m, a) => `${J(a)} 连接后提供`],
    [/^Connected (.+?) · (.+)$/, (m, a, s) => `已连接 ${T(a)} · ${J(s)}`],
    [/^(.+) (?:is|are) connected$/, (m, a) => `${T(a)} 已连接`],
    [/^Next: (.+)$/, (m, a) => `下一步:${T(a)}`],
    [/^Someone from Nomix will connect (.+) with you\.$/, (m, a) => `Nomix 的同事会与您一起连接 ${T(a)}。`],
    [/^Someone from Nomix will reach out to finish connecting (.+)\.$/, (m, a) => `Nomix 的同事会联系您,一起完成 ${T(a)} 的连接。`],
    [/^Nothing called “(.+)” yet\.$/, (m, a) => `还没有叫“${a}”的工具。`],
    [/^Connected (.+)$/, (m, a) => `连接于 ${T(a)}`],
    [/^Requested (.+)$/, (m, a) => `申请于 ${T(a)}`],
    // Where data comes from
    [/^From (.+)$/, (m, a) => `来自 ${J(a)}`],
    [/^Nothing sends this for (.+) yet$/, (m, a) => `${a} 还没有工具提供这项数据`],
    [/^(.+) more$/, (m, a) => `另外 ${a} 个`],
    // Ready
    [/^(.+) (?:is|are) flowing into Nomix from (\d+) stores?\.(?: (\d+) more joins? once (?:it’s|they’re) connected\.)?$/,
      (m, a, s, p) => `${/^\d+ tools$/.test(a) ? a.replace(' tools', ' 个工具') : T(a)}正从 ${s} 家门店流入 Nomix。${p ? `另有 ${p} 个连接后加入。` : ''}`],
    [/^Nomix is set up\. (\d+) more joins? once (?:it’s|they’re) connected\.$/, (m, p) => `Nomix 已设置好。另有 ${p} 个连接后加入。`],
    // Home
    [/^Most recent at (.+)$/, (m, a) => `${a} 的最新数据`],
    [/^What should Nomix receive from (.+)\?$/, (m, a) => `Nomix 应从 ${T(a)} 接收什么?`],
    [/^What else should Nomix receive from (.+)\?$/, (m, a) => `Nomix 还应从 ${T(a)} 接收什么?`],
    [/^Disconnect (.+)\? Nomix stops receiving from it(?: at (.+))?\. What it already sent stays, and History can bring this setup back\.$/,
      (m, a, s) => `断开 ${T(a)}?Nomix 将停止接收${s ? ` ${J(s)} 的` : ''}数据。已收到的数据会保留,也可以在历史中恢复这个设置。`],
    [/^Viewing (.+)$/, (m, a) => `正在查看 ${T(a)}`],
    [/^(.+)\. Connections, dictionary and data as they were then\.$/, (m, a) => `${T(a)}。当时的连接、数据字典和数据。`],
    [/^Go back to this setup\? Connections and the data dictionary return to how they were (.+)\. Data Nomix kept since then stays\.$/,
      (m, a) => `恢复到这个设置?连接和数据字典将回到${T(a)}的状态。之后 Nomix 保存的数据会保留。`],
    [/^(.+) · Latest$/, (m, a) => `${T(a)} · 最新`],
    [/^Also sending a copy to your (.+) account$/, (m, a) => `同时复制一份到您的 ${a} 账户`],
    [/^your (.+) account$/, (m, a) => `您的 ${a} 账户`],
    [/^Nomix keeps running your data home and also sends a copy to$/, () => 'Nomix 会继续管理您的数据,并同时复制一份到'],
    [/^\. We’ll set it up with you\.$/, () => '。我们会与您一起设置。'],
    [/^Stop keeping (.+)$/, (m, a) => `停止保存 ${T(a)}`],
    [/^Remove the (.+) tag$/, (m, a) => `删除标签 ${T(a)}`],
    [/^Add a field to (.+)$/, (m, a) => `为 ${T(a)} 添加字段`],
    // History labels and toasts
    [/^Disconnected (.+)$/, (m, a) => `已断开 ${T(a)}`],
    [/^Asked for help with (.+)$/, (m, a) => `已申请协助连接 ${T(a)}`],
    [/^(.+) now covers (.+)$/, (m, a, b) => (/^\d+ stores?$/.test(b) ? `${T(a)} 现在覆盖 ${b.split(' ')[0]} 家门店` : `${T(a)} 现在覆盖 ${J(b)}`)],
    [/^Added prompt “(.+)”$/, (m, a) => `添加了提示“${T(a)}”`],
    [/^Removed prompt “(.+)”$/, (m, a) => `删除了提示“${T(a)}”`],
    [/^Added tag (.+)$/, (m, a) => `添加了标签 ${T(a)}`],
    [/^Removed tag (.+)$/, (m, a) => `删除了标签 ${T(a)}`],
    [/^Added (.+) to (.+)$/, (m, a, b) => `为 ${T(b)} 添加了 ${a}`],
    [/^Removed (.+) from the list$/, (m, a) => `从列表移除了 ${T(a)}`],
    [/^Removed (.+) from (.+)$/, (m, a, b) => `从 ${T(b)} 删除了 ${a}`],
    [/^Asked (.+) for (.+)$/, (m, a, b) => `向 ${T(a)} 申请了 ${b}`],
    [/^Asked for (.+) from (.+)$/, (m, a, b) => `已向 ${T(b)} 申请 ${a}`],
    [/^Asked to send a copy to (.+)$/, (m, a) => `申请复制到 ${a}`],
    [/^Stopped the copy to (.+)$/, (m, a) => `停止复制到 ${a}`],
    [/^Went back to (.+)$/, (m, a) => `恢复到 ${T(a)}`],
    [/^Back to the setup from (.+)$/, (m, a) => `已恢复到 ${T(a)} 的设置`],
    [/^Help requested for (.+)$/, (m, a) => `已为 ${a} 请求协助`],
    [/^(.+) disconnected$/, (m, a) => `${T(a)} 已断开`],
    [/^(.+) is already on your list$/, (m, a) => `${T(a)} 已在您的列表中`],
    [/^(.+) added to (.+)$/, (m, a, b) => `已为 ${T(b)} 添加 ${a}`],
    [/^(.+) added$/, (m, a) => `已添加 ${T(a)}`],
    // What the tools just sent
    [/^Order #(\d+)$/, (m, a) => `订单 #${a}`],
    [/^Delivery order #(\d+)$/, (m, a) => `外卖订单 #${a}`],
    [/^Pickup order #(\d+)$/, (m, a) => `自取订单 #${a}`],
    [/^Payment for #(\d+)$/, (m, a) => `订单 #${a} 付款`],
    [/^Refund on #(\d+)$/, (m, a) => `订单 #${a} 退款`],
    [/^Ticket #(\d+) ready$/, (m, a) => `小票 #${a} 已出餐`],
    [/^Order from (.+)$/, (m, a) => `来自 ${a} 的订单`],
    [/^(.+) voided$/, (m, a) => `${T(a)} 已作废`],
    [/^(.+) sold out$/, (m, a) => `${T(a)} 已售罄`],
    [/^(.+) clocked (in|out)$/, (m, a, b) => `${a} ${b === 'in' ? '上班打卡' : '下班打卡'}`],
    [/^(\d)-star (rating|review)$/, (m, a, b) => `${a} 星${b === 'rating' ? '评分' : '评价'}`],
    [/^(\d+) items?$/, (m, a) => `${a} 件`],
    [/^(.+) \+(\d+)$/, (m, a, b) => `${J(a)} 等 ${+b + 2} 道`],
    [/^(\$[\d,.]+) \+ (\$[\d,.]+) tip$/, (m, a, b) => `${a} + 小费 ${b}`],
    [/^ready at (.+)$/, (m, a) => `${a} 可取`],
    [/^(.+) station$/, (m, a) => `${T(a)}档`],
    [/^(Over|Short) (\$[\d,.]+)$/, (m, a, b) => `${a === 'Over' ? '长款' : '短款'} ${b}`],
    [/^(\d+) min offline$/, (m, a) => `下线 ${a} 分钟`],
    [/^(\d+) in line$/, (m, a) => `排队 ${a} 人`],
    [/^longest wait (\d+) min$/, (m, a) => `最长等待 ${a} 分钟`],
    [/^(\d+) people this hour$/, (m, a) => `本小时 ${a} 人进店`],
    [/^Invoice from (.+)$/, (m, a) => `来自 ${a} 的发票`],
    [/^(\$[\d,.]+) a plate$/, (m, a) => `每份 ${a}`],
    [/^(-?\d+)°F$/, m => m],
    [/^(-?\d+)°F · in the safe range$/, (m, a) => `${a}°F · 在安全范围内`],
    [/^in the safe range$/, () => '在安全范围内'],
    [/^(Delivery|Pickup|Voucher) · (.+)$/, (m, a, b) => `${T(a)} · ${b}`],
    [/^(\d+) (cases|lb|bags|gallons)(?: on hand)?$/, (m, a, b) => `${a} ${T(b)}`],
    [/^•••• (\d+)$/, m => m],
    [/^Connect (.+)$/, (m, a) => `连接 ${T(a)}`],
    [/^Add (.+)$/, (m, a) => `添加 ${T(a.replace(/^“|”$/g, ''))}`],
    [/^Remove (.+)$/, (m, a) => `删除 ${T(a)}`],
    [/^Disconnect (.+)$/, (m, a) => `断开 ${T(a)}`],
    [/^Close (.+)$/, (m, a) => `关闭 ${T(a)}`],
    [/^(\d+) (orders?|people|person) waiting$/, (m, a) => `${a} ${/order/.test(m) ? '单' : '人'}等待中`]
  ];

  let depth = 0;
  function core(t) {
    if (EXACT.has(t)) return EXACT.get(t);
    if (depth > 8) return t;   // a phrase nested this deep is left as it is
    depth++;
    try {
      for (const [re, f] of P) { const m = t.match(re); if (m) return f(...m); }
      if (t.includes(' · ')) {
        const parts = t.split(' · '), out = parts.map(core);
        if (out.some((x, i) => x !== parts[i])) return out.join(' · ');
      }
      const end = t.match(/^(.+?)([:.?])$/);
      if (end && EXACT.has(end[1])) return EXACT.get(end[1]) + ({ ':': ':', '.': '。', '?': '?' })[end[2]];
      if (/, | and /.test(t) && !/[.?!:]/.test(t)) return J(t);
      return t;
    } finally { depth--; }
  }
  function tr(s) {
    if (!s || !/[A-Za-z]/.test(s)) return s;
    const t = s.trim();
    if (!t) return s;
    const out = core(t);
    return out === t ? s : s.replace(t, out);
  }
  N.L = tr;
  N.tr = tr;

  // Translate text and labels as the app draws them.
  const SKIP = 'code, script, style, textarea, [data-notr]';
  const ATTRS = ['placeholder', 'aria-label', 'title'];
  function fixText(node) {
    const p = node.parentElement;
    if (!p || p.closest(SKIP)) return;
    const v = node.nodeValue, out = tr(v);
    if (out !== v) node.nodeValue = out;
  }
  function fixEl(el) {
    if (el.closest(SKIP) && el.tagName !== 'TEXTAREA') return;
    ATTRS.forEach(a => { const v = el.getAttribute(a); if (v) { const out = tr(v); if (out !== v) el.setAttribute(a, out); } });
  }
  function walk(root) {
    if (root.nodeType === 3) return fixText(root);
    if (root.nodeType !== 1) return;
    fixEl(root);
    root.querySelectorAll('*').forEach(fixEl);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = w.nextNode())) fixText(node);
  }
  new MutationObserver(list => list.forEach(m => {
    if (m.type === 'characterData') fixText(m.target);
    else m.addedNodes.forEach(walk);
  })).observe(document.body, { childList: true, subtree: true, characterData: true });
  walk(document.body);
})();
