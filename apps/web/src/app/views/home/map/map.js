// initialiseMap is used in map.njk
/* eslint-disable no-unused-vars */
/* global document */

const serviceUrl = 'https://api.os.uk/maps/vector/v1/vts';
const SELECT_CASE_ACTION = 'Select Case';
const UNSELECT_CASE_ACTION = 'Unselect Case';

/**
 * Initialise the OS map
 * @param {string} apiKey
 * @param {import('@pins/inspector-programming-lib/data/types.js').CaseViewModel[]} pins
 * @param {import('@pins/inspector-programming-database/src/client').Inspector} [inspector]
 */
function initialiseMap(apiKey, pins, inspector) {
	require([
		'esri/Map',
		'esri/views/MapView',
		'esri/Graphic',
		'esri/layers/VectorTileLayer',
		'esri/geometry/Point',
		'esri/geometry/Circle',
		'esri/config',
		'esri/core/reactiveUtils'
	], function (Map, MapView, Graphic, VectorTileLayer, Point, Circle, esriConfig, reactiveUtils) {
		esriConfig.request.interceptors.push({
			urls: serviceUrl,
			before: function (params) {
				// include the API key in all requests to OS Maps
				const query = params.requestOptions.query || (params.requestOptions.query = {});
				query.key = apiKey;
			}
		});

		const graphics = [];

		/**
		 * @param {import('@pins/inspector-programming-lib/data/types.js').CaseViewModel} caseData
		 */
		function addCaseMarker(caseData) {
			if (caseData.siteAddressLatitude == null || caseData.siteAddressLongitude == null) {
				return;
			}
			const point = new Point({
				x: caseData.siteAddressLongitude,
				y: caseData.siteAddressLatitude
			});
			const markerSymbol = {
				type: 'simple-marker',
				color: '#' + (caseData.caseAgeColor || '00703c'),
				outline: {
					color: '#fff',
					width: 1
				}
			};
			const graphic = new Graphic({
				geometry: point,
				symbol: markerSymbol,
				attributes: caseData,
				popupTemplate: {
					title: 'Case ' + caseData.caseReference,
					content: [
						{
							type: 'fields',
							fieldInfos: [
								{ fieldName: 'caseAge', label: 'Case age' },
								{ fieldName: 'lpaName', label: 'LPA name' },
								{ fieldName: 'caseStatus', label: 'Case status' },
								{ fieldName: 'siteAddressPostcode', label: 'Site postcode' },
								{ fieldName: 'specialismList', label: 'Case specialism' },
								{ fieldName: 'caseType', label: 'Appeal type' },
								{ fieldName: 'caseProcedure', label: 'Procedure' },
								{ fieldName: 'caseLevel', label: 'Allocation level' }
							]
						}
					],
					actions: [
						{
							id: `toggle-select-case-${caseData.caseReference}`,
							icon: 'check-circle',
							title: SELECT_CASE_ACTION
						}
					]
				}
			});
			graphics.push(graphic);
		}

		function addInspectorMarker(inspectorData) {
			if (!inspectorData || !inspectorData.latitude || !inspectorData.longitude) {
				return;
			}

			const exclusionRadius = new Circle({
				center: new Point({
					x: inspectorData.longitude,
					y: inspectorData.latitude
				}),
				geodesic: true,
				radius: 5,
				radiusUnit: 'kilometers'
			});

			const circleGraphic = new Graphic({
				geometry: exclusionRadius,
				symbol: {
					type: 'simple-fill',
					style: 'none',
					outline: {
						width: 2,
						color: 'red'
					}
				}
			});
			graphics.push(circleGraphic);

			const point = new Point({
				x: inspectorData.longitude,
				y: inspectorData.latitude
			});
			const pictureMarkerSymbol = {
				type: 'picture-marker',
				url: `/assets/images/person.png`,
				width: '50px',
				height: '50px'
			};

			const inspectorTooltip = {
				title: `Inspector: ${inspectorData.firstName} ${inspectorData.lastName}`,
				content: `
                        <strong>Postcode:</strong> ${inspectorData.postcode}<br>
                        <strong>Grade:</strong> ${inspectorData.grade}<br>
                        <strong>Specialisms:</strong> ${inspectorData.specialismsList}<br>
                    `
			};

			const pointGraphic = new Graphic({
				geometry: point,
				symbol: pictureMarkerSymbol,
				popupTemplate: inspectorTooltip
			});
			graphics.push(pointGraphic);
		}

		for (const pin of pins) {
			addCaseMarker(pin);
		}

		if (inspector) {
			addInspectorMarker(inspector);
		}

		function mapCenterPoint() {
			// Filter valid pins
			const validPins = pins.filter((p) => p.siteAddressLatitude != null && p.siteAddressLongitude != null);

			// Default center (UK)
			const defaultCenter = { longitude: -1.5, latitude: 52.5 };
			const center = { ...defaultCenter };

			if (inspector && inspector.longitude && inspector.latitude) {
				// if inspector address is available, use it as the center
				center.longitude = inspector.longitude;
				center.latitude = inspector.latitude;
			} else if (validPins.length > 0) {
				// if no inspector address, use the average of valid pins
				center.longitude = validPins.reduce((acc, pin) => acc + Number(pin.siteAddressLongitude), 0) / validPins.length;
				center.latitude = validPins.reduce((acc, pin) => acc + Number(pin.siteAddressLatitude), 0) / validPins.length;

				// ensure center is a valid number
				if (isNaN(center.longitude) || isNaN(center.latitude)) {
					center.longitude = defaultCenter.longitude;
					center.latitude = defaultCenter.latitude;
				}
			}

			return new Point({
				x: center.longitude,
				y: center.latitude
			});
		}

		const view = new MapView({
			container: 'map',
			map: new Map({
				layers: [
					new VectorTileLayer({
						url: serviceUrl
					})
				]
			}),
			zoom: 3,
			center: mapCenterPoint(),
			constraints: {
				minZoom: 2,
				maxZoom: 15,
				rotationEnabled: false
			}
		});

		for (const graphic of graphics) {
			view.graphics.add(graphic);
		}

		reactiveUtils.on(
			() => view.popup,
			'trigger-action',
			(event) => {
				if (event.action.title === SELECT_CASE_ACTION || event.action.title === UNSELECT_CASE_ACTION) {
					const selectedCase = event.action.id.replace('toggle-select-case-', '');
					console.log(event.action.title, selectedCase);
					document.dispatchEvent(
						new CustomEvent('caseStateChange', {
							detail: {
								caseId: selectedCase,
								selected: !pins.find(({ caseReference: caseId }) => caseId === selectedCase).selected
							}
						})
					);
				}
			}
		);

		// keep the list of 'pins' in sync with any selection changes
		// do it with a listener so it also works if cases are selected on the table
		document.addEventListener('caseStateChange', function (event) {
			const graphic = view.graphics.find((graphic) => graphic.attributes?.caseId === event.detail.caseId);

			if (graphic) {
				const caseData = pins.find(({ caseReference: caseId }) => caseId === event.detail.caseId);
				caseData.selected = event.detail.selected;
				console.debug('caseStateChange, syncing map state', caseData.caseReference, caseData.selected);

				graphic.popupTemplate.actions.items[0].title = event.detail.selected
					? UNSELECT_CASE_ACTION
					: SELECT_CASE_ACTION;
				graphic.popupTemplate.actions.items[0].icon = event.detail.selected ? 'check-circle-f' : 'check-circle';
				graphic.symbol.outline.color.setColor(event.detail.selected ? '#000000' : '#ffffff');
				graphic.symbol = graphic.symbol.clone(); // force render
			}
		});
	});
}
