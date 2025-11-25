// auth.js - نظام المصادقة والإدارة
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.users = [];
        this.admins = [];
        this.blacklist = { emails: [], plates: [] };
        this.init();
    }

    init() {
        this.loadUsers();
        this.loadAdmins();
        this.loadBlacklist();
        this.checkLoginStatus();
    }

    // تحميل البيانات من localStorage
    loadUsers() {
        const savedUsers = localStorage.getItem('parkingUsers');
        this.users = savedUsers ? JSON.parse(savedUsers) : [];
    }

    loadAdmins() {
        const savedAdmins = localStorage.getItem('parkingAdmins');
        this.admins = savedAdmins ? JSON.parse(savedAdmins) : [
            { email: 'admin@ecu.edu.eg', password: 'admin123', name: 'System Administrator' }
        ];
    }

    loadBlacklist() {
        const savedBlacklist = localStorage.getItem('parkingBlacklist');
        this.blacklist = savedBlacklist ? JSON.parse(savedBlacklist) : {
            emails: [],
            plates: []
        };
    }

    // حفظ البيانات
    saveUsers() {
        localStorage.setItem('parkingUsers', JSON.stringify(this.users));
    }

    saveAdmins() {
        localStorage.setItem('parkingAdmins', JSON.stringify(this.admins));
    }

    saveBlacklist() {
        localStorage.setItem('parkingBlacklist', JSON.stringify(this.blacklist));
    }

    // تسجيل الدخول
    login(email, password, isAdmin = false) {
        if (this.isBlacklisted(email)) {
            return { success: false, message: 'Account is blocked. Please contact administrator.' };
        }

        if (isAdmin) {
            const admin = this.admins.find(a => a.email === email && a.password === password);
            if (admin) {
                this.currentUser = admin;
                this.isAdmin = true;
                this.saveLoginState();
                return { success: true, isAdmin: true };
            }
        } else {
            const user = this.users.find(u => u.email === email && u.password === password);
            if (user) {
                if (this.isBlacklisted(user.email) || this.isBlacklisted(user.plateNumber)) {
                    return { success: false, message: 'Account is blocked. Please contact administrator.' };
                }
                this.currentUser = user;
                this.isAdmin = false;
                this.saveLoginState();
                return { success: true, isAdmin: false };
            }
        }

        return { success: false, message: 'Invalid email or password' };
    }

    // تسجيل الخروج
    logout() {
        this.currentUser = null;
        this.isAdmin = false;
        localStorage.removeItem('currentParkingUser');
        window.location.href = 'index.html';
    }

    // التحقق من الحظر
    isBlacklisted(identifier) {
        return this.blacklist.emails.includes(identifier) || this.blacklist.plates.includes(identifier);
    }

    // حفظ حالة التسجيل
    saveLoginState() {
        localStorage.setItem('currentParkingUser', JSON.stringify({
            user: this.currentUser,
            isAdmin: this.isAdmin,
            loginTime: new Date().toISOString()
        }));
    }

    // التحقق من حالة التسجيل
    checkLoginStatus() {
        const saved = localStorage.getItem('currentParkingUser');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data && data.user) {
                    this.currentUser = data.user;
                    this.isAdmin = data.isAdmin;
                    return true;
                }
            } catch (e) {
                console.error('Error parsing saved login state:', e);
            }
        }
        return false;
    }

    // التسجيل كمستخدم جديد
    register(userData) {
        if (this.users.find(u => u.email === userData.email)) {
            return { success: false, message: 'Email already registered' };
        }

        if (this.users.find(u => u.plateNumber === userData.plateNumber)) {
            return { success: false, message: 'Plate number already registered' };
        }

        const newUser = {
            id: Date.now().toString(),
            ...userData,
            registrationDate: new Date().toISOString(),
            status: 'active',
            reservations: []
        };

        this.users.push(newUser);
        this.saveUsers();
        return { success: true, user: newUser };
    }

    // إدارة الحظر
    blockUser(identifier, type = 'email') {
        if (type === 'email' && !this.blacklist.emails.includes(identifier)) {
            this.blacklist.emails.push(identifier);
        } else if (type === 'plate' && !this.blacklist.plates.includes(identifier)) {
            this.blacklist.plates.push(identifier);
        }
        this.saveBlacklist();
    }

    unblockUser(identifier, type = 'email') {
        if (type === 'email') {
            this.blacklist.emails = this.blacklist.emails.filter(e => e !== identifier);
        } else if (type === 'plate') {
            this.blacklist.plates = this.blacklist.plates.filter(p => p !== identifier);
        }
        this.saveBlacklist();
    }

    // الحصول على جميع المستخدمين
    getAllUsers() {
        return this.users;
    }

    // تحديث بيانات المستخدم
    updateUser(userId, updates) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            this.saveUsers();
            return true;
        }
        return false;
    }
}

// Initialize auth system as global variable
const auth = new AuthSystem();