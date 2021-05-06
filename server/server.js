const path = require('path')
const mongoose = require('mongoose')

const Document = require('./Document')

require('dotenv').config({
    path: path.join(path.dirname(require.main.filename), 'huehue.env'),
})

const connectDBString = process.env.DB_URL.replace('<password>', process.env.DB_PASSWORD);

mongoose.connect(connectDBString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
}).then(()=> {
    console.log("DB Connected!")
}).catch((err)=>{
    console.log(err)
})

const io = require('socket.io')(3001, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
})

io.on('connection', (socket) => {
    socket.on('get-document', async (documentId) => {
        const document = await findOrCreateDocument(documentId)
        // Joins room
        socket.join(documentId)
        // Loads the data we have already
        socket.emit('load-document', document.data)

        socket.on('send-changes', (delta) => {
            socket.broadcast.to(documentId).emit('receive-changes', delta)
        })

        socket.on('save-document', async (data) => {
            await Document.findByIdAndUpdate(documentId, { data })
        })
    })
})

const defaultValue = ""

async function findOrCreateDocument(id) {
    if (id == null) return

    const document = await Document.findById(id)
    if (document) return document
    return await Document.create({_id: id, data: defaultValue})
}