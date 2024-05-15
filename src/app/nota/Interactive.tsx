"use client";
import { useCallback, useState } from "react";
import { twMerge } from "tailwind-merge";
import Grafo from "./Grafo";
import { YearKey } from "./common";
import { GraphCluster, GraphEdge, GraphNode, Positions } from "./types";
import { getNodeNetwork, getSubNetwork } from "./utils";
import * as d3 from "d3";

type Props = {
  data: Record<
    YearKey,
    {
      nodes: GraphNode[];
      edges: GraphEdge[];
      positions: Positions;
    }
  >;
};

type Config = {
  id: string;
  year: YearKey;
  minWeight: number;
  nodesToHighlight?: string[];
  edgesToHighlight?: string[];
  labelsToShow?: string[];
  viewsToShow?: string[];
  clusters?: GraphCluster[];
};

function StepCard(props: {
  id: string;
  currentId: string;
  onStep: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={twMerge(
        "flex flex-col justify-start gap-2 p-3 border border-black w-full text-sm transition-colors",
        props.id === props.currentId ? "bg-gray-200/95" : "white"
      )}
    >
      {props.children}
      <button
        className={twMerge(
          "font-mono px-2 py-1 leading-none border border-black rounded-md w-fit text-xs bg-white hover:bg-gray-500 transition-colors"
        )}
        onClick={() => {
          // resetZoom();
          props.onStep(props.id);
        }}
      >
        Click
      </button>
    </div>
  );
}

function zoomToNode(handle: string, positions: Positions) {
  const { x, y } = positions[handle];
  const svg = d3.select("svg#grafo-scrolly");

  svg
    .select(".canvas")
    .transition()
    .duration(500)
    .attr("transform", `scale(1.5) translate(${-x}, ${-y})`);
}

function resetZoom() {
  const svg = d3.select("svg#grafo-scrolly");

  svg
    .select(".canvas")
    .transition()
    .duration(500)
    .attr("transform", `scale(1) translate(0, 0)`);
}

