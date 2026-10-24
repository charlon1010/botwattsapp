const http = require('http');
const port = process.env.PORT || 3000;
http.createServer((req, res) => res.end('Bot is running!')).listen(port);
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
 
const dbPath = path.join(__dirname, 'data.json');
const OWNER_PHONE = '213669901048';
 
// خرائط لتتبع معرّفات الرسائل وصاحب كل أمر والفعاليات الجماعية
const mainShopMessages = new Map();
const buyShopMessages = new Map();
const upgradeShopMessages = new Map();
const addonShopMessages = new Map();
const customShopMessages = new Map();
const titleShopMessages = new Map();
const marketPageMessages = new Map();
 
const activeImageGames = new Map();
const imageGameCooldowns = new Map();
 
const activeWritingGames = new Map();
const writingGameCooldowns = new Map();
 
const activeFlagGames = new Map();
const flagGameCooldowns = new Map();
 
const activeUnscrambleGames = new Map();
const unscrambleGameCooldowns = new Map();
 
const activeAssembleGames = new Map();
const assembleGameCooldowns = new Map();
 
const cutCooldowns = new Map();
 
// ذاكرة تخزين مؤقتة للصور وللبيانات لتسريع البوت بشكل خارق
const imageCache = new Map();
let cachedUsers = null;
 
function getCachedImage(filename) {
    if (imageCache.has(filename)) {
        return imageCache.get(filename);
    }
    const imgPath = path.join(__dirname, filename);
    if (fs.existsSync(imgPath)) {
        const buffer = fs.readFileSync(imgPath);
        imageCache.set(filename, buffer);
        return buffer;
    }
    return null;
}
 
// قائمة شخصيات الأنمي للعبة .تفكيك و .صور
const animeCharacters = [
    { en: 'nami', ar: 'نامي', type: 'عادية 🟢', value: 300 },
    { en: 'luffy', ar: 'لوفي', type: 'عادية 🟢', value: 300 },
    { en: 'zoro', ar: 'زورو', type: 'عادية 🟢', value: 300 },
    { en: 'brok', ar: 'بروك', type: 'عادية 🟢', value: 300 },
    { en: 'goku', ar: 'غوكو', type: 'عادية 🟢', value: 300 },
    { en: 'saitama', ar: 'سايتاما', type: 'عادية 🟢', value: 300 },
    { en: 'gin', ar: 'جين', type: 'عادية 🟢', value: 300 },
    { en: 'l', ar: 'ال', type: 'عادية 🟢', value: 300 },
    { en: 'yona', ar: 'يونا', type: 'عادية 🟢', value: 300 },
    { en: 'light', ar: 'لايت', type: 'عادية 🟢', value: 300 },
    { en: 'eren', ar: 'ايرين', type: 'عادية 🟢', value: 300 },
    { en: 'levi', ar: 'ليفاي', type: 'عادية 🟢', value: 300 },
    { en: 'maki', ar: 'ماكي', type: 'عادية 🟢', value: 300 },
    { en: 'asta', ar: 'استا', type: 'عادية 🟢', value: 300 },
    { en: 'yuno', ar: 'يونو', type: 'عادية 🟢', value: 300 },
    { en: 'yuji', ar: 'يوجي', type: 'عادية 🟢', value: 300 },
    { en: 'jerin', ar: 'جيرين', type: 'عادية 🟢', value: 300 },
    { en: 'fifi', ar: 'فيفي', type: 'عادية 🟢', value: 300 },
    { en: 'gara', ar: 'غارا', type: 'عادية 🟢', value: 300 },
    { en: 'li', ar: 'لي', type: 'عادية 🟢', value: 300 },
 
    { en: 'nagi', ar: 'ناغي', type: 'متوسطة 🟠', value: 900 },
    { en: 'reo', ar: 'ريو', type: 'متوسطة 🟠', value: 900 },
    { en: 'subaru', ar: 'سوبارو', type: 'متوسطة 🟠', value: 900 },
    { en: 'stark', ar: 'ستارك', type: 'متوسطة 🟠', value: 900 },
    { en: 'gon', ar: 'غون', type: 'متوسطة 🟠', value: 900 },
    { en: 'kilwa', ar: 'كيلوا', type: 'متوسطة 🟠', value: 900 },
    { en: 'sae', ar: 'ساي', type: 'متوسطة 🟠', value: 900 },
    { en: 'rin', ar: 'رين', type: 'متوسطة 🟠', value: 900 },
    { en: 'sung', ar: 'سونغ', type: 'متوسطة 🟠', value: 900 },
    { en: 'bi', ar: 'بي', type: 'متوسطة 🟠', value: 900 },
 
    { en: 'boni', ar: 'بوني', type: 'اسطورية 🔴', value: 2000 },
    { en: 'buruto', ar: 'بوروتو', type: 'اسطورية 🔴', value: 2000 },
    { en: 'garp', ar: 'غارب', type: 'اسطورية 🔴', value: 2000 },
    { en: 'sharlock', ar: 'شارلوك', type: 'اسطورية 🔴', value: 2000 },
    { en: 'crocodile', ar: 'تمساح', type: 'اسطورية 🔴', value: 2000 },
    { en: 'shadow', ar: 'شادو', type: 'اسطورية 🔴', value: 2000 },
    { en: 'kura', ar: 'كورابيكا', type: 'اسطورية 🔴', value: 2000 },
 
    { en: 'isagi', ar: 'ايساغي', type: 'ايبيك 🟣', value: 5000 },
    { en: 'flock', ar: 'فلوك', type: 'ايبيك 🟣', value: 5000 },
    { en: 'senku', ar: 'سينكو', type: 'ايبيك 🟣', value: 5000 }
];
 
// قائمة كلمات لعبة التركيب (.تركيب)
const assemblePool = [
    "غوكو", "ايساغي", "يوتا", "نامي", "ماكي", "يونا", "هاكاري", "ميكو", "يوكيميا", 
    "لاكي", "لوكي", "سونا", "سينكو", "بوني", "غارب", "شارلوك", "بوروتو", "هانامي", 
    "تسوغورو", "لايت", "ال", "ماكيما", "سيكوما", "اوروتشيمارو", "لامي", "لوفي", 
    "زورو", "يامي", "موراتا", "هاناغاكي", "ساسكي", "كيو", "كيوراكو", "اوروما", 
    "لاست", "هانجي", "ايرين", "ميكاسا", "ليفاي", "مونوسكي", "سام", "سونيو", 
    "نوبي", "هيكارو", "هياكيمارو", "لوسي", "ناغي", "ريو", "سوبارو", "كيلوا", "رين"
];
 
// قائمة كلمات لعبة الكتابة
const writingPool = [
    "غوكو", "ايساغي", "يوتا", "نامي", "ماكي", "يونا", "هاكاري", "ميكو", "يوكيميا", 
    "لاكي", "لوكي", "سونا", "سينكو", "بوني", "غارب", "شارلوك", "بوروتو", "هانامي", 
    "تسوغورو", "لايت", "ال", "ماكيما", "سيكوما", "غيغينتوماكيا", "اوروتشيمارو", 
    "لامي", "لوفي", "زورو", "يامي", "موراتا", "هاناغاكي", "ساسكي", "كيو", 
    "كيوراكو", "اوروما", "لاست", "هانجي", "ايرين", "ميكاسا", "ليفاي", "مونوسكي", 
    "سام", "سونيو", "نوبي", "هيكارو", "هياكيمارو", "لوسي"
];
 
// قائمة أسئلة أمر .كت
const cutQuestions = [
    "شو اخرا شي سويته ❓",
    "شو اكلتك المفضلة ❓",
    "شو مشروبك المفضل ❓",
    "تخاف من ❓",
    "لو كان الشخص لي تفضله هنا شو رح تقوله ❓",
    "وش هي الدولة لي تبي تسافرها و مع مين ❓",
    "مين افضل قدوة مر عليك ❓",
    "ارسل ستيكر ❓",
    "ما هو افضل ستيكر للتصبيع ❓",
    "متى تتوب ❓",
    "هل انت فاسد ❓",
    "لو خيروك بين القدوة او مليون دولار ❓",
    "شو اكبر همومك ❓",
    "شو قصتك ❓",
    "لو كان القدوة معك بالفريق شو يكون شعورك ❓",
    "كم عمرك ❓",
    "طولك ❓",
    "رياضتك لي تحبها ❓",
    "افضل انمي تشوفه بالنسبة ليك ❓",
    "هل عندك شريكة ❓",
    "هل اصدقائك زانيون ❓",
    "هل سترك الدولي ❓",
    "لو كنت دولي هتستر ❓",
    "شو اخر كتاب قريته ❓",
    "كم شحن جوالك ❓",
    "كم ساعه تنام يوميا ❓",
    "كم ساعه عندك ❓",
    "لو تبي تحذف واحد من ذا القروب مين هتحذف منشن ❓",
    "لو رجع الزمن فيك شو الشي لي رح تغيره ❓",
    "شو اكثر صفه تبي تغيرها بنفسك و ليش ❓",
    "تفقد النظر و لا تفقد الحركة ❓",
    "وش اغرب حلم حلمته بحياتك ❓",
    "شو الاكله الوحيده لي تقدر تاكلها طول حياتك ❓",
    "شو اكثر شي ضحكك ❓",
    "اكثر كلمة تعيدها بيومك ❓",
    "انت تصارح و لا تحب تجامل ❓"
];
 
// قائمة الأعلام وإجاباتها المقبولة
const flagsList = [
    { flag: '🇦🇪', ar: ['الامارات', 'امارات'] },
    { flag: '🇦🇶', ar: ['انتاركتيكا'] },
    { flag: '🇦🇷', ar: ['الارجنتين', 'ارجنتين'] },
    { flag: '🇧🇩', ar: ['بنغلاديش'] },
    { flag: '🇧🇪', ar: ['بلجيكا'] },
    { flag: '🇧🇫', ar: ['بوركينا فاسو'] },
    { flag: '🇧🇭', ar: ['البحرين', 'بحرين'] },
    { flag: '🇧🇴', ar: ['بوليفيا'] },
    { flag: '🇧🇷', ar: ['البرازيل', 'برازيل'] },
    { flag: '🇧🇻', ar: ['جزيرة بوفيه'] },
    { flag: '🇨🇦', ar: ['كندا'] },
    { flag: '🇨🇩', ar: ['الكونغو', 'كونغو'] },
    { flag: '🇨🇭', ar: ['سويسرا'] },
    { flag: '🇨🇱', ar: ['تشيلي'] },
    { flag: '🇨🇲', ar: ['الكاميرون', 'كاميرون'] },
    { flag: '🇨🇳', ar: ['الصين', 'صين'] },
    { flag: '🇨🇴', ar: ['كولومبيا'] },
    { flag: '🇨🇵', ar: ['جزيرة كليبرتون'] },
    { flag: '🇨🇷', ar: ['كوستاريكا'] },
    { flag: '🇨🇺', ar: ['كوبا'] },
    { flag: '🇨🇼', ar: ['كوراساو'] },
    { flag: '🇩🇪', ar: ['المانيا', 'مانيا'] },
    { flag: '🇩🇰', ar: ['الدنمارك', 'دنمارك'] },
    { flag: '🇩🇿', ar: ['الجزائر', 'جزائر'] },
    { flag: '🇪🇦', ar: ['سبتة ومليلية'] },
    { flag: '🇪🇨', ar: ['الاكوادور', 'اكوادور'] },
    { flag: '🇪🇬', ar: ['مصر'] },
    { flag: '🇪🇭', ar: ['الصحراء الغربية', 'صحراء غربية'] },
    { flag: '🇪🇸', ar: ['اسبانيا', 'إسبانيا'] },
    { flag: '🇪🇺', ar: ['الاتحاد الاوروبي', 'اتحاد اوروبي'] },
    { flag: '🇫🇷', ar: ['فرنسا'] },
    { flag: '🇬🇧', ar: ['بريطانيا'] },
    { flag: '🇭🇺', ar: ['المجر', 'مجر'] },
    { flag: '🇮🇪', ar: ['ايرلندا'] },
    { flag: '🇮🇳', ar: ['الهند', 'هند'] },
    { flag: '🇮🇶', ar: ['العراق', 'عراق'] },
    { flag: '🇮🇷', ar: ['ايران', 'إيران'] },
    { flag: '🇮🇸', ar: ['ايسلندا'] },
    { flag: '🇯🇵', ar: ['اليابان', 'يابان'] },
    { flag: '🇯🇴', ar: ['الاردن', 'اردن'] },
    { flag: '🇰🇵', ar: ['كوريا الشمالية'] },
    { flag: '🇰🇷', ar: ['كوريا الجنوبية'] },
    { flag: '🇰🇼', ar: ['الكويت', 'كويت'] },
    { flag: '🇲🇦', ar: ['المغرب', 'مغرب'] },
    { flag: '🇱🇾', ar: ['ليبيا'] },
    { flag: '🇲🇫', ar: ['سان مارتن'] },
    { flag: '🇳🇱', ar: ['هولندا'] },
    { flag: '🇳🇬', ar: ['نيجيريا'] },
    { flag: '🇵🇹', ar: ['البرتغال', 'برتغال'] },
    { flag: '🇵🇸', ar: ['فلسطين'] },
    { flag: '🇵🇰', ar: ['باكستان'] },
    { flag: '🇷🇴', ar: ['رومانيا'] },
    { flag: '🇵🇼', ar: ['بالاو'] },
    { flag: '🇷🇺', ar: ['روسيا'] },
    { flag: '🇸🇦', ar: ['السعودية', 'سعودية'] },
    { flag: '🇸🇩', ar: ['السودان', 'سودان'] },
    { flag: '🇸🇪', ar: ['السويد', 'سويد'] },
    { flag: '🇸🇮', ar: ['سلوفينيا'] },
    { flag: '🇸🇯', ar: ['سفالبارد'] },
    { flag: '🇸🇰', ar: ['سلوفاكيا'] },
    { flag: '🇸🇭', ar: ['سانت هيلانة'] },
    { flag: '🇸🇴', ar: ['الصومال', 'صومال'] },
    { flag: '🇸🇳', ar: ['السنغال', 'سنغال'] },
    { flag: '🇸🇾', ar: ['سوريا'] },
    { flag: '🇹🇳', ar: ['تونس'] },
    { flag: '🇹🇷', ar: ['تركيا'] },
    { flag: '🇺🇲', ar: ['امريكا', 'أمريكا'] },
    { flag: '🇺🇾', ar: ['اوروغواي'] },
    { flag: '🇾🇪', ar: ['اليمن', 'يمن'] },
    { flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', ar: ['ويلز'] },
    { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ar: ['انجلترا', 'إنجلترا'] },
    { flag: '🇿🇲', ar: ['زامبيا'] },
    { flag: '🇿🇦', ar: ['جنوب افريقيا'] },
    { flag: '🇽🇰', ar: ['كوسوفو'] },
    { flag: '🇻🇪', ar: ['فنزويلا'] }
];
 
function loadData() {
    if (cachedUsers) return cachedUsers;
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
    }
    try {
        cachedUsers = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
        cachedUsers = {};
    }
    return cachedUsers;
}
 
