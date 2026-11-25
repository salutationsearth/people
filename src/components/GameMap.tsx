"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { bearing } from "@/lib/game";
import type { Group } from "@/lib/types";
import { useTheme } from "@/lib/theme";
import styles from "./GameMap.module.css";

export const ARROW_PX = 52;
const MARKER_GAP = 10;
const ARROW_IMAGE = "guess-arrow";

type MapPoint = Pick<Group, "id" | "name" | "lat" | "lon">;
type Props = { groups: MapPoint[]; guesses: MapPoint[]; answer: MapPoint; reveal: boolean; interactive?: boolean };

function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function arrowImage(color: string) {
  const ratio = 2;
  const half = ARROW_PX + MARKER_GAP;
  const width = half * 2 * ratio;
  const height = 16 * ratio;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(ratio, ratio);
  const y = 8;
  const start = half + MARKER_GAP;
  const tip = half * 2;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(start, y);
  ctx.lineTo(tip - 10, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tip, y);
  ctx.lineTo(tip - 12, y - 6.5);
  ctx.lineTo(tip - 12, y + 6.5);
  ctx.closePath();
  ctx.fill();
  return { data: ctx.getImageData(0, 0, width, height), pixelRatio: ratio };
}

const point = (g: MapPoint, properties: Record<string, unknown> = {}) => ({
  type: "Feature" as const,
  properties,
  geometry: { type: "Point" as const, coordinates: [g.lon, g.lat] },
});

function markerElement(label: string, index: number | null) {
  const el = document.createElement("div");
  el.className = index === null ? `${styles.marker} ${styles.answer}` : styles.marker;
  const pin = document.createElement("span");
  pin.className = styles.pin;
  pin.textContent = index === null ? "✓" : String(index);
  const name = document.createElement("span");
  name.className = styles.label;
  name.textContent = label;
  el.append(pin, name);
  return el;
}

export function GameMap({ groups, guesses, answer, reveal, interactive = true }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;
    import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !container.current) return;
      maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
      const instance = new maplibregl.Map({
        container: container.current,
        style: {
          version: 8,
          sources: {
            land: { type: "geojson", data: "/map/land.geojson", attribution: "Natural Earth" },
            groups: { type: "geojson", data: { type: "FeatureCollection", features: groups.map((g) => point(g, { name: g.name })) } },
            arrows: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
            joins: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
          },
          layers: [
            { id: "sea", type: "background", paint: { "background-color": token("--color-sea") } },
            { id: "land", type: "fill", source: "land", paint: { "fill-color": token("--color-land") } },
            { id: "land-line", type: "line", source: "land", paint: { "line-color": token("--color-line"), "line-width": 0.8 } },
            {
              id: "groups",
              type: "circle",
              source: "groups",
              paint: {
                "circle-color": token("--color-dot"),
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 2, 5, 4],
              },
            },
            {
              id: "joins",
              type: "line",
              source: "joins",
              paint: { "line-color": token("--color-cobalt"), "line-width": 1.5, "line-dasharray": [2, 2.5] },
            },
            {
              id: "arrows",
              type: "symbol",
              source: "arrows",
              layout: {
                "icon-image": ARROW_IMAGE,
                "icon-rotate": ["-", ["get", "bearing"], 90],
                "icon-rotation-alignment": "map",
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
              },
            },
          ],
        },
        center: [answer.lon, 10],
        zoom: 1.2,
        minZoom: 0.5,
        maxZoom: 7,
        dragRotate: false,
        pitchWithRotate: false,
        renderWorldCopies: false,
        interactive,
        attributionControl: { compact: true },
      });
      instance.touchZoomRotate.disableRotation();
      instance.keyboard.disableRotation();
      if (interactive) instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      const arrow = arrowImage(token("--color-cobalt"));
      instance.addImage(ARROW_IMAGE, arrow.data, { pixelRatio: arrow.pixelRatio });
      const popup = new maplibregl.Popup({ closeButton: false, className: styles.popup, offset: 8 });
      instance.on("click", "groups", (e) => {
        const f = e.features?.[0];
        if (!f || f.geometry.type !== "Point") return;
        popup.setLngLat(f.geometry.coordinates as [number, number]).setText(String(f.properties.name)).addTo(e.target);
      });
      instance.on("mouseenter", "groups", (e) => (e.target.getCanvas().style.cursor = "pointer"));
      instance.on("mouseleave", "groups", (e) => (e.target.getCanvas().style.cursor = ""));
      map = instance;
      const observer = new ResizeObserver(() => instance.resize());
      observer.observe(container.current);
      instance.once("remove", () => observer.disconnect());
      instance.on("load", (e) => {
        if (cancelled) return;
        mapRef.current = e.target;
        setReady(true);
      });
    });
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [groups, answer, interactive]);

  useEffect(() => {
    let cancelled = false;
    const draw = async () => {
      const map = mapRef.current;
      if (!ready || !map || cancelled) return;
      const maplibregl = await import("maplibre-gl");
      const wrong = guesses.filter((g) => g.id !== answer.id);
      (map.getSource("arrows") as GeoJSONSource).setData({
        type: "FeatureCollection",
        features: reveal ? [] : wrong.map((g) => point(g, { bearing: bearing(g, answer) })),
      });
      (map.getSource("joins") as GeoJSONSource).setData({
        type: "FeatureCollection",
        features: reveal
          ? wrong.map((g) => ({
              type: "Feature" as const,
              properties: {},
              geometry: { type: "LineString" as const, coordinates: [[g.lon, g.lat], [answer.lon, answer.lat]] },
            }))
          : [],
      });
      markers.current.forEach((m) => m.remove());
      markers.current = guesses
        .map((g, i) => (g.id === answer.id ? null : new maplibregl.Marker({ element: markerElement(g.name, i + 1), anchor: "left", offset: [-11, 0] }).setLngLat([g.lon, g.lat]).addTo(map)))
        .filter((m): m is Marker => m !== null);
      if (reveal) markers.current.push(new maplibregl.Marker({ element: markerElement(answer.name, null), anchor: "left", offset: [-13, 0] }).setLngLat([answer.lon, answer.lat]).addTo(map));
      const shown = reveal ? [...wrong, answer] : wrong;
      if (shown.length === 0) return;
      const bounds = new maplibregl.LngLatBounds();
      shown.forEach((g) => bounds.extend([g.lon, g.lat]));
      const { width, height } = map.getContainer().getBoundingClientRect();
      map.resize();
      map.fitBounds(bounds, { padding: Math.min(90, width / 5, height / 5), maxZoom: 4.5, duration: 0 });
    };
    draw();
    return () => {
      cancelled = true;
    };
  }, [ready, guesses, answer, reveal]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setPaintProperty("sea", "background-color", token("--color-sea"));
    map.setPaintProperty("land", "fill-color", token("--color-land"));
    map.setPaintProperty("land-line", "line-color", token("--color-line"));
    map.setPaintProperty("groups", "circle-color", token("--color-dot"));
    map.setPaintProperty("joins", "line-color", token("--color-cobalt"));
    map.updateImage(ARROW_IMAGE, arrowImage(token("--color-cobalt")).data);
  }, [ready, theme]);

  return <div ref={container} className={styles.map} data-testid="game-map" />;
}
