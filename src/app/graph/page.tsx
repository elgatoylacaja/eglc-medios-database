"use client";
import { useEffect } from "react";
import Graph, { MultiDirectedGraph, UndirectedGraph } from "graphology";
import { SigmaContainer, useLoadGraph } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";

type Node = {
  id: string;
  name: string;
  handle: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
  commentCount: string;
  authors: string;
};

type Edge = {
  Source: string;
  Target: string;
  weight: number;
};

const NODES = `
id,_id,name,handle,label,subscriberCount,viewCount,videoCount,commentCount,authors,oldestVideo,publishedAt
@futurock,UCgn6r0aGRBnEQm02tE_jzbw,Futurock FM,@futurock,@futurock,219000,7450367,459,18142,6023,2020-01-13T22:15:09.000Z,2016-10-24T17:13:34.000Z
@barricadatv321,UC6YundoLrEuBJaPp_oEPWaA,Barricada TV,@barricadatv321,@barricadatv321,28500,847208,379,2671,1736,2020-01-09T21:03:54.000Z,2008-01-29T14:48:47.000Z
@filonews,UC9vs8KujZ2kJ2hbg01fNRVw,Filo News,@filonews,@filonews,1450000,91964355,251,154199,93708,2020-01-02T16:58:49.000Z,2017-02-16T11:05:58.000Z
@ramiromarra,UCC1T5E1SKjKz7apQ8IkxTGQ,Ramiro Marra,@ramiromarra,@ramiromarra,404000,7291567,206,36419,12912,2020-01-02T19:32:37.000Z,2017-12-22T17:38:46.000Z
@elprestook,UCHDwIzNtE5vPScYLLXutkHA,El Presto,@elprestook,@elprestook,464000,17218496,190,165887,50559,2020-01-11T18:28:58.000Z,2011-03-08T19:23:37.000Z
@luzutv,UCTHaNTsP7hsVgBxARZTuajw,LUZU TV,@luzutv,@luzutv,1370000,1635178,135,1125,480,2020-11-02T18:33:50.000Z,2013-05-07T03:12:19.000Z
@danannoficial,UCf7cmc_Xxke9eIg76b6qdSg,Danann,@danannoficial,@danannoficial,1870000,53136683,117,159082,79912,2020-01-01T22:00:08.000Z,2016-12-07T21:21:39.000Z
@220podcast,UCOpxYGU6whNOWd2LWzkFEKQ,220 Podcast,@220podcast,@220podcast,47700,361865,117,17275,1967,2020-06-30T23:12:07.000Z,2020-06-25T14:19:39.668Z
@planmmaximontenegro,UCnkAzcpDF-yd5ndPEaBMzDA,Plan M - Maxi Montenegro,@planmmaximontenegro,@planmmaximontenegro,122000,4451194,103,24073,8864,2020-03-05T19:05:14.000Z,2011-05-13T20:47:54.000Z
@agustinlajeok,UCJKjzEoy91UYS-bZLc4CLCQ,Agustín Laje Arrigoni,@agustinlajeok,@agustinlajeok,2240000,20665056,98,184983,74475,2020-01-06T15:25:37.000Z,2011-10-01T20:03:20.000Z
@cafekyoto,UC7ah60G8vVmj4S1bF3D5JlA,Café Kyoto,@cafekyoto,@cafekyoto,379000,3473338,57,3248,630,2020-01-18T01:15:20.000Z,2018-09-26T23:10:26.000Z
@tipitoenojado,UCFCsnU1m_b1t93Oz9Weawng,Tipito Enojado,@tipitoenojado,@tipitoenojado,348000,8377902,55,67608,28036,2020-01-11T03:44:51.000Z,2019-01-04T02:09:29.000Z
@somosgelatina,UCWSfXECGo1qK_H7SXRaUSMg,GELATINA,@somosgelatina,@somosgelatina,318000,2254632,28,19269,9251,2020-08-07T14:00:10.000Z,2019-09-12T17:29:10.000Z
@losherederosdealberdi,UCK2ozGMW83z83QQaHjZeVBg,Los Herederos de Alberdi,@losherederosdealberdi,@losherederosdealberdi,338000,2092354,25,8579,3238,2020-01-22T23:00:13.000Z,2018-09-16T21:50:56.000Z
@paisdeboludos,UCMdE59YbYbSqkiZT_DPM4Dg,Pais De Boludos,@paisdeboludos,@paisdeboludos,206000,1306694,17,13044,7189,2020-03-09T01:31:44.000Z,2017-08-30T03:11:42.000Z
@somosazz,UCgLBmUFPO8JtZ1nPIBQGMlQ,AZZ,@somosazz,@somosazz,500000,110012,10,900,458,2020-01-01T06:06:29.000Z,2016-08-28T18:08:13.000Z
@francopisso,UCwd_qoS94df5orGoPLPnsxQ,Franco Pisso,@francopisso,@francopisso,871000,156752,10,94,67,2020-06-10T19:00:09.000Z,2014-04-15T19:57:56.000Z
@tipitolive,UCzmvTwRkUUsd-RguaMl2V1g,Tipito LIVE,@tipitolive,@tipitolive,136000,320050,8,294,180,2020-11-22T05:26:55.000Z,2020-11-08T05:42:45.973Z
@tomasrebord,UCEKbBDfanOeB3LqZio_nLdQ,Tomás Rebord,@tomasrebord,@tomasrebord,111000,156632,7,183,142,2020-07-28T21:00:04.000Z,2012-05-21T15:19:08.000Z
@nicoguthmann,UCpvYnSZNyBxF2MSWvju06jg,Nico Guthmann,@nicoguthmann,@nicoguthmann,182000,163022,7,2294,1210,2020-01-18T14:19:03.000Z,2013-09-28T05:05:19.000Z
@pablobordaok,UCIlhgwnIjK_l2w_MMYy18tw,Pablo Borda,@pablobordaok,@pablobordaok,66100,76874,5,177,97,2020-08-21T11:45:43.000Z,2020-05-06T13:12:26.168Z
@leylabechara,UCZW0ewjrlQtj5OmIdQ9bt0Q,Leyla Bechara,@leylabechara,@leylabechara,7730,4052,3,18,11,2020-05-20T14:16:58.000Z,2020-05-20T13:11:57.339Z
@incatube,UCCNbips7oecr9sytVC7YoZw,Inca,@incatube,@incatube,17300,25416,2,134,112,2020-12-13T21:43:25.000Z,2020-12-13T01:55:57.563Z
@genteenojada7387,UCY39HPbA70X7Hrry_OkuMQQ,Pronto Pinarello,@genteenojada7387,@genteenojada7387,58700,164386,1,692,598,2020-07-11T03:27:44.000Z,2020-04-21T22:37:43.443Z
`;

