'use strict'

const got = require('got')
const SchemaValidator = require('ajv')
const dbStations = require('db-stations/data')
const { get } = require('lodash')
const { flow, map, filter, omit } = require('lodash/fp')

const fastaSchema = {
	type: 'array',
	items: {
		type: 'object',
		properties: {
			equipmentnumber: { type: 'number', minimum: 1 },
			type: { type: 'string', enum: ['ESCALATOR', 'ELEVATOR'] },
			description: { type: 'string', minLength: 1, nullable: true },
			stationnumber: { type: 'number', minimum: 1 },
			geocoordX: { type: 'number', maximum: 180, minimum: -180, nullable: true },
			geocoordY: { type: 'number', maximum: 90, minimum: -90, nullable: true }
		},
		required: ['equipmentnumber', 'type', 'stationnumber']
	},
	minItems: 200
}

const validateWithoutError = new SchemaValidator({ nullable: true, allErrors: true }).compile(fastaSchema)
const validateFasta = fastaData => {
	const valid = validateWithoutError(fastaData)
	if (!valid) throw new Error('fasta data doesn\'t match schema')
}

const getStation = nr => get(dbStations.find(s => s.nr === nr), 'id')

const transformEntry = e => {
	return {
		id: String(e.equipmentnumber),
		description: e.description || null,
		station: getStation(e.stationnumber),
		location: (e.geocoordX && e.geocoordY) ? {
			longitude: e.geocoordX,
			latitude: e.geocoordY
		} : null,
		type: e.type.toLowerCase()
	}
}

const isElevator = e => e.type === 'elevator'
const entryHasStation = e => !!e.station

const download = async () => {
	const resource = 'https://api.deutschebahn.com/fasta/v2/facilities'
	const { body: data } = await got.get(resource, {
		json: true,
		headers: {
			Authorization: 'Bearer 83a59e0844becfcd386eca18df2c1fe6'
		}
	})
	validateFasta(data)
	return flow([
		map(transformEntry),
		filter(isElevator),
		map(omit(['type'])),
		filter(e => {
			if (entryHasStation(e)) return true
			console.error('entry without station, skipping', e.id)
		})
	])(data)
}

module.exports = download
