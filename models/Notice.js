
const mongoose = require("mongoose");

const NoticeSchema = new mongoose.Schema({
    notice: {
        type: String,
        default: ""
    }

}, { timetamps: true })
module.exports = mongoose.model("Notice", NoticeSchema);