const EDGES = `
Source,Target,weight
@agustinlajeok,@danannoficial,14906
@danannoficial,@elprestook,10005
@elprestook,@tipitoenojado,9778
@danannoficial,@tipitoenojado,7902
@agustinlajeok,@elprestook,7428
@agustinlajeok,@tipitoenojado,5473
@danannoficial,@filonews,5058
@elprestook,@filonews,4436
@agustinlajeok,@filonews,4022
@filonews,@tipitoenojado,3028
@elprestook,@planmmaximontenegro,1751
@losherederosdealberdi,@tipitoenojado,1341
@elprestook,@losherederosdealberdi,1330
@planmmaximontenegro,@ramiromarra,1240
@elprestook,@ramiromarra,1237
@danannoficial,@losherederosdealberdi,1225
@filonews,@paisdeboludos,1183
@filonews,@somosgelatina,1128
@planmmaximontenegro,@tipitoenojado,1032
@ramiromarra,@tipitoenojado,999
@filonews,@futurock,955
@paisdeboludos,@somosgelatina,906
@danannoficial,@ramiromarra,896
@filonews,@planmmaximontenegro,896
@danannoficial,@planmmaximontenegro,864
@agustinlajeok,@losherederosdealberdi,831
@filonews,@ramiromarra,768
@agustinlajeok,@planmmaximontenegro,722
@elprestook,@paisdeboludos,550
@agustinlajeok,@ramiromarra,518
@filonews,@losherederosdealberdi,511
@paisdeboludos,@tipitoenojado,483
@220podcast,@paisdeboludos,473
@elprestook,@somosgelatina,434
@futurock,@somosgelatina,407
@danannoficial,@paisdeboludos,374
@220podcast,@somosgelatina,317
@220podcast,@filonews,287
@barricadatv321,@elprestook,274
@somosgelatina,@tipitoenojado,262
@futurock,@paisdeboludos,247
@danannoficial,@futurock,246
@elprestook,@futurock,243
@danannoficial,@somosgelatina,242
@agustinlajeok,@paisdeboludos,236
@filonews,@nicoguthmann,236
@paisdeboludos,@planmmaximontenegro,212
@losherederosdealberdi,@ramiromarra,204
@barricadatv321,@filonews,199
@agustinlajeok,@futurock,192
@losherederosdealberdi,@planmmaximontenegro,188
@futurock,@tipitoenojado,156
@agustinlajeok,@somosgelatina,154
@barricadatv321,@danannoficial,153
@paisdeboludos,@ramiromarra,148
@agustinlajeok,@barricadatv321,148
@220podcast,@futurock,136
@barricadatv321,@tipitoenojado,133
@planmmaximontenegro,@somosgelatina,129
@filonews,@genteenojada7387,128
@elprestook,@nicoguthmann,125
@cafekyoto,@tipitoenojado,122
@tipitoenojado,@tipitolive,120
@nicoguthmann,@paisdeboludos,104
@elprestook,@tipitolive,96
@220podcast,@nicoguthmann,94
@cafekyoto,@danannoficial,94
@220podcast,@elprestook,84
@losherederosdealberdi,@paisdeboludos,83
@cafekyoto,@elprestook,78
@danannoficial,@tipitolive,77
@futurock,@planmmaximontenegro,75
@barricadatv321,@planmmaximontenegro,73
@danannoficial,@nicoguthmann,73
@cafekyoto,@filonews,73
@nicoguthmann,@tipitoenojado,71
@agustinlajeok,@cafekyoto,69
@nicoguthmann,@somosgelatina,64
@ramiromarra,@somosgelatina,64
@220podcast,@tipitoenojado,60
@agustinlajeok,@nicoguthmann,60
@nicoguthmann,@planmmaximontenegro,52
@filonews,@somosazz,47
@losherederosdealberdi,@somosgelatina,46
@nicoguthmann,@ramiromarra,46
@futurock,@ramiromarra,45
@danannoficial,@somosazz,45
@danannoficial,@genteenojada7387,44
@220podcast,@danannoficial,44
@genteenojada7387,@paisdeboludos,43
@futurock,@nicoguthmann,42
@genteenojada7387,@tipitoenojado,42
@filonews,@luzutv,42
@elprestook,@somosazz,40
@220podcast,@agustinlajeok,39
@elprestook,@genteenojada7387,37
@barricadatv321,@somosgelatina,36
@somosgelatina,@tomasrebord,35
@barricadatv321,@ramiromarra,35
@agustinlajeok,@tipitolive,35
@genteenojada7387,@somosgelatina,32
@cafekyoto,@losherederosdealberdi,29
@losherederosdealberdi,@tipitolive,28
@220podcast,@planmmaximontenegro,28
@barricadatv321,@paisdeboludos,27
@losherederosdealberdi,@nicoguthmann,26
@barricadatv321,@losherederosdealberdi,26
@agustinlajeok,@somosazz,26
@filonews,@tipitolive,26
@cafekyoto,@paisdeboludos,25
@220podcast,@ramiromarra,24
@somosazz,@tipitoenojado,24
@futurock,@genteenojada7387,22
@futurock,@losherederosdealberdi,22
@agustinlajeok,@genteenojada7387,22
@filonews,@tomasrebord,20
@pablobordaok,@paisdeboludos,18
@paisdeboludos,@tomasrebord,17
@barricadatv321,@futurock,15
@220podcast,@genteenojada7387,14
@incatube,@somosgelatina,14
@cafekyoto,@somosgelatina,14
@filonews,@pablobordaok,14
@cafekyoto,@planmmaximontenegro,13
@cafekyoto,@ramiromarra,13
@incatube,@paisdeboludos,12
@pablobordaok,@somosgelatina,12
@pablobordaok,@tipitoenojado,12
@filonews,@incatube,12
@220podcast,@losherederosdealberdi,11
@paisdeboludos,@somosazz,11
@barricadatv321,@nicoguthmann,10
@futurock,@incatube,10
@futurock,@tomasrebord,10
@genteenojada7387,@planmmaximontenegro,10
@somosazz,@somosgelatina,10
@genteenojada7387,@losherederosdealberdi,9
@planmmaximontenegro,@somosazz,9
@danannoficial,@pablobordaok,9
@220podcast,@tomasrebord,7
@elprestook,@pablobordaok,7
@agustinlajeok,@pablobordaok,7
@cafekyoto,@pablobordaok,6
@220podcast,@barricadatv321,6
@danannoficial,@tomasrebord,6
@220podcast,@incatube,5
@220podcast,@somosazz,5
@220podcast,@cafekyoto,5
@losherederosdealberdi,@somosazz,5
@futurock,@somosazz,5
@futurock,@luzutv,5
@ramiromarra,@tipitolive,5
@ramiromarra,@somosazz,5
@francopisso,@tipitoenojado,5
@elprestook,@francopisso,5
@elprestook,@tomasrebord,5
@cafekyoto,@tipitolive,4
@planmmaximontenegro,@tipitolive,4
@genteenojada7387,@ramiromarra,4
@elprestook,@incatube,4
@agustinlajeok,@luzutv,4
@danannoficial,@luzutv,4
@genteenojada7387,@nicoguthmann,3
@220podcast,@pablobordaok,3
@barricadatv321,@cafekyoto,3
@losherederosdealberdi,@pablobordaok,3
@losherederosdealberdi,@tomasrebord,3
@pablobordaok,@planmmaximontenegro,3
@francopisso,@ramiromarra,3
@tipitoenojado,@tomasrebord,3
@elprestook,@luzutv,3
@agustinlajeok,@tomasrebord,3
@danannoficial,@francopisso,3
@filonews,@francopisso,3
@cafekyoto,@genteenojada7387,2
@nicoguthmann,@tomasrebord,2
@nicoguthmann,@tipitolive,2
@luzutv,@nicoguthmann,2
@barricadatv321,@incatube,2
@barricadatv321,@somosazz,2
@220podcast,@luzutv,2
@futurock,@tipitolive,2
@cafekyoto,@futurock,2
@paisdeboludos,@tipitolive,2
@luzutv,@paisdeboludos,2
@incatube,@ramiromarra,2
@incatube,@tipitoenojado,2
@pablobordaok,@tomasrebord,1
@incatube,@tomasrebord,1
@genteenojada7387,@incatube,1
@nicoguthmann,@pablobordaok,1
@nicoguthmann,@somosazz,1
@cafekyoto,@nicoguthmann,1
@barricadatv321,@tipitolive,1
@barricadatv321,@genteenojada7387,1
@futurock,@pablobordaok,1
@leylabechara,@paisdeboludos,1
@incatube,@planmmaximontenegro,1
@planmmaximontenegro,@tomasrebord,1
@leylabechara,@somosgelatina,1
@luzutv,@planmmaximontenegro,1
@luzutv,@somosgelatina,1
@pablobordaok,@ramiromarra,1
@ramiromarra,@tomasrebord,1
@luzutv,@tipitoenojado,1
@agustinlajeok,@francopisso,1
@filonews,@leylabechara,1
`;