export default function Interactive(props: Props) {
  const [config, setConfig] = useState<Config>({
    id: "initial",
    year: "2020",
    minWeight: 2000,
    nodesToHighlight: props.data["2020"].nodes.map((n) => n.handle),
  });

  const {
    year,
    minWeight,
    nodesToHighlight,
    edgesToHighlight,
    labelsToShow,
    viewsToShow,
    clusters,
  } = config;

  const { nodes, edges, positions } = props.data[year];

  return (
    <div
      className={twMerge(
        "grid grid-cols-12 gap-4 max-w-7xl mx-auto px-6",
        "max-h-full h-dvh relative"
      )}
    >
      {/* Scrolly steps */}
      <div
        className={twMerge(
          "flex flex-col col-span-5 h-full overflow-scroll py-20 no-scrollbar",
          "absolute top-0 bottom-0 w-11/12 left-1/2 -translate-x-1/2 z-10",
          "md:relative"
        )}
      >
        <div className="flex flex-col justify-center items-center z-10 md:gap-10 gap-[20dvh]">
          <StepCard
            onStep={(id) => {
              const { nodes } = props.data["2020"];
              setConfig({
                id,
                year: "2020",
                minWeight: 2000,
                nodesToHighlight: nodes.map((n) => n.handle),
              });
            }}
            id="initial"
            currentId={config.id}
          >
            <p className="font-bold">2020: Inicio</p>
            <p>Mostramos todos los canales y solo las aristas de más de 2000</p>
            <p>Especificamos: año, minimo peso, nodos (entran todos)</p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              setConfig({
                id,
                year: "2020",
                minWeight: 2000,
              });
            }}
            id="comunidad-libertaria"
            currentId={config.id}
          >
            <p className="font-bold">La comunidad libertaria</p>
            <p>Mosramos solo los canales con aristas de más de 2000</p>
            <p>
              Especificamos: año, mínimo peso (los nodos se destacan si tienen
              aristas con ese mínimo peso)
            </p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              setConfig({
                id,
                year: "2020",
                minWeight: 2000,
                clusters: [
                  {
                    id: "danann",
                    nodes: [
                      "@danannoficial",
                      "@agustinlajeok",
                      "@nicolasmarqueztv",
                    ],
                    color: "#E7401D",
                  },
                  {
                    id: "presto",
                    nodes: ["@elprestook", "@tipitoenojado"],
                    color: "#F2E227",
                  },
                ],
              });
            }}
            id="clusters-libertarios"
            currentId={config.id}
          >
            <p className="font-bold">Clusters libertarios</p>
            <p>Mostramos los dos clusters libertarios</p>
            <p>
              Especificamos: año, mínimo peso (los nodos se destacan si tienen
              aristas con ese mínimo peso), los dos clusters poniendo nodos a
              mano.
            </p>
            <p>
              <span className="text-orange-400 font-bold">TODO:</span> definir
              si siempre que mostramos cluster se van a ver todos los nodos del
              cluster por más que no tengan arsitas con el peso mínimo y qué
              pasa con los que cumplen con las aristas pero no son de los
              clusters?
            </p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              const { nodes, edges } = props.data["2020"];
              const topViews = Array.from(nodes)
                .sort((a, b) => b.viewCount - a.viewCount)
                .slice(0, 5)
                .map((_) => _.handle);
              const { nodesIds, edgesIds } = getNodeNetwork(
                "@filonews",
                edges.filter((e) => e.weight > 2000)
              );
              setConfig({
                id,
                year: "2020",
                minWeight: 2000,
                viewsToShow: topViews,
                nodesToHighlight: nodesIds,
                edgesToHighlight: edgesIds,
                labelsToShow: ["@filonews"],
              });
            }}
            id="mirando-filo"
            currentId={config.id}
          >
            <p className="font-bold">Mirando Filo</p>
            <p>
              Mostramos que filo es top 1 en views y sus conexiones (es como
              haber hecho hover en filo)
            </p>
            <p>
              Especificamos: año, mínimo peso, views de los top 5 nodos y todos
              los nodos/aristas que pertenecen a la red de filo con peso mayor a
              2000
            </p>
            <p>
              <span className="text-orange-400 font-bold">TODO:</span> acá al
              definir el step estoy repitiendo la lógica de hover sobre un nodo,
              me gustaría que cuando extraigamos eso para hacer el hover sobre
              los tags en texto se pueda reutilizar acá.
            </p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              const { nodes } = props.data["2021"];
              setConfig({
                id,
                year: "2021",
                minWeight: 2000,
                nodesToHighlight: nodes.map((n) => n.handle),
              });
            }}
            id="initial-2021"
            currentId={config.id}
          >
            <p className="font-bold">2021: Las invasiones bárbaras</p>
            <p>
              Mostramos todos los canales y solo las aristas de más de 2000 para
              el año 2021
            </p>
            <p>Especificamos: año, minimo peso, nodos (entran todos)</p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              setConfig({
                id,
                year: "2021",
                minWeight: 2000,
              });
            }}
            id="centrales-2021"
            currentId={config.id}
          >
            <p className="font-bold">Los importantes del 2021</p>
            <p>Especificamos: año, minimo peso (solo nodos con más 2000)</p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              const { edges } = props.data["2021"];
              const { nodesIds, edgesIds } = getNodeNetwork(
                "@filonews",
                edges.filter((e) => e.weight > 1000)
              );
              setConfig({
                id,
                year: "2021",
                minWeight: 2000,
                nodesToHighlight: nodesIds,
                edgesToHighlight: edgesIds,
                labelsToShow: [
                  "@filonews",
                  "@luquitasrodriguez",
                  "@somosazz",
                  "@futurock",
                ],
              });
            }}
            id="nuevo-territorio"
            currentId={config.id}
          >
            <p className="font-bold">Nuevo territorio</p>
            <p>
              Lo mismo que arriba pero haciendo hover el filo y mostrando
              aristas más livianas
            </p>
            <p>
              <span className="text-orange-400 font-bold">TODO:</span> ver si
              queremos elegir las conexiones con filo a mano (ahora se muestran
              las que pesan más de 1000). Tenemos que pensar que pasa acá si
              mostramos estas conexiones a filo con la escala de pesos porque
              estaría mal decir que va de 2000 a X.
            </p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              const { edges, positions } = props.data["2021"];
              const { nodesIds, edgesIds } = getNodeNetwork(
                "@somosgelatina",
                edges.filter((e) => e.weight > 500)
              );
              setConfig({
                id,
                year: "2021",
                minWeight: 2000,
                nodesToHighlight: nodesIds,
                edgesToHighlight: edgesIds,
                labelsToShow: [
                  "@somosgelatina",
                  "@luquitasrodriguez",
                  "@somosazz",
                  "@futurock",
                ],
              });

              // zoomToNode("@somosgelatina", positions);
            }}
            id="pedro-rosemblat"
            currentId={config.id}
          >
            <p className="font-bold">Gelatina / Pedro</p>
            <p>
              Lo mismo que arriba pero haciendo hover el filo y mostrando
              aristas más livianas
            </p>
            <p>
              <span className="text-orange-400 font-bold">TODO:</span> ver si
              queremos elegir las conexiones con filo a mano (ahora se muestran
              las que pesan más de 1000). Tenemos que pensar que pasa acá si
              mostramos estas conexiones a filo con la escala de pesos porque
              estaría mal decir que va de 2000 a X.
            </p>
            <p>
              <span className="text-blue-400 font-bold">FEATURE:</span> si
              quisieramos podemos hacer zoom a algún nodo en particular. Puede
              servir en estos casos donde el tamaño de gelatina es chico para el
              grafo global
            </p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              const { nodes } = props.data["2021"];
              const top4 = Array.from(nodes)
                .sort((a, b) => b.viewCount - a.viewCount)
                .slice(0, 4)
                .map((_) => _.handle);
              setConfig({
                id,
                year: "2021",
                minWeight: 2000,
                nodesToHighlight: top4,
                viewsToShow: top4,
              });
            }}
            id="views-luzu"
            currentId={config.id}
          >
            <p className="font-bold">Views luzu</p>
            <p>
              Acá mostramos lo mismo que el inicio del año pero destacando que
              luzu se mete entre top 5 de viewcount
            </p>
            <p>
              <span className="text-orange-400 font-bold">TODO:</span> acá hay
              que ver como ajustamos los labels de nombre/views para que se vea
              algo en nodos tan chicos
            </p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              const { edges } = props.data["2021"];
              const { nodesIds, edgesIds } = getNodeNetwork(
                "@breakpointmp",
                edges.filter((e) => e.weight > 2000)
              );
              setConfig({
                id,
                year: "2021",
                minWeight: 2000,
                edgesToHighlight: edgesIds,
                nodesToHighlight: nodesIds,
                labelsToShow: ["@breakpointmp"],
              });
            }}
            id="aparece-breakpoint"
            currentId={config.id}
          >
            <p className="font-bold">Aparece breakpoint</p>
            <p>
              Mostramos a breakpoint y sus conexiones de más de 2000 coautores
            </p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              const { nodes } = props.data["2022"];
              setConfig({
                id,
                year: "2022",
                minWeight: 2000,
                nodesToHighlight: nodes.map((n) => n.handle),
              });
            }}
            id="initial-2022"
            currentId={config.id}
          >
            <p className="font-bold">2022: ¿No están entretenidos?</p>
            <p>
              Mostramos todos los canales y solo las aristas de más de 2000 para
              el año 2022
            </p>
            <p>Especificamos: año, minimo peso, nodos (entran todos)</p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              setConfig({
                id,
                year: "2022",
                minWeight: 2000,
              });
            }}
            id="centrales-2022"
            currentId={config.id}
          >
            <p className="font-bold">Los importantes del 2022</p>
            <p>Especificamos: año, minimo peso (solo nodos con más 2000)</p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              const { nodes, edges } = props.data["2022"];
              const group = [
                "@vorterixoficial",
                "@luquitasrodriguez",
                "@elmetodorebord",
                "@parenlamano",
                "@neuramedia",
                "@somosazz",
              ];
              const { nodesIds, edgesIds } = getSubNetwork(group, edges);
              setConfig({
                id,
                year: "2022",
                minWeight: 2000,
                nodesToHighlight: nodesIds,
                edgesToHighlight: edgesIds,
              });
            }}
            id="entreteniemiento-heterogeneo"
            currentId={config.id}
          >
            <p className="font-bold">Entreteniemiento heterogeneo</p>
            <p>
              Sin mostrar color de cluster destacamos un grupo de canales en
              particular mostrando toda conexión entre ellos sin importar el
              peso
            </p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              const { nodes, edges } = props.data["2022"];
              const group = [
                "@somosgelatina",
                "@paisdeboludos",
                "@nicoguthmann",
                "@220podcast",
                "@somosmatear",
              ];
              const { nodesIds, edgesIds } = getSubNetwork(group, edges);
              setConfig({
                id,
                year: "2022",
                minWeight: 2000,
                nodesToHighlight: nodesIds,
                edgesToHighlight: edgesIds,
              });
            }}
            id="tercera-comunidad"
            currentId={config.id}
          >
            <p className="font-bold">
              Tercera comunidad (progre, peronista, centroizquierda)
            </p>
            <p>
              Sin mostrar color de cluster destacamos un grupo de canales en
              particular mostrando toda conexión entre ellos sin importar el
              peso
            </p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              const { nodes } = props.data["2023"];
              setConfig({
                id,
                year: "2023",
                minWeight: 2000,
                nodesToHighlight: nodes.map((n) => n.handle),
              });
            }}
            id="initial-2023"
            currentId={config.id}
          >
            <p className="font-bold">2023: ¿No están entretenidos?</p>
            <p>
              Mostramos todos los canales y solo las aristas de más de 2000 para
              el año 2023
            </p>
            <p>Especificamos: año, minimo peso, nodos (entran todos)</p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              setConfig({
                id,
                year: "2023",
                minWeight: 2000,
              });
            }}
            id="centrales-2023"
            currentId={config.id}
          >
            <p className="font-bold">Los importantes del 2023</p>
            <p>Especificamos: año, minimo peso (solo nodos con más 2000)</p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              const { nodes, edges } = props.data["2023"];
              const group = [
                "@somosgelatina",
                "@tomasrebord",
                "@futurock",
                "@incatube",
                "@paisdeboludos",
                "@cafekyoto",
                "@pablobordaok",
                "@rosendogrobostreams",
                "@leylabechara",
                "@elmetodorebord",
                "@nicoguthmann",
                "@220podcast",
                "@somosmatear",
                "@posdata_ar",
                "@somosdelireo",
              ];
              const { nodesIds, edgesIds } = getSubNetwork(group, edges);
              setConfig({
                id,
                year: "2023",
                minWeight: 2000,
                nodesToHighlight: nodesIds,
                edgesToHighlight: edgesIds,
              });
            }}
            id="afines-peronismo-clusterizados"
            currentId={config.id}
          >
            <p className="font-bold">Peronismo y cercanos clusterizados</p>
            <p>
              Sin mostrar color de cluster destacamos un grupo de canales en
              particular mostrando toda conexión entre ellos sin importar el
              peso
            </p>
          </StepCard>

          <StepCard
            onStep={(id) => {
              const { nodes, edges } = props.data["2023"];
              const group = [
                "@olgaenvivo_",
                "@luzutv",
                "@luquitasrodriguez",
                "@vorterixoficial",
                "@somosazz",
                "@parenlamano",
                "@loftstream",
              ];
              const { nodesIds, edgesIds } = getSubNetwork(group, edges);
              setConfig({
                id,
                year: "2023",
                minWeight: 2000,
                nodesToHighlight: nodesIds,
                edgesToHighlight: edgesIds,
              });
            }}
            id="entretenimiento-sin-rosca"
            currentId={config.id}
          >
            <p className="font-bold">Entretenimiento sin rosca</p>
            <p>
              Sin mostrar color de cluster destacamos un grupo de canales en
              particular mostrando toda conexión entre ellos sin importar el
              peso
            </p>
          </StepCard>
        </div>
      </div>

      {/* Grafo container */}
      <div
        className={twMerge(
          "col-span-12 md:col-span-7",
          "h-full flex flex-col justify-start md:justify-center items-center z-0"
        )}
      >
        <Grafo
          className="mt-20"
          id="grafo-scrolly"
          nodes={nodes}
          edges={edges}
          positions={positions}
          minWeight={minWeight}
          nodesToHighlight={nodesToHighlight}
          edgesToHighlight={edgesToHighlight}
          labelsToShow={labelsToShow}
          viewsToShow={viewsToShow}
          clusters={clusters}
        />
      </div>
    </div>
  );
}

