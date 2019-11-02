# db-elevators

Deutsche Bahn elevator information, enriched (by crowdsourcing) with OSM data.

You're invited to help, see the [data structure](#data-structure) and [contributing](#contributing) sections!

Using [this original dataset](https://developer.deutschebahn.com/store/apis/info?name=FaSta-Station_Facilities_Status&version=v2&provider=DBOpenData) provided by [Deutsche Bahn](https://www.bahn.de).

[![npm version](https://img.shields.io/npm/v/db-elevators.svg)](https://www.npmjs.com/package/db-elevators)
[![Build Status](https://travis-ci.org/juliuste/db-elevators.svg?branch=master)](https://travis-ci.org/juliuste/db-elevators)
[![Greenkeeper badge](https://badges.greenkeeper.io/juliuste/db-elevators.svg)](https://greenkeeper.io/)
[![license](https://img.shields.io/github/license/juliuste/db-elevators.svg?style=flat)](license)

## Installation and Usage

If you're using `Node.js` or `JavaScript` with `npm`, you can install the package by running:

```bash
npm install db-elevators
```

```js
const elevators = require('db-elevators')
```

`elevators` is an array of objects which looks as follows:

```js
[
	{
		id: '10499641',
		description: 'zu Gleis 1',
		station: '8010212',
		location: {
			longitude: 14.6713589,
			latitude: 51.0993991
		},
		osmNodeId: '2793052424'
	},
	{
		id: '10499642',
		description: 'zu Gleis 2/3',
		station: '8010212',
		location: {
			longitude: 14.6713245,
			latitude: 51.0995518
		},
		osmNodeId: '4011664512'
	}
	// …
]
```

You can use the `id` to retrieve live availability information via the [FaSta API](https://developer.deutschebahn.com/store/apis/info?name=FaSta-Station_Facilities_Status&version=v2&provider=DBOpenData).

## Data structure

OpenStreetMap associations are stored in `osm.ndjson`, an [ndjson](http://ndjson.org/) file which contains one record per row. All records are objects with the following keys (required).

| key name | description | example |
| -------- | ----------- | ------- |
| `id` | elevator id from the main dataset | `"10009222"` |
| `osmNodeId` | Id of the OSM *elevator* node. Note that OSM ids are not too stable, however this still seems to be the best way to associate data (for now). Additionally, tests that verify that ids are still valid and refering to an elevator are run on a daily basis. | `"2381179238"` |
| `stationName` | Name of the station. Note that this field is required, but won't ever be parsed, we just use it to make the dataset a bit more human-readable. | `"Bochum Hbf"` |
| `description` | Elevator description from the main dataset. As with `stationName` this field won't ever be parsed, we just use it to make the dataset a bit more human-readable. *Optional, as some elevators don't have any description even in the original dataset. However: Feel free to write one yourself in this case.* | `"zu Gleis 1/2"` |
| `revised` | Some entries have been automatically fetched/guessed with a heuristical approach (`false`), while others have been manually inserted (`true`). This field is currently not exposed by the module, but can be used internally to monitor quality. | `true` |

Put together, our example would give us the following data row for the NDJSON file:

```json
{"id":"10009222","osmNodeId":"2381179238","stationName":"Bochum Hbf","description":"zu Gleis 1/2","revised":false}
```

## Contributing

If you want to add information to the dataset, **[fork this repository](https://help.github.com/articles/fork-a-repo/), add information and finally [submit a pull request](https://help.github.com/articles/about-pull-requests/)**. If you don't know how any of this works, you can also just [open an issue](https://github.com/juliuste/db-elevators/issues) with the information you want to add in text form and I'll add it to the dataset for you. The same applies if you have found an error or want to change anything about the data structure.

Please note that by contributing to this project, you waive any copyright claims on the information you add.

See the [**todo list**](todo.md) for a list of stations that have not been (fully) covered yet.

### CLI

If you want to contribute to this project, you can either add data to `osm.ndjson` manually or use the CLI as follows:

1. Clone the repository (or your fork)

```bash
git clone https://github.com/juliuste/db-elevators.git
```

2. Navigate to the repository root

```bash
cd db-elevators
```

3. Use the CLI to add entries to `osm.ndjson`

```bash
./build/bin/index # starts the cli
./build/bin/index --help # shows the help menu
./build/bin/index --auto-open # starts the CLI, opens OpenStreetMap around stations automatically (only on mac OS, using 'open' CLI)
```

## License

The original dataset was released as [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/), the crowdsourced database of OpenStreetMap associations is licensed as [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.de).
