#!/usr/bin/env node
'use strict'

const mri = require('mri')
const chalk = require('chalk')
const fs = require('fs')
const { spawn } = require('child_process')

const pkg = require('../../package.json')
const { queryStation, parseStation, queryElementId, queryOsmNodeId, verifyOsmNodeId } = require('./lib')

const argv = mri(process.argv.slice(2), {
	boolean: ['help', 'h', 'version', 'v'],
})

const opt = {
	datafile: argv._[0] || './osm.ndjson',
	help: argv.help || argv.h,
	version: argv.version || argv.v,
	open: argv['auto-open'] || argv.o,
	unknownOnly: argv['unknown-only'] || argv.u,
}

if (opt.help === true) {
	process.stdout.write(`
db-elevators-cli [datafile] [options]

Arguments:
    datafile        NDJSON data file path (default: './osm.ndjson').

Options:
	--auto-open     -o Open OpenStreetMap around stations automatically (only on mac OS, using 'open' CLI)
	--unknown-only  -u Only suggest stations/elevators that don't have associated OSM data yet
    --help          -h Show help dialogue (this)
    --version       -v Show version
`)
	process.exit(0)
}

if (opt.version === true) {
	process.stdout.write(`db-elevators-cli v${pkg.version}\n`)
	process.exit(0)
}

const showError = function (err) {
	if (process.env.NODE_DEBUG === 'db-elevators-cli') console.error(err)
	process.stderr.write(chalk.red(err.message) + '\n')
	process.exit(err.code || 1)
}

const main = async (opt) => {
	// query arrival station
	const { id: station, name: stationName, location: stationLocation } = await queryStation('Which station?', { unknownOnly: opt.unknownOnly })
	const elevators = await parseStation(station)

	const selectable = elevators.filter(p => !opt.unknownOnly || !p.osmNodeId)

	if (stationLocation && opt.open) {
		const { latitude, longitude } = stationLocation
		const url = `https://www.openstreetmap.org/query?lat=${latitude}&lon=${longitude}#map=17/${latitude}/${longitude}`
		spawn('open', [url])
	}
	if (selectable.length === 0) throw new Error('No elevators found for the given station.')

	// elevator id
	const options = selectable.map(elevator => {
		return {
			value: { id: elevator.id, description: elevator.description },
			title: `${elevator.description || 'No description'}, FaSta-ID: ${elevator.id}`,
		}
	})
	const { id: elevatorId, description: elevatorDescription } = await queryElementId('Which elevator?', options)

	// osm node id
	const osmNodeId = await queryOsmNodeId('Which OSM node id?')
	verifyOsmNodeId(osmNodeId)

	const entries = {
		id: elevatorId,
		osmNodeId,
		stationName,
		description: elevatorDescription,
		revised: true,
	}

	const ndjson = JSON.stringify(entries) + '\n'

	try {
		fs.appendFileSync(opt.datafile, ndjson) // @todo pify & await
		console.log('Appended to ' + opt.datafile)
	} catch (err) {
		showError(err)
	}

	process.stdout.write(ndjson)
}

main(opt)
	.catch(showError)
