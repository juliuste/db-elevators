'use strict'

const laender = require('german-administrative-areas/laender.geo.json')
const contains = require('@turf/boolean-contains').default
const { point } = require('@turf/helpers')
const flatten = require('@turf/flatten')
const { uniq, flatMap, get, sortBy, groupBy } = require('lodash')
const stations = require('db-stations/data')
const Slugger = require('github-slugger')
const slugger = new Slugger()

const elevators = require('..')
const allStations = uniq(elevators.map(item => item.station))
const incompleteStationIds = uniq(elevators.filter(item => !item.osmNodeId).map(item => item.station))
const incompleteStations = incompleteStationIds.map(id => {
	const station = stations.find(s => s.id === id)

	let land = 'Unknown Bundesland'
	if (station.location && station.location.longitude && station.location.latitude) {
		const stationPoint = point([station.location.longitude, station.location.latitude])
		land = laender.find(land => {
			const geometries = land.type === 'FeatureCollection' ? land.features.map(feature => feature.geometry) : [land.geometry]
			const flatGeometries = flatMap(geometries, geometry => flatten(geometry).features).map(feature => feature.geometry)
			return flatGeometries.some(geometry => contains(geometry, stationPoint))
		})
	}

	return {
		id,
		name: station.name || undefined,
		category: station.category || '7',
		land: get(get(land, 'properties') || get(land, 'features[0].properties'), 'GEN')
	}
})

const main = () => {
	const landHeading = 'By Bundesland'
	process.stdout.write('# ToDo')
	process.stdout.write('\n\n')
	process.stdout.write('List of stations that have not been (fully) covered yet.')
	process.stdout.write('\n\n')

	process.stdout.write(`- [${landHeading}](#${slugger.slug(landHeading)})`)
	process.stdout.write('\n\n')

	const coveredLength = elevators.filter(item => !!item.osmNodeId).length
	const coveredPercentage = Math.round(1000 * (coveredLength / elevators.length)) / 10
	process.stdout.write(`**${coveredLength} of ${elevators.length}** elevators covered **(${coveredPercentage}%)**.`)
	process.stdout.write('\n\n')

	const coveredStationsLength = allStations.length - incompleteStations.length
	const coveredStationsPercentage = Math.round(1000 * (coveredStationsLength / allStations.length)) / 10
	process.stdout.write(`**${coveredStationsLength} of ${allStations.length}** stations fully covered **(${coveredStationsPercentage}%)**.`)
	process.stdout.write('\n\n')

	process.stdout.write(`## ${landHeading}`)
	process.stdout.write('\n\n')

	const byLand = groupBy(incompleteStations, 'land')
	const coveredLaenderLength = 16 - Object.keys(byLand).length
	const coveredLaenderPercentage = Math.round(1000 * (coveredLaenderLength / 16)) / 10
	process.stdout.write(`**${coveredLaenderLength} of 16** Bundesländer fully covered **(${coveredLaenderPercentage}%)**.`)
	process.stdout.write('\n')

	for (const land of Object.keys(byLand).sort()) {
		process.stdout.write(`- [${land}](#${slugger.slug(land)})`)
		process.stdout.write('\n')
	}

	for (const land of Object.keys(byLand).sort()) {
		process.stdout.write('\n')
		process.stdout.write(`### ${land}`)
		process.stdout.write('\n\n')
		const landStations = sortBy(byLand[land], 'name')
		for (const landStation of landStations) {
			const name = [landStation.name, landStation.id].filter(x => !!x).join(' - ')
			process.stdout.write(`- ${name}`)
			process.stdout.write('\n')
		}
		process.stdout.write('\n')
	}
}

main()
