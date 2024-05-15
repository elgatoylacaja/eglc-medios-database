"use client";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import Grafo from "./Grafo";
import { GraphCluster, GraphEdge, GraphNode, Positions } from "./types";
import { YearKey, getEdgeId, nodeInEdge, years } from "./common";
import { keys } from "../../lib/utils";

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
  year: YearKey;
  minWeight: number;
  nodesToHighlight?: string[];
  edgesToHighlight?: string[];
  labelsToShow?: string[];
  viewsToShow?: string[];
  clusters?: GraphCluster[];
};

const classes = {
  "scrolly-card":
    "flex flex-col justify-start gap-2 p-3 bg-gray-200/95 border border-black w-full *:text-sm",
  "card-button":
    "font-mono px-2 py-1 leading-none border border-black rounded-md w-fit text-xs pointer-events-auto",
};

export default function Interactive(props: Props) {
  const [config, setConfig] = useState<Config>({
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
          "flex flex-col col-span-5 h-full overflow-scroll py-20",
          "absolute top-0 bottom-0 w-11/12 left-1/2 -translate-x-1/2 z-10",
          "md:relative"
        )}
      >
        <div className="flex flex-col justify-center items-center z-10 md:gap-40 gap-[80dvh]">
          {/* Step 1 */}
          <div className={twMerge(classes["scrolly-card"], "mt-[60dvh]")}>
            <p className="font-bold">2020: La sociedad secreta</p>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptate
              provident temporibus esse illo ab error. Nobis, temporibus et
              architecto adipisci perferendis corrupti similique quidem totam
              esse quibusdam expedita fugit possimus!
            </p>
            <button
              className={classes["card-button"]}
              onClick={() => {
                const { nodes } = props.data["2020"];
                setConfig((conf) => ({
                  year: "2020" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: nodes.map((n) => n.handle),
                }));
              }}
            >
              Click
            </button>
          </div>

          {/* Step 2 */}
          <div className={classes["scrolly-card"]}>
            <p>
              La comunidad libertaria fue la primera en constituirse como tal.
            </p>
            <button
              className={classes["card-button"]}
              onClick={() => {
                setConfig((conf) => ({
                  year: "2020" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: [
                    "@elprestook",
                    "@francopisso",
                    "@tipitoenojado",
                    "@tipitolive",
                    "@losherederosdealberdi",
                    "@danannoficial",
                    "@agustinlajeok",
                    "@ramiromarra",
                    "@planmmaximontenegro",
                    "@nicolasmarqueztv",
                  ],
                }));
              }}
            >
              Click
            </button>
          </div>

          {/* Step 3 */}
          <div className={classes["scrolly-card"]}>
            <p>
              Por supuesto, no era homogénea. Por un lado, estaban quienes
              elegían a{" "}
              <span className="bg-yellow-400 p-0.5 px-2">Tipito Enojado</span> y
              <span className="bg-yellow-400 p-0.5 px-2">El Presto</span>,
              famosos por su discurso económico y político. Por otro lado, los
              paladares que preferían a{" "}
              <span className="bg-red-500 p-0.5 px-2">Danann</span> y{" "}
              <span className="bg-red-500 p-0.5 px-2">Agustín Laje</span>, más
              abocados a la batalla cultural. Cuando se quiera minimizar el
              fenómeno de los nuevos medios, hay que recordar que ambas líneas
              editoriales planteaban agendas que en aquel momento casi podían
              considerarse de nicho o hasta contraculturales, y que hoy son
              parte del discurso de la mismísima Presidencia de la Nación.
            </p>
            <button
              className={classes["card-button"]}
              onClick={() => {
                setConfig((conf) => ({
                  year: "2020" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: [
                    "@elprestook",
                    "@francopisso",
                    "@tipitoenojado",
                    "@tipitolive",
                    "@losherederosdealberdi",
                    "@ramiromarra",
                    "@planmmaximontenegro",
                    "@nicolasmarqueztv",
                    "@agustinlajeok",
                    "@danannoficial",
                  ],
                  clusters: [
                    {
                      id: "tipito-presto",
                      nodes: [
                        "@elprestook",
                        "@francopisso",
                        "@tipitoenojado",
                        "@tipitolive",
                        "@losherederosdealberdi",
                        "@ramiromarra",
                        "@planmmaximontenegro",
                        "@nicolasmarqueztv",
                      ],
                      color: "rgb(250 204 21)",
                    },
                    {
                      id: "danann-laje",
                      nodes: ["@agustinlajeok", "@danannoficial"],
                      color: "rgb(239 68 68)",
                    },
                  ],
                }));
              }}
            >
              Click
            </button>
          </div>

          {/* Step 3 */}
          <div className={classes["scrolly-card"]}>
            <p>
              ¿Era esto previsible? ¿Por qué nadie la vio por fuera de los
              miembros de esa comunidad? Quizás los que no la vieron estaban
              mirando otra cosa:{" "}
              <span className="bg-red-500 p-0.5 px-2">FiloNews</span> tiene la
              mayor cantidad de vistas ese año{" "}
              <span className="bg-red-500 p-0.5 px-2">91M</span> , pero no
              conformaba tan sólidamente una comunidad. ¿Por qué? Porque era
              poco probable que su audiencia comentara también otros canales.
              Tampoco comentaban en Luzu, ni en Rebord, ni en FutuRock, Nico
              Guthman, Pablo Borda o cualquiera de los otros canales incipientes
              que asomaban en el horizonte. La conversación cruzada en 2020 fue
              un invento libertario. Una suerte de sociedad secreta, pero a la
              vista de todos.
            </p>
            <button
              className={classes["card-button"]}
              onClick={() => {
                const { edges } = props.data["2020"];
                const filoEdges = edges.filter(
                  (edge) => nodeInEdge("@filonews", edge) && edge.weight >= 2000
                );
                const nodesConnectedToFilo = Array.from(
                  new Set(
                    filoEdges.flatMap((edge) => [edge.target, edge.source])
                  )
                );
                setConfig((conf) => ({
                  year: "2020" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: nodesConnectedToFilo,
                  viewsToShow: nodesConnectedToFilo,
                }));
              }}
            >
              Click
            </button>
          </div>

          {/* Step 5 */}
          <div className={classes["scrolly-card"]}>
            <p className="font-bold">2021: Las invasiones bárbaras</p>
            <p>
              El 2021 fue un año confuso. ¿Estábamos o no en pandemia todavía?
              Las clases volvían intermitentemente. Los usuarios ya estaban
              entrenados en la virtualidad, en las compras a distancia, en los
              nuevos modos de consumir. El pasado lucía remoto y el futuro no
              terminaba de llegar. En ese contexto, la comunidad libertaria se
              consolidó aún más. Sin embargo, las murallas empezaban a
              resquebrajarse. La comunidad desbordó y tendió lazos con otros
              nodos más exóticos. Se abrió, siquiera un poco.{" "}
            </p>
            <button
              className={classes["card-button"]}
              onClick={() => {
                const { nodes, edges } = props.data["2021"];
                setConfig((conf) => ({
                  year: "2021" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: nodes.map((n) => n.handle),
                }));
              }}
            >
              Click
            </button>
          </div>

          {/* Step 6 */}
          <div className={classes["scrolly-card"]}>
            <p>
              Y más importante aún, una nueva comunidad empezó a gestarse.
              Digamos, mejor, un nuevo un territorio que emergió de las aguas,
              conectado pero sin división política clara:{" "}
              <span className="bg-black text-white p-0.5 px-2">El Método</span>,
              <span className="bg-black text-white p-0.5 px-2">Futurock</span>,{" "}
              <span className="bg-black text-white p-0.5 px-2">Azzaro</span> y{" "}
              <span className="bg-black text-white p-0.5 px-2">
                Luquitas Rodríguez
              </span>
              , con{" "}
              <span className="bg-black text-white p-0.5 px-2">Filo News</span>{" "}
              como punto de encuentro, empezaron a alimentar otra conversación.
            </p>
            <button
              className={classes["card-button"]}
              onClick={() => {
                const { edges } = props.data["2021"];
                const rest = [
                  "@luzutv",
                  "@somosgelatina",
                  "@somosazz",
                  "@luquitasrodriguez",
                  "@elmetodorebord",
                  "@futurock",
                  "@paisdeboludos",
                ];

                const edgesFromFiloToOthers = edges.filter((edge) => {
                  return (
                    (edge.source === "@filonews" &&
                      rest.includes(edge.target)) ||
                    (edge.target === "@filonews" && rest.includes(edge.source))
                  );
                });
                setConfig((conf) => ({
                  year: "2021" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: [...rest, "@filonews"],
                  edgesToHighlight: edgesFromFiloToOthers.map(getEdgeId),
                  labelsToShow: [
                    "@somosazz",
                    "@futurock",
                    "@elmetodorebord",
                    "@filonews",
                    "@luquitasrodriguez",
                  ],
                }));
              }}
            >
              Click
            </button>
          </div>

          {/* Step 7 */}
          <div className={classes["scrolly-card"]}>
            <p>
              <span className="bg-[#44f261] p-0.5 px-2">Gelatina</span> (todavía
              en su protoforma “Pedro Rosemblat”) ya estaban rosqueando su
              pertenencia a este espacio y a la vez siendo parte de una
              conversación más amplia con actores diferentes.
            </p>
            <button
              className={classes["card-button"]}
              onClick={() => {
                const { nodes, edges } = props.data["2021"];
                const rest = [
                  "@elmetodorebord",
                  "@futurock",
                  "@paisdeboludos",
                  "@220podcast",
                  "@incatube",
                  "@somosmatear",
                  "@leylabechara",
                  "@circulovicioso8",
                  "@pablobordaok",
                  "@cafekyoto",
                ];

                const edgesFromGelatinaToOthers = edges.filter((edge) => {
                  return (
                    (edge.source === "@somosgelatina" &&
                      rest.includes(edge.target)) ||
                    (edge.target === "@somosgelatina" &&
                      rest.includes(edge.source))
                  );
                });
                setConfig((conf) => ({
                  year: "2021" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: [...rest, "@somosgelatina"],
                  edgesToHighlight: edgesFromGelatinaToOthers.map(getEdgeId),
                  labelsToShow: ["@somosgelatina"],
                  clusters: [
                    {
                      id: "gelatina",
                      nodes: ["@somosgelatina"],
                      color: "#44f261",
                    },
                  ],
                }));
              }}
            >
              Click
            </button>
          </div>

          {/* Step 8 */}
          <div className={classes["scrolly-card"]}>
            <p>
              En este escenario,{" "}
              <span className="bg-red-500 p-0.5 px-2">Luzu</span> ya se ubica
              4to en cantidad de views, pero su audiencia no comenta en otros
              canales, por eso se lo ve pequeño, solo y aislado.
            </p>
            <button
              className={classes["card-button"]}
              onClick={() => {
                const { nodes, edges } = props.data["2021"];
                const top5 = Array.from(nodes)
                  .sort((a, b) => b.viewCount - a.viewCount)
                  .slice(0, 5);
                setConfig((conf) => ({
                  year: "2021" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: top5.map((n) => n.handle),
                  viewsToShow: top5.map((n) => n.handle),
                  labelsToShow: ["@luzutv"],
                }));
              }}
            >
              Click
            </button>
          </div>

          {/* Step 9 */}
          <div className={classes["scrolly-card"]}>
            <p>
              Y un pequeño actor aparece con una centralidad insospechada:{" "}
              <span className="bg-red-500 p-0.5 px-2">Break Point</span> todavía
              es una estrella pequeña en el firmamento libertario, pero dará
              forma al mundo a niveles que aún nadie podía sospechar.
            </p>
            <button
              className={classes["card-button"]}
              onClick={() => {
                const { edges } = props.data["2021"];

                const edgesFromBreakpoint = edges.filter((edge) => {
                  return (
                    [edge.source, edge.target].includes("@breakpointmp") &&
                    edge.weight >= 2000
                  );
                });
                setConfig((conf) => ({
                  year: "2021" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: edgesFromBreakpoint.flatMap((e) => [
                    e.source,
                    e.target,
                  ]),
                  edgesToHighlight: edgesFromBreakpoint.map(getEdgeId),
                  labelsToShow: ["@breakpointmp"],
                }));
              }}
            >
              Click
            </button>
          </div>

          {/* Step 10 */}
          <div className={classes["scrolly-card"]}>
            <p className="font-bold">2022: ¿No están entretenidos?</p>
            <p>
              La nueva normalidad trae dos fenómenos claros al mapa de nuevos
              medios digitales. Por un lado, el mainstream. Las grandes
              audiencias parecen descubrir que acá está pasando algo y aumenta
              mucho la cantidad de personas que miran Luzu, Azzaro, Luquitas
              Rodriguez, El Método y FutuRock. Y si bien continúa el dominio de
              los libertarios, se empiezan a consolidar nuevas comunidades. El
              mapa crece y se reordena.
            </p>
            <button
              className={classes["card-button"]}
              onClick={() => {
                const { nodes } = props.data["2022"];
                setConfig((conf) => ({
                  year: "2022" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: nodes.map((n) => n.handle),
                }));
              }}
            >
              Click
            </button>
          </div>

          {/* Step 10 */}
          <div className={classes["scrolly-card"]}>
            <p>
              Por un lado, se nuclean{" "}
              <span className="bg-red-500 p-0.5 px-2">Vorterix</span>,
              <span className="bg-red-500 p-0.5 px-2">Luquitas</span>,
              <span className="bg-red-500 p-0.5 px-2">El Método</span>,
              <span className="bg-red-500 p-0.5 px-2">Paren la mano</span>,
              <span className="bg-red-500 p-0.5 px-2">Neura Media</span>,
              <span className="bg-red-500 p-0.5 px-2">Azzaro</span>. ¿Cómo puede
              existir una comunidad tan heterogénea? Mera hipótesis: estos
              canales funcionaron como puerta de entrada al formato para muchas
              personas que llegaron en busca de entretenimiento. Además, sus
              mismos creadores hacían cruces y se invitaban entre sí, provocando
              migración cruzada de espectadores.
            </p>
            <button
              className={classes["card-button"]}
              onClick={() => {
                const { nodes } = props.data["2022"];
                const highlight = [
                  "@vorterixoficial",
                  "@luquitasrodriguez",
                  "@elmetodorebord",
                  "@parenlamano",
                  "@neuramedia",
                  "@somosazz",
                ];
                setConfig((conf) => ({
                  year: "2022" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: highlight,
                  labelsToShow: highlight,
                }));
              }}
            >
              Click
            </button>
          </div>

          {/* Step 11 */}
          <div className={classes["scrolly-card"]}>
            <p>
              Por otro lado, asistimos a la consolidación de una tercera
              comunidad, muy politizada pero no-libertaria (¿progre? ¿peronista?
              ¿de centroizquierda?) constituída principalmente por{" "}
              <span className="bg-red-500 p-0.5 px-2">Gelatina</span>,{" "}
              <span className="bg-red-500 p-0.5 px-2">País de boludos</span> y
              <span className="bg-red-500 p-0.5 px-2">Nico Guthmann</span>. La
              corren de atrás, pero corren muy rápido.
            </p>
            <button
              className={classes["card-button"]}
              onClick={() => {
                const { nodes } = props.data["2022"];
                const highlight = [
                  "@somosgelatina",
                  "@paisdeboludos",
                  "@nicoguthmann",
                  "@220podcast",
                  "@somosmatear",
                ];
                setConfig((conf) => ({
                  year: "2022" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: highlight,
                  labelsToShow: highlight,
                }));
              }}
            >
              Click
            </button>
          </div>

          <div className={classes["scrolly-card"]}>
            <p className="font-bold">2023: Punto de quiebre</p>
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
            <button
              className={classes["card-button"]}
              onClick={() => {
                const { nodes } = props.data["2023"];
                setConfig((conf) => ({
                  year: "2023" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: nodes.map((n) => n.handle),
                }));
              }}
            >
              Click
            </button>
          </div>

          <div className={classes["scrolly-card"]}>
            <p>
              El peronismo en sus diversas expresiones (
              <span className="bg-[#1f8df6] p-0.5 px-2">Gelatina</span>,{" "}
              <span className="bg-[#1f8df6] p-0.5 px-2">Rebord</span>,{" "}
              <span className="bg-[#1f8df6] p-0.5 px-2">Futurock</span>,{" "}
              <span className="bg-[#1f8df6] p-0.5 px-2">La Inca</span>,
              etcétera) se clusteriza con canales no peronistas pero afines
              ideológicamente (como{" "}
              <span className="bg-[#1f8df6] p-0.5 px-2">País de boludos</span>)
              y otros más inesperados (como{" "}
              <span className="bg-[#1f8df6] p-0.5 px-2">Café Kyoto</span>,{" "}
              <span className="bg-[#1f8df6] p-0.5 px-2">Pablo Borda</span> o
              <span className="bg-[#1f8df6] p-0.5 px-2">
                Rosendo Grobcopatel
              </span>
              ). Son comunidades compatibles que se encuentran y, a los fines de
              este análisis, se funden. Además, ocurre un fenómeno contenido en
              un sólo canal, pero relevante para todo el ecosistema porque
              repercute fuera de él: la fábrica de jingles salta del stream a la
              tele y de ahí a la calle y a los bunkers de campaña. (Momento de
              apreciación a este fenómeno cultural de ingenio colectivo y
              tradición popular. Amigues, a sus plantas rendido este gatito)
            </p>
            <button
              className={classes["card-button"]}
              onClick={() => {
                const { nodes } = props.data["2023"];
                const peronist = [
                  "@somosgelatina",
                  "@elmetodorebord",
                  "@tomasrebord",
                  "@futurock",
                  "@incatube",
                  "@cafekyoto",
                  "@pablobordaok",
                  "@rosendogrobostreams",
                  "@paisdeboludos",
                ];
                const libertario = [
                  "@breakpointmp",
                  "@losherederosdealberdi",
                  "@agustinlajeok",
                  "@neuramedia",
                  "@tipitoenojado",
                  "@danannoficial",
                ];
                const highlight = [...peronist, ...libertario];
                setConfig((conf) => ({
                  year: "2023" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: highlight,
                  clusters: [
                    { id: "peronistas", nodes: peronist, color: "#1f8df6" },
                    { id: "libertario", nodes: libertario, color: "#f2e227" },
                  ],
                }));
              }}
            >
              Click
            </button>
          </div>

          <div className={classes["scrolly-card"]}>
            <p>
              Quienes no tienen ganas de rosquear se refugian en la comunidad
              del entretenimiento:{" "}
              <span className="bg-red-400 p-0.5 px-2">Olga</span>,{" "}
              <span className="bg-red-400 p-0.5 px-2">Luzu</span> (que tiene la
              mayor cantidad de views),{" "}
              <span className="bg-red-400 p-0.5 px-2">Luquitas Rodríguez</span>,
              <span className="bg-red-400 p-0.5 px-2">Vorterix</span> y{" "}
              <span className="bg-red-400 p-0.5 px-2">Azzaro</span> concentran a
              la mayoría de una comunidad que tiene ganas de hablar de otra
              cosa.
            </p>
            <button
              className={classes["card-button"]}
              onClick={() => {
                const { nodes } = props.data["2023"];
                const highlight = [
                  "@olgaenvivo_",
                  "@luzutv",
                  "@luquitasrodriguez",
                  "@vorterixoficial",
                  "@somosazz",
                ];
                setConfig((conf) => ({
                  year: "2023" as YearKey,
                  minWeight: 2000,
                  nodesToHighlight: highlight,
                  clusters: [
                    {
                      id: "entretenimiento",
                      nodes: highlight,
                      color: "rgb(248 113 113)",
                    },
                  ],
                }));
              }}
            >
              Click
            </button>
          </div>

          {/* Fin */}
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
