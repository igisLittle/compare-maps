import react, { useEffect, useRef } from 'react';
import { loadModules } from 'esri-loader';
import axios from 'axios';
import Timer from '../../classes/Timer';

import './styles.css';

// FIXME: We need to test if pull all sublayers individually is faster/slower
// than pulling the whole WebServer
// this lags too much, need to lazy load and apply to map
// We can either hardcode the import or use the endpoint:
// https://web-who.westus.cloudapp.azure.com/arcgis/rest/services/PJM?f=pjson
// import * as mapServers from "../../endpoints/MapServers.json";

const style = {
	height: '100vh',
	width: '50vw',
};

function WebMapView() {
	const mapRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const timer = new Timer('basemap', 'left').start();
		// lazy load the required ArcGIS API for JavaScript modules and CSS
		loadModules(
			[
				'esri/Map',
				'esri/views/MapView',
				'esri/layers/FeatureLayer',
				'esri/layers/support/FeatureReductionCluster',
				'esri/PopupTemplate',
				'esri/layers/support/LabelClass',
				'esri/symbols/TextSymbol',
				'esri/renderers/SimpleRenderer',
				'esri/symbols/SimpleMarkerSymbol',
			],
			{ css: true }
		).then(
			([
				ArcGISMap,
				MapView,
				FeatureLayer,
				FeatureReductionCluster,
				PopupTemplate,
				LabelClass,
				TextSymbol,
				SimpleRenderer,
				SimpleMarkerSymbol,
			]) => {
				const jobFeatureLayer = new FeatureLayer({
					url:
						'https://apps-test.integralgis.com/arcgis/rest/services/Carpenters/framework/MapServer/0',
					copywrite: 'Integral GIS, inc.',
					id: 'jobFeatureLayer',
					labelsVisible: true,

					// https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-support-FeatureReductionCluster.html
					featureReduction: new FeatureReductionCluster({
						clusterMinSize: '25px',
						clusterMaxSize: '50px',
						clusterRadius: '100px',

						// https://developers.arcgis.com/javascript/latest/api-reference/esri-PopupTemplate.html
						popupTemplate: new PopupTemplate({
							title: 'This cluster represents <b>{cluster_count}</b> features.',
							content: async (feature: any) => {
								const { graphic } = feature;
								!graphic.isAggregate && new Error('Graphic is not aggregate');
								const layerView = await view.whenLayerView(jobFeatureLayer);
								const query = layerView.createQuery();
								query.aggregateIds = [graphic.getObjectId()];
								const { features } = await layerView.queryFeatures(query);
								view.popup.features = features;
							},
							outFields: ['JOB_ID'],
							returnGeometry: true,
						}),

						// https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-support-LabelClass.html
						labelingInfo: [
							new LabelClass({
								deconflictionStrategy: 'none',
								labelExpressionInfo: {
									expression: "Text($feature.cluster_count, '#,###')",
								},
								symbol: new TextSymbol({
									color: '#ffffff',
									font: {
										weight: 'bold',
										family: 'Noto Sans',
										size: '12px',
									},
								}),
								labelPlacement: 'center-center',
							}),
						],
					}),

					// https://developers.arcgis.com/javascript/latest/api-reference/esri-PopupTemplate.html
					popupTemplate: new PopupTemplate({
						title: 'Job Popup for: {JOB_ID}',
						content: async ({ graphic }: any) => {
							const query = jobFeatureLayer.createQuery();
							query.objectIds = [graphic.getObjectId()];
							const queryReturn = await jobFeatureLayer.queryFeatures(query);
							const [feature] = queryReturn.features;
							const job = await axios.get(
								'https://apps-test.integralgis.com/node/framework/api/getJob',
								{
									params: {
										jobProfileId: feature.attributes.JOB_ID.replace(
											/[{}]/g,
											''
										),
									},
								}
							);
							const {
								data,
							} = await axios.get(
								'https://apps-test.integralgis.com/node/framework/api/getJobProfile',
								{ params: { jobProfileId: job.data[0].JOB_PROFILE_ID } }
							);
							const { jobInformation } = data;
							return (`<div>
                              ${jobInformation.friendlyId}<br/>
                              ${jobInformation.address}<br/>
                              ${jobInformation.city}, ${jobInformation.stateAbbreviation} ${jobInformation.zipCode}<br/>
                              ${jobInformation.description}
                              </div>`);
						},
						outFields: ['*'],
						fieldInfos: [
							{
								fieldName: 'JOB_ID',
								label: 'Job ID',
								format: {
									places: 0,
									digitSeparator: false,
								},
							},
						],
					}),

					// https://developers.arcgis.com/javascript/latest/api-reference/esri-renderers-Renderer.html
					renderer: new SimpleRenderer({
						symbol: new SimpleMarkerSymbol({
							size: 15,
							color: 'rgba(236, 28, 36, 1)',
							outline: {
								color: 'rgba(255, 255, 255, 1)',
								width: 2,
							},
						}),
					}),
				});
				console.log(jobFeatureLayer.loadStatus);

				// basemap
				// https://support.esri.com/en/technical-article/000022021#:~:text=To%20add%20a%20Mapbox%20map,errors%2C%20or%20omissions%20of%20data.
				const layeredMap = new ArcGISMap({
					basemap: 'osm',
					layers: [jobFeatureLayer],
				});

				// FIXME: update-end does not fire when a map loads
				// https://community.esri.com/t5/arcgis-api-for-javascript/how-to-know-when-a-vectortilelayer-is-finished-rendering-arcgis/td-p/473160
				// jobFeatureLayer.on('update-end', (event: any) => {
				// console.log('end', event);
				// timer.end();
				// });

				// load the map view at the ref's DOM node
				const view = new MapView({
					container: mapRef.current,
					map: layeredMap,
					center: [-122, 47.5],
					zoom: 9,
				});

				(async (): Promise<void> => {
					const layerTimer = new Timer('Job Layer', 'left').start();
					const layerView = await view.whenLayerView(jobFeatureLayer);
					layerTimer.end();
					timer.end();
					console.log(jobFeatureLayer.loadStatus);
					console.log(layerView.visible);
				})();

				return () => {
					if (view) {
						// destroy the map view
						view.container = null;
					}
				};
			}
		);
	});

	return <div className='absolute' style={style} ref={mapRef} />;
}
export default WebMapView;
