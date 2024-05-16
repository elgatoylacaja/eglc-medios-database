"use client";
import * as d3 from "d3";
import { useCallback, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import NodeLabel from "./NodeLabel";
import { GraphCluster, GraphEdge, GraphNode, Positions } from "./types";
import {
  getDefaultHighlight,
  getEdgeId,
  getNodeId,
  getNodeNetwork,
  numberToLabel,
  rScaleGenerator,
  wScaleGenerator
} from "./utils";

type Props = {
  id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  positions: Positions;

  // Optional
  minWeight?: number;
  nodesToHighlight?: string[];
  edgesToHighlight?: string[];
  labelsToShow?: string[];
  viewsToShow?: string[];

  // Clustering
  clusters?: GraphCluster[];

  className?: string;
};

const classes = {
  nodeHighlight: "opacity-100 grayscale-0",
  nodeHide: "opacity-20 grayscale",
  edgeHighlight: "opacity-100",
  edgeHide: "opacity-10",
};

export default function Grafo(props: Props) {
  const {
    id,
    nodes,
    edges: initialEdges,
    positions,
    minWeight = 0,
    clusters = [],
    labelsToShow = [],
    viewsToShow = [],
    edgesToHighlight = [],
    className = "",
  } = props;
  const ref = useRef<SVGSVGElement>(null);

  const edges = initialEdges.filter(
    (edge) =>
      edge.weight >= minWeight || edgesToHighlight.includes(getEdgeId(edge))
  );

  const { nodesToHighlight = getDefaultHighlight(nodes, edges, clusters) } =
    props;

  const rScale = rScaleGenerator(nodes, [30, 140]);
  const wScale = wScaleGenerator(initialEdges, [5, 50]);

  const highlightNodes = useCallback(
    (handles: string[] = nodesToHighlight) => {
      if (ref.current) {
        const svg = d3.select(ref.current);

        const nodesSelector = handles
          .map((n) => `.node#node-${n.replace("@", "")}`)
          .join(",");

        svg
          .selectAll(nodesSelector)
          .raise()
          .selectAll(".thumbnail")
          .classed(classes.nodeHide, false)
          .classed(classes.nodeHighlight, true);
      }
    },
    [nodesToHighlight, ref]
  );

  const hideNodes = useCallback(() => {
    if (ref.current) {
      const svg = d3.select(ref.current);
      svg
        .selectAll(".node .thumbnail")
        .classed(classes.nodeHide, true)
        .classed(classes.nodeHighlight, false);
    }
  }, [ref]);

  const highlightEdges = useCallback(
    (ids: string[] = edgesToHighlight) => {
      if (ref.current) {
        const svg = d3.select(ref.current);
        svg
          .selectAll(
            ids.length === 0
              ? ".edge"
              : ids.map((e) => `.edge#edge-${e}`).join(",")
          )
          .raise()
          .classed(classes.edgeHide, false)
          .classed(classes.edgeHighlight, true);
      }
    },
    [ref, edgesToHighlight]
  );

  const hideEdges = useCallback(() => {
    if (ref.current) {
      const svg = d3.select(ref.current);
      svg
        .selectAll(".edge")
        .classed(classes.edgeHide, true)
        .classed(classes.edgeHighlight, false);
    }
  }, [ref]);

  const onNodeMouseOver = useCallback(
    (handle: string) => {
      const { nodesIds, edgesIds } = getNodeNetwork(handle, edges);

      if (edgesIds.length !== 0) {
        hideEdges();
        highlightEdges(edgesIds);
      }

      if (nodesIds.length !== 0) {
        hideNodes();
        highlightNodes(nodesIds);
      }
    },
    [edges]
  );

  const onNodeMouseOut = useCallback(() => {
    hideEdges();
    hideNodes();
    highlightEdges();
    highlightNodes();
  }, [highlightNodes, highlightEdges, hideNodes, hideEdges]);

  const animateLines = useCallback(() => {
    if (ref.current) {
      const svg = d3.select(ref.current);

      edges.forEach((edge) => {
        const id = getEdgeId(edge);
        const { x: x1, y: y1 } = positions[edge.source];
        const { x: x2, y: y2 } = positions[edge.target];

        const line = svg.select(`#edge-${id}`);
        line
          .transition()
          .duration(150)
          .attr("x1", x1)
          .attr("y1", y1)
          .attr("x2", x2)
          .attr("y2", y2)
          .attr("stroke-width", wScale(edge.weight))
          .attr("stroke", "black");
      });
    }
  }, [ref, edges]);

  // const raiseNetwork = useCallback(() => {
  //   if (ref.current) {
  //     const svg = d3.select(ref.current);
  //     const nodesSelector = nodesToHighlight
  //       .map((n) => `.node#node-${n.replace("@", "")}`)
  //       .join(",");

  //     svg.selectAll(nodesSelector).raise();
  //   }
  // }, [ref, nodesToHighlight]);

  // const { dx, dy, scale } = recenterPositions(positions);

  useEffect(() => {
    onNodeMouseOut();
    animateLines();
    // raiseNetwork();
  }, [onNodeMouseOut, animateLines]);

  useEffect(() => {
    const mouseOverEvent = (event: CustomEvent<{ handle: string }>) => {
      onNodeMouseOver(event.detail.handle);
    };
    const mouseOutEvent = () => {
      onNodeMouseOut();
    };

    // @ts-ignore
    document.addEventListener("graphNodeMouseOver", mouseOverEvent);
    // @ts-ignore
    document.addEventListener("graphNodeMouseOut", mouseOutEvent);

    return () => {
      // @ts-ignore
      document.removeEventListener("graphNodeMouseOver", mouseOverEvent);
      // @ts-ignore
      document.removeEventListener("graphNodeMouseOut", mouseOutEvent);
    };
  }, [onNodeMouseOver, onNodeMouseOut]);

  return (
    <svg
      id={id}
      ref={ref}
      viewBox="-1000 -1000 2000 2000"
      className={twMerge(
        "max-w-4xl aspect-square overflow-visible border",
        className
      )}
    >
      <g
        className="canvas transition-transform"
        style={
          {
            // transform: `translate(${dx}px, ${dy}px)`,
          }
        }
      >
        {/* <g> */}
        {/* Edges */}
        {edges.map((edge) => {
          const edgeId = getEdgeId(edge);

          return (
            <line
              key={`edge-${edgeId}`}
              id={`edge-${edgeId}`}
              className="edge stroke-gray-800 transition-all"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const { x, y } = positions[node.handle];

          const r = rScale(node.pageRank);
          const imgR = r * 0.9;

          const showLabel = labelsToShow.includes(node.handle);
          const showViews = viewsToShow.includes(node.handle);

          const cluster: GraphCluster = clusters.find((cluster) =>
            cluster.nodes.includes(node.handle)
          ) || { nodes: [], color: "#3E3E3E", id: "regular" };

          return (
            <g
              id={`node-${getNodeId(node)}`}
              key={`node-${getNodeId(node)}`}
              className={twMerge(
                "node",
                "transition-all *:transition-all *:duration-500"
              )}
              // style={{ transform: `translate(${x}px, ${y}px)` }}
              onMouseOver={() => {
                onNodeMouseOver(node.handle);
              }}
              onMouseOut={() => {
                onNodeMouseOut();
              }}
              transform={`translate(${x}, ${y})`}
            >
              <circle cx={0} cy={0} r={r} className="fill-white" />

              {/* Thumbnail */}
              <g className={twMerge(`thumbnail cluster-${cluster.id}`)}>
                {/* Border circle */}
                <circle
                  cx={0}
                  cy={0}
                  r={r}
                  fill={cluster.color}
                  className="transition-colors"
                />
                <image
                  href={`https://cdn.elgatoylacaja.com/analisis-medios-digitales/thumbnails/${node.handle}.jpg`}
                  clipPath="inset(0% round 100%)"
                  x={-imgR}
                  y={-imgR}
                  width={imgR * 2}
                  height={imgR * 2}
                />

                <NodeLabel
                  r={r}
                  text={node.name}
                  position={"bottom-center"}
                  className={twMerge(showLabel ? "opacity-100" : "opacity-0")}
                  background={cluster.color}
                  stroke={"transparent"}
                  color="white"
                />
                <NodeLabel
                  r={r}
                  text={numberToLabel(node.viewCount)}
                  position={"top-center"}
                  withIcon
                  color="#E7401D"
                  className={twMerge(showViews ? "opacity-100" : "opacity-0")}
                  rounded
                />
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
