const db = require('./db');
const { v4: uuidv4 } = require('uuid');

async function createUser(whatsappNumber, name) {
    try {
        const userId = uuidv4(); // Generate a new UUID

        const result = await db.one(
            `INSERT INTO users (id, whatsapp_number, name)
         VALUES ($1, $2, $3)
         RETURNING id`,
            [userId, whatsappNumber, name]
        );
        await updateLastSeen(result.id)
        console.log(`[ Users Database ] - Successfully created user for ${name} with number ${whatsappNumber}. User Id = ${result.id}`);
        return result.id;
    } catch (error) {
        console.error('[ ERROR ][ Users Database ] - Error creating user:', error);
        throw error;
    }
}

async function getUserByWhatsAppNumber(whatsappNumber) {
    try {
        const user = await db.oneOrNone(
            `SELECT * FROM users WHERE whatsapp_number = $1`,
            whatsappNumber
        );
        if (user) {
            console.log(`[ Users Database ] - Successfully retrieved user for number: ${whatsappNumber}: ${user}`);
        } else {
            console.log(`[ Users Database ] - No record found for a user with whatsapp number: ${whatsappNumber}`);

        }
        return user;
    } catch (error) {
        console.error('[ ERROR ][ Users Database ] - Error retrieving user:', error);
        throw error;
    }
}


async function updateLastSeen(userId) {
    try {
        await db.none(
            `UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = $1`,
            userId
        );
        console.log(`[ Users Database ] - Successfully updated last seen for user with id ${userId}`);
    } catch (error) {
        console.error(`[ ERROR ][ Users Database ] - Error updating last seen for user with id ${userId}: `, error);
        throw error;
    }
}

module.exports = {
    getUserByWhatsAppNumber,
    createUser,
    updateLastSeen
};