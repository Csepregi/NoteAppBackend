const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors');

app.use(express.static('build'))

app.use(cors())
app.use(bodyParser.json())

let notes = [
	{
		id: 1,
		content: "HTML is easy",
		date: "2019-05-30T17:30:31.098Z",
		important: true
	},
	{
		id: 2,
		content: "Browser can execute only Javascript",
		date: "2019-05-30T18:39:34.091Z",
		important: false
	},
	{
		id: 3,
		content: "GET and POST are the most important methods of HTTP protocol",
		date: "2019-05-30T19:20:14.298Z",
		important: true
	}
]
const requestLogger = (request, response, next) => {
	console.log('Method:', request.method)
	console.log('Path:  ', request.path)
	console.log('Body:  ', request.body)
	console.log('---')
	next()
}

app.use(requestLogger)

const generateId = () => {
	const maxId = notes.length > 0
		? Math.max(...notes.map(n => n.id))
		: 0
	return maxId + 1
}

app.get('/', (req, res) => {
	res.send('<h1>Hello World!</h1>')
})

app.post('/api/notes', (req, res) => {
	const body = req.body
	if (!body.content) {
		return response.status(400).json({
			error: 'content missing'
		})
	}
	const note = {
		content: body.content,
		important: body.important || false,
		date: new Date(),
		id: generateId(),
	}

	notes = notes.concat(note)
	res.json(note);
})

app.get('/api/notes', (req, res) => {
	res.json(notes)
})

app.get('/api/notes/:id', (request, response) => {
	const id = Number(request.params.id)
	const note = notes.find(note => {
		console.log(note.id, typeof note.id, id, typeof id, note.id === id)
		return note.id === id
	})
	if (note) {
		response.json(note)
	} else {
		response.status(404).end()
	}
})


app.delete('/api/notes/:id', (request, response) => {
	const id = Number(request.params.id)
	notes = notes.filter(note => note.id !== id)

	response.status(204).end()
})


const unknownEndpoint = (request, response) => {
	response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})