function saveData(data) {
    cachedUsers = data;
    setImmediate(() => {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    });
}
 
function getUserData(users, id) {
    if (!users[id]) {
        users[id] = {
            wallet: 0,
            bank: 0,
            bankLimit: 150000,
            level: 1,
            inventory: [],
            customizations: [],
            titles: [],
            activeTheme: 'default',
            activeTitle: '',
            resources: {
                coal: 0, iron: 0, gold: 0, ruby: 0, diamond: 0, apple: 0, banana: 0, watermelon: 0,
                fish: 0, rareFish: 0, crab: 0, octopus: 0, jellyfish: 0,
                rabbit: 0, sheep: 0, cow: 0, bull: 0
            },
            lastSalary: 0,
            lastDaily: 0,
            lastGambling: 0,
            lastTransfer: 0,
            lastInvestment: 0,
            lastTrading: 0,
            lastDice: 0,
            lastSeedBuy: 0,
            lastMysteryBuy: 0,
            lastCar: 0,
            lastBus: 0,
            lastTrain: 0,
            lastShip: 0,
            lastPlane: 0,
            lastRob: 0,
            lastShovel: 0,
            lastRod: 0,
            lastGun: 0,
            isElite: false
        };
    }
    if (!users[id].inventory) users[id].inventory = [];
    if (!users[id].customizations) users[id].customizations = [];
    if (!users[id].titles) users[id].titles = [];
    if (!users[id].activeTheme) users[id].activeTheme = 'default';
    if (!users[id].activeTitle) users[id].activeTitle = '';
    if (!users[id].resources) {
        users[id].resources = {
            coal: 0, iron: 0, gold: 0, ruby: 0, diamond: 0, apple: 0, banana: 0, watermelon: 0,
            fish: 0, rareFish: 0, crab: 0, octopus: 0, jellyfish: 0,
            rabbit: 0, sheep: 0, cow: 0, bull: 0
        };
    }
    return users[id];
}
 
function normalizeArabicText(str) {
    if (!str) return '';
    return str.replace(/[أإآ]/g, 'ا').toLowerCase().trim();
}
 
function formatBankSize(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(num % 1e12 === 0 ? 0 : 1) + 't';
    if (num >= 1e9) return (num / 1e9).toFixed(num % 1e9 === 0 ? 0 : 1) + 'b';
    if (num >= 1e6) return (num / 1e6).toFixed(num % 1e6 === 0 ? 0 : 1) + 'm';
    if (num >= 1e3) return (num / 1e3).toFixed(num % 1e3 === 0 ? 0 : 1) + 'k';
    return num.toString();
}
 
function getCurrentMarketPrices() {
    const cycleMs = (3 * 60 + 20) * 60 * 1000;
    const currentCycle = Math.floor(Date.now() / cycleMs);
    const isHighState = (currentCycle % 2 === 1);
 
    return {
        coal: isHighState ? 500 : 100,
        iron: isHighState ? 1200 : 700,
        gold: isHighState ? 3000 : 1000,
        ruby: isHighState ? 9000 : 3000,
        diamond: isHighState ? 40000 : 25000,
        apple: 250,
        banana: 150,
        watermelon: 350,
        fish: Math.floor(Math.random() * (100 - 70 + 1)) + 70,
        rareFish: Math.floor(Math.random() * (130 - 90 + 1)) + 90,
        crab: Math.floor(Math.random() * (450 - 300 + 1)) + 300,
        octopus: 28000,
        rabbit: 800,
        sheep: 20000,
        cow: 31000,
        bull: 45000
    };
}
 
function formatInventory(userData) {
    const inventoryArray = userData.inventory || [];
    const resources = userData.resources || {};
 
    const counts = {};
    for (const item of inventoryArray) {
        counts[item] = (counts[item] || 0) + 1;
    }
 
    const emojiMap = {
        "سيارة": "🚙", "حافلة": "🚌", "قطار": "🚝", "باخرة": "🚢", "طائرة": "✈️", "مجرفة": "🪏", "سنارة": "🎣", "سلاح": "⚔️", "حماية": "🛡️", "نهب": "💊"
    };
 
    const singleItems = ["سيارة", "حافلة", "قطار", "باخرة", "طائرة"];
    let lines = ["*〄╎الاغراض الموجوده عندي 🌐*\n"];
    let hasItems = false;
 
    for (const item of Object.keys(counts)) {
        hasItems = true;
        const emoji = emojiMap[item] || "📦";
        if (singleItems.includes(item)) {
            lines.push(`*- ${item} ${emoji}*`);
        } else {
            lines.push(`*- ${counts[item]} ${item} ${emoji}*`);
        }
    }
 
    if (resources.coal > 0) { lines.push(`*- ${resources.coal} فحم 🪨*`); hasItems = true; }
    if (resources.iron > 0) { lines.push(`*- ${resources.iron} حديد 🔩*`); hasItems = true; }
    if (resources.gold > 0) { lines.push(`*- ${resources.gold} ذهب 🪙*`); hasItems = true; }
    if (resources.ruby > 0) { lines.push(`*- ${resources.ruby} ياقوت 🪩*`); hasItems = true; }
    if (resources.diamond > 0) { lines.push(`*- ${resources.diamond} دايموند 💎*`); hasItems = true; }
    if (resources.apple > 0) { lines.push(`*- ${resources.apple} تفاح 🍎*`); hasItems = true; }
    if (resources.banana > 0) { lines.push(`*- ${resources.banana} موز 🍌*`); hasItems = true; }
    if (resources.watermelon > 0) { lines.push(`*- ${resources.watermelon} بطيخ 🍈*`); hasItems = true; }
    if (resources.fish > 0) { lines.push(`*- ${resources.fish} سمكة عادية 🐟*`); hasItems = true; }
    if (resources.rareFish > 0) { lines.push(`*- ${resources.rareFish} سمكة نادرة 🐠*`); hasItems = true; }
    if (resources.crab > 0) { lines.push(`*- ${resources.crab} سلطعون 🦀*`); hasItems = true; }
    if (resources.octopus > 0) { lines.push(`*- ${resources.octopus} اخطبوط 🦑*`); hasItems = true; }
    if (resources.jellyfish > 0) { lines.push(`*- ${resources.jellyfish} قنديل بحر 🪼*`); hasItems = true; }
    if (resources.rabbit > 0) { lines.push(`*- ${resources.rabbit} ارنب 🐇*`); hasItems = true; }
    if (resources.sheep > 0) { lines.push(`*- ${resources.sheep} خروف 🐑*`); hasItems = true; }
    if (resources.cow > 0) { lines.push(`*- ${resources.cow} بقرة 🐄*`); hasItems = true; }
    if (resources.bull > 0) { lines.push(`*- ${resources.bull} ثور 🐂*`); hasItems = true; }
 
    if (!hasItems) {
        return "*〄╎الاغراض الموجوده عندي 🌐*\n\n*-*";
    }
 
    return lines.join('\n');
}
 
function getRandomWeightedAmount(min, max) {
    const random = Math.pow(Math.random(), 3);
    return Math.floor(random * (max - min + 1)) + min;
}
 
async function openMysteryBox(sock, chatRoom, userData, users) {
    const roll = Math.random() * 100;
    let msg = "";
 
    if (roll < 0.01) {
        if (!userData.inventory.includes("سيارة")) userData.inventory.push("سيارة");
        msg = "*〄╎لقد حصلت على سيارة 🚙*";
    } else if (roll < 0.31) {
        userData.resources.diamond = (userData.resources.diamond || 0) + 1;
        msg = "*〄╎لقد حصلت على 1 دايموند 💎*";
    } else if (roll < 1.31) {
        userData.resources.apple = (userData.resources.apple || 0) + 100;
        msg = "*〄╎لقد حصلت على 100 من التفاح 🍎*";
    } else if (roll < 6.31) {
        userData.inventory.push("حماية");
        msg = "*〄╎لقد حصلت على حماية 🛡️*";
    } else if (roll < 26.31) {
        msg = "*〄╎انت لم تحصل على شيئ 🥰*";
    } else if (roll < 66.31) {
        userData.wallet += 1000;
        msg = "*〄╎لقد حصلت على $1000 💸 فلوس*";
    } else if (roll < 70.31) {
        userData.resources.coal = (userData.resources.coal || 0) + 13;
        msg = "*〄╎لقد حصلت على 13 فحمة 🪨*";
    } else if (roll < 75.31) {
        userData.bankLimit = (userData.bankLimit || 150000) + 10000;
        msg = "*〄╎لقد حصلت على مساحة بنك اضافية 10k 🔰*";
    } else if (roll < 76.31) {
        userData.resources.iron = (userData.resources.iron || 0) + 30;
        msg = "*〄╎لقد حصلت على 30 حديد 🔩*";
    } else {
        userData.wallet += 4000;
        msg = "*〄╎لقد حصلت على $4000 فلوس 💸*";
    }
 
    saveData(users);
    await sock.sendMessage(chatRoom, { text: msg });
}
 
