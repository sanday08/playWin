const mongoose = require('mongoose');


const Bet = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    game: {
        type: String,
        enum: ["parity", "fastParity", "dice", "andarBahar"], //if you write admin than its display error "`admin` is not a valid enum value for path`role`".
        required: true
    },
    bet: Number,
    winPosition: {
        type: String,
        default: ""
    },
    startAmount: Number,

    position: {
        type: Object,
        required: true
    },
    won: {
        type: Number,
        default: 0
    },
    DrTime: {
        type: String,
        default: istdate.getHours().toString() + " : " + istdate.getMinutes().toString() + " : " + istdate.getSeconds().toString(),
    },
    DrDate: {
        type: String,
        default: istdate.getFullYear().toString() + "-" + (istdate.getMonth() + 1).toString() + "-" + istdate.getDate().toString(),
    },

}, { timestamps: true })

module.exports = mongoose.model("Bet", BetSchema);