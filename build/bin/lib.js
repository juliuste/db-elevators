'use strict'

const isUICLocationCode = require('is-uic-location-code')
const chalk = require('chalk')
const textPrompt = require('text-prompt')
const selectPrompt = require('select-prompt')
const autocompletePrompt = require('cli-autocomplete')
const uniq = require('lodash/uniq')
const got = require('got')
const elevators = require('../..')

const findStations = async query => {
	const { body } = await got.get('https://2.db.transport.rest/stations', {
		query: {
			results: 100,
			query,
		},
		json: true,
	})
	return body
}

// stations
const id9to7 = id => id.length === 9 && id.slice(0, 2) === '00' ? id.slice(2) : id
const isStationId = (s) => /^\d{7}$/.test(s.toString())
const parseStation = (query) => {
	if (isStationId(query)) {
		return elevators.filter(e => e.station === query)
	}
	throw new Error('Station not found.')
}
const suggestStations = unknownOnly => async (input) => {
	if (!input || input === '') return []
	const stations = await findStations(input)
	const validStations = stations.filter(s => isUICLocationCode(id9to7(s.id))).map(({ name, id, location }) => ({ title: [name, id9to7(id)].join(' - '), value: { name, id: id9to7(id), location } }))
	if (!unknownOnly) return validStations
	return validStations.filter(({ value }) => {
		const incompleteStations = uniq(elevators.filter(item => !item.osmNodeId).map(item => item.station))
		return incompleteStations.includes(value.id)
	}).filter((element, index) => index < 5)
}
const queryStation = (msg, { unknownOnly }) => new Promise((resolve, reject) => {
	autocompletePrompt(chalk.bold(msg), suggestStations(unknownOnly))
		.on('submit', resolve)
		.on('abort', (val) => {
			reject(new Error(`Rejected with ${val}.`))
		})
})

// element id
const queryElementId = (msg, options) => new Promise((resolve, reject) => {
	selectPrompt(msg, options)
		.on('abort', (v) => reject(new Error(`Rejected with ${v}.`)))
		.on('submit', resolve)
})

// osm node id
const verifyOsmNodeId = (x) => {
	if (typeof x !== 'string' || x.length === 0) throw new Error('Invalid OSM node id.')
}
const queryOsmNodeId = (msg) => new Promise((resolve, reject) =>
	textPrompt(msg)
		.on('submit', resolve)
		.on('abort', (v) => reject(new Error(`Rejected with ${v}.`))),
)

module.exports = {
	queryStation,
	parseStation,
	queryElementId,
	queryOsmNodeId,
	verifyOsmNodeId,
}
