const express = require('express');
require('dotenv').config();

const postsRouter = require('./routes/posts.routes')
const userRoutes = require('./routes/user.routes')

const cors = require('cors')
const path = require('path')

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json( { extended: true }))

app.use('/api', postsRouter)
app.use('/api', userRoutes)

app.listen(PORT, () => console.log('Server started'))