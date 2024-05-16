"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import Grafo from "./Grafo";
import { YearKey } from "./common";
import { GraphCluster, GraphEdge, GraphNode, Positions } from "./types";
import { getNodeNetwork, getSubNetwork, recenterPositions } from "./utils";
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
  className?: string;
}) {
  const { id, currentId, onStep, children, className = "" } = props;

  const isCurrent = id === currentId;

  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={twMerge(
        "flex flex-col justify-start gap-2 p-3 border border-black w-full text-sm transition-colors",
        isCurrent ? "bg-gray-200" : "bg-white",
        "bg-opacity-80 backdrop-blur-sm",
        className
      )}
    >
      {children}
      <button
        className={twMerge(
          "font-mono px-2 py-1 leading-none border border-black rounded-md w-fit text-xs bg-white hover:bg-gray-500 transition-colors"
        )}
        onClick={() => {
          onStep(id);
        }}
      >
        Click
      </button>
    </div>
  );
}

function ViewsTag(props: { label: string }) {
  return (
    <span
      className={twMerge(
        "px-1 py-1 text-sm font-semibold bg-white text-[#e73f1d] inline-flex rounded-sm"
      )}
    >
      <svg
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
        className="size-4"
      >
        <mask id="eye-mask" maskUnits="userSpaceOnUse">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.00033 4.40625C10.219 4.40625 12.1664 5.65523 13.2106 7.52404C13.3747 7.81775 13.3747 8.18225 13.2106 8.47596C12.1669 10.3439 10.22 11.5938 8.00033 11.5938C5.78167 11.5938 3.83426 10.3448 2.79008 8.47596C2.62596 8.18225 2.62596 7.81773 2.79008 7.52402C3.83374 5.65613 5.7807 4.40625 8.00033 4.40625ZM8.00033 9.875C9.30945 9.875 10.3707 8.79068 10.3707 7.45312C10.3707 6.11557 9.30945 5.03125 8.00033 5.03125C6.69122 5.03125 5.62996 6.11557 5.62996 7.45312C5.62996 8.79068 6.69122 9.875 8.00033 9.875ZM12.7 8.15865C11.7381 9.88041 9.9608 10.9687 8.00033 10.9687C6.03198 10.9687 4.25846 9.87295 3.30063 8.15867C3.24595 8.06076 3.24595 7.93926 3.30063 7.84135C3.839 6.87781 4.6588 6.07504 5.6647 5.57793C5.27524 6.08967 5.03737 6.74156 5.03737 7.45312C5.03737 9.12926 6.35628 10.5 8.00033 10.5C9.64422 10.5 10.9633 9.12934 10.9633 7.45312C10.9633 6.74197 10.7256 6.08996 10.336 5.57793C11.3315 6.0699 12.1559 6.8674 12.7001 7.84135C12.7547 7.93926 12.7547 8.06075 12.7 8.15865ZM6.95459 6.78639C6.86565 6.9618 6.81515 7.16217 6.81515 7.375C6.81515 8.06535 7.34578 8.625 8.00033 8.625C8.65489 8.625 9.18552 8.06535 9.18552 7.375C9.18552 6.68465 8.65489 6.125 8.00033 6.125C7.79854 6.125 7.60856 6.17826 7.44224 6.27207H7.44261C7.71213 6.27207 7.93063 6.50252 7.93063 6.78678C7.93063 7.07104 7.71213 7.30148 7.44261 7.30148C7.17309 7.30148 6.95459 7.07104 6.95459 6.78678V6.78639Z"
            fill="white"
          />
        </mask>
        <g mask="url(#eye-mask)">
          <rect width="16" height="16" fill={"#e73f1d"} />
        </g>
      </svg>
      <span>{props.label}</span>
    </span>
  );
}

