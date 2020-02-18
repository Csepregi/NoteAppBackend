const notesRouter = require('express').Router()
const Note = require('../models/note')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

const getTokenForm = request => {
	const authorization = request.get('authorization')
	if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
		return authorization.substring(7)
	}
	return null
}

notesRouter.get('/', async (request, response) => {
	const notes = await Note
		.find({}).populate('user', { username: 1, name: 1 })
	response.json(notes.map(note => note.toJSON()))
})

notesRouter.get('/:id', async (request, response, next) => {
	try {
		const note = await Note.findById(request.params.id)
		if (note) {
			response.json(note.toJSON())
		} else {
			response.status(404).end()
		}
	} catch (e) {
		next(e)
	}

	// Note.findById(request.params.id).then(note => {
	// 	if (note) {
	// 		response.json(note.toJSON())
	// 	} else {
	// 		response.status(404).end()
	// 	}
	// })
	// 	.catch(error => next(error))
})

notesRouter.post('/', async (request, response, next) => {
	const body = request.body

	const token = getTokenForm(request)

	try {
		const decodedToken = jwt.verify(token, process.env.SECRET)
		if (!token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)

		const note = new Note({
			content: body.content,
			important: body.important || false,
			date: new Date(),
			user: user._id
		})

		const savedNote = await note.save()
		user.notes = user.notes.concat(savedNote._id)
		await user.save()
		response.json(savedNote.toJSON())
	} catch (e) {
		next(e)
	}

	// note
	// 	.save()
	// 	.then(savedNote => savedNote.toJSON())
	// 	.then(savedAndFormattedNote => {
	// 		response.json(savedAndFormattedNote)
	// 	})
	// 	.catch(error => next(error))
})


notesRouter.delete('/:id', async (request, response, next) => {
	try {
		await Note.findByIdAndRemove(request.params.id)
		response.status(204).end()
	} catch (e) {
		next(e)
	}
	// Note.findByIdAndRemove(request.params.id)
	// 	.then(result => {
	// 		response.status(204).end()
	// 	})
	// 	.catch(error => next(error))

	// response.status(204).end()
})

notesRouter.put('/:id', (request, response, next) => {
	const body = request.body

	const note = {
		content: body.content,
		important: body.important,
	}

	Note.findByIdAndUpdate(request.params.id, note, { new: true })
		.then(updatedNote => {
			response.json(updatedNote.toJSON())
		})
		.catch(error => next(error))
})

module.exports = notesRouter