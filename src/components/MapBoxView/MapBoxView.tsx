import mapboxGl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import react, { useEffect, useRef, useState } from "react";
import Timer from "../../classes/Timer";
import { mapboxpopup } from "../../popups/mapboxcluster";
import "./styles.css";

interface IInitializeMap {
  setMap: any;
  mapContainer: any;
}

const style = {
  height: "100vh",
  width: "50vw",
};

const MapBoxView = () => {
  const [map, setMap] = useState(null);
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mapboxGl.accessToken =
      "pk.eyJ1IjoiaWdpc21hcGJveCIsImEiOiJja2tzbjJleHMxbW5mMnVudjdtN3RxbXlwIn0.J47KkdfpZMKCEOqx9tK9NA";

    const timer = new Timer("basemap", "right").start();

    const initializeMap = ({ setMap, mapContainer }: IInitializeMap) => {
      // using optimized map to load faster
      // https://docs.mapbox.com/help/troubleshooting/mapbox-gl-js-performance/#remove-unused-features
      const map = new mapboxGl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11?optimized=true", // stylesheet location
        center: [-122, 47.5],
        zoom: 9,
      });

      map.on("load", () => {
        setMap(map);
        map.resize();

        const layerTimer = new Timer("Job Layer", "right").start();

        // Add a new source from our GeoJSON data and
        // set the 'cluster' option to true. GL-JS will
        // add the point_count property to your source data.
        map.addSource("jobLayer", {
          type: "geojson",
          data:
            "https://apps-test.integralgis.com/arcgis/rest/services/Carpenters/framework/FeatureServer/0/query?where=OBJECTID+IS+NOT+NULL&outFields=*&f=geojson",
          cluster: true,
          clusterMaxZoom: 14, // Max zoom to cluster points on
          clusterRadius: 65, // Radius of each cluster when clustering points (defaults to 50)
          clusterMinPoints: 2,
        });

        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "jobLayer",
          filter: ["has", "point_count"],
          paint: {
            // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
            // with three steps to implement three types of circles:
            //   * Blue, 20px circles when point count is less than 100
            //   * Yellow, 30px circles when point count is between 100 and 750
            //   * Pink, 40px circles when point count is greater than or equal to 750
            "circle-color": "#EC1C24",
            "circle-stroke-width": 3,
            "circle-stroke-color": "white",
            "circle-radius": [
              // TODO: Figure out easier way to step
              "step",
              ["get", "point_count"],
              12, // size
              25, // count (up to)
              15, // size
              50, // count
              17, // size
              100, // count
              20, // size
              250, // count (high)
              23, // size all nodes above count (high)
            ],
          },
        } as any);

        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "jobLayer",
          filter: ["has", "point_count"],
          paint: {
            "text-color": "white",
          },
          layout: {
            "text-field": "{point_count}",
            "text-font": ["Arial Unicode MS Bold", "DIN Offc Pro Medium"],
            "text-size": 12,
          },
        });

        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "jobLayer",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#EC1C24",
            "circle-stroke-width": 3,
            "circle-stroke-color": "white",
            "circle-radius": 12,
          },
        });

        map.on("click", "clusters", (event: any) => {
          const { lng, lat } = event.lngLat;
          const coords: [number, number] = [lng, lat];

          const features = map.queryRenderedFeatures(event.point, {
            layers: ["clusters"],
          });
          const id = features[0]?.properties?.cluster_id;

          const source = map.getSource("jobLayer");
          (source as any).getClusterExpansionZoom(
            id,
            (err: any, zoom: number) => {
              !!err && new Error("zoom error");
              map.easeTo({
                center: coords,
                zoom,
              });
            }
          );

          (source as any).getClusterLeaves(
            id,
            0,
            0,
            (err: any, res: any): any => {
              !!err && console.error(err.message);
              new mapboxGl.Popup({ closeButton: false, className: "TEST" })
                .setLngLat(coords)
                .setHTML(mapboxpopup(res))
                .addTo(map);
            }
          );
        });

        map.on("click", "unclustered-point", (event: any) => {
          const { lng, lat } = event.lngLat;
          const coords: [number, number] = [lng, lat];

          const features = map.queryRenderedFeatures(event.point, {
            layers: ["unclustered-point"],
          });

          map.easeTo({
            center: coords,
            zoom: 15,
          });

          new mapboxGl.Popup({ closeButton: false, className: "TEST" })
            .setLngLat(coords)
            .setHTML(
              `<div style='color: white; background-color: #283246;'>${features[0].properties?.JOB_ID}</div>`
            )
            .addTo(map);
        });

        layerTimer.end();
        timer.end();
      });
    };

    if (!map) initializeMap({ setMap, mapContainer });
  }, [map]);

  return <div style={style} ref={mapContainer} />;
};

export default MapBoxView;
