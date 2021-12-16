import react, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
	const [part1Data, setPart1Data] = useState(null);
	const [part2Data, setPart2Data] = useState(null);
	const apiURL = "https://www.swapi.tech/api/";

	let allShips = [];
	let allShipsDetails = [];
	let shipsAndPilots = [];
	let shipsAndPopulation = [];

	let planetsList = [];

	const getAll = async (category) => {
		return await axios.get(`${apiURL}${category}`);
	};

	const getDetails = async (category, id) => {
		return await axios.get(`${apiURL}${category}/${id}`);
	};

	const getMultipleDetailsId = async (category, idList) => {
		let getList = [];

		idList.forEach((id) => {
			getList.push(axios.get(`${apiURL}${category}/${id}`));
		});

		return await axios.all(getList);
	};

	const getMultipleDetailsURLs = async (list) => {
		let getList = [];

		list.forEach((url) => {
			getList.push(axios.get(url));
		});

		return await axios.all(getList);
	};

	const getShipList = async () => {
		await getAll("vehicles").then((response) => {
			allShips = response.data.results;
		});
	};

	const getShipDetails = async () => {
		let idList = [];

		allShips.forEach((ship) => {
			idList.push(ship.uid);
		});

		await getMultipleDetailsId("vehicles", idList).then((response) => {
			allShipsDetails = response;
		});
	};

	const getPilotsDetails = async () => {
		let pilotList = [];

		allShipsDetails.forEach((ship) => {
			if (ship.data.result.properties.pilots.length > 0) {
				ship.data.result.properties.pilots.forEach((pilot) => {
					shipsAndPilots.push({
						ship: ship.data.result.properties.name,
					});
					pilotList.push(pilot);
				});
			}
		});

		await getMultipleDetailsURLs(pilotList).then(
			axios.spread((...responses) => {
				responses.forEach((pilotDetail, index) => {
					shipsAndPilots[index].pilot = pilotDetail.data.result.properties;
				});
			})
		);
	};

	const getHomeworldDetails = async () => {
		let homeworldList = [];

		shipsAndPilots.forEach((ship) => {
			homeworldList.push(ship.pilot.homeworld);
		});

		await getMultipleDetailsURLs(homeworldList).then(
			axios.spread((...responses) => {
				responses.forEach((homeworldDetail, index) => {
					shipsAndPilots[index].homeworld =
						homeworldDetail.data.result.properties;
				});
			})
		);
	};

	const addNewShip = (newShip) => {
		shipsAndPopulation.push({
			ship: newShip.ship,
			pilots: [newShip.pilot.name],
			planets: [newShip.homeworld],
			populationSum: parseInt(newShip.homeworld.population),
		});
	};

	const addPilotToShip = (ship, newData) => {
		let newPlanet = true;

		ship.pilots.push(newData.pilot.name);

		ship.planets.forEach((planet) => {
			if (planet.name === newData.homeworld.name) {
				newPlanet = false;
			}
		});

		if (newPlanet) {
			ship.planets.push(newData.homeworld);
			ship.populationSum += parseInt(newData.homeworld.population);
		}
	};

	const populationPerShip = () => {
		if (shipsAndPilots.length > 0) {
			let newPilot = false;

			for (let i = 0; i < shipsAndPilots.length; i++) {
				for (let j = 0; j < shipsAndPopulation.length; j++) {
					if (shipsAndPilots[i].ship === shipsAndPopulation[j].ship) {
						newPilot = true;
						addPilotToShip(shipsAndPopulation[j], shipsAndPilots[i]);
					}
				}

				if (!newPilot) {
					addNewShip(shipsAndPilots[i]);
				} else {
					newPilot = false;
				}
			}
		}
	};

	const seletShipWithMostPopulation = () => {
		let selectedShip = shipsAndPopulation[0];

		shipsAndPopulation.forEach((ship) => {
			if (ship.populationSum > selectedShip.populationSum) {
				selectedShip = ship;
			}
		});

		setPart1Data(selectedShip);
	};

	const part1 = async () => {
		await getShipList(); // includes ships IDs
		await getShipDetails(); // includes pilots URLs
		await getPilotsDetails(); // includes homeworld URLs
		await getHomeworldDetails(); // includes Populations

		populationPerShip();
		seletShipWithMostPopulation();
	};

	const getPlanetsList = async () => {
		await getAll("planets").then((response) => {
			planetsList = response.data.results;
		});
	};

	const getPlanetsDetails = async () => {
		let urlList = [];

		planetsList.forEach((planet) => {
			urlList.push(planet.url);
		});

		await getMultipleDetailsURLs(urlList).then(
			axios.spread((...responses) => {
				responses.forEach((planetDetail, index) => {
					planetsList[index].population =
						planetDetail.data.result.properties.population;
				});
			})
		);
	};

	const selectPlanetsToDisplay = () => {
		let planets = ["Tatooine", "Alderaan", "Naboo", "Bespin", "Endor"];
		let maxPopulation = 0;
		let graphData = [];
		let planetPopulation = 0;

		planetsList.forEach((planet) => {
			if (planets.includes(planet.name)) {
				planetPopulation = parseInt(planet.population);

				if (planetPopulation > maxPopulation) {
					maxPopulation = planetPopulation;
				}

				graphData.push({ name: planet.name, population: planet.population });
			}
		});

		graphData.forEach((planet) => {
			planet.percentage = (planet.population * 100) / maxPopulation;
		});

		// console.log(graphData);
		setPart2Data(graphData);
	};

	const part2 = async () => {
		await getPlanetsList(); // includes both IDs and URLs
		await getPlanetsDetails(); // includes Populations
		selectPlanetsToDisplay();
	};

	// run
	useEffect(() => {
		part1();
		part2();
	}, []);

	return (
		<div className="App">
			{part1Data !== null ? (
				<div className="Wrapper">
					<div className="Row">
						<span className="Square">Vehicle name with the largest sum</span>
						<span className="Square">{part1Data.ship}</span>
					</div>
					<div className="Row">
						<span className="Square">
							Related home planets and their respective population
						</span>
						<span className="Square">
							{part1Data.planets.map((planet) => (
								<div>
									{planet.name} ({planet.population})
								</div>
							))}
						</span>
					</div>
					<div className="Row">
						<span className="Square">Related pilot names</span>
						<span className="Square">{part1Data.pilots}</span>
					</div>
				</div>
			) : null}
			{part2Data !== null ? (
				<div className="graph-wrapper">
					{part2Data.map((planet) => (
						<div className="graph-planet">
							<span>{planet.population}</span>
							<span
								style={{
									backgroundColor: "yellow",
									height: `${planet.percentage}%`,
									border: "1px solid black",
								}}
							></span>
							<span>{planet.name}</span>
						</div>
					))}
				</div>
			) : null}
		</div>
	);
}

export default App;
