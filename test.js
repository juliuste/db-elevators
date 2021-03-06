'use strict'

const tapeWithoutPromise = require('tape')
const addPromiseSupport = require('tape-promise').default
const tape = addPromiseSupport(tapeWithoutPromise)
const queryOsm = require('@derhuerst/query-overpass')
const stations = require('db-stations/full')
const { point } = require('@turf/helpers')
const distance = require('@turf/distance').default
const chunk = require('lodash/chunk')

const elevators = require('.')

tape('base dataset', t => {
	elevators.forEach(elevator => {
		const matchingStations = stations.filter(station => station.id === elevator.station)
		t.ok(matchingStations.length === 1, 'matching station')
		t.ok(typeof elevator.id === 'string' && elevator.id.length > 0, 'elevator id')
		if (elevator.description) t.ok(typeof elevator.description === 'string' && elevator.description.length > 0, 'elevator description')
		if (elevator.osmNodeId) t.ok(typeof elevator.osmNodeId === 'string' && elevator.osmNodeId.length > 0, 'elevator osmNodeId')
	})
	t.ok(elevators.filter(elevator => !!elevator.description).length >= 5, 'elevators with description')
	t.ok(elevators.filter(elevator => !!elevator.osmNodeId).length >= 5, 'elevators with osmNodeId')
	t.end()
})

tape('upstream osm', async t => {
	// @todo distance to matching elevator (if available)
	const elementsWithOsm = elevators.filter(item => !!item.osmNodeId)
	for (const elementsWithOsmChunk of chunk(elementsWithOsm, 100)) {
		const osmQuery = `[out:json][timeout:20]; ${elementsWithOsmChunk.map(item => `node(${item.osmNodeId}); out body;`).join('\n')}`
		const osmResults = await queryOsm(osmQuery, { retryOpts: { retries: 3, minTimeout: 20000 }, endpoint: 'https://overpass.nchc.org.tw/api/interpreter' })
		elementsWithOsmChunk.forEach(element => {
			const matching = osmResults.find(item => String(item.id) === String(element.osmNodeId))
			t.ok(matching, `matching osm element ${element.osmNodeId}`)
			if (matching) {
				t.ok(matching.tags && (matching.tags.highway === 'elevator' || matching.tags.construction === 'elevator'), `highway=elevator ${element.osmNodeId}`)
				const elementLocation = point([element.location.longitude, element.location.latitude])
				const osmLocation = point([matching.lon, matching.lat])
				t.ok(distance(elementLocation, osmLocation) <= 0.1, `distance <= 100m ${element.osmNodeId}`)
			}
		})
	}
	t.end()
})