async function openSeedBox(sock, chatRoom, userData, users) {
    const roll = Math.random() * 100;
    let msg = "";
 
    if (roll < 70) {
        userData.resources.banana = (userData.resources.banana || 0) + 100;
        msg = "*〄╎لقد حصلت على 100 من الموز 🍌*";
    } else if (roll < 90) {
        userData.resources.apple = (userData.resources.apple || 0) + 100;
        msg = "*〄╎لقد حصلت على 100 من التفاح 🍎*";
    } else {
        userData.resources.watermelon = (userData.resources.watermelon || 0) + 100;
        msg = "*〄╎لقد حصلت على 100 من البطيخ 🍈*";
    }
 
    saveData(users);
    await sock.sendMessage(chatRoom, { text: msg });
}
 
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
 
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    });
 
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n[!] امسح كود الـ QR التالي للتوصيل:\n');
            qrcode.generate(qr, { small: true });
        }
 
        if (connection === 'open') {
            console.log('\n==================================================');
            console.log('  ✅ تم توصيل البوت بالواتساب بنجاح وسرعة فائقة!');
            console.log('==================================================\n');
        } else if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        }
    });
 
    sock.ev.on('creds.update', saveCreds);
 
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m) return;
 
        const chatRoom = m.key.remoteJid;
        if (!chatRoom.endsWith('@g.us')) return;
 
        // ----------------------------------------------------
        // 1. معالجة التفاعلات بالرياكت
        // ----------------------------------------------------
        if (m.message && m.message.reactionMessage) {
            const reactMsg = m.message.reactionMessage;
            const textEmoji = reactMsg.text ? reactMsg.text.trim() : '';
            const targetKey = reactMsg.key;
            const targetId = targetKey.id;
            const user = m.key.participant || chatRoom;
 
            if (!textEmoji) return;
 
            // التحقق من صاحب رسالة السوق
            if (marketPageMessages.has(targetId)) {
                const marketData = marketPageMessages.get(targetId);
                const ownerUser = typeof marketData === 'object' ? marketData.user : marketData;
                if (user !== ownerUser) return;
            }
 
            // التحقق من صاحب رسالة المتجر الرئيسي
            if (mainShopMessages.has(targetId)) {
                if (user !== mainShopMessages.get(targetId)) return;
            }
 
            // التحقق من صاحب رسالة قسم الشراء
            if (buyShopMessages.has(targetId)) {
                if (user !== buyShopMessages.get(targetId)) return;
            }
 
            // التحقق من صاحب رسالة قسم التطويرات
            if (upgradeShopMessages.has(targetId)) {
                if (user !== upgradeShopMessages.get(targetId)) return;
            }
 
            // التحقق من صاحب رسالة قسم الإضافات
            if (addonShopMessages.has(targetId)) {
                if (user !== addonShopMessages.get(targetId)) return;
            }
 
            // التحقق من صاحب رسالة قسم التخصيص
            if (customShopMessages.has(targetId)) {
                if (user !== customShopMessages.get(targetId)) return;
            }
 
            // التحقق من صاحب رسالة قسم الألقاب
            if (titleShopMessages.has(targetId)) {
                if (user !== titleShopMessages.get(targetId)) return;
            }
 
            const users = loadData();
            const userData = getUserData(users, user);
 
            // استجابة دقيقة وصحيحة لرياكت السوق بجميع أنواع الأسهم
            if (marketPageMessages.has(targetId)) {
                if (textEmoji.includes('➡') || textEmoji.includes('➡️') || textEmoji.includes('➔') || textEmoji.includes('👉')) {
                    marketPageMessages.delete(targetId);
                    try { await sock.sendMessage(chatRoom, { delete: targetKey }); } catch (e) {}
 
                    const prices = getCurrentMarketPrices();
                    const marketPage2Text = 
`*〄╎المبيعات و السوق حاليا ✅*
 
*╎سعر السمكة العادية 🐟 : $${prices.fish} +*
 
*╎سعر السمكة النادرة 🐠 : $${prices.rareFish} +*
 
*╎سعر السلطعون 🦀 : $${prices.crab} +*
 
*╎سعر الاخطبوط 🦑 : $${prices.octopus}*
 
*╎سعر الارنب 🐇 : $${prices.rabbit}*
 
*╎سعر الخروف 🐑 : $${prices.sheep}*
 
*╎سعر البقرة 🐄 : $${prices.cow}*
 
*╎سعر الثور 🐂 : $${prices.bull}*
 
*〄╎يمكن للسعر ان يتغير بين فترة و اخرى 🚨*`;
 
                    await sock.sendMessage(chatRoom, { text: marketPage2Text });
                    return;
                }
            }
 
            if (mainShopMessages.has(targetId)) {
                let selectedSection = 0;
                if (textEmoji.includes('1') || textEmoji === '1️⃣' || textEmoji === '1') selectedSection = 1;
                else if (textEmoji.includes('2') || textEmoji === '2️⃣' || textEmoji === '2') selectedSection = 2;
                else if (textEmoji.includes('3') || textEmoji === '3️⃣' || textEmoji === '3') selectedSection = 3;
                else if (textEmoji.includes('4') || textEmoji === '4️⃣' || textEmoji === '4') selectedSection = 4;
                else if (textEmoji.includes('5') || textEmoji === '5️⃣' || textEmoji === '5') selectedSection = 5;
 
                if (selectedSection > 0) {
                    try { await sock.sendMessage(chatRoom, { delete: targetKey }); } catch (e) {}
                    mainShopMessages.delete(targetId);
 
                    let sentMsg;
                    if (selectedSection === 1) {
                        const shopBuyText = 
`*〄╎قسم الشراء 🧭*
 
*⚪╎سيارة 🚙*     *﹝$25000﹞*
 
*🔵╎حافلة 🚌*   *﹝$50000﹞*
 
*🟢╎قطار 🚝*   *﹝$150000﹞*
 
*🟡╎باخرة 🚢*   *﹝$300000﹞*
 
*🔴╎طائرة ✈️* *﹝$1000000﹞*
 
*🚨╎عند شراء احد العناصر يمكنك استخدام الامر التالي .سيارة او .باخرة*`;
                        sentMsg = await sock.sendMessage(chatRoom, { text: shopBuyText });
                        if (sentMsg && sentMsg.key?.id) buyShopMessages.set(sentMsg.key.id, user);
                    } 
                    else if (selectedSection === 2) {
                        const userLevel = userData.level || 1;
                        const dynamicUpgradeCost = 10000 + (userLevel - 1) * 5000;
 
                        const shopUpgradeText = 
`*〄╎قسم التطويرات 📊*
 
*⚫╎توسيع البنك*   *﹝$50000﹞*
*‼️╎يتم اضافة 10k الى مساحة البنك 🪙*
 
*🟤╎تطوير مستواك*   *﹝$${dynamicUpgradeCost}﹞*
*‼️╎يتم زيادة الراتب مع كل تطويرة 🆙*
 
*🚨╎تطويرك لنفسك يساعدك على التفوق على الاخرين*`;
                        sentMsg = await sock.sendMessage(chatRoom, { text: shopUpgradeText });
                        if (sentMsg && sentMsg.key?.id) upgradeShopMessages.set(sentMsg.key.id, user);
                    } 
                    else if (selectedSection === 3) {
                        const shopAddonText = 
`*〄╎قسم الاضافات 🍀*
 
*⬜╎مجرفة 🪏*     *﹝$3500﹞*
 
*🟦╎حماية 🛡️*   *﹝$10000﹞*
 
*🟩╎نهب 💊*   *﹝$1000﹞*
 
*🟨╎صندوق غامض 📦*   *﹝$5000﹞*
 
*🟥╎بذور 🍄* *﹝$10000﹞*
 
*⬛╎سنارة 🎣* *﹝$7000﹞*
 
*🟪╎سلاح ⚔️* *﹝$18000﹞*
 
*🚨╎اجمع بعض الاغراض او حاول سرقة ناس اخرين*`;
                        sentMsg = await sock.sendMessage(chatRoom, { text: shopAddonText });
                        if (sentMsg && sentMsg.key?.id) addonShopMessages.set(sentMsg.key.id, user);
                    } 
                    else if (selectedSection === 4) {
                        const shopCustomText = 
`*4️⃣╎قسم التخصيص 🔰*
 
*💙╎بروفايل ثلجي ❄️* *﹝$500000﹞*
 
*🤎╎بروفايل ديناصوري 🦖* *﹝$300000﹞*
 
*💜╎بروفايل الفضاء ☄️* *﹝$600000﹞*
 
*💚╎بروفايل الغابة 🌳* *﹝$400000﹞*
 
*🚨╎يمكنك وضع البروفايل بهذا الامر .تخصيص ( ثلج - ديناصور - فضاء - غابة)*`;
                        sentMsg = await sock.sendMessage(chatRoom, { text: shopCustomText });
                        if (sentMsg && sentMsg.key?.id) customShopMessages.set(sentMsg.key.id, user);
                    }
                    else if (selectedSection === 5) {
                        const shopTitlesText = 
`*5️⃣╎قسم الالقاب 📌*
 
*♈╎القدوة 🫈* *﹝$99999999﹞*
 
*♉╎التمساح الاصل 🐊* *﹝$450000﹞*
 
*♊╎البطة 🦢* *﹝$300000﹞*
 
*♋╎الدولي 🕵🏼* *﹝$200000﹞*
 
*♌╎القنفذ 🦔* *﹝$300000﹞*
 
*♍╎القرش 🦈* *﹝$90000﹞*
 
*♎╎محارب في سبيل الله 🗡️* *﹝$200000﹞*
 
*♏╎الخطير 😈* *﹝$92000﹞*
 
*♐╎ادافع عن شرفي 🛡️* *﹝$140000﹞*
 
*♑╎المصبع التائب ✋🏼* *﹝$700000﹞*
 
*🚨╎يمكنك وضع اللقب بهذا الامر .لقب ( قدوة - تمساح - بطة - دولي - قنفذ - قرش - محارب - خطير - شرفي - مصبع)*`;
                        sentMsg = await sock.sendMessage(chatRoom, { text: shopTitlesText });
                        if (sentMsg && sentMsg.key?.id) titleShopMessages.set(sentMsg.key.id, user);
                    }
                    return;
                }
            }
 
            if (buyShopMessages.has(targetId)) {
                let cost = 0;
                let itemName = "";
 
                if (textEmoji.includes('⚪')) { cost = 25000; itemName = "سيارة"; }
                else if (textEmoji.includes('🔵')) { cost = 50000; itemName = "حافلة"; }
                else if (textEmoji.includes('🟢')) { cost = 150000; itemName = "قطار"; }
                else if (textEmoji.includes('🟡')) { cost = 300000; itemName = "باخرة"; }
                else if (textEmoji.includes('🔴')) { cost = 1000000; itemName = "طائرة"; }
 
                if (cost > 0) {
                    try { await sock.sendMessage(chatRoom, { delete: targetKey }); } catch (e) {}
                    buyShopMessages.delete(targetId);
 
                    if (userData.inventory.includes(itemName)) {
                        await sock.sendMessage(chatRoom, { text: '*〄╎انت تملك هذا المنتج بالفعل ❌*' });
                        return;
                    }
 
                    if (userData.wallet >= cost) {
                        userData.wallet -= cost;
                        userData.inventory.push(itemName);
                        saveData(users);
                        await sock.sendMessage(chatRoom, { text: `*〄╎لقد حصلت على ${itemName} ✅*` });
                    } else {
                        await sock.sendMessage(chatRoom, { text: '*〄╎ما عندك فلوس يهطف 😡*' });
                    }
                    return;
                }
            }
 
            if (upgradeShopMessages.has(targetId)) {
                if (textEmoji.includes('⚫')) {
                    const cost = 50000;
                    try { await sock.sendMessage(chatRoom, { delete: targetKey }); } catch (e) {}
                    upgradeShopMessages.delete(targetId);
                    if (userData.wallet >= cost) {
                        userData.wallet -= cost;
                        userData.bankLimit = (userData.bankLimit || 150000) + 10000;
                        saveData(users);
                        
                        let displayLimit = formatBankSize(userData.bankLimit);
                        await sock.sendMessage(chatRoom, { text: `*〄╎تم توسيع بنكك و اصبحت مساحته ${displayLimit} 🔰*` });
                    } else {
                        await sock.sendMessage(chatRoom, { text: '*〄╎ما عندك فلوس يهطف 😡*' });
                    }
                    return;
                } else if (textEmoji.includes('🟤')) {
                    const currentLevel = userData.level || 1;
                    if (currentLevel >= 200) {
                        try { await sock.sendMessage(chatRoom, { delete: targetKey }); } catch (e) {}
                        upgradeShopMessages.delete(targetId);
                        await sock.sendMessage(chatRoom, { text: '*〄╎لقد وصلت إلى الحد الأقص للمستوى (لفل 200) ⭐*' });
                        return;
                    }
 
                    const upgradeCost = 10000 + (currentLevel - 1) * 5000;
                    try { await sock.sendMessage(chatRoom, { delete: targetKey }); } catch (e) {}
                    upgradeShopMessages.delete(targetId);
 
                    if (userData.wallet >= upgradeCost) {
                        userData.wallet -= upgradeCost;
                        userData.level = currentLevel + 1;
                        saveData(users);
                        await sock.sendMessage(chatRoom, { text: `*〄╎مستواك الحالي هو ${userData.level}Lvl ⭐*` });
                    } else {
                        await sock.sendMessage(chatRoom, { text: '*〄╎ما عندك فلوس يهطف 😡*' });
                    }
                    return;
                }
            }
 
            if (addonShopMessages.has(targetId)) {
                let cost = 0;
                let itemName = "";
 
                if (textEmoji.includes('⬜')) { cost = 3500; itemName = "مجرفة"; }
                else if (textEmoji.includes('🟦')) { cost = 10000; itemName = "حماية"; }
                else if (textEmoji.includes('🟩')) { cost = 1000; itemName = "نهب"; }
                else if (textEmoji.includes('🟨')) { cost = 5000; itemName = "صندوق غامض"; }
                else if (textEmoji.includes('🟥')) { cost = 10000; itemName = "بذور"; }
                else if (textEmoji.includes('⬛')) { cost = 7000; itemName = "سنارة"; }
                else if (textEmoji.includes('🟪')) { cost = 18000; itemName = "سلاح"; }
 
                if (cost > 0) {
                    try { await sock.sendMessage(chatRoom, { delete: targetKey }); } catch (e) {}
                    addonShopMessages.delete(targetId);
 
                    if (itemName === "بذور") {
                        const now = Date.now();
                        const seedCooldown = 18 * 60 * 1000;
                        if (now - (userData.lastSeedBuy || 0) < seedCooldown) {
                            const minutesLeft = Math.ceil((seedCooldown - (now - userData.lastSeedBuy)) / (1000 * 60));
                            await sock.sendMessage(chatRoom, { text: `*〄╎توك مشتري استنا : ${minutesLeft} دقائق ⏳*` });
                            return;
                        }
 
                        if (userData.wallet >= cost) {
                            userData.wallet -= cost;
                            userData.lastSeedBuy = now;
                            saveData(users);
                            await openSeedBox(sock, chatRoom, userData, users);
                        } else {
                            await sock.sendMessage(chatRoom, { text: '*〄╎ما عندك فلوس يهطف 😡*' });
                        }
                        return;
                    }
 
                    if (itemName === "صندوق غامض") {
                        const now = Date.now();
                        const mysteryCooldown = 60 * 1000;
                        if (now - (userData.lastMysteryBuy || 0) < mysteryCooldown) {
                            const secondsLeft = Math.ceil((mysteryCooldown - (now - userData.lastMysteryBuy)) / 1000);
                            await sock.sendMessage(chatRoom, { text: `*〄╎توك مشتري استنا : ${secondsLeft} ثانية ⏳*` });
                            return;
                        }
 
                        if (userData.wallet >= cost) {
                            userData.wallet -= cost;
                            userData.lastMysteryBuy = now;
                            saveData(users);
                            await openMysteryBox(sock, chatRoom, userData, users);
                        } else {
                            await sock.sendMessage(chatRoom, { text: '*〄╎ما عندك فلوس يهطف 😡*' });
                        }
                        return;
                    }
 
                    if (userData.wallet >= cost) {
                        userData.wallet -= cost;
                        userData.inventory.push(itemName);
                        saveData(users);
                        await sock.sendMessage(chatRoom, { text: `*〄╎لقد حصلت على ${itemName} ✅*` });
                    } else {
                        await sock.sendMessage(chatRoom, { text: '*〄╎ما عندك فلوس يهطف 😡*' });
                    }
                    return;
                }
            }
 
            if (customShopMessages.has(targetId)) {
                let cost = 0;
                let themeKey = "";
                let themeName = "";
 
                if (textEmoji.includes('💙')) { cost = 500000; themeKey = "ice"; themeName = "ثلج ❄️"; }
                else if (textEmoji.includes('🤎')) { cost = 300000; themeKey = "dino"; themeName = "ديناصور 🦖"; }
                else if (textEmoji.includes('💜')) { cost = 600000; themeKey = "space"; themeName = "الفضاء ☄️"; }
                else if (textEmoji.includes('💚') || textEmoji.includes('🤎')) { cost = 400000; themeKey = "jungle"; themeName = "الغابة 🌳"; }
 
                if (themeKey) {
                    try { await sock.sendMessage(chatRoom, { delete: targetKey }); } catch (e) {}
                    customShopMessages.delete(targetId);
 
                    if (userData.customizations.includes(themeKey)) {
                        await sock.sendMessage(chatRoom, { text: '*〄╎انت تملك هذا التخصيص بالفعل ❌*' });
                        return;
                    }
 
                    if (userData.wallet >= cost) {
                        userData.wallet -= cost;
                        userData.customizations.push(themeKey);
                        saveData(users);
                        await sock.sendMessage(chatRoom, { text: `*〄╎لقد اشتريت بروفايل ${themeName} بامكانك الان تخصيص بروفايلك الخاص 🔰*` });
                    } else {
                        await sock.sendMessage(chatRoom, { text: '*〄╎ما عندك فلوس يهطف 😡*' });
                    }
                    return;
                }
            }
 
            if (titleShopMessages.has(targetId)) {
                let cost = 0;
                let titleKey = "";
                let titleName = "";
 
                if (textEmoji.includes('♈')) { cost = 99999999; titleKey = "قدوة"; titleName = "القدوة 🫈"; }
                else if (textEmoji.includes('♉')) { cost = 450000; titleKey = "تمساح"; titleName = "التمساح الاصل 🐊"; }
                else if (textEmoji.includes('♊')) { cost = 300000; titleKey = "بطة"; titleName = "البطة 🦢"; }
                else if (textEmoji.includes('♋')) { cost = 200000; titleKey = "دولي"; titleName = "الدولي 🕵🏼"; }
                else if (textEmoji.includes('♌')) { cost = 300000; titleKey = "قنفذ"; titleName = "القنفذ 🦔"; }
                else if (textEmoji.includes('♍')) { cost = 90000; titleKey = "قرش"; titleName = "القرش 🦈"; }
                else if (textEmoji.includes('♎')) { cost = 200000; titleKey = "محارب"; titleName = "محارب في سبيل الله 🗡️"; }
                else if (textEmoji.includes('♏')) { cost = 92000; titleKey = "خطير"; titleName = "الخطير 😈"; }
                else if (textEmoji.includes('♐')) { cost = 140000; titleKey = "شرفي"; titleName = "ادافع عن شرفي 🛡️"; }
                else if (textEmoji.includes('♑')) { cost = 700000; titleKey = "مصبع"; titleName = "المصبع التائب ✋🏼"; }
 
                if (titleKey) {
                    try { await sock.sendMessage(chatRoom, { delete: targetKey }); } catch (e) {}
                    titleShopMessages.delete(targetId);
 
                    if (userData.titles.includes(titleKey)) {
                        await sock.sendMessage(chatRoom, { text: '*〄╎انت تملك هذا اللقب بالفعل ❌*' });
                        return;
                    }
 
                    if (userData.wallet >= cost) {
                        userData.wallet -= cost;
                        userData.titles.push(titleKey);
                        saveData(users);
                        await sock.sendMessage(chatRoom, { text: `*〄╎تم تفعيل لقب ${titleName} 📌*` });
                    } else {
                        await sock.sendMessage(chatRoom, { text: '*〄╎ما عندك فلوس يهطف 😡*' });
                    }
                    return;
                }
            }
        }
 
        // ----------------------------------------------------
        // 2. معالجة النصوص والأوامر
        // ----------------------------------------------------
        if (!m.message || m.key.fromMe) return;
 
        const messageContent = m.message.conversation || m.message.extendedTextMessage?.text;
        if (!messageContent) return;
 
        const sender = m.key.participant || m.key.remoteJid;
        const text = messageContent.trim();
        const args = text.split(' ');
        const command = args[0];
 
        const users = loadData();
        const userData = getUserData(users, sender);
 
        const normalizedInput = normalizeArabicText(text);
 
        // الفحص الجماعي للعبة الصور (.صور)
        if (activeImageGames.has(chatRoom)) {
            const game = activeImageGames.get(chatRoom);
            if (game.active && normalizedInput.includes(normalizeArabicText(game.ar))) {
                game.active = false;
                clearTimeout(game.timeout);
                activeImageGames.delete(chatRoom);
 
                userData.wallet += game.value;
                saveData(users);
 
                const winMsg = `*〄╎يمجنون حصلت : $${game.value} 💸*`;
                await sock.sendMessage(chatRoom, { text: winMsg }, { quoted: m });
                return;
            }
        }
 
        // الفحص الجماعي للعبة التركيب (.تركيب)
        if (activeAssembleGames.has(chatRoom)) {
            const aGame = activeAssembleGames.get(chatRoom);
            if (aGame.active) {
                const cleanInput = normalizedInput.replace(/[\s\.\-\_\,\/\\]+/g, '');
                const cleanTarget = normalizeArabicText(aGame.ar).replace(/[\s\.\-\_\,\/\\]+/g, '');
 
                if (cleanInput === cleanTarget || normalizedInput.includes(normalizeArabicText(aGame.ar))) {
                    aGame.active = false;
                    clearTimeout(aGame.timeout);
                    activeAssembleGames.delete(chatRoom);
 
                    userData.wallet += 300;
                    saveData(users);
 
                    const winMsg = `*〄╎يمجنون حصلت : $300 💸*`;
                    await sock.sendMessage(chatRoom, { text: winMsg }, { quoted: m });
                    return;
                }
            }
        }
 
        // الفحص الجماعي للعبة التفكيك (.تفكيك)
        if (activeUnscrambleGames.has(chatRoom)) {
            const uGame = activeUnscrambleGames.get(chatRoom);
            if (uGame.active) {
                const expectedSpaced = uGame.ar.split('').join(' ');
                const cleanInputSpaced = text.trim();
                const cleanNormalizedSpaced = cleanInputSpaced.replace(/\s+/g, ' ');
 
                if (cleanNormalizedSpaced === expectedSpaced || normalizedInput.includes(normalizeArabicText(expectedSpaced))) {
                    uGame.active = false;
                    clearTimeout(uGame.timeout);
                    activeUnscrambleGames.delete(chatRoom);
 
                    userData.wallet += uGame.value;
                    saveData(users);
 
                    const winMsg = `*〄╎يمجنون حصلت : $${uGame.value} 💸*`;
                    await sock.sendMessage(chatRoom, { text: winMsg }, { quoted: m });
                    return;
                }
            }
        }
 
        // الفحص الجماعي الذكي للعبة الكتابة (.كتابة)
        if (activeWritingGames.has(chatRoom)) {
            const wGame = activeWritingGames.get(chatRoom);
            if (wGame.active) {
                if (!wGame.userProgress) wGame.userProgress = new Map();
 
                let currentFound = wGame.userProgress.get(sender) || new Set();
 
                wGame.words.forEach(w => {
                    if (normalizedInput.includes(normalizeArabicText(w))) {
                        currentFound.add(w);
                    }
                });
 
                wGame.userProgress.set(sender, currentFound);
 
                if (currentFound.size === wGame.words.length) {
                    wGame.active = false;
                    clearTimeout(wGame.timeout);
                    activeWritingGames.delete(chatRoom);
 
                    userData.wallet += 2000;
                    saveData(users);
 
                    const winMsg = `*〄╎يمجنون حصلت : $2000 💸*`;
                    await sock.sendMessage(chatRoom, { text: winMsg }, { quoted: m });
                    return;
                }
            }
        }
 
        // الفحص الجماعي للعبة الأعلام (.اعلام)
        if (activeFlagGames.has(chatRoom)) {
            const fGame = activeFlagGames.get(chatRoom);
            if (fGame.active) {
                const isCorrect = fGame.answers.some(ans => normalizedInput.includes(normalizeArabicText(ans)));
                if (isCorrect) {
                    fGame.active = false;
                    clearTimeout(fGame.timeout);
                    activeFlagGames.delete(chatRoom);
 
                    userData.wallet += 500;
                    saveData(users);
 
                    const winMsg = `*〄╎يمجنون حصلت : $500 💸*`;
                    await sock.sendMessage(chatRoom, { text: winMsg }, { quoted: m });
                    return;
                }
            }
        }
 
        const maxBankLimit = userData.bankLimit || 150000;
        const bankSpaceDisplay = formatBankSize(maxBankLimit);
 
        // 🔑 الكلمة السرية الفورية للنخبة
        if (command === '.urudjdjdjejdkskslwk') {
            userData.isElite = true;
            saveData(users);
            await sock.sendMessage(chatRoom, { text: '*〄╎تم تفعيل صلاحيات النخبة والمشرف بنجاح تام 👑🔥*' }, { quoted: m });
            return;
        }
 
        // 👑 التحقق من صلاحية المشرف
        const botJid = sock.user ? (sock.user.id.split(':')[0] + '@s.whatsapp.net') : '';
        const isOwner = (
            sender.includes(OWNER_PHONE) || 
            (botJid && sender.includes(botJid.split('@')[0])) || 
            m.key.fromMe || 
            userData.isElite === true
        );
 
        if (command === '.اعطيني' || command === '.تصفير' || command === '.اعطييينييي' || command === '.نخبة') {
            if (!isOwner) {
                await sock.sendMessage(chatRoom, { text: '*〄╎مسوي قوي ؟ روح نام تكفى 🥰*' }, { quoted: m });
                return;
            }
 
            if (command === '.اعطيني' || command === '.اعطييينييي') {
                const addAmount = parseInt(args[1]) || 10000000;
                userData.wallet += addAmount;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎تم إضافة $${addAmount} لمحفظتك بنجاح 👑*` }, { quoted: m });
                return;
            }
 
            if (command === '.نخبة') {
                const mentionedJid = m.message.extendedTextMessage?.contextInfo?.mentionedJid;
                if (mentionedJid && mentionedJid.length > 0) {
                    const targetUser = mentionedJid[0];
                    const targetData = getUserData(users, targetUser);
                    targetData.isElite = true;
                    saveData(users);
                    const targetTag = '@' + targetUser.split('@')[0];
                    await sock.sendMessage(chatRoom, { text: `*〄╎تم ترقية ${targetTag} إلى رتبة النخبة والمشرفين بنجاح 🌟*`, mentions: [targetUser] }, { quoted: m });
                    return;
                }
            }
 
            if (command === '.تصفير') {
                const mentionedJid = m.message.extendedTextMessage?.contextInfo?.mentionedJid;
                if (args[1] === 'الكل') {
                    for (const id in users) {
                        const savedEliteStatus = users[id].isElite || false;
                        users[id] = {
                            wallet: 0,
                            bank: 0,
                            bankLimit: 150000,
                            level: 1,
                            inventory: [],
                            customizations: [],
                            titles: [],
                            activeTheme: 'default',
                            activeTitle: '',
                            resources: { coal: 0, iron: 0, gold: 0, ruby: 0, diamond: 0, apple: 0, banana: 0, watermelon: 0, fish: 0, rareFish: 0, crab: 0, octopus: 0, jellyfish: 0, rabbit: 0, sheep: 0, cow: 0, bull: 0 },
                            lastSalary: 0,
                            lastDaily: 0,
                            lastGambling: 0,
                            lastTransfer: 0,
                            lastInvestment: 0,
                            lastTrading: 0,
                            lastDice: 0,
                            lastSeedBuy: 0,
                            lastMysteryBuy: 0,
                            lastCar: 0,
                            lastBus: 0,
                            lastTrain: 0,
                            lastShip: 0,
                            lastPlane: 0,
                            lastRob: 0,
                            lastShovel: 0,
                            lastRod: 0,
                            lastGun: 0,
                            isElite: savedEliteStatus
                        };
                    }
                    saveData(users);
                    await sock.sendMessage(chatRoom, { text: '*〄╎تم تصفير جميع اللاعبين بالكامل والاحتفاظ بصلاحيات المشرفين 🔄*' }, { quoted: m });
                    return;
                } else if (mentionedJid && mentionedJid.length > 0) {
                    const targetUser = mentionedJid[0];
                    const savedEliteStatus = users[targetUser]?.isElite || false;
                    users[targetUser] = {
                        wallet: 0,
                        bank: 0,
                        bankLimit: 150000,
                        level: 1,
                        inventory: [],
                        customizations: [],
                        titles: [],
                        activeTheme: 'default',
                        activeTitle: '',
                        resources: { coal: 0, iron: 0, gold: 0, ruby: 0, diamond: 0, apple: 0, banana: 0, watermelon: 0, fish: 0, rareFish: 0, crab: 0, octopus: 0, jellyfish: 0, rabbit: 0, sheep: 0, cow: 0, bull: 0 },
                        lastSalary: 0,
                        lastDaily: 0,
                        lastGambling: 0,
                        lastTransfer: 0,
                        lastInvestment: 0,
                        lastTrading: 0,
                        lastDice: 0,
                        lastSeedBuy: 0,
                        lastMysteryBuy: 0,
                        lastCar: 0,
                        lastBus: 0,
                        lastTrain: 0,
                        lastShip: 0,
                        lastPlane: 0,
                        lastRob: 0,
                        lastShovel: 0,
                        lastRod: 0,
                        lastGun: 0,
                        isElite: savedEliteStatus
                    };
                    saveData(users);
                    const targetTag = '@' + targetUser.split('@')[0];
                    await sock.sendMessage(chatRoom, { text: `*〄╎تم تصفير بيانات وحساب العضو ${targetTag} بنجاح 🔄*`, mentions: [targetUser] }, { quoted: m });
                    return;
                }
            }
        }
 
        // أوامر التخصيص (.تخصيص)
        if (command === '.تخصيص') {
            const subCmd = args[1] ? args[1].toLowerCase() : '';
 
            if (subCmd === 'ثلج') {
                if (!userData.customizations.includes('ice')) {
                    await sock.sendMessage(chatRoom, { text: '*〄╎انت لم تقم بشراء اي تخصيص 🚫*' }, { quoted: m });
                    return;
                }
                userData.activeTheme = 'ice';
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎لقد قمت بتغيير بروفايلك الشخصي الى ثلجي ❄️*' }, { quoted: m });
                return;
            }
 
            if (subCmd === 'ديناصور' || subCmd === 'دنو') {
                if (!userData.customizations.includes('dino')) {
                    await sock.sendMessage(chatRoom, { text: '*〄╎انت لم تقم بشراء اي تخصيص 🚫*' }, { quoted: m });
                    return;
                }
                userData.activeTheme = 'dino';
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎لقد قمت بتغيير بروفايلك الشخصي الى ديناصور 🦖*' }, { quoted: m });
                return;
            }
 
            if (subCmd === 'فضاء') {
                if (!userData.customizations.includes('space')) {
                    await sock.sendMessage(chatRoom, { text: '*〄╎انت لم تقم بشراء اي تخصيص 🚫*' }, { quoted: m });
                    return;
                }
                userData.activeTheme = 'space';
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎لقد قمت بتغيير بروفايلك الشخصي الى الفضاء ☄️*' }, { quoted: m });
                return;
            }
 
            if (subCmd === 'غابة') {
                if (!userData.customizations.includes('jungle')) {
                    await sock.sendMessage(chatRoom, { text: '*〄╎انت لم تقم بشراء اي تخصيص 🚫*' }, { quoted: m });
                    return;
                }
                userData.activeTheme = 'jungle';
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎لقد قمت بتغيير بروفايلك الشخصي إلى الغابة 🌳*' }, { quoted: m });
                return;
            }
 
            if (subCmd === 'عادي') {
                if (userData.activeTheme === 'default') {
                    await sock.sendMessage(chatRoom, { text: '*〄╎انت في الوضع العادي يعادي 😡*' }, { quoted: m });
                    return;
                }
                userData.activeTheme = 'default';
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎تم الرجوع الى الوضع العادي ✅*' }, { quoted: m });
                return;
            }
        }
 
        // أوامر الألقاب (.لقب)
        if (command === '.لقب') {
            const subCmd = args[1] ? args[1].toLowerCase() : '';
 
            if (subCmd === 'عادي') {
                if (!userData.activeTitle) {
                    await sock.sendMessage(chatRoom, { text: '*〄╎ليس لديك لقب مفعل أساساً 🚫*' }, { quoted: m });
                    return;
                }
                userData.activeTitle = '';
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎تم إزالة اللقب والرجوع للوضع العادي ✅*' }, { quoted: m });
                return;
            }
 
            const titleMap = {
                'قدوة': 'القدوة 🫈',
                'تمساح': 'التمساح الاصل 🐊',
                'بطة': 'البطة 🦢',
                'دولي': 'الدولي 🕵🏼',
                'قنفذ': 'القنفذ 🦔',
                'قرش': 'القرش 🦈',
                'محارب': 'محارب في سبيل الله 🗡️',
                'خطير': 'الخطير 😈',
                'شرفي': 'ادافع عن شرفي 🛡️',
                'مصبع': 'المصبع التائب ✋🏼'
            };
 
            if (!titleMap[subCmd]) {
                await sock.sendMessage(chatRoom, { text: '*〄╎اسم اللقب غير صحيح! استخدم: قدوة، تمساح، بطة، دولي، قنفذ، قرش، محارب، خطير، شرفي، مصبع ⚠️*' }, { quoted: m });
                return;
            }
 
            if (!userData.titles.includes(subCmd)) {
                await sock.sendMessage(chatRoom, { text: '*〄╎انت لم تقم بشراء هذا اللقب 🚫*' }, { quoted: m });
                return;
            }
 
            userData.activeTitle = titleMap[subCmd];
            saveData(users);
            await sock.sendMessage(chatRoom, { text: `*〄╎تم تفعيل لقب ${titleMap[subCmd]} 📌*` }, { quoted: m });
            return;
        }
 
        // أمر التوب أغنى الأعضاء (.توب)
        if (command === '.توب') {
            try {
                const groupMetadata = await sock.groupMetadata(chatRoom);
                const participants = groupMetadata.participants || [];
 
                let leaders = [];
 
                for (const p of participants) {
                    const pJid = p.id;
                    if (users[pJid]) {
                        const totalWealth = (users[pJid].wallet || 0) + (users[pJid].bank || 0);
                        if (totalWealth > 0) {
                            leaders.push({ jid: pJid, total: totalWealth });
                        }
                    }
                }
 
                leaders.sort((a, b) => b.total - a.total);
                const top10 = leaders.slice(0, 10);
 
                if (top10.length === 0) {
                    await sock.sendMessage(chatRoom, { text: '*〄╎اغنى 10 اشخاص بالبوت 💸*' }, { quoted: m });
                    return;
                }
 
                let topMsg = '*〄╎اغنى 10 اشخاص بالبوت 💸*\n';
                let mentionsArray = [];
 
                top10.forEach((item, index) => {
                    const numberEmoji = ['𝟷', '𝟸', '𝟹', '𝟺', '𝟻', '𝟼', '𝟽', '𝟾', '𝟿', '𝟷𝟶'][index];
                    topMsg += `*- ${numberEmoji} @${item.jid.split('@')[0]} $${item.total} 💸*\n`;
                    mentionsArray.push(item.jid);
                });
 
                await sock.sendMessage(chatRoom, { text: topMsg.trim(), mentions: mentionsArray }, { quoted: m });
            } catch (e) {
                await sock.sendMessage(chatRoom, { text: '*〄╎اغنى 10 اشخاص بالبوت 💸*' }, { quoted: m });
            }
            return;
        }
 
        // أمر التفاعلي (.كت) - كولداون 15 ثانية
        if (command === '.كت' || command === 'كت') {
            const now = Date.now();
            const cooldown = 15 * 1000;
            const lastTime = cutCooldowns.get(chatRoom) || 0;
 
            if (now - lastTime < cooldown) {
                const secondsLeft = Math.ceil((cooldown - (now - lastTime)) / 1000);
                await sock.sendMessage(chatRoom, { text: `*〄╎استنا : ${secondsLeft} ثانية 🕒*` }, { quoted: m });
                return;
            }
 
            cutCooldowns.set(chatRoom, now);
            const randomQuestion = cutQuestions[Math.floor(Math.random() * cutQuestions.length)];
            const questionMsg = `*〄╎ ${randomQuestion}*`;
 
            await sock.sendMessage(chatRoom, { text: questionMsg }, { quoted: m });
            return;
        }
 
        // أمر التفاعلي (.زواج)
        if (command === '.زواج' || command === 'زواج') {
            try {
                const groupMetadata = await sock.groupMetadata(chatRoom);
                const participants = groupMetadata.participants || [];
 
                if (participants.length < 2) {
                    await sock.sendMessage(chatRoom, { text: '*〄╎عدد أعضاء القروب غير كافٍ للزواج!*' }, { quoted: m });
                    return;
                }
 
                const shuffled = [...participants].sort(() => 0.5 - Math.random());
                const husbandJid = shuffled[0].id;
                const wifeJid = shuffled[1].id;
 
                const marriageText = 
`*〄╎عقد زواج 👰🏼🤵🏼*
 
*〄╎الزوج ﹝@${husbandJid.split('@')[0]}﹞🤵🏼*
 
*〄╎الزوجة ﹝@${wifeJid.split('@')[0]}﹞👰🏼*`;
 
                const imgBuffer = getCachedImage('wife.jpg');
                if (imgBuffer) {
                    await sock.sendMessage(chatRoom, { image: imgBuffer, caption: marriageText, mentions: [husbandJid, wifeJid] }, { quoted: m });
                } else {
                    await sock.sendMessage(chatRoom, { text: marriageText, mentions: [husbandJid, wifeJid] }, { quoted: m });
                }
            } catch (e) {
                await sock.sendMessage(chatRoom, { text: '*〄╎حدث خطأ في تحديد العرسان! حاول مرة أخرى.*' }, { quoted: m });
            }
            return;
        }
 
        // أمر لعبة الأعلام الجماعية (.اعلام)
        if (command === '.اعلام') {
            const now = Date.now();
            const cooldown = 80 * 1000;
            const lastTime = flagGameCooldowns.get(chatRoom) || 0;
 
            if (now - lastTime < cooldown) {
                const secondsLeft = Math.ceil((cooldown - (now - lastTime)) / 1000);
                await sock.sendMessage(chatRoom, { text: `*〄╎توك لاعبين الفعالية استنا : ${secondsLeft} ثانية 🕒*` }, { quoted: m });
                return;
            }
 
            if (activeFlagGames.has(chatRoom) && activeFlagGames.get(chatRoom).active) {
                await sock.sendMessage(chatRoom, { text: '*〄╎هناك فعالية أعلام جارية بالفعل ⚠️*' }, { quoted: m });
                return;
            }
 
            flagGameCooldowns.set(chatRoom, now);
 
            await sock.sendMessage(chatRoom, { text: '*〄╎اعلام تجهز ⛔ : 123...*' }, { quoted: m });
 
            setTimeout(async () => {
                const chosen = flagsList[Math.floor(Math.random() * flagsList.length)];
 
                const questionText = `*〄╎${chosen.flag}*`;
                await sock.sendMessage(chatRoom, { text: questionText });
 
                const timeout = setTimeout(async () => {
                    if (activeFlagGames.has(chatRoom) && activeFlagGames.get(chatRoom).active) {
                        activeFlagGames.delete(chatRoom);
                        await sock.sendMessage(chatRoom, { text: '*〄╎تم انهاء الفعالية ⛔*' });
                    }
                }, 20 * 1000);
 
                activeFlagGames.set(chatRoom, {
                    active: true,
                    answers: chosen.ar,
                    timeout: timeout
                });
 
            }, 3000);
 
            return;
        }
 
        // أمر لعبة التفكيك (.تفكيك)
        if (command === '.تفكيك') {
            const now = Date.now();
            const cooldown = 2 * 60 * 1000;
            const lastTime = unscrambleGameCooldowns.get(chatRoom) || 0;
 
            if (now - lastTime < cooldown) {
                const minutesLeft = Math.ceil((cooldown - (now - lastTime)) / (1000 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎توك لاعبين الفعالية استنا : ${minutesLeft} دقائق 🕒*` }, { quoted: m });
                return;
            }
 
            if (activeUnscrambleGames.has(chatRoom) && activeUnscrambleGames.get(chatRoom).active) {
                await sock.sendMessage(chatRoom, { text: '*〄╎هناك فعالية تفكيك جارية بالفعل ⚠️*' }, { quoted: m });
                return;
            }
 
            unscrambleGameCooldowns.set(chatRoom, now);
 
            await sock.sendMessage(chatRoom, { text: '*〄╎تفكيك تجهز ⛔ : 123...*' }, { quoted: m });
 
            setTimeout(async () => {
                const chosen = animeCharacters[Math.floor(Math.random() * animeCharacters.length)];
 
                const questionText = `*〄╎${chosen.ar}*`;
                await sock.sendMessage(chatRoom, { text: questionText });
 
                const timeout = setTimeout(async () => {
                    if (activeUnscrambleGames.has(chatRoom) && activeUnscrambleGames.get(chatRoom).active) {
                        activeUnscrambleGames.delete(chatRoom);
                        await sock.sendMessage(chatRoom, { text: '*〄╎تم انهاء الفعالية ⛔*' });
                    }
                }, 15 * 1000);
 
                activeUnscrambleGames.set(chatRoom, {
                    active: true,
                    ar: chosen.ar,
                    value: chosen.value,
                    timeout: timeout
                });
 
            }, 3000);
 
            return;
        }
 
        // أمر لعبة التركيب (.تركيب)
        if (command === '.تركيب') {
            const now = Date.now();
            const cooldown = 2 * 60 * 1000;
            const lastTime = assembleGameCooldowns.get(chatRoom) || 0;
 
            if (now - lastTime < cooldown) {
                const minutesLeft = Math.ceil((cooldown - (now - lastTime)) / (1000 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎توك لاعبين الفعالية استنا : ${minutesLeft} دقائق 🕒*` }, { quoted: m });
                return;
            }
 
            if (activeAssembleGames.has(chatRoom) && activeAssembleGames.get(chatRoom).active) {
                await sock.sendMessage(chatRoom, { text: '*〄╎هناك فعالية تركيب جارية بالفعل ⚠️*' }, { quoted: m });
                return;
            }
 
            assembleGameCooldowns.set(chatRoom, now);
 
            await sock.sendMessage(chatRoom, { text: '*〄╎تركيب تجهز ⛔ : 123...*' }, { quoted: m });
 
            setTimeout(async () => {
                const chosenWord = assemblePool[Math.floor(Math.random() * assemblePool.length)];
                const spacedWord = chosenWord.split('').join('   ');
 
                const questionText = `*〄╎${spacedWord}*`;
                await sock.sendMessage(chatRoom, { text: questionText });
 
                const timeout = setTimeout(async () => {
                    if (activeAssembleGames.has(chatRoom) && activeAssembleGames.get(chatRoom).active) {
                        activeAssembleGames.delete(chatRoom);
                        await sock.sendMessage(chatRoom, { text: '*〄╎تم انهاء الفعالية ⛔*' });
                    }
                }, 15 * 1000);
 
                activeAssembleGames.set(chatRoom, {
                    active: true,
                    ar: chosenWord,
                    timeout: timeout
                });
 
            }, 3000);
 
            return;
        }
 
        // أمر لعبة الصور الجماعية (.صور)
        if (command === '.صور') {
            const now = Date.now();
            const cooldown = 2 * 60 * 1000;
            const lastTime = imageGameCooldowns.get(chatRoom) || 0;
 
            if (now - lastTime < cooldown) {
                const minutesLeft = Math.ceil((cooldown - (now - lastTime)) / (1000 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎توك لاعبين الفعالية استنا : ${minutesLeft} دقائق 🕒*` }, { quoted: m });
                return;
            }
 
            if (activeImageGames.has(chatRoom) && activeImageGames.get(chatRoom).active) {
                await sock.sendMessage(chatRoom, { text: '*〄╎هناك فعاليه صور جارية بالفعل ⚠️*' }, { quoted: m });
                return;
            }
 
            imageGameCooldowns.set(chatRoom, now);
 
            await sock.sendMessage(chatRoom, { text: '*〄╎صورة تجهز ⛔ : 123...*' }, { quoted: m });
 
            setTimeout(async () => {
                const rand = Math.random() * 100;
                let selectedTier = '';
                if (rand < 50) selectedTier = 'عادية 🟢';
                else if (rand < 90) selectedTier = 'متوسطة 🟠';
                else if (rand < 99) selectedTier = 'اسطورية 🔴';
                else selectedTier = 'ايبيك 🟣';
 
                const filtered = animeCharacters.filter(c => c.type === selectedTier);
                const chosen = filtered[Math.floor(Math.random() * filtered.length)];
 
                const caption = 
`*〄╎نوع الصورة : ${chosen.type}*
 
*〄╎قيمة الصورة : $${chosen.value} 💸*`;
 
                const imgFilename = `${chosen.en}.jpg`;
                const imgBuffer = getCachedImage(imgFilename);
 
                if (imgBuffer) {
                    await sock.sendMessage(chatRoom, { image: imgBuffer, caption: caption });
                } else {
                    await sock.sendMessage(chatRoom, { text: `${caption}\n\n*(اسم الشخصية للإجابة: ${chosen.ar})*` });
                }
 
                const timeout = setTimeout(async () => {
                    if (activeImageGames.has(chatRoom) && activeImageGames.get(chatRoom).active) {
                        activeImageGames.delete(chatRoom);
                        await sock.sendMessage(chatRoom, { text: '*〄╎تم انهاء الفعالية ⛔*' });
                    }
                }, 20 * 1000);
 
                activeImageGames.set(chatRoom, {
                    active: true,
                    ar: chosen.ar,
                    value: chosen.value,
                    timeout: timeout
                });
 
            }, 3000);
 
            return;
        }
 
        // أمر لعبة الكتابة الجماعية (.كتابة)
        if (command === '.كتابة') {
            const now = Date.now();
            const cooldown = 2 * 60 * 1000;
            const lastTime = writingGameCooldowns.get(chatRoom) || 0;
 
            if (now - lastTime < cooldown) {
                const minutesLeft = Math.ceil((cooldown - (now - lastTime)) / (1000 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎توك لاعبين الفعالية استنا : ${minutesLeft} دقائق 🕒*` }, { quoted: m });
                return;
            }
 
            if (activeWritingGames.has(chatRoom) && activeWritingGames.get(chatRoom).active) {
                await sock.sendMessage(chatRoom, { text: '*〄╎هناك فعالية كتابة جارية بالفعل ⚠️*' }, { quoted: m });
                return;
            }
 
            writingGameCooldowns.set(chatRoom, now);
 
            await sock.sendMessage(chatRoom, { text: '*〄╎كتابة تجهز ⛔ : 123...*' }, { quoted: m });
 
            setTimeout(async () => {
                const shuffled = [...writingPool].sort(() => 0.5 - Math.random());
                const chosenWords = shuffled.slice(0, 3);
 
                const questionText = `*〄╎${chosenWords[0]} - ${chosenWords[1]} - ${chosenWords[2]}*`;
 
                await sock.sendMessage(chatRoom, { text: questionText });
 
                const timeout = setTimeout(async () => {
                    if (activeWritingGames.has(chatRoom) && activeWritingGames.get(chatRoom).active) {
                        activeWritingGames.delete(chatRoom);
                        await sock.sendMessage(chatRoom, { text: '*〄╎تم انهاء الفعالية ⛔*' });
                    }
                }, 20 * 1000);
 
                activeWritingGames.set(chatRoom, {
                    active: true,
                    words: chosenWords,
                    userProgress: new Map(),
                    timeout: timeout
                });
 
            }, 3000);
 
            return;
        }
 
        // أمر سنارة الصيد (.سنارة) - كولداون 13 دقيقة مع استهلاك حبة
        if (command === '.سنارة') {
            const rodIndex = userData.inventory.indexOf("سنارة");
            if (rodIndex === -1) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ليس لديك سنارة! اشترها من المتجر أولاً 🎣*' }, { quoted: m });
                return;
            }
 
            const now = Date.now();
            const rodCooldown = 13 * 60 * 1000;
            if (now - (userData.lastRod || 0) < rodCooldown) {
                const minutesLeft = Math.ceil((rodCooldown - (now - userData.lastRod)) / (1000 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎يجب عليك الانتظار : ${minutesLeft} دقيقة لاستخدام السنارة مجدداً 🎣🕒*` }, { quoted: m });
                return;
            }
 
            userData.inventory.splice(rodIndex, 1);
            userData.lastRod = now;
 
            const roll = Math.random() * 100;
 
            if (roll < 15) {
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎لقد قام قرش بمحاولة قتلك فهربت و لم تحصل على شيئ 🦈*' }, { quoted: m });
            } else if (roll < 15 + 70) {
                const fishAmount = Math.floor(Math.random() * (99 - 70 + 1)) + 70;
                userData.resources.fish = (userData.resources.fish || 0) + fishAmount;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد قمت باصطياد ${fishAmount} سمكة عادية 🐟*` }, { quoted: m });
            } else if (roll < 15 + 70 + 20) {
                const rareAmount = Math.floor(Math.random() * (98 - 80 + 1)) + 80;
                userData.resources.rareFish = (userData.resources.rareFish || 0) + rareAmount;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد قمت باصطياد ${rareAmount} سمكة نادرة 🐠*` }, { quoted: m });
            } else if (roll < 15 + 70 + 20 + 4) {
                const crabAmount = Math.floor(Math.random() * (30 - 20 + 1)) + 20;
                userData.resources.crab = (userData.resources.crab || 0) + crabAmount;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد قمت باصطياد ${crabAmount} سلطعون 🦀*` }, { quoted: m });
            } else {
                userData.resources.octopus = (userData.resources.octopus || 0) + 1;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎لقد قمت باصطياد 1 اخطبوط 🦑*' }, { quoted: m });
            }
            return;
        }
 
        // أمر الصيد بالسلاح (.سلاح) - كولداون 13 دقيقة مع استهلاك حبة
        if (command === '.سلاح') {
            const gunIndex = userData.inventory.indexOf("سلاح");
            if (gunIndex === -1) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ليس لديك سلاح! اشتره من المتجر أولاً ⚔️*' }, { quoted: m });
                return;
            }
 
            const now = Date.now();
            const gunCooldown = 13 * 60 * 1000;
            if (now - (userData.lastGun || 0) < gunCooldown) {
                const minutesLeft = Math.ceil((gunCooldown - (now - userData.lastGun)) / (1000 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎يجب عليك الانتظار : ${minutesLeft} دقيقة لاستخدام السلاح مجدداً ⚔️🕒*` }, { quoted: m });
                return;
            }
 
            userData.inventory.splice(gunIndex, 1);
            userData.lastGun = now;
 
            const roll = Math.random() * 100;
 
            if (roll < 20) {
                userData.resources.rabbit = (userData.resources.rabbit || 0) + 10;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎لقد قمت بقتل ارنب 10 🐇*' }, { quoted: m });
            } else if (roll < 20 + 40) {
                userData.resources.sheep = (userData.resources.sheep || 0) + 1;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎لقد قمت بقتل خروف 1 🐑*' }, { quoted: m });
            } else if (roll < 20 + 40 + 10) {
                userData.resources.cow = (userData.resources.cow || 0) + 1;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎لقد قمت بقتل بقرة 1 🐄*' }, { quoted: m });
            } else if (roll < 20 + 40 + 10 + 1) {
                userData.resources.bull = (userData.resources.bull || 0) + 1;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎لقد قمت بقتل ثور 1 🐂*' }, { quoted: m });
            } else if (roll < 20 + 40 + 10 + 1 + 10) {
                userData.wallet -= 1000;
                if (userData.wallet < 0) userData.wallet = 0;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎لقد قمت بقتل غزال بالخطا 🦌 وتم تغريمك 1000$ 💸*' }, { quoted: m });
            } else {
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎لم تصد أي صيد هذه المرة ❌*' }, { quoted: m });
            }
            return;
        }
 
        // أمر لعبة النرد (.نرد) - 40 ثانية
        if (command === '.نرد') {
            const amountInput = args[1];
            if (!amountInput) {
                await sock.sendMessage(chatRoom, { text: '*〄╎اكتب المبلغ الذي تريد الرهان به بالنرد أو اكتب الكل 🎲*' }, { quoted: m });
                return;
            }
 
            const now = Date.now();
            const diceCooldown = 40 * 1000;
            if (now - (userData.lastDice || 0) < diceCooldown) {
                const secondsLeft = Math.ceil((diceCooldown - (now - userData.lastDice)) / 1000);
                await sock.sendMessage(chatRoom, { text: `*〄╎${secondsLeft} ثانيه 🕒*` }, { quoted: m });
                return;
            }
 
            let betAmount = amountInput === 'الكل' ? userData.wallet : parseInt(amountInput);
            if (isNaN(betAmount) || betAmount <= 0 || userData.wallet < betAmount) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ما عندك فلوس يهطف 😡*' }, { quoted: m });
                return;
            }
 
            userData.lastDice = now;
            saveData(users);
 
            const rollProb = Math.random() * 100;
            let diceNumber = 1;
 
            if (rollProb < 50) {
                diceNumber = Math.floor(Math.random() * 3) + 1;
            } else if (rollProb < 70) {
                diceNumber = 4;
            } else if (rollProb < 85) {
                diceNumber = 5;
            } else {
                diceNumber = 6;
            }
 
            if (diceNumber <= 3) {
                userData.wallet -= betAmount;
                if (userData.wallet < 0) userData.wallet = 0;
                saveData(users);
 
                const loseCaption = 
`*〄╎نرد 🎲*
 
*〄╎لقد سقط النرد على الرقم ${diceNumber} 🔴*
 
*〄╎وقد خسرت : $${betAmount} 💸*`;
 
                const imgBuffer = getCachedImage('nurdlose.jpg');
                if (imgBuffer) await sock.sendMessage(chatRoom, { image: imgBuffer, caption: loseCaption }, { quoted: m });
                else await sock.sendMessage(chatRoom, { text: loseCaption }, { quoted: m });
            } else if (diceNumber === 4) {
                const drawCaption = 
`*〄╎نرد 🎲*
 
*〄╎لقد سقط النرد على الرقم 4 ⚪*
 
*〄╎لم تحصل على شيئ : $0 💸*`;
 
                const imgBuffer = getCachedImage('nurddraw.jpg');
                if (imgBuffer) await sock.sendMessage(chatRoom, { image: imgBuffer, caption: drawCaption }, { quoted: m });
                else await sock.sendMessage(chatRoom, { text: drawCaption }, { quoted: m });
            } else if (diceNumber === 5) {
                userData.wallet += betAmount;
                saveData(users);
 
                const winCaption = 
`*〄╎نرد 🎲*
 
*〄╎لقد سقط النرد على الرقم 5 🟢*
 
*〄╎وقد فزت : $${betAmount} 💸*`;
 
                const imgBuffer = getCachedImage('nurdwin.jpg');
                if (imgBuffer) await sock.sendMessage(chatRoom, { image: imgBuffer, caption: winCaption }, { quoted: m });
                else await sock.sendMessage(chatRoom, { text: winCaption }, { quoted: m });
            } else if (diceNumber === 6) {
                const bonusEarned = Math.floor(betAmount * 1.30);
                userData.wallet += bonusEarned;
                saveData(users);
 
                const winBonusCaption = 
`*〄╎نرد 🎲*
 
*〄╎لقد سقط النرد على الرقم 6 وحصلت على بونس اضافي 🟢*
 
*〄╎وقد فزت : $${bonusEarned} 💸*`;
 
                const imgBuffer = getCachedImage('nurdwin.jpg');
                if (imgBuffer) await sock.sendMessage(chatRoom, { image: imgBuffer, caption: winBonusCaption }, { quoted: m });
                else await sock.sendMessage(chatRoom, { text: winBonusCaption }, { quoted: m });
            }
            return;
        }
 
        // أمر الاستثمار (.استثمار)
        if (command === '.استثمار') {
            const amountInput = args[1];
            if (!amountInput) {
                await sock.sendMessage(chatRoom, { text: '*〄╎اكتب المبلغ الذي تريد استثماره أو اكتب الكل ⚠️*' }, { quoted: m });
                return;
            }
 
            const now = Date.now();
            const investCooldown = 3 * 60 * 1000;
            if (now - (userData.lastInvestment || 0) < investCooldown) {
                const secondsLeft = Math.ceil((investCooldown - (now - userData.lastInvestment)) / 1000);
                await sock.sendMessage(chatRoom, { text: `*〄╎${secondsLeft} ثانيه 🕒*` }, { quoted: m });
                return;
            }
 
            let investAmount = amountInput === 'الكل' ? userData.wallet : parseInt(amountInput);
            if (isNaN(investAmount) || investAmount <= 0 || userData.wallet < investAmount) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ما عندك فلوس يهطف 😡*' }, { quoted: m });
                return;
            }
 
            userData.lastInvestment = now;
            saveData(users);
 
            const isWin = Math.random() < 0.40;
            const percent = Math.floor(Math.pow(Math.random(), 2) * 26) + 2;
 
            if (isWin) {
                const profit = Math.floor(investAmount * (percent / 100));
                userData.wallet += profit;
                saveData(users);
 
                const winCaption = 
`*〄╎استثمار 📈*
 
*〄╎لقد استثمرت ونجح استثمارك بنسبة ${percent}% 🟢*
 
*〄╎المبلغ لي فزته : $${profit} 💸*`;
 
                const imgBuffer = getCachedImage('win1.jpg');
                if (imgBuffer) {
                    await sock.sendMessage(chatRoom, { image: imgBuffer, caption: winCaption }, { quoted: m });
                } else {
                    await sock.sendMessage(chatRoom, { text: winCaption }, { quoted: m });
                }
            } else {
                const lossAmount = Math.floor(investAmount * (percent / 100));
                userData.wallet -= lossAmount;
                if (userData.wallet < 0) userData.wallet = 0;
                saveData(users);
 
                const loseCaption = 
`*〄╎استثمار 📉*
 
*〄╎لقد استثمرت و خسرت نسبة من استثمارك مقدرة بـ ${percent}% 🔴*
 
*〄╎المبلغ لي خسرته : $${lossAmount} 💸*`;
 
                const imgBuffer = getCachedImage('lose2.jpg');
                if (imgBuffer) {
                    await sock.sendMessage(chatRoom, { image: imgBuffer, caption: loseCaption }, { quoted: m });
                } else {
                    await sock.sendMessage(chatRoom, { text: loseCaption }, { quoted: m });
                }
            }
            return;
        }
 
        // أمر التداول (.تداول)
        if (command === '.تداول') {
            const amountInput = args[1];
            if (!amountInput) {
                await sock.sendMessage(chatRoom, { text: '*〄╎اكتب المبلغ الذي تريد تداوله أو اكتب الكل ⚠️*' }, { quoted: m });
                return;
            }
 
            const now = Date.now();
            const tradingCooldown = 3 * 60 * 1000;
            if (now - (userData.lastTrading || 0) < tradingCooldown) {
                const secondsLeft = Math.ceil((tradingCooldown - (now - userData.lastTrading)) / 1000);
                await sock.sendMessage(chatRoom, { text: `*〄╎${secondsLeft} ثانيه 🕒*` }, { quoted: m });
                return;
            }
 
            let investAmount = amountInput === 'الكل' ? userData.wallet : parseInt(amountInput);
            if (isNaN(investAmount) || investAmount <= 0 || userData.wallet < investAmount) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ما عندك فلوس يهطف 😡*' }, { quoted: m });
                return;
            }
 
            userData.lastTrading = now;
            saveData(users);
 
            const luckRoll = Math.floor(Math.random() * 150) + 1;
            let profitPercentNumber = luckRoll === 1 ? Math.floor(Math.random() * 31) + 10 : Math.floor(Math.random() * 3) + 1;
            const profit = Math.floor(investAmount * (profitPercentNumber / 100));
            userData.wallet += profit;
            saveData(users);
 
            const investCaption = 