function Tag(props: { handle: string; label: string; className?: string }) {
  return (
    <span
      className={twMerge(
        "px-2 py-1 text-sm font-semibold",
        "bg-[#e73f1d] text-white hover:bg-opacity-80 transition-colors",
        props.className
      )}
      onClick={() => {
        // @ts-ignore
        document.dispatchEvent(
          new CustomEvent("graphNodeMouseOver", {
            detail: { handle: props.handle },
          })
        );
      }}
      onMouseOver={() => {
        // @ts-ignore
        document.dispatchEvent(
          new CustomEvent("graphNodeMouseOver", {
            detail: { handle: props.handle },
          })
        );
      }}
      onMouseOut={() => {
        // @ts-ignore
        document.dispatchEvent(new CustomEvent("graphNodeMouseOut"));
      }}
    >
      {props.label}
    </span>
  );
}

function zoomToNode(handle: string, positions: Positions) {
  const { x, y } = positions[handle];
  const svg = d3.select("svg#grafo-scrolly");
  const { scale } = recenterPositions(positions);

  svg
    .select(".canvas")
    .transition()
    .duration(250)
    .style("transform", `scale(${scale * 1.2}) translate(${-x}px, ${-y}px)`);
}

function resetZoom(positions: Positions) {
  const svg = d3.select("svg#grafo-scrolly");

  const { dx, dy, scale } = recenterPositions(positions);

  svg
    .select(".canvas")
    .transition()
    .duration(250)
    .style(
      "transform",
      `scale(${scale.toFixed(1)}) translate(${dx}px, ${dy}px)`
    );
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
          "absolute top-0 bottom-0 w-11/12 left-1/2 -translate-x-1/2 z-20",
          "md:relative"
        )}
      >
        <div className="flex flex-col justify-center items-center z-10 md:gap-[20dvh] gap-[120dvw]">
          <StepCard
            className="mt-[100dvw] md:mt-[20dvh]"
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
            <p className="font-bold">2020: La sociedad secreta</p>
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Mostramos todos los canales y solo las aristas de más de 2000
            </p>
            <p className="text-xs font-mono">
              Especificamos: año, minimo peso, nodos (entran todos)
            </p> */}
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
            <p>
              La comunidad libertaria fue la primera en constituirse como tal.
            </p>
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Mosramos solo los canales con aristas de más de 2000
            </p>
            <p className="text-xs font-mono">
              Especificamos: año, mínimo peso (los nodos se destacan si tienen
              aristas con ese mínimo peso)
            </p> */}
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
                    color: "#0903ae",
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
            <p>
              Por supuesto, no era homogénea. Por un lado, estaban quienes
              elegían a{" "}
              <Tag
                label="Tipito Enojado"
                handle="@tipitoenojado"
                className="bg-[#F2E227] text-black"
              />{" "}
              y{" "}
              <Tag
                label="El Presto"
                handle="@elprestook"
                className="bg-[#F2E227] text-black"
              />
              , famosos por su discurso económico y político. Por otro lado, los
              paladares que preferían a{" "}
              <Tag
                label="Danann"
                handle="@danannoficial"
                className="bg-[#0903ae] text-white"
              />{" "}
              y{" "}
              <Tag
                label="Agustín Laje"
                handle="@agustinlajeok"
                className="bg-[#0903ae] text-white"
              />
              , más abocados a la batalla cultural. Cuando se quiera minimizar
              el fenómeno de los nuevos medios, hay que recordar que ambas
              líneas editoriales planteaban agendas que en aquel momento casi
              podían considerarse de nicho o hasta contraculturales, y que hoy
              son parte del discurso de la mismísima Presidencia de la Nación.
            </p>
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Mostramos los dos clusters libertarios
            </p>
            <p className="text-xs font-mono">
              Especificamos: año, mínimo peso (los nodos se destacan si tienen
              aristas con ese mínimo peso), los dos clusters poniendo nodos a
              mano.
            </p>
            <p className="text-xs font-mono">
              <span className="text-orange-400 font-bold">TODO:</span> definir
              si siempre que mostramos cluster se van a ver todos los nodos del
              cluster por más que no tengan arsitas con el peso mínimo y qué
              pasa con los que cumplen con las aristas pero no son de los
              clusters?
            </p> */}
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
              // zoomToNode("@filonews", positions);
            }}
            id="mirando-filo"
            currentId={config.id}
          >
            <p>
              ¿Era esto previsible? ¿Por qué nadie la vio por fuera de los
              miembros de esa comunidad? Quizás los que no la vieron estaban
              mirando otra cosa: <Tag label="Filo News" handle="@filonews" />{" "}
              tiene la mayor cantidad de vistas ese año <ViewsTag label="91M" />
              , pero no conformaba tan sólidamente una comunidad. ¿Por qué?
              Porque era poco probable que su audiencia comentara también otros
              canales. Tampoco comentaban en Luzu, ni en Rebord, ni en FutuRock,
              Nico Guthman, Pablo Borda o cualquiera de los otros canales
              incipientes que asomaban en el horizonte. La conversación cruzada
              en 2020 fue un invento libertario. Una suerte de sociedad secreta,
              pero a la vista de todos.
            </p>
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Mostramos que filo es top 1 en views y sus conexiones (es como
              haber hecho hover en filo)
            </p>
            <p className="text-xs font-mono">
              Especificamos: año, mínimo peso, views de los top 5 nodos y todos
              los nodos/aristas que pertenecen a la red de filo con peso mayor a
              2000
            </p>
            <p className="text-xs font-mono">
              <span className="text-orange-400 font-bold">TODO:</span> acá al
              definir el step estoy repitiendo la lógica de hover sobre un nodo,
              me gustaría que cuando extraigamos eso para hacer el hover sobre
              los tags en texto se pueda reutilizar acá.
            </p> */}
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
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Mostramos todos los canales y solo las aristas de más de 2000 para
              el año 2021
            </p>
            <p className="text-xs font-mono">
              Especificamos: año, minimo peso, nodos (entran todos)
            </p> */}
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
            <p>
              El 2021 fue un año confuso. ¿Estábamos o no en pandemia todavía?
              Las clases volvían intermitentemente. Los usuarios ya estaban
              entrenados en la virtualidad, en las compras a distancia, en los
              nuevos modos de consumir. El pasado lucía remoto y el futuro no
              terminaba de llegar. En ese contexto, la comunidad libertaria se
              consolidó aún más. Sin embargo, las murallas empezaban a
              resquebrajarse. La comunidad desbordó y tendió lazos con otros
              nodos más exóticos. Se abrió, siquiera un poco.
            </p>
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Especificamos: año, minimo peso (solo nodos con más 2000)
            </p> */}
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
            <p>
              Y más importante aún, una nueva comunidad empezó a gestarse.
              Digamos, mejor, un nuevo un territorio que emergió de las aguas,
              conectado pero sin división política clara:{" "}
              <Tag label="El Método" handle="@elmetodorebord" /> ,{" "}
              <Tag label="Futurock" handle="@futurock" />,{" "}
              <Tag label="Azzaro" handle="@somosazz" /> y
              <Tag label="Luquitas Rodríguez" handle="@luquitasrodriguez" />,
              con <Tag label="Filo News" handle="@filonews" /> como punto de
              encuentro, empezaron a alimentar otra conversación.
            </p>
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Lo mismo que arriba pero haciendo hover el filo y mostrando
              aristas más livianas
            </p>
            <p className="text-xs font-mono">
              <span className="text-orange-400 font-bold">TODO:</span> ver si
              queremos elegir las conexiones con filo a mano (ahora se muestran
              las que pesan más de 1000). Tenemos que pensar que pasa acá si
              mostramos estas conexiones a filo con la escala de pesos porque
              estaría mal decir que va de 2000 a X.
            </p> */}
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
            <p>
              <Tag label="Gelatina" handle="@somosgelatina" /> (todavía en su
              protoforma “Pedro Rosemblat”) ya estaban rosqueando su pertenencia
              a este espacio y a la vez siendo parte de una conversación más
              amplia con actores diferentes.
            </p>
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Lo mismo que arriba pero haciendo hover el filo y mostrando
              aristas más livianas
            </p>
            <p className="text-xs font-mono">
              <span className="text-orange-400 font-bold">TODO:</span> ver si
              queremos elegir las conexiones con filo a mano (ahora se muestran
              las que pesan más de 1000). Tenemos que pensar que pasa acá si
              mostramos estas conexiones a filo con la escala de pesos porque
              estaría mal decir que va de 2000 a X.
            </p>
            <p className="text-xs font-mono">
              <span className="text-blue-400 font-bold">FEATURE:</span> si
              quisieramos podemos hacer zoom a algún nodo en particular. Puede
              servir en estos casos donde el tamaño de gelatina es chico para el
              grafo global
            </p> */}
          </StepCard>

          <StepCard
            onStep={(id) => {
              const { nodes, edges } = props.data["2021"];
              const top4 = Array.from(nodes)
                .sort((a, b) => b.viewCount - a.viewCount)
                .slice(0, 4)
                .map((_) => _.handle);
              const { edgesIds, nodesIds } = getSubNetwork(
                top4,
                edges.filter((e) => e.weight > 2000)
              );
              setConfig({
                id,
                year: "2021",
                minWeight: 2000,
                nodesToHighlight: nodesIds,
                edgesToHighlight: edgesIds,
                viewsToShow: top4,
              });
              // zoomToNode("@luzutv", positions);
            }}
            id="views-luzu"
            currentId={config.id}
          >
            <p>
              En este escenario, <Tag label="Luzu" handle="@luzutv" /> ya se
              ubica 4to en cantidad de views, pero su audiencia no comenta en
              otros canales, por eso se lo ve pequeño, solo y aislado.
            </p>
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Acá mostramos lo mismo que el inicio del año pero destacando que
              luzu se mete entre top 5 de viewcount
            </p>
            <p className="text-xs font-mono">
              <span className="text-orange-400 font-bold">TODO:</span> acá hay
              que ver como ajustamos los labels de nombre/views para que se vea
              algo en nodos tan chicos
            </p> */}
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
              // zoomToNode("@breakpointmp", positions);
            }}
            id="aparece-breakpoint"
            currentId={config.id}
          >
            <p>
              Y un pequeño actor aparece con una centralidad insospechada:{" "}
              <Tag label="Break Point" handle="@breakpointmp" /> todavía es una
              estrella pequeña en el firmamento libertario, pero dará forma al
              mundo a niveles que aún nadie podía sospechar.
            </p>
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p>
              Mostramos a breakpoint y sus conexiones de más de 2000 coautores
            </p> */}
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
            <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Mostramos todos los canales y solo las aristas de más de 2000 para
              el año 2022
            </p>
            <p className="text-xs font-mono">
              Especificamos: año, minimo peso, nodos (entran todos)
            </p>
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
            <p>
              La nueva normalidad trae dos fenómenos claros al mapa de nuevos
              medios digitales. Por un lado, el mainstream. Las grandes
              audiencias parecen descubrir que acá está pasando algo y aumenta
              mucho la cantidad de personas que miran Luzu, Azzaro, Luquitas
              Rodriguez, El Método y FutuRock. Y si bien continúa el dominio de
              los libertarios, se empiezan a consolidar nuevas comunidades. El
              mapa crece y se reordena.
            </p>
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Especificamos: año, minimo peso (solo nodos con más 2000)
            </p> */}
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
            <p>
              Por un lado, se nuclean{" "}
              <Tag label="Vorterix" handle="@vorterixoficial" />,{" "}
              <Tag label="Luquitas Rodríguez" handle="@luquitasrodriguez" />,{" "}
              <Tag label="El Método" handle="@elmetodorebord" />,{" "}
              <Tag label="Paren la mano" handle="@parenlamano" />,{" "}
              <Tag label="Neura Media" handle="@neuramedia" /> y{" "}
              <Tag label="Azzaro" handle="@somosazz" />. ¿Cómo puede existir una
              comunidad tan heterogénea? Mera hipótesis: estos canales
              funcionaron como puerta de entrada al formato para muchas personas
              que llegaron en busca de entretenimiento. Además, sus mismos
              creadores hacían cruces y se invitaban entre sí, provocando
              migración cruzada de espectadores.
            </p>
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Sin mostrar color de cluster destacamos un grupo de canales en
              particular mostrando toda conexión entre ellos sin importar el
              peso
            </p> */}
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
            <p>
              Por otro lado, asistimos a la consolidación de una tercera
              comunidad, muy politizada pero no-libertaria (¿progre? ¿peronista?
              ¿de centroizquierda?) constituída principalmente por{" "}
              <Tag label="Gelatina" handle="@somosgelatina" />,{" "}
              <Tag label="País de Boludos" handle="@paisdeboludos" /> y{" "}
              <Tag label="Nico Guthmann" handle="@nicoguthmann" />. La corren de
              atrás, pero corren muy rápido.
            </p>
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Tercera comunidad (progre, peronista, centroizquierda)
            </p>
            <p className="text-xs font-mono">
              Sin mostrar color de cluster destacamos un grupo de canales en
              particular mostrando toda conexión entre ellos sin importar el
              peso
            </p> */}
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
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Mostramos todos los canales y solo las aristas de más de 2000 para
              el año 2023
            </p>
            <p className="text-xs font-mono">
              Especificamos: año, minimo peso, nodos (entran todos)
            </p> */}
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
            <p>
              Finalmente, ocurre: el año de las elecciones presidenciales en
              Argentina. La pandemia es cosa del pasado, ahora vamos a estar por
              lo menos seis meses eligiendo entre dos posibilidades: consumir
              toda la política que podemos, o tratar de consumir la menor
              cantidad de política que podemos. A veces, llamativamente,
              logramos hacer ambas a la vez. Todo el sistema parece más
              integrado. Las comunidades mantienen cierto nivel de diálogo unas
              con otras. Pero, también, los territorios están más claros:
            </p>
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Especificamos: año, minimo peso (solo nodos con más 2000)
            </p> */}
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
            <p>
              El peronismo en sus diversas expresiones (
              <Tag label="Gelatina" handle="@somosgelatina" />,{" "}
              <Tag label="Rebord" handle="@tomasrebord" />,{" "}
              <Tag label="Futurock" handle="@futurock" />,{" "}
              <Tag label="La Inca" handle="@incatube" />, etcétera) se
              clusteriza con canales no peronistas pero afines ideológicamente
              (como País de Boludos) y otros más inesperados (como{" "}
              <Tag label="Café Kyoto" handle="@cafekyoto" />,{" "}
              <Tag label="Pablo Borda" handle="@pablobordaok" /> o{" "}
              <Tag label="Rosendo Grobocopatel" handle="@rosendogrobostreams" />
              ). Son comunidades compatibles que se encuentran y, a los fines de
              este análisis, se funden. Además, ocurre un fenómeno contenido en
              un sólo canal, pero relevante para todo el ecosistema porque
              repercute fuera de él: la fábrica de jingles salta del stream a la
              tele y de ahí a la calle y a los bunkers de campaña. (Momento de
              apreciación a este fenómeno cultural de ingenio colectivo y
              tradición popular. Amigues, a sus plantas rendido este gatito).
            </p>
            {/* <div className="w-full h-px bg-gray-900"></div>
            <p className="text-xs font-mono">
              Sin mostrar color de cluster destacamos un grupo de canales en
              particular mostrando toda conexión entre ellos sin importar el
              peso
            </p> */}
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

          <StepCard
            onStep={(id) => {
              setConfig({
                id,
                year: "2024",
                minWeight: 800,
              });
            }}
            id="centrales-2024"
            currentId={config.id}
          >
            <p className="font-bold">Los importantes del 2024</p>
            <p>Especificamos: año, minimo peso (solo nodos con más 800)</p>
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
