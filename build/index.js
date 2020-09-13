'use strict'

const download = require('./download')
const streamToPromise = require('get-stream').array
const ndjson = require('ndjson')
const fs = require('fs')
const { resolve } = require('path')

const mergeOsmDataWithStatic = (osmData, fetchedElevators) => {
	const elevators = JSON.parse(JSON.stringify(fetchedElevators))
	osmData.forEach(row => {
		const { id, osmNodeId, stationName } = row
		if (!id || !stationName) throw new Error(`invalid entry "${JSON.stringify(row)}"`)

		const matching = elevators.filter(item => item.id === id)
		if (matching.length < 1) return console.error(`WARNING: no matching entries found in original dataset for elevator "${id}", skipping`)
		if (matching.length > 1) return console.error(`WARNING: multiple matching entries found in original dataset for elevator "${id}", skipping`)
		const [item] = matching

		if (item.osmNodeId) throw new Error(`duplicate osm data for elevator "${id}"`)
		item.osmNodeId = osmNodeId
	})
	return elevators
}

const build = async () => {
	const elevators = await download()
	const osmDataStream = fs.createReadStream(resolve(__dirname, '../osm.ndjson')).pipe(ndjson.parse())
	const osmData = await streamToPromise(osmDataStream)
	return mergeOsmDataWithStatic(osmData, elevators)
}

build()
	.then(res => process.stdout.write(JSON.stringify(res)))
	.catch(console.error)
