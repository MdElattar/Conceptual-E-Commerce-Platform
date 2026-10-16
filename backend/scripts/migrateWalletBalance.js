const mongoose = require("mongoose");
const User = require("../models/userModel");

async function migrateWalletBalance() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/equipment-website");
    console.log("Connected to MongoDB");

    const vendors = await User.find({
      role: "vendor",
      "vendorProfile.balance": { $gt: 0 },
    });

    console.log(`Found ${vendors.length} vendors with legacy balance > 0`);

    let totalMigrated = 0;
    const batch = [];

    for (const vendor of vendors) {
      const legacyBalance = vendor.vendorProfile.balance || 0;
      if (legacyBalance > 0) {
        totalMigrated += legacyBalance;
        batch.push({
          updateOne: {
            filter: { _id: vendor._id },
            update: {
              $inc: { "vendorProfile.availableBalance": legacyBalance },
              $set: { "vendorProfile.balance": 0 },
            },
          },
        });
      }
    }

    if (batch.length > 0) {
      const result = await User.bulkWrite(batch);
      console.log(`Migrated ${result.modifiedCount} vendor records`);
    }

    console.log(`Total funds migrated: $${totalMigrated.toFixed(2)}`);
    console.log("Wallet balance migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateWalletBalance();
