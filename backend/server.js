const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, 'data');
const dbFile = path.join(dataDir, 'database.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const initDb = async () => {
    if (!fs.existsSync(dbFile)) {
        const hashedAdmin = await bcrypt.hash('admin123', 8);
        const initialData = {
            users: [
                { id: 1, username: 'admin', password: hashedAdmin, role: 'admin', status: 'approved' }
            ],
            items: [
                { id: 1, name: 'Furuno EPIRB Tester', serial_number: 'EP-9921', category: 'GMDSS / Safety', status: 'Available', current_holder: '-', holder_username: null },
                { id: 2, name: 'RF Power Watt Meter', serial_number: 'WM-4410', category: 'Radio Comms', status: 'Available', current_holder: '-', holder_username: null },
                { id: 3, name: 'JRC Navtex Receiver Tester', serial_number: 'NX-8820', category: 'Navigation', status: 'Available', current_holder: '-', holder_username: null },
                { id: 4, name: 'VHF Handheld Transceiver', serial_number: 'IC-M85-02', category: 'Radio Comms', status: 'Available', current_holder: '-', holder_username: null },
                { id: 5, name: 'Heavy Duty Cordless Drill', serial_number: 'DR-1029', category: 'Tools', status: 'Available', current_holder: '-', holder_username: null }
            ]
        };
        fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2));
    }
};
initDb();

const readDb = () => JSON.parse(fs.readFileSync(dbFile, 'utf8'));
const writeDb = (data) => fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'marine_navcom_secret_key', resave: false, saveUninitialized: false }));

const auth = (req, res, next) => req.session.user ? next() : res.status(401).json({ error: 'Unauthorized' });
const admin = (req, res, next) => req.session.user?.role === 'admin' ? next() : res.status(403).json({ error: 'Admin only' });

// Register new user (Strict unique username check, case-insensitive)
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'All fields required' });
    
    const db = readDb();
    const cleanUsername = username.trim();
    
    const existingUser = db.users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    db.users.push({
        id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
        username: cleanUsername,
        password: hashedPassword,
        role: 'user',
        status: 'pending'
    });
    writeDb(db);
    res.json({ success: true, message: 'Registration submitted. Waiting for admin approval.' });
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const db = readDb();
    const user = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'Invalid username or password' });
    }
    if (user.status !== 'approved') {
        return res.status(403).json({ error: 'Your account is pending administrator approval.' });
    }

    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ success: true, user: req.session.user });
});

app.get('/api/check-session', (req, res) => {
    if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
    else res.json({ loggedIn: false });
});

app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ success: true })));

app.get('/api/admin/users', admin, (req, res) => {
    const db = readDb();
    res.json(db.users);
});

app.post('/api/admin/approve/:id', admin, (req, res) => {
    const db = readDb();
    const user = db.users.find(u => u.id == req.params.id);
    if (user) {
        user.status = 'approved';
        writeDb(db);
    }
    res.json({ success: true });
});

app.delete('/api/admin/users/:id', admin, (req, res) => {
    const db = readDb();
    db.users = db.users.filter(u => u.id != req.params.id);
    writeDb(db);
    res.json({ success: true });
});

app.post('/api/reset-password', async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    const db = readDb();
    const user = db.users.find(u => u.username === username);

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.session.user?.role !== 'admin') {
        if (!oldPassword || !(await bcrypt.compare(oldPassword, user.password))) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }
    }

    user.password = await bcrypt.hash(newPassword, 8);
    writeDb(db);
    res.json({ success: true, message: 'Password updated successfully' });
});

app.get('/api/items', auth, (req, res) => {
    const db = readDb();
    res.json(db.items.sort((a, b) => b.id - a.id));
});

app.post('/api/items', admin, (req, res) => {
    const db = readDb();
    const newItem = {
        id: db.items.length > 0 ? Math.max(...db.items.map(i => i.id)) + 1 : 1,
        name: req.body.name,
        serial_number: req.body.serial_number || '',
        category: req.body.category || 'General',
        status: 'Available',
        current_holder: '-',
        holder_username: null
    };
    db.items.push(newItem);
    writeDb(db);
    res.json({ success: true });
});

app.post('/api/items/:id/checkout', auth, (req, res) => {
    const db = readDb();
    const item = db.items.find(i => i.id == req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    
    if (item.status === 'In Use') {
        return res.status(400).json({ error: 'Item is already checked out by another user.' });
    }

    const locationInfo = req.body.location ? ` - ${req.body.location}` : '';
    item.status = 'In Use';
    item.holder_username = req.session.user.username;
    item.current_holder = `${req.session.user.username}${locationInfo}`;
    writeDb(db);
    res.json({ success: true });
});

app.post('/api/items/:id/return', auth, (req, res) => {
    const db = readDb();
    const item = db.items.find(i => i.id == req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    // Restrict return: Only the person who checked it out OR an admin can return it
    const isOwner = item.holder_username === req.session.user.username;
    const isAdmin = req.session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Only the user who checked out this item (or an Admin) can return it.' });
    }

    item.status = 'Available';
    item.current_holder = '-';
    item.holder_username = null;
    writeDb(db);
    res.json({ success: true });
});

app.delete('/api/items/:id', admin, (req, res) => {
    const db = readDb();
    db.items = db.items.filter(i => i.id != req.params.id);
    writeDb(db);
    res.json({ success: true });
});

const frontendBuild = path.join(__dirname, 'public');
if (fs.existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild));
    app.get('*', (req, res) => res.sendFile(path.join(frontendBuild, 'index.html')));
}

app.listen(PORT, () => console.log(`NavCom Inventory server running on port ${PORT}`));