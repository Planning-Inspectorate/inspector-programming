const serviceUrl = 'https://api.os.uk/maps/vector/v1/vts';
// initialiseMap is used in map.njk
/* eslint-disable no-unused-vars */

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
		'esri/config'
	], function (Map, MapView, Graphic, VectorTileLayer, Point, esriConfig) {
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
					title: 'Case ' + caseData.caseId,
					content: [
						{
							type: 'fields',
							fieldInfos: [
								{ fieldName: 'caseType', label: 'Type' },
								{ fieldName: 'caseLevel', label: 'Allocation Level' },
								{ fieldName: 'caseProcedure', label: 'Procedure' },
								{ fieldName: 'siteAddressPostcode', label: 'Postcode' },
								{ fieldName: 'lpaName', label: 'LPA' },
								{ fieldName: 'caseAge', label: 'Case Age' },
								{ fieldName: 'caseStatus', label: 'Status' },
								{ fieldName: 'specialismList', label: 'Specialisms' }
							]
						}
					]
				}
			});
			graphics.push(graphic);
		}

		function addInspectorMarker(inspectorData) {
			if (!inspectorData || !inspectorData.address) {
				return;
			}
			const point = new Point({
				x: inspectorData.address.longitude,
				y: inspectorData.address.latitude
			});
			const pictureMarkerSymbol = {
				type: 'picture-marker',
				url: `/assets/images/people.png`,
				width: '50px',
				height: '50px'
			};

			const inspectorTooltip = {
				title: `Inspector: ${inspectorData.firstName} ${inspectorData.lastName}`,
				content: `
                        <strong>Address:</strong> ${inspectorData.address}<br>
                        <strong>Grade:</strong> ${inspectorData.grade}<br>
                        <strong>FTE:</strong> ${inspectorData.fte}<br>
                        <strong>Specialisms:</strong> ${inspectorData.caseSpecialisms}<br>
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

			if (inspector && inspector.address) {
				// if inspector address is available, use it as the center
				center.longitude = inspector.address.longitude;
				center.latitude = inspector.address.latitude;
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
	});
}
