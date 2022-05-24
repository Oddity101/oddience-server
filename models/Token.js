const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    dateCreated: {
        type: Date,
        default: new Date(Date.now())
    }
})

module.exports = mongoose.model('token', tokenSchema)