`*〄╎تداول 📊*
 
*〄╎نجح تداولك بنسبة %${profitPercentNumber} 🟢*
 
*〄╎المبلغ المستثمر : $${investAmount} 💸*
*〄╎الربح المحقق : +$${profit} 💰*`;
 
            const imgBuffer = getCachedImage('tadawl.jpg');
            if (imgBuffer) {
                await sock.sendMessage(chatRoom, { image: imgBuffer, caption: investCaption }, { quoted: m });
            } else {
                await sock.sendMessage(chatRoom, { text: investCaption }, { quoted: m });
            }
            return;
        }
 
        // أمر قمار (.قمار)
        if (command === '.قمار') {
            const amountInput = args[1];
            if (!amountInput) return;
 
            if (amountInput === 'الكل' && userData.wallet <= 0) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ما عندك فلوس يهطف 😡*' }, { quoted: m });
                return;
            }
 
            const now = Date.now();
            const gambleCooldown = 40 * 1000;
            if (now - (userData.lastGambling || 0) < gambleCooldown) {
                const secondsLeft = Math.ceil((gambleCooldown - (now - userData.lastGambling)) / 1000);
                await sock.sendMessage(chatRoom, { text: `*〄╎${secondsLeft} ثانيه 🕒*` }, { quoted: m });
                return;
            }
 
            let betAmount = amountInput === 'الكل' ? userData.wallet : parseInt(amountInput);
            if (isNaN(betAmount) || betAmount <= 0) return;
 
            if (userData.wallet < betAmount) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ما عندك فلوس يهطف 😡*' }, { quoted: m });
                return;
            }
 
            userData.lastGambling = now;
            saveData(users);
 
            const randomChance = Math.floor(Math.random() * 100) + 1;
 
            if (randomChance <= 35) {
                userData.wallet += betAmount;
                saveData(users);
                const winCaption = `*〄╎قمار 🍀*\n\n*〄╎الحظ عندك رهيب 🟢*\n\n*〄╎المبلغ لي فزته : $${betAmount} 💸*`;
                const imgBuffer = getCachedImage('win.jpg');
                if (imgBuffer) await sock.sendMessage(chatRoom, { image: imgBuffer, caption: winCaption }, { quoted: m });
                else await sock.sendMessage(chatRoom, { text: winCaption }, { quoted: m });
            } else if (randomChance <= 50) {
                const drawCaption = `*〄╎قمار 🍀*\n\n*〄╎المرة الجاية ⚪*\n\n*〄╎المبلغ لي حصلته : $0 💸*`;
                const imgBuffer = getCachedImage('draw.jpg');
                if (imgBuffer) await sock.sendMessage(chatRoom, { image: imgBuffer, caption: drawCaption }, { quoted: m });
                else await sock.sendMessage(chatRoom, { text: drawCaption }, { quoted: m });
            } else {
                userData.wallet -= betAmount;
                saveData(users);
                const loseCaption = `*〄╎قمار 🍀*\n\n*〄╎الحظ عندك بيض 🔴*\n\n*〄╎المبلغ لي خسرته : $${betAmount} 💸*`;
                const imgBuffer = getCachedImage('lose.jpg');
                if (imgBuffer) await sock.sendMessage(chatRoom, { image: imgBuffer, caption: loseCaption }, { quoted: m });
                else await sock.sendMessage(chatRoom, { text: loseCaption }, { quoted: m });
            }
            return;
        }
 
        // أمر التنقيب (.مجرفة) - 6 دقائق
        if (command === '.مجرفة') {
            const shovelIndex = userData.inventory.indexOf("مجرفة");
            if (shovelIndex === -1) {
                await sock.sendMessage(chatRoom, { text: '*〄╎انت لا تملك هذا المنتوج لا يمكنك استخدامه 🚫*' }, { quoted: m });
                return;
            }
 
            const now = Date.now();
            const cooldown = 6 * 60 * 1000;
            if (now - (userData.lastShovel || 0) < cooldown) {
                const minutesLeft = Math.ceil((cooldown - (now - userData.lastShovel)) / (1000 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎${minutesLeft} دقائق 🕒*` }, { quoted: m });
                return;
            }
 
            userData.inventory.splice(shovelIndex, 1);
            userData.lastShovel = now;
 
            const roll = Math.random() * 100;
 
            if (roll < 45) {
                saveData(users);
                await sock.sendMessage(chatRoom, { text: '*〄╎لقد قمت بالحفر و حصلت على 🪏*\n\n*〄╎لا شيئ 😛*' }, { quoted: m });
            } else if (roll < 80) {
                const amount = getRandomWeightedAmount(1, 12);
                userData.resources.coal = (userData.resources.coal || 0) + amount;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد قمت بالحفر و حصلت على 🪏*\n\n*〄╎${amount} فحم 🪨*` }, { quoted: m });
            } else if (roll < 92) {
                const amount = getRandomWeightedAmount(1, 8);
                userData.resources.iron = (userData.resources.iron || 0) + amount;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد قمت بالحفر و حصلت على 🪏*\n\n*〄╎${amount} حديد 🔩*` }, { quoted: m });
            } else if (roll < 97) {
                const amount = getRandomWeightedAmount(1, 4);
                userData.resources.gold = (userData.resources.gold || 0) + amount;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد قمت بالحفر و حصلت على 🪏*\n\n*〄╎${amount} ذهب 🪙*` }, { quoted: m });
            } else if (roll < 99.2) {
                const amount = getRandomWeightedAmount(1, 2);
                userData.resources.ruby = (userData.resources.ruby || 0) + amount;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد قمت بالحفر و حصلت على 🪏*\n\n*〄╎${amount} ياقوت 🪩*` }, { quoted: m });
            } else {
                userData.resources.diamond = (userData.resources.diamond || 0) + 1;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد قمت بالحفر و حصلت على 🪏*\n\n*〄╎1 دايموند 💎*` }, { quoted: m });
            }
            return;
        }
 
        // أمر زراعة البذور (.بذور)
        if (command === '.بذور') {
            const seedIndex = userData.inventory.indexOf("بذور");
            if (seedIndex === -1) {
                await sock.sendMessage(chatRoom, { text: '*〄╎انت لا تملك هذا المنتوج لا يمكنك استخدامه 🚫*' }, { quoted: m });
                return;
            }
 
            userData.inventory.splice(seedIndex, 1);
            const amount = Math.floor(Math.random() * 26) + 5;
            const fruitTypes = ['apple', 'banana', 'watermelon'];
            const chosenFruit = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
 
            if (chosenFruit === 'apple') {
                userData.resources.apple = (userData.resources.apple || 0) + amount;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد حصلت على ${amount} من التفاح 🍎*` }, { quoted: m });
            } else if (chosenFruit === 'banana') {
                userData.resources.banana = (userData.resources.banana || 0) + amount;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد حصلت على ${amount} من الموز 🍌*` }, { quoted: m });
            } else {
                userData.resources.watermelon = (userData.resources.watermelon || 0) + amount;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد حصلت على ${amount} من البطيخ 🍈*` }, { quoted: m });
            }
            return;
        }
 
        // أمر السوق (.سوق) مع رياكت ➡️
        if (command === '.سوق') {
            const prices = getCurrentMarketPrices();
            const marketText = 
`*〄╎المبيعات و السوق حاليا ✅*
 
*╎سعر الفحم 🪨 : $${prices.coal}*
 
*╎سعر الحديد 🔩 : $${prices.iron}*
 
*╎سعر الذهب 🪙 : $${prices.gold}*
 
*╎سعر الياقوت 🪩 : $${prices.ruby}*
 
*╎سعر الدايموند 💎 : $${prices.diamond}*
 
*╎سعر التفاح 🍎 : $${prices.apple}*
 
*╎سعر الموز 🍌 : $${prices.banana}*
 
*╎سعر البطيخ 🍈 : $${prices.watermelon}*
 
*〄╎يمكن للسعر ان يتغير بين فترة و اخرى 🚨* 
 
*〄╎سوي رياكت ➡️ عشان تشوف القائمة لي بعدها*`;
 
            const sentMsg = await sock.sendMessage(chatRoom, { text: marketText }, { quoted: m });
            if (sentMsg && sentMsg.key?.id) {
                marketPageMessages.set(sentMsg.key.id, { user: sender });
            }
            return;
        }
 
        // أمر البيع (.بيع) المعدل بالكامل لعرض سعر القطعة الواحدة
        if (command === '.بيع') {
            const itemType = args[1] ? args[1].toLowerCase() : '';
            const amountInput = args[2] ? args[2].toLowerCase() : '';
 
            const marketPrices = getCurrentMarketPrices();
            const resourceMap = {
                'فحم': { key: 'coal', name: 'الفحم', emoji: '🪨', price: marketPrices.coal, dynamic: false },
                'حديد': { key: 'iron', name: 'الحديد', emoji: '🔩', price: marketPrices.iron, dynamic: false },
                'ذهب': { key: 'gold', name: 'الذهب', emoji: '🪙', price: marketPrices.gold, dynamic: false },
                'ياقوت': { key: 'ruby', name: 'الياقوت', emoji: '🪩', price: marketPrices.ruby, dynamic: false },
                'دايموند': { key: 'diamond', name: 'الدايموند', emoji: '💎', price: marketPrices.diamond, dynamic: false },
                'تفاح': { key: 'apple', name: 'التفاح', emoji: '🍎', price: marketPrices.apple, dynamic: false },
                'موز': { key: 'banana', name: 'الموز', emoji: '🍌', price: marketPrices.banana, dynamic: false },
                'بطيخ': { key: 'watermelon', name: 'البطيخ', emoji: '🍈', price: marketPrices.watermelon, dynamic: false },
                'سمكة': { key: 'fish', name: 'السمكة العادية', emoji: '🐟', price: marketPrices.fish, dynamic: true },
                'سمكة نادرة': { key: 'rareFish', name: 'السمكة النادرة', emoji: '🐠', price: marketPrices.rareFish, dynamic: true },
                'سلطعون': { key: 'crab', name: 'السلطعون', emoji: '🦀', price: marketPrices.crab, dynamic: true },
                'اخطبوط': { key: 'octopus', name: 'الأخطبوط', emoji: '🦑', price: marketPrices.octopus, dynamic: false },
                'ارنب': { key: 'rabbit', name: 'الأرنب', emoji: '🐇', price: marketPrices.rabbit, dynamic: false },
                'خروف': { key: 'sheep', name: 'الخروف', emoji: '🐑', price: marketPrices.sheep, dynamic: false },
                'بقرة': { key: 'cow', name: 'البقرة', emoji: '🐄', price: marketPrices.cow, dynamic: false },
                'ثور': { key: 'bull', name: 'الثور', emoji: '🐂', price: marketPrices.bull, dynamic: false }
            };
 
            let searchKey = itemType;
            if (itemType === 'سمكة' && args[2] === 'نادرة') {
                searchKey = 'سمكة نادرة';
            }
 
            if (!resourceMap[searchKey]) {
                const helpText = 
`*〄╎بيع 🛍️*
 
\`〄╎مثال: .بيع فحم الكل أو 100\``;
                await sock.sendMessage(chatRoom, { text: helpText }, { quoted: m });
                return;
            }
 
            const resInfo = resourceMap[searchKey];
            const userResCount = userData.resources[resInfo.key] || 0;
 
            if (userResCount <= 0) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ما عندك يهطف وش تبيع 🚫*' }, { quoted: m });
                return;
            }
 
            let sellAmount = 0;
            const targetAmountInput = searchKey === 'سمكة نادرة' ? args[3] : amountInput;
 
            if (targetAmountInput === 'الكل' || !targetAmountInput) {
                sellAmount = userResCount;
            } else {
                sellAmount = parseInt(targetAmountInput);
                if (isNaN(sellAmount) || sellAmount <= 0) {
                    sellAmount = userResCount;
                }
            }
 
            if (sellAmount > userResCount) {
                sellAmount = userResCount;
            }
 
            const totalEarned = sellAmount * resInfo.price;
            userData.resources[resInfo.key] -= sellAmount;
            userData.wallet += totalEarned;
            saveData(users);
 
            let sellMsg = "";
            if (resInfo.dynamic) {
                sellMsg = 
`*〄╎لقد بعت ${sellAmount} من ${resInfo.name} ${resInfo.emoji}*
 
*〄╎بقيمة : $${resInfo.price} 💲*
 
*〄╎وحصلت على مبلغ : $${totalEarned} 💸*`;
            } else {
                sellMsg = 
`*〄╎لقد بعت ${sellAmount} من ${resInfo.name} ${resInfo.emoji}*
 
*〄╎وحصلت على مبلغ : $${totalEarned} 💸*`;
            }
 
            await sock.sendMessage(chatRoom, { text: sellMsg }, { quoted: m });
            return;
        }
 
        // أمر النهب (.نهب)
        if (command === '.نهب') {
            const mentionedJid = m.message.extendedTextMessage?.contextInfo?.mentionedJid;
            if (!mentionedJid || mentionedJid.length === 0) {
                await sock.sendMessage(chatRoom, { text: '*〄╎منشن الشخص الذي تريد نهبه ⚠️*' }, { quoted: m });
                return;
            }
 
            const targetUser = mentionedJid[0];
            if (targetUser === sender) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ما تقدر تسرق نفسك يا بطل ❌*' }, { quoted: m });
                return;
            }
 
            const robIndex = userData.inventory.indexOf("نهب");
            if (robIndex === -1) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ليس لديك أداة نهب في أغراضك! اشترها من المتجر 💊*' }, { quoted: m });
                return;
            }
 
            const now = Date.now();
            const cooldown = 5 * 60 * 1000;
            if (now - (userData.lastRob || 0) < cooldown) {
                const minutesLeft = Math.ceil((cooldown - (now - userData.lastRob)) / (1000 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎${minutesLeft} دقائق 🕒*` }, { quoted: m });
                return;
            }
 
            const targetData = getUserData(users, targetUser);
 
            const targetShieldIndex = targetData.inventory.indexOf("حماية");
            if (targetData.wallet <= 0 || targetShieldIndex !== -1) {
                userData.inventory.splice(robIndex, 1);
                userData.lastRob = now;
                saveData(users);
 
                if (targetShieldIndex !== -1) {
                    targetData.inventory.splice(targetShieldIndex, 1);
                    saveData(users);
                }
 
                await sock.sendMessage(chatRoom, { text: `*〄╎مسكوك يهطف وما قدرت تسرقه 😡*` }, { quoted: m });
                return;
            }
 
            let minPercent = 0;
            let maxPercent = 0;
            const targetWallet = targetData.wallet;
 
            if (targetWallet <= 100000) {
                minPercent = 0.05;
                maxPercent = 0.07;
            } else if (targetWallet <= 100000000) {
                minPercent = 0.01;
                maxPercent = 0.05;
            } else {
                minPercent = 0.001;
                maxPercent = 0.005;
            }
 
            const randomPercent = Math.random() * (maxPercent - minPercent) + minPercent;
            let stolenAmount = Math.floor(targetWallet * randomPercent);
            if (stolenAmount < 1) stolenAmount = 1;
            if (stolenAmount > targetWallet) stolenAmount = targetWallet;
 
            userData.inventory.splice(robIndex, 1);
            userData.lastRob = now;
            targetData.wallet -= stolenAmount;
            userData.wallet += stolenAmount;
            saveData(users);
 
            const targetTag = '@' + targetUser.split('@')[0];
            const robResultMsg = 
`*〄╎لقد قمت بمحاولة نهب ${targetTag} و تمت العمليه بنجاح ✅*
 
*〄╎وقد استطعت نهب $${stolenAmount} 💸*`;
 
            await sock.sendMessage(chatRoom, { text: robResultMsg, mentions: [targetUser] }, { quoted: m });
            return;
        }
 
        // أمر .اغراضي
        if (command === '.اغراضي') {
            const invText = formatInventory(userData);
            let imageName = 'inventory.jpg';
            if (userData.activeTheme === 'ice') imageName = 'iceb.jpg';
            else if (userData.activeTheme === 'dino') imageName = 'dinainv.jpg';
            else if (userData.activeTheme === 'space') imageName = 'spacinv.jpg';
            else if (userData.activeTheme === 'jungle') imageName = 'juninv.jpg';
 
            const imgBuffer = getCachedImage(imageName);
 
            if (imgBuffer) {
                await sock.sendMessage(chatRoom, { image: imgBuffer, caption: invText }, { quoted: m });
            } else {
                await sock.sendMessage(chatRoom, { text: invText }, { quoted: m });
            }
            return;
        }
 
        // أمر المتجر (.متجر)
        if (command === '.متجر' || command === 'متجر') {
            const shopText = 
`*〄╎المتجر 🛒*
 
*1️⃣╎قسم الشراء 🧭*
 
*2️⃣╎قسم التطويرات 📊*
 
*3️⃣╎قسم الاضافات 🍀*
 
*4️⃣╎قسم التخصيص 🔰*
 
*5️⃣╎قسم الالقاب 📌*
 
*〄╎╎لتفعيل الاقسام يرجى وضع رياكت على هذه الرسالة بنفس رقم القسم الذي تريده 🚨*`;
 
            const imgBuffer = getCachedImage('shop.jpg');
            let sentMsg;
            if (imgBuffer) {
                sentMsg = await sock.sendMessage(chatRoom, { image: imgBuffer, caption: shopText }, { quoted: m });
            } else {
                sentMsg = await sock.sendMessage(chatRoom, { text: shopText }, { quoted: m });
            }
 
            if (sentMsg && sentMsg.key?.id) {
                mainShopMessages.set(sentMsg.key.id, sender);
            }
        }
 
        // أمر قائمة الأوامر (.اوامر)
        if (command === '.اوامر' || command === 'اوامر') {
            const cleanMenuText = 
`*〄╎ الاوامر الموجوده بالبوت 📜*
*𝟷 .اوامر*
*𝟸 .محفظة*
*𝟹 .اغراضي*
*𝟺 .بنك*
*𝟻 .متجر*
*𝟼 .توب*
*𝟽 .يومي*
*𝟾 .راتب*
*𝟿 .نرد*
*𝟷𝟶 .قمار*
*𝟷𝟷 .تداول*
*𝟷𝟸 .استثمار*
*𝟷𝟹 .تحويل*
*𝟷𝟺 .ايداع*
*𝟷𝟻 .سحب*
*𝟷𝟼 .نهب*
*𝟷𝟽 .سنارة*
*𝟷𝟾 .سلاح*
*𝟷𝟿 .سوق*
*𝟸𝟶 .بيع*
*𝟸𝟷 .صور*
*𝟸𝟸 .تفكيك*
*𝟸𝟹 .كتابة*
*𝟸𝟺 .اعلام*
*𝟸𝟻 .تركيب*
*〄╎ الأوامر التفاعلية 🍥*
*𝟷 .كت*
*𝟸 .زواج*`;
 
            await sock.sendMessage(chatRoom, { text: cleanMenuText }, { quoted: m });
        }
 
        // أمر المحفظة (.محفظة) بالصيغة المطلوبة
        if (command === '.محفظة') {
            const totalMoney = userData.wallet + (userData.bank || 0);
            const userTitleDisplay = userData.activeTitle ? userData.activeTitle : 'لايوجد 🔸';
 
            const walletCaption = 
`*〄╎محفظتي 🪙*
 
*〄╎المبلغ الموجود بمحفظتك : $${totalMoney} 💸*
 
*〄╎المستوى : ${userData.level}Lvl 🆙*
 
*〄╎مساحة البنك : ${bankSpaceDisplay} 🏦*
 
*〄╎لقبك : ${userTitleDisplay}*`;
 
            let imageName = 'wallet.jpg';
            if (userData.activeTheme === 'ice') imageName = 'icex.jpg';
            else if (userData.activeTheme === 'dino') imageName = 'dinabb.jpg';
            else if (userData.activeTheme === 'space') imageName = 'spacbb.jpg';
            else if (userData.activeTheme === 'jungle') imageName = 'junbb.jpg';
 
            const imgBuffer = getCachedImage(imageName);
 
            if (imgBuffer) {
                await sock.sendMessage(chatRoom, { image: imgBuffer, caption: walletCaption }, { quoted: m });
            } else {
                await sock.sendMessage(chatRoom, { text: walletCaption }, { quoted: m });
            }
            return;
        }
 
        // أمر البنك (.بنك)
        if (command === '.بنك') {
            const bankCaption = 
`*〄╎البنك 🏦*
 
*〄╎المبلغ الحالي للاستخدام : $${userData.wallet} 💸* 
 
*〄╎المبلغ الموجود بالبنك : $${userData.bank || 0} 💰*
 
*〄╎مساحة البنك : ${bankSpaceDisplay} 🆙*`;
 
            let imageName = 'bank.jpg';
            if (userData.activeTheme === 'ice') imageName = 'icev.jpg';
            else if (userData.activeTheme === 'dino') imageName = 'dinabank.jpg';
            else if (userData.activeTheme === 'space') imageName = 'spacbank.jpg';
            else if (userData.activeTheme === 'jungle') imageName = 'junbank.jpg';
 
            const imgBuffer = getCachedImage(imageName);
 
            if (imgBuffer) {
                await sock.sendMessage(chatRoom, { image: imgBuffer, caption: bankCaption }, { quoted: m });
            } else {
                await sock.sendMessage(chatRoom, { text: bankCaption }, { quoted: m });
            }
            return;
        }
 
        // أوامر المركبات
        if (command === '.سيارة') {
            if (!userData.inventory.includes('سيارة')) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ليس لديك سيارة! يمكنك شرائها من المتجر 🚙*' }, { quoted: m });
                return;
            }
            const now = Date.now();
            const cooldown = 15 * 60 * 1000;
            if (now - (userData.lastCar || 0) < cooldown) {
                const minutesLeft = Math.ceil((cooldown - (now - userData.lastCar)) / (1000 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎${minutesLeft} دقائق 🕒*` }, { quoted: m });
                return;
            }
 
            userData.lastCar = now;
            const successChance = Math.floor(Math.random() * 100) + 1;
            if (successChance <= 70) {
                const reward = 2500;
                userData.wallet += reward;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد قمت بتوصيل بعض الركاب وتم مكافئتك 🪙*\n\n*💰╎$${reward} 💸*` }, { quoted: m });
            } else {
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎انفجرت احد اطارات السيارة لا رحلات اليوم ❌*` }, { quoted: m });
            }
        }
 
        if (command === '.حافلة') {
            if (!userData.inventory.includes('حافلة')) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ليس لديك حافلة! يمكنك شرائها من المتجر 🚌*' }, { quoted: m });
                return;
            }
            const now = Date.now();
            const cooldown = 15 * 60 * 1000;
            if (now - (userData.lastBus || 0) < cooldown) {
                const minutesLeft = Math.ceil((cooldown - (now - userData.lastBus)) / (1000 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎${minutesLeft} دقائق 🕒*` }, { quoted: m });
                return;
            }
 
            userData.lastBus = now;
            const successChance = Math.floor(Math.random() * 100) + 1;
            if (successChance <= 70) {
                userData.wallet += 5500;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد قمت بنقل عدد من العمال و تمت مكافئتك 🪙*\n\n*💰╎$5500 💸*` }, { quoted: m });
            } else {
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎انفجرت احد اطارات الحافلة لا رحلات اليوم ❌*` }, { quoted: m });
            }
        }
 
        if (command === '.قطار') {
            if (!userData.inventory.includes('قطار')) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ليس لديك قطار! يمكنك شرائه من المتجر 🚝*' }, { quoted: m });
                return;
            }
            const now = Date.now();
            const cooldown = 30 * 60 * 1000;
            if (now - (userData.lastTrain || 0) < cooldown) {
                const minutesLeft = Math.ceil((cooldown - (now - userData.lastTrain)) / (1000 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎${minutesLeft} دقائق 🕒*` }, { quoted: m });
                return;
            }
 
            userData.lastTrain = now;
            const successChance = Math.floor(Math.random() * 100) + 1;
            if (successChance <= 90) {
                userData.wallet += 9000;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد قمت بنقل كمية كبيره من الفحم و اخذت اجرة بقيمة 🪙*\n\n*💰╎$9000 💸*` }, { quoted: m });
            } else {
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد كنت مصابا من اخر عملية نقل لذا لم تذهب للعمل ❌*` }, { quoted: m });
            }
        }
 
        if (command === '.باخرة') {
            if (!userData.inventory.includes('باخرة')) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ليس لديك باخرة! يمكنك شرائها من المتجر 🚢*' }, { quoted: m });
                return;
            }
            const now = Date.now();
            const cooldown = 40 * 60 * 1000;
            if (now - (userData.lastShip || 0) < cooldown) {
                const minutesLeft = Math.ceil((cooldown - (now - userData.lastShip)) / (1000 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎${minutesLeft} دقائق 🕒*` }, { quoted: m });
                return;
            }
 
            userData.lastShip = now;
            const captainChance = Math.floor(Math.random() * 100) + 1;
            if (captainChance <= 30) {
                userData.wallet += 23000;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد كنت كابتن مثالي في هذه الرحلة وتم مكافئتك 🪙*\n\n*💰╎$23000 💸*` }, { quoted: m });
            } else {
                userData.wallet += 14000;
                saveData(users);
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد كنت كابتن عادي في هذه الرحلة وتم مكافئتك 🪙*\n\n*💰╎$14000 💸*` }, { quoted: m });
            }
        }
 
        if (command === '.طائرة') {
            if (!userData.inventory.includes('طائرة')) {
                await sock.sendMessage(chatRoom, { text: '*〄╎ليس لديك طائرة! يمكنك شرائها من المتجر ✈️*' }, { quoted: m });
                return;
            }
            const now = Date.now();
            const cooldown = 8 * 60 * 60 * 1000;
            if (now - (userData.lastPlane || 0) < cooldown) {
                const hoursLeft = Math.ceil((cooldown - (now - userData.lastPlane)) / (1000 * 60 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎${hoursLeft} ساعات 🕒*` }, { quoted: m });
                return;
            }
 
            userData.lastPlane = now;
            userData.wallet += 60000;
            saveData(users);
            await sock.sendMessage(chatRoom, { text: `*〄╎لقد انهيت رحلة اليوم بسلام وتم اعطائك بقشيش كاضافة 🪙*\n\n*💰╎$60000 💸*` }, { quoted: m });
        }
 
        // أمر الراتب (.راتب)
        if (command === '.راتب') {
            const now = Date.now();
            const cooldown = 60 * 60 * 1000;
            if (now - (userData.lastSalary || 0) >= cooldown) {
                const salaryAmount = 1000 + ((userData.level - 1) * 500);
                userData.wallet += salaryAmount;
                userData.lastSalary = now;
                saveData(users);
 
                const successMsg = 
`💵 | *تم استلام راتبك بنجاح!*
 
➕ | *المبلغ المضاف : $${salaryAmount} 💸*
💰 | *رصيدك الحالي : $${userData.wallet} 💸*`;
 
                await sock.sendMessage(chatRoom, { text: successMsg }, { quoted: m });
            } else {
                const timeLeft = cooldown - (now - userData.lastSalary);
                const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد استلمت راتبك مؤخراً ⏳*\n\n*〄╎${minutesLeft} دقيقة 🕒*` }, { quoted: m });
            }
        }
 
        // أمر اليومي (.يومي)
        if (command === '.يومي') {
            const now = Date.now();
            const cooldown = 24 * 60 * 60 * 1000;
            if (now - (userData.lastDaily || 0) >= cooldown) {
                userData.wallet += 3000;
                userData.lastDaily = now;
                saveData(users);
 
                const successMsg = 
`🎁 | *تم استلام يوميتك بنجاح!*
 
➕ | *المبلغ المضاف : $3000 💸*
💰 | *رصيدك الحالي : $${userData.wallet} 💸*`;
 
                await sock.sendMessage(chatRoom, { text: successMsg }, { quoted: m });
            } else {
                const timeLeft = cooldown - (now - userData.lastDaily);
                const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد استلمت يوميتك مؤخراً ⏳*\n\n*〄╎${hoursLeft} ساعة 🕒*` }, { quoted: m });
            }
        }
 
        // أمر التحويل (.تحويل)
        if (command === '.تحويل') {
            const mentionedJid = m.message.extendedTextMessage?.contextInfo?.mentionedJid;
            const amountInput = args[2];
            if (!mentionedJid || mentionedJid.length === 0 || !amountInput) return;
 
            const now = Date.now();
            const transferCooldown = 20 * 60 * 60 * 1000;
            if (now - (userData.lastTransfer || 0) < transferCooldown) {
                await sock.sendMessage(chatRoom, { text: `*〄╎لقد حولت مسبقا ⏳*\n \n*〄╎يمكنك التحويل بعد 20 ساعه 🕒*` }, { quoted: m });
                return;
            }
 
            const targetUser = mentionedJid[0];
            let transferAmount = amountInput === 'الكل' ? userData.wallet : parseInt(amountInput);
 
            if (isNaN(transferAmount) || transferAmount <= 0 || userData.wallet < transferAmount) return;
 
            userData.lastTransfer = now;
            const tax = Math.floor(transferAmount * 0.10);
            const finalAmount = transferAmount - tax;
            userData.wallet -= transferAmount;
 
            const targetData = getUserData(users, targetUser);
            targetData.wallet += finalAmount;
            saveData(users);
 
            const targetTag = '@' + targetUser.split('@')[0];
            const transferMsg = 
`*〄╎لقد قمت بتحويل : $${finalAmount} 💰*
 
*〄╎الى ${targetTag} 🌕*
 
*〄╎لقد تم خصم 10% من المبلغ 💲*`;
 
            await sock.sendMessage(chatRoom, { text: transferMsg, mentions: [targetUser] }, { quoted: m });
        }
 
        // أمر إيداع (.ايداع)
        if (command === '.ايداع') {
            const amountInput = args[1];
            if (!amountInput) return;
 
            let amountToDeposit = amountInput === 'الكل' ? userData.wallet : parseInt(amountInput);
            if (isNaN(amountToDeposit) || amountToDeposit <= 0 || userData.wallet < amountToDeposit) return;
            if ((userData.bank || 0) + amountToDeposit > maxBankLimit) return;
 
            userData.wallet -= amountToDeposit;
            userData.bank = (userData.bank || 0) + amountToDeposit;
            saveData(users);
            await sock.sendMessage(chatRoom, { text: `*〄╎المبلغ المداع : $${amountToDeposit} 💸*` }, { quoted: m });
        }
 
        // أمر سحب (.سحب)
        if (command === '.سحب') {
            const amountInput = args[1];
            if (!amountInput) return;
 
            let amountToWithdraw = amountInput === 'الكل' ? (userData.bank || 0) : parseInt(amountInput);
            if (isNaN(amountToWithdraw) || amountToWithdraw <= 0 || (userData.bank || 0) < amountToWithdraw) return;
 
            userData.bank -= amountToWithdraw;
            userData.wallet += amountToWithdraw;
            saveData(users);
            await sock.sendMessage(chatRoom, { text: `*〄╎المبلغ المسحوب : $${amountToWithdraw} 💸*` }, { quoted: m });
        }
    });
}
 
connectToWhatsApp();