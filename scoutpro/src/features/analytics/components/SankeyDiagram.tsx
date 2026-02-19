import { useMemo } from "react";
import { sankey as d3Sankey, sankeyLinkHorizontal } from "d3-sankey";
import type { SankeyResponse } from "../types";

type SankeyNodeData = { name: string };
type SankeyLinkData = { source: number; target: number; value: number };

/** Pipeline stage order for acyclic Sankey (d3-sankey does not support cycles). */
const PIPELINE_STAGE_ORDER: Record<string, number> = {
  first_contact: 0,
  observed: 1,
  shortlist: 2,
  trial: 3,
  offer: 4,
  signed: 5,
  rejected: 6,
};

export function SankeyDiagram({ data }: { data: SankeyResponse }) {
  const { nodes, links } = data;

  const graph = useMemo(() => {
    const nodeIndex = new Map<string, number>();
    const sankeyNodes: SankeyNodeData[] = [];

    const ensureNode = (id: string) => {
      const existing = nodeIndex.get(id);
      if (existing !== undefined) return existing;
      const idx = sankeyNodes.length;
      sankeyNodes.push({ name: id });
      nodeIndex.set(id, idx);
      return idx;
    };

    // d3-sankey requires a DAG: keep only forward transitions to avoid "circular link" error
    const order = (id: string) => PIPELINE_STAGE_ORDER[id] ?? 999;
    const acyclicLinks = links.filter(
      (l) => order(l.source) < order(l.target)
    );

    const sankeyLinks: SankeyLinkData[] = acyclicLinks.map((l) => ({
      source: ensureNode(l.source),
      target: ensureNode(l.target),
      value: l.value,
    }));

    // Ensure nodes declared by server also exist (even if no links)
    nodes.forEach((n) => ensureNode(n.id));

    const width = 900;
    const height = 420;

    const sankeyGen = d3Sankey<SankeyNodeData, SankeyLinkData>()
      .nodeWidth(16)
      .nodePadding(14)
      .extent([
        [1, 1],
        [width - 1, height - 1],
      ]);

    const sankeyGraph = sankeyGen({
      nodes: sankeyNodes.map((d) => ({ ...d })),
      links: sankeyLinks.map((d) => ({ ...d })),
    });

    return { width, height, sankeyGraph };
  }, [nodes, links]);

  const { width, height, sankeyGraph } = graph;
  const linkPath = sankeyLinkHorizontal<SankeyNodeData, SankeyLinkData>();

  return (
    <div className="w-full overflow-auto rounded-md border border-slate-200 bg-white">
      <svg width={width} height={height}>
        <g>
          {sankeyGraph.links.map((l, idx) => (
            <path
              key={idx}
              d={linkPath(l) ?? undefined}
              fill="none"
              stroke="rgba(59,130,246,0.35)"
              strokeWidth={Math.max(1, l.width ?? 1)}
            />
          ))}
        </g>
        <g>
          {sankeyGraph.nodes.map((n, idx) => (
            <g key={idx}>
              <rect
                x={n.x0 ?? 0}
                y={n.y0 ?? 0}
                width={(n.x1 ?? 0) - (n.x0 ?? 0)}
                height={Math.max(1, (n.y1 ?? 0) - (n.y0 ?? 0))}
                fill="rgba(30,41,59,0.85)"
                rx={2}
              />
              <text
                x={(n.x0 ?? 0) < width / 2 ? (n.x1 ?? 0) + 6 : (n.x0 ?? 0) - 6}
                y={((n.y0 ?? 0) + (n.y1 ?? 0)) / 2}
                textAnchor={(n.x0 ?? 0) < width / 2 ? "start" : "end"}
                dominantBaseline="middle"
                fontSize={12}
                fill="#0f172a"
              >
                {n.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

