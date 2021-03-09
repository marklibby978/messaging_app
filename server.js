// Note:  Use NPM to get the Express Framework, like so:
//            o Go to Terminal and type:
//            o npm install -s express
//        The dash-s option adds the dependency to your package.json "dependencies" object.
let express = require('express')
// JSON Parser:  npm install -s body-parser
let bodyParser = require('body-parser')
// Mongoose = elegant mongodb object modeling for node.js:  npm install -s mongoose
let mongoose = require('mongoose')

// Instantiate an express app:
let app = express()
// To use socket.io, which will notify us when new messages come in so we don't
// have to constantly refresh, we have to set up an http server first:
let http = require('http').Server(app)
// Now get a socket.io instance and pass a reference to http:
let io = require('socket.io')(http)

// Let the app know to get the static files from the current directory:
app.use(express.static(__dirname))
// Let bodyParser know we expect JSON to be coming in with our http request:
app.use(bodyParser.json())
// Set URL-encoded:
app.use(bodyParser.urlencoded({extended: false}))

const dbUrl = 'mongodb+srv://mark-libby-dev:Lnkd1n-Lrnig@learning-node-cluster0.rbpay.mongodb.net/learning-node-cluster0?retryWrites=true&w=majority'

let Message = mongoose.model('Message', {
    name: String,
    message: String
})

app.get('/messages', ((req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages)
    })
}))

app.get('/messages/:user', ((req, res) => {
    let user = req.params.user
    Message.find({name: user}, (err, messages) => {
        res.send(messages)
    })
}))

/*
++++ The below is "callback hell" because of the levels of nesting.
     Following that is the better way to do it using "promises."

app.post('/messages', ((req, res) => {
    let message = new Message(req.body)
    message.save((err) => {
        if (err)
            sendStatus(500)

        Message.findOne({message: "badword"}, (err, censored) => {
            if (censored) {
                console.log('censored words found', censored)
                // Let's remove the censored message:
                Message.deleteOne({_id: censored.id}, (err) => {
                    console.log(err? err : 'removed censored message')
                })
            }
        })
        // We need to emit to all clients that a message has been posted.
        // We will call the event 'message' and emit the request body with it:
        io.emit('message', req.body)
        // Note:  We will also need to add an event-listener to the frontend.

        res.sendStatus(200)
    })
}))

+++ PROMISES +++
app.post('/messages', (req, res) => {
    let message = new Message(req.body)

    message.save()
    .then(() => {
        console.log('message saved')
        return Message.findOne({message: "badword"})
    })
    .then(censored => {
        if (censored) {
            console.log('censored words found', censored)
            return Message.deleteOne({_id: censored.id})
        }
        io.emit('message', req.body)
        res.sendStatus(200)
    })
    .catch((err) => {
        res.sendStatus(500)
        return console.error(err)
    })
})

+++ ASYNC AWAIT +++
Below (uncommented) is an even better way to do it.
Adding 'async' allows us to use 'await' which makes our asynchronous
code seem more synchronous.
 */

app.post('/messages', async(req, res) => {
    try {
        let message = new Message(req.body)

        let savedMessage = await message.save()
        console.log('message saved')

        let censored = await Message.findOne({message: "badword"})
        if (censored) {
            console.log('censored words found', censored)
            await Message.deleteOne({_id: censored.id})
        }
        else
            io.emit('message', req.body)

        res.sendStatus(200)
    } catch (error) {
        res.sendStatus(500)
        return console.error(error)
    }
})

io.on('connection', (socket) => {
    console.log('a user connected')
})

mongoose.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
    console.log(err? err : 'MongoDB connection')

    // Message.findByIdAndDelete('602054464512bf2a0ce6b900', (err, doc) => {
    //     console.log(err? err : 'Msg id 602054464512bf2a0ce6b900 successfully deleted')
    // })
})

let server = http.listen(3000, () => {
    console.log('server is listening on port', server.address().port)
})