function parse<T>(data: string) {
  const lines = data.split("\n").filter((line) => line.trim().length > 0);
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const item: T = header.reduce((acc, key, index) => {
      return { ...acc, [key]: values[index] };
    }, {} as T);
    return item;
  });
}

// Component that load the graph
export const LoadGraph = ({
  nodes,
  edges,
}: {
  nodes: Node[];
  edges: Edge[];
}) => {
  const loadGraph = useLoadGraph();

  useEffect(() => {
    const graph = new UndirectedGraph();

    nodes.forEach((node) => {
      console.log(node.handle);
      graph.addNode(node.handle, {
        x: Math.random() * 500,
        y: Math.random() * 500,
        size: 5,
        label: node.handle,
        color: "#FA4F40",
      });
    });
    edges
      .filter((e) => e.weight > 10)
      .forEach((edge) => {
        graph.addEdge(edge.Source, edge.Target, {
          size: edge.weight / 1000,
          color: "#ccc",
        });
      });
    loadGraph(graph, true);
  }, [loadGraph]);

  return null;
};

export const ForceAtlas2 = () => {
  const { start, kill } = useWorkerLayoutForceAtlas2({
    settings: { slowDown: 10, gravity: 1, scalingRatio: 1000 },
  });

  useEffect(() => {
    start();
    return () => kill();
  }, [start, kill]);

  return null;
};

export default function Page() {
  const nodes = parse<Node>(NODES);
  const edges = parse<Edge>(EDGES).map((edge) => ({
    ...edge,
    weight: Number(edge.weight),
  }));

  return (
    <div>
      <SigmaContainer
        className="border border-black"
        style={{
          width: "800px",
          height: "500px",
        }}
      >
        <LoadGraph nodes={nodes} edges={edges} />
        <ForceAtlas2 />
      </SigmaContainer>
      <ul>
        {nodes.map((node) => (
          <li key={node.handle}>{node.handle}</li>
        ))}
      </ul>
    </div>
  );
}
