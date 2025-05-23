require("dotenv").config();
const Profile = require("./src/database/models/economy/profile");
const mongoose = require("mongoose");
const logger = require("./src/utils/logger");

mongoose.connection.on("err", (err) => {
    console.error(`Mongoose connection error: ${err.stack}`);
});

mongoose.connection.on("disconnected", () => {
    console.log(`Mongoose connection lost`);
});

mongoose.connection.on("connected", () => {
    console.log(`Mongoose connection connected!`);
});

mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

mongoose.connect(process.env.MONGO).catch((e) => {
    console.error("Database failed to connect:", e.message);
    process.exit(1);
});

async function migrateToGlobalProfiles() {
    const allProfiles = await Profile.find({});
    const mergedProfiles = new Map();

    for (const profile of allProfiles) {
        const id = profile.userID;

        if (!mergedProfiles.has(id)) {
            mergedProfiles.set(id, {
                userID: id,
                wallet: parseInt(profile.wallet) || 0,
                bank: parseInt(profile.bank) || 0,
                xp: parseInt(profile.xp) || 0,
                bankCapacity: parseInt(profile.bankCapacity) || 0,
                lastDaily: profile.lastDaily,
                lastWeekly: profile.lastWeekly,
                lastMonthly: profile.lastMonthly,
                lastBeg: profile.lastBeg,
                lastRob: profile.lastRob,
                passiveUpdated: profile.passiveUpdated,
                hasInfiniteStorage: profile.hasInfiniteStorage || false,
            });
        } else {
            const existing = mergedProfiles.get(id);
            existing.wallet += profile.wallet || 0;
            existing.bank += profile.bank || 0;
            existing.bankCapacity += 0;
            existing.xp += profile.xp || 0;
        }
    }

    await Profile.deleteMany({});

    await Profile.insertMany([...mergedProfiles.values()]);

    console.log("Migration to global profiles complete!");
    mongoose.disconnect();
    process.exit();
}

migrateToGlobalProfiles().catch(console.error);