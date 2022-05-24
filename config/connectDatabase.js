const mongoose = require('mongoose');

module.exports = async() => {
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: false,
        useUnifiedTopology: false
    }).then(connection => {
        console.log(`Successfully connected to database at ${connection.connection.host}`)
    }).catch(err => {
        console.log(err)
    })
}