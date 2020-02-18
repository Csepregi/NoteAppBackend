const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Note = require('../models/note')

beforeEach(async () => {
	await Note.deleteMany({})
	console.log('cleared')

	const noteObjects = helper.initialNotes
		.map(note => new Note(note))
	const promiseArray = noteObjects.map(note => note.save())
	await Promise.all(promiseArray)
	//const results = await Promise.all(promiseArray)

	//for guarantees a specific execution order.
	// for (let note of helper.initialNotes) {
	// 	let noteObject = new Note(note)
	// 	await noteObject.save()
	// }

	// let noteObject = new Note(helper.initialNotes[0])
	// await noteObject.save()

	// noteObject = new Note(helper.initialNotes[1])
	// await noteObject.save()
})

describe('when there is initially some notes saved', () => {

	test('notes are returned as json', async () => {
		await api
			.get('/api/notes')
			.expect(200)
			.expect('Content-Type', /application\/json/)
	})

	test('all notes are returned', async () => {
		const response = await api.get('/api/notes')

		expect(response.body.length).toBe(helper.initialNotes.length)
	})

	test('a specific note is within the returned notes', async () => {
		const response = await api.get('/api/notes')
		const contents = response.body.map(r => r.content)

		expect(contents).toContain(
			'Browser can execute only Javascript'
		)
	})

	describe('viewing a specific note', async () => {
		test('succeeed with a valid id', async () => {
			const noteAtStart = await helper.notesInDb()

			const noteToView = noteAtStart[0]

			const resultNote = await api
				.get(`/api/notes/${noteToView.id}`)
				.expect(200)
				.expect('Content-Type', /application\/json/)

			expect(resultNote.body).toEqual(noteToView)
		})

		test('fails with statuscode 404 if note does note exist', async () => {
			const validNoteExistingId = await helper.nonExistingId()
			console.log(validNoteExistingId)
			await api
				.get(`/api/notes/${validNoteExistingId}`)
				.expect(404)
		})

		test('fails with statuscode 400 id is invalid', async () => {
			const invalidId = '5a3d5da59070081a82a3445'
			await api
				.get(`/api/notes/${invalidId}`)
				.expect(400)
		})
	})

	describe('addition of a new note', async () => {
		test('a valid note can be added ', async () => {
			const newNote = {
				content: 'async/await simplifies making async calls',
				important: true,
			}

			await api
				.post('/api/notes')
				.send(newNote)
				.expect(200)
				.expect('Content-Type', /application\/json/)

			const notesAtEnd = await helper.notesInDb()
			expect(notesAtEnd.length).toBe(helper.initialNotes.length + 1)

			const contents = notesAtEnd.map(n => n.content)

			expect(contents).toContain(
				'async/await simplifies making async calls'
			)
		})
		test('note without content is not added', async () => {
			const newNote = {
				important: true
			}

			await api
				.post('/api/notes')
				.send(newNote)
				.expect(400)

			const notesAtEnd = await helper.notesInDb()

			expect(notesAtEnd.length).toBe(helper.initialNotes.length)
		})
	})


	describe('deletion of a note', async () => {
		test('a note can be deleted', async () => {
			const notesAtStart = await helper.notesInDb()
			const noteToDelete = notesAtStart[0]

			await api
				.delete(`/api/notes/${noteToDelete.id}`)
				.expect(204)

			const notesAtEnd = await helper.notesInDb()

			expect(notesAtEnd.length).toBe(
				helper.initialNotes.length - 1
			)

			const contents = notesAtEnd.map(r => r.content)

			expect(contents).not.toContain(noteToDelete.content)
		})
	})
})

afterAll(() => {
	mongoose.connection.close()
})