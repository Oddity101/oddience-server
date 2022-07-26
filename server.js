const app = require('./app');
const connectDatabase = require('./config/connectDatabase');
const bcrypt = require('bcrypt')

require('dotenv').config({path: './config/config.env'});

connectDatabase()

app.listen(process.env.PORT, () => {
    console.log(`Server running on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode`)
})

app.get('/', async (req, res, next) => {
    console.log(process.env);
    res.send('Online')
})