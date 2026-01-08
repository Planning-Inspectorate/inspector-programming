// initialiseMap is used in map.njk
/* eslint-disable no-unused-vars */
/* global document */

const serviceUrl = 'https://api.os.uk/maps/vector/v1/vts';
const SELECT_CASE_ACTION = 'Select Case';
const UNSELECT_CASE_ACTION = 'Unselect Case';
const CLUSTER_RADIUS = '300px';

/**
 * Initialise the OS map
 * @param {string} apiKey
 * @param {import('@pins/inspector-programming-lib/data/types.js').CaseViewModel[]} pins
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').Inspector} [inspector]
 */
function initialiseMap(apiKey, pins, inspector) {
	require([
		'esri/Map',
		'esri/views/MapView',
		'esri/Graphic',
		'esri/layers/VectorTileLayer',
		'esri/layers/FeatureLayer',
		'esri/geometry/Point',
		'esri/geometry/Circle',
		'esri/config',
		'esri/core/reactiveUtils'
	], function (Map, MapView, Graphic, VectorTileLayer, FeatureLayer, Point, Circle, esriConfig, reactiveUtils) {
		esriConfig.request.interceptors.push({
			urls: serviceUrl,
			before: function (params) {
				// include the API key in all requests to OS Maps
				const query = params.requestOptions.query || (params.requestOptions.query = {});
				query.key = apiKey;
			}
		});

		const graphics = [];

		const selectedCaseReferences = new Set();

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

			const attributes = {
				...caseData,
				caseAge: Number(caseData.caseAge || 0)
			};

			const graphic = new Graphic({
				geometry: point,
				symbol: markerSymbol,
				attributes
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
				},
				popupTemplate: null
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
				popupTemplate: inspectorTooltip,
				attributes: {
					type: 'inspector',
					firstName: inspectorData.firstName,
					lastName: inspectorData.lastName,
					postcode: inspectorData.postcode,
					grade: inspectorData.grade,
					specialismsList: inspectorData.specialismsList
				}
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
		view.popup.highlightEnabled = false;

		view.highlightOptions = {
			color: [0, 0, 0, 1],
			haloOpacity: 1,
			haloColor: [0, 0, 0, 1],
			fillOpacity: 0
		};

		// Separate case and inspector graphics
		const caseGraphics = graphics.filter((g) => g.attributes?.caseReference);
		const otherGraphics = graphics.filter((g) => !g.attributes?.caseReference); // inspector, circles, etc.

		const caseLayer = new FeatureLayer({
			source: caseGraphics,
			objectIdField: 'caseReference',
			geometryType: 'point',
			fields: [
				{ name: 'caseReference', type: 'string' },
				{ name: 'caseAgeColor', type: 'string' },
				{ name: 'caseAge', type: 'integer' },
				{ name: 'lpaName', type: 'string' },
				{ name: 'caseStatus', type: 'string' },
				{ name: 'siteAddressPostcode', type: 'string' },
				{ name: 'specialismList', type: 'string' },
				{ name: 'caseType', type: 'string' },
				{ name: 'caseProcedure', type: 'string' },
				{ name: 'caseLevel', type: 'string' },
				{ name: 'caseId', type: 'string' }
			],
			featureReduction: {
				type: 'cluster',
				clusterRadius: CLUSTER_RADIUS,
				clusterMinSize: '30px',
				clusterMaxSize: '60px',
				labelingInfo: [
					{
						deconflictionStrategy: 'none',
						labelExpressionInfo: { expression: "Text($feature.cluster_count, '#,###')" },
						symbol: {
							type: 'text',
							color: 'white',
							font: { weight: 'bold', size: 14 }
						},
						labelPlacement: 'center-center'
					}
				],
				popupTemplate: {
					title: 'Cluster with {cluster_count} cases',
					content: 'Zoom in to see individual case markers.'
				},
				fields: [
					{
						name: 'cluster_oldest_case_age',
						statisticType: 'max',
						onStatisticField: 'caseAge'
					}
				],
				renderer: {
					type: 'simple',
					symbol: {
						type: 'simple-marker',
						outline: { color: '#fff', width: 1 }
					},
					visualVariables: [
						{
							type: 'color',
							field: 'cluster_oldest_case_age',
							// Duplicate colors at boundaries force discrete bands with hard breaks: 0–20 green, 21–40 orange, 41+ red.
							// Prevents interpolation/gradient between ranges.
							stops: [
								{ value: 0, color: '#00703c' },
								{ value: 20, color: '#00703c' },
								{ value: 21, color: '#f47738' },
								{ value: 40, color: '#f47738' },
								{ value: 41, color: '#d4351c' }
							]
						}
					]
				}
			},
			popupTemplate: {
				title: 'Case {caseReference}',
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
							{ fieldName: 'caseLevel', label: 'Allocation level' },
							{ fieldName: 'caseId', label: 'Case ID', visible: false }
						]
					}
				],
				actions: [
					{
						id: 'toggle-select-case',
						icon: 'check-circle',
						title: SELECT_CASE_ACTION
					}
				]
			}
		});

		let caseLayerView;
		let highlightHandle;
		function refreshSelectionHighlight() {
			if (!caseLayerView) return;
			if (highlightHandle) {
				highlightHandle.remove();
				highlightHandle = null;
			}
			const ids = Array.from(selectedCaseReferences);
			if (ids.length === 0) return;
			highlightHandle = caseLayerView.highlight(ids);
		}

		view.map.add(caseLayer);

		reactiveUtils.watch(
			() => view.popup.selectedFeature,
			(feature) => {
				const action = caseLayer.popupTemplate.actions.items[0];
				const selected = !feature || selectedCaseReferences.has(feature.attributes.caseReference);
				action.title = selected ? UNSELECT_CASE_ACTION : SELECT_CASE_ACTION;
				action.icon = selected ? 'check-circle-f' : 'check-circle';
			}
		);

		view.whenLayerView(caseLayer).then((layerView) => {
			caseLayerView = layerView;
			refreshSelectionHighlight();
		});

		for (const graphic of otherGraphics) {
			view.graphics.add(graphic);
		}

		reactiveUtils.on(
			() => view.popup,
			'trigger-action',
			(event) => {
				if (event.action.title === SELECT_CASE_ACTION || event.action.title === UNSELECT_CASE_ACTION) {
					const selectedCaseReference = view.popup.selectedFeature.attributes.caseReference;
					const selectedCase = pins.find(({ caseReference }) => caseReference === selectedCaseReference);
					const { caseId, caseReference, selected } = selectedCase;
					if (!selected && !selectedCaseReferences.has(caseReference)) {
						// Count currently selected cases using pins array (reliable source)
						const currentlySelectedCount = pins.filter((pin) => pin.selected).length;

						if (currentlySelectedCount >= 10) {
							// Create and dispatch error event
							document.dispatchEvent(
								new CustomEvent('mapSelectionError', {
									detail: {
										message: 'Maximum you can select up to 10 cases at once'
									}
								})
							);
							return;
						}

						selectedCaseReferences.add(caseReference);
					} else if (selected || selectedCaseReferences.has(caseReference)) {
						selectedCaseReferences.delete(caseReference);
					}

					console.log(event.action.title, caseId);

					document.dispatchEvent(
						new CustomEvent('caseStateChange', {
							detail: {
								caseId: caseId,
								selected: !selected
							}
						})
					);
				}
			}
		);

		// keep the list of 'pins' in sync with any selection changes
		// do it with a listener so it also works if cases are selected on the table
		document.addEventListener('caseStateChange', function (event) {
			const { selected, caseId } = event.detail;
			const graphic = caseGraphics.find((graphic) => graphic.attributes?.caseId === caseId);
			if (graphic) {
				const caseData = pins.find((pin) => pin.caseId === caseId);
				caseData.selected = selected;
				console.debug('caseStateChange, syncing map state', caseData.caseReference, caseData.selected);

				// Sync selectedCaseReferences Set with table selections
				if (selected) {
					selectedCaseReferences.add(caseData.caseReference);
				} else {
					selectedCaseReferences.delete(caseData.caseReference);
				}

				const action = graphic.layer.popupTemplate.actions.items[0];
				action.title = selected ? UNSELECT_CASE_ACTION : SELECT_CASE_ACTION;
				action.icon = selected ? 'check-circle-f' : 'check-circle';

				const symbol = graphic.symbol.clone ? graphic.symbol.clone() : { ...graphic.symbol };
				symbol.outline = {
					...(symbol.outline || {}),
					color: selected ? '#000000' : '#ffffff',
					width: selected ? 2 : 1
				};
				graphic.symbol = symbol;
				refreshSelectionHighlight();
			}
		});
	});
}