const handles = [
  "@luzutv",
  "@filonews",
  "@danannoficial",
  "@agustinlajeok",
  "@somosazz",
  "@breakpointmp",
  "@vorterixoficial",
  "@olgaenvivo_",
  "@luquitasrodriguez",
  "@losherederosdealberdi",
  "@neuramedia",
  "@francopisso",
  "@elprestook",
  "@losliberales",
  "@futurock",
  "@filosofiaparalavida",
  "@somosgelatina",
  "@elmetodorebord",
  "@ramiromarra",
  "@parenlamano",
  "@tipitoenojado",
  "@tipitolive",
  "@estoesblender",
  "@cafekyoto",
  "@planmmaximontenegro",
  "@piso18tv",
  "@republicaz",
  "@paisdeboludos",
  "@nicolasmarqueztv",
  "@ahora_play",
  "@tomasrebord",
  "@nicoguthmann",
  "@lhdapodcast",
  "@pablobordaok",
  "@somoslacasa",
  "@220podcast",
  "@somosmatear",
  "@barricadatv321",
  "@posdata_ar",
  "@lamisadedan",
  "@genteenojada7387",
  "@circulovicioso8",
  "@somosdelireo",
  "@rosendogrobostreams",
  "@loftstream",
  "@brindistv",
  "@incatube",
  "@ebeplay",
  "@cenitalcom",
  "@leylabechara",
  "@leanzicca",
  "@tugo_ok",
  "@factoria1251",
  "@lacastream",
  "@ceiboargentina",
  "@mostritv_",
  "@vorlytv",
  "@lafabricapodcast_ok",
];
