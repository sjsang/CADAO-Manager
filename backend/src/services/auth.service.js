const bcrypt = require('bcrypt');
const db = require('../config/db.js');
const { generateToken, verifyToken } = require("../utils/jwt");
const authRepository = require('../repositories/auth.repository');

const loginAdmin = async (username, password) => {
    try {
        const admin = await authRepository.loginAdmin(username);
        if (!admin) {
            throw new Error('Admin not found');
        }
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            throw new Error('Invalid password');
        }

        await db.query(
            `DELETE FROM user_tokens WHERE user_id = $1`,
            [admin.id]
        );

        const token = generateToken({
            id: admin.id,
            role: admin.role,
            username: admin.username
        });
        await db.query(
            `INSERT INTO user_tokens (user_id, token, expires_at)
            VALUES ($1, $2, NOW() + INTERVAL '12 hours')`,
            [admin.id, token]
        );
        return token;
    } catch (error) {
        console.error('Error logging in admin:', error);
        throw new Error('Failed to log in admin');
    }
};

const hashPassword = async (password) => {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
};

const registerCustomer = async (customerData) => {
    try {
        const customerId = await authRepository.registerCustomer(customerData);
        return customerId;
    } catch (error) {
        console.error('Error registering customer:', error);
        throw new Error('Failed to register customer');
    }
};

const loginCustomer = async (email, password) => {
    try {
        const customer = await authRepository.loginCustomer(email);
        if (!customer) {
            throw new Error('Customer not found');
        }
        const isMatch = await bcrypt.compare(password, customer.password_hash);
        if (!isMatch) {
            throw new Error('Invalid password');
        }

        await db.query(
            `DELETE FROM user_tokens WHERE customer_id = $1`,
            [customer.id]
        );

        const token = generateToken({
            id: customer.id,
            role: 'customer',
        });

        await db.query(
            `INSERT INTO user_tokens (customer_id, token, expires_at)
            VALUES ($1, $2, NOW() + INTERVAL '12 hours')`,
            [customer.id, token]
        );

        return token;
    } catch (error) {
        console.error('Error logging in customer:', error);
        throw new Error('Failed to log in customer');
    }
};

const logoutCustomer = async (token) => {
    await db.query(
        `DELETE FROM user_tokens WHERE token = $1`,
        [token]
    );
};

const getCustomerById = async (id) => {
    return await authRepository.getCustomerById(id);
}

module.exports = {
    loginAdmin,
    hashPassword,
    registerCustomer,
    loginCustomer,
    logoutCustomer,
    getCustomerById
};