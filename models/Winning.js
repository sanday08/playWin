const mongoose = require("mongoose");
//This Model Use for decide admin Percent
const WinningSchema = new mongoose.Schema({
    percent: {
        type: Number,
        default: 0
    }

}, { timestamps: true })
module.exports = mongoose.model("Winning", WinningSchema);