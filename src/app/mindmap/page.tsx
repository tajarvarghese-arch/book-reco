'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

type MindmapBook = {
  id: number;
  title: string;
  author: string | null;
  my_rating: number;
  cover_url: string | null;
  review: string | null;
  category: string;
};

type CategoryStat = {
  name: string;
  count: number;
  avgRating: number;
  fiveStarCount: number;
  color: string;
  books: MindmapBook[];
};

type GraphNode = d3.SimulationNodeDatum & {
  id: string;
  type: 'genre' | 'book';
  label: string;
  author?: string;
  rating?: number;
  color: string;
  coverUrl?: string | null;
  synopsis?: string | null;
  category?: string;
  count?: number;
};

type GraphLink = d3.SimulationLinkDatum<GraphNode> & {
  type: 'genre-book' | 'author-link';
};

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.substring(0, max).replace(/\s+\S*$/, '') + '...';
}

function nodeRadius(d: GraphNode): number {
  if (d.type === 'genre') return 25;
  const r = d.rating || 0;
  if (r === 5) return 9;
  if (r >= 4) return 7;
  if (r >= 3) return 6;
  if (r >= 1) return 5;
  return 4;
}

export default function MindmapPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    fetch('/api/mindmap')
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categoryStats);
        setTotalBooks(data.totalBooks);
        buildGraph(data.categoryStats);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildGraph = (cats: CategoryStat[]) => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const width = window.innerWidth;
    const height = window.innerHeight;
    svg.attr('width', width).attr('height', height);

    // Build nodes and links
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const authorMap: Record<string, string[]> = {};

    for (const cat of cats) {
      const genreId = `genre-${cat.name}`;
      nodes.push({
        id: genreId, type: 'genre', label: cat.name, color: cat.color, count: cat.count,
      });

      for (const book of cat.books) {
        const bookId = `book-${book.id}`;
        nodes.push({
          id: bookId, type: 'book', label: book.title,
          author: book.author || undefined, rating: book.my_rating,
          color: cat.color, coverUrl: book.cover_url,
          synopsis: book.review, category: cat.name,
        });
        links.push({ source: genreId, target: bookId, type: 'genre-book' });

        if (book.author) {
          if (!authorMap[book.author]) authorMap[book.author] = [];
          authorMap[book.author].push(bookId);
        }
      }
    }

    // Author cross-links
    for (const bookIds of Object.values(authorMap)) {
      if (bookIds.length > 1) {
        for (let i = 1; i < bookIds.length; i++) {
          links.push({ source: bookIds[0], target: bookIds[i], type: 'author-link' });
        }
      }
    }

    // Zoom container
    const g = svg.append('g');
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoomBehavior);
    svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8));

    // Glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'coloredBlur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance((d) => d.type === 'genre-book' ? 80 : 120)
        .strength((d) => d.type === 'genre-book' ? 0.4 : 0.1))
      .force('charge', d3.forceManyBody()
        .strength((d) => (d as GraphNode).type === 'genre' ? -400 : -30))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide<GraphNode>()
        .radius((d) => d.type === 'genre' ? 35 : nodeRadius(d) + 2));

    // Links
    const link = g.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', (d) => d.type === 'author-link' ? '#fff' : '#555')
      .attr('stroke-opacity', (d) => d.type === 'author-link' ? 0.08 : 0.15)
      .attr('stroke-width', (d) => d.type === 'author-link' ? 0.5 : 0.7)
      .attr('stroke-dasharray', (d) => d.type === 'author-link' ? '2,3' : 'none');

    // Book nodes
    const bookNode = g.append('g')
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .data(nodes.filter((n) => n.type === 'book'))
      .join('circle')
      .attr('r', (d) => nodeRadius(d))
      .attr('fill', (d) => d.color)
      .attr('stroke', (d) => d.rating === 5 ? '#fff' : 'none')
      .attr('stroke-width', (d) => d.rating === 5 ? 1.5 : 0)
      .attr('opacity', (d) => (!d.rating || d.rating === 0) ? 0.4 : 0.3 + (d.rating / 5) * 0.7)
      .attr('cursor', 'pointer')
      .attr('filter', (d) => d.rating === 5 ? 'url(#glow)' : 'none')
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(150)
          .attr('r', nodeRadius(d) * 1.8).attr('opacity', 1);
        showTooltip(event, d);
      })
      .on('mouseout', function (_, d) {
        d3.select(this).transition().duration(300)
          .attr('r', nodeRadius(d))
          .attr('opacity', (!d.rating || d.rating === 0) ? 0.4 : 0.3 + (d.rating / 5) * 0.7);
        hideTooltip();
      })
      .on('click', (_, d) => setSelectedNode(d))
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    // Genre hub nodes
    const genreGroup = g.append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes.filter((n) => n.type === 'genre'))
      .join('g')
      .attr('cursor', 'grab')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    genreGroup.append('circle')
      .attr('r', (d) => 20 + (d.count || 0) * 0.5)
      .attr('fill', (d) => d.color).attr('opacity', 0.25)
      .attr('stroke', (d) => d.color).attr('stroke-width', 2);

    genreGroup.append('text').text((d) => d.label)
      .attr('text-anchor', 'middle').attr('dy', '-0.2em')
      .attr('fill', '#fff').attr('font-size', '11px').attr('font-weight', 'bold').attr('pointer-events', 'none');

    genreGroup.append('text').text((d) => `${d.count} books`)
      .attr('text-anchor', 'middle').attr('dy', '1em')
      .attr('fill', '#fff').attr('font-size', '9px').attr('opacity', 0.7).attr('pointer-events', 'none');

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x || 0)
        .attr('y1', (d) => (d.source as GraphNode).y || 0)
        .attr('x2', (d) => (d.target as GraphNode).x || 0)
        .attr('y2', (d) => (d.target as GraphNode).y || 0);
      bookNode.attr('cx', (d) => d.x || 0).attr('cy', (d) => d.y || 0);
      genreGroup.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    function showTooltip(event: MouseEvent, d: GraphNode) {
      const tip = tooltipRef.current;
      if (!tip) return;
      tip.style.display = 'block';
      tip.style.left = `${event.pageX + 15}px`;
      tip.style.top = `${event.pageY - 10}px`;

      const dots = d.rating && d.rating > 0
        ? Array.from({ length: 5 }, (_, i) =>
            `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:2px;background:${i < (d.rating || 0) ? '#d97757' : '#444'}"></span>`
          ).join('')
        : '<span style="color:#666;font-size:11px">Unrated</span>';

      const cover = d.coverUrl && d.coverUrl !== 'none'
        ? `<img src="${d.coverUrl}" style="width:50px;border-radius:4px;object-fit:cover;flex-shrink:0" />`
        : '';

      const syn = d.synopsis
        ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #333;font-size:11px;color:#aaa;max-height:100px;overflow-y:auto;line-height:1.4">${truncate(d.synopsis, 200)}</div>`
        : '';

      tip.innerHTML = `
        <div style="display:flex;gap:10px;align-items:start">
          ${cover}
          <div style="flex:1;min-width:0">
            <div style="font-weight:bold;font-size:13px;color:#fff;line-height:1.3">${d.label}</div>
            <div style="font-size:11px;color:#999;margin-top:2px">${d.author || 'Unknown'}</div>
            <div style="margin-top:4px">${dots}</div>
            <div style="font-size:10px;color:${d.color};margin-top:3px">${d.category || ''}</div>
          </div>
        </div>
        ${syn}`;
    }

    function hideTooltip() {
      const tip = tooltipRef.current;
      if (tip) tip.style.display = 'none';
    }

    return () => simulation.stop();
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#141413', overflow: 'hidden', position: 'relative' }}>
      {/* Header */}
      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', margin: 0, fontFamily: 'var(--font-heading)' }}>Book Network</h1>
          <p style={{ fontSize: '13px', color: '#b0aea5', margin: '4px 0 0' }}>
            {totalBooks} books &middot; {categories.length} genres &middot; drag nodes &middot; scroll to zoom &middot; click for details
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', pointerEvents: 'all' }}>
          <a href="/" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontSize: '13px', textDecoration: 'none', backdropFilter: 'blur(8px)' }}>Dashboard</a>
          <a href="/recommendations" style={{ padding: '8px 16px', background: 'rgba(217,119,87,0.8)', color: '#fff', borderRadius: '8px', fontSize: '13px', textDecoration: 'none' }}>Recommendations</a>
        </div>
      </header>

      {/* Genre Legend */}
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 20, display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '500px', pointerEvents: 'none' }}>
        {categories.map((cat) => (
          <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '4px 12px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color, display: 'inline-block' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{cat.name} ({cat.count})</span>
          </div>
        ))}
      </div>

      {/* Size Legend */}
      <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 20, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '10px', padding: '10px 16px', pointerEvents: 'none' }}>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Dot Size = Rating</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[{ size: 4, label: 'Unrated' }, { size: 6, label: '3' }, { size: 7, label: '4' }, { size: 9, label: '5' }].map((s) => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: s.size * 2, height: s.size * 2, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* D3 SVG */}
      <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Hover Tooltip */}
      <div ref={tooltipRef} style={{ display: 'none', position: 'absolute', zIndex: 30, background: '#1a1a19', border: '1px solid #333', borderRadius: '10px', padding: '12px', maxWidth: '320px', pointerEvents: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }} />

      {/* Click Detail Modal */}
      {selectedNode && selectedNode.type === 'book' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedNode(null)}>
          <div style={{ background: '#1a1a19', border: '1px solid #333', borderRadius: '16px', padding: '24px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
              {selectedNode.coverUrl && selectedNode.coverUrl !== 'none' && (
                <img src={selectedNode.coverUrl} alt={selectedNode.label} style={{ width: '80px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: 0, lineHeight: 1.3, fontFamily: 'var(--font-heading)' }}>{selectedNode.label}</h2>
                  <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: '#666', fontSize: '20px', cursor: 'pointer', marginLeft: '8px', flexShrink: 0 }}>&times;</button>
                </div>
                <p style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>{selectedNode.author || 'Unknown author'}</p>
                <div style={{ marginTop: '8px', display: 'flex', gap: '3px' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: i <= (selectedNode.rating || 0) ? '#d97757' : '#444' }} />
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: selectedNode.color, marginTop: '6px' }}>{selectedNode.category}</div>
              </div>
            </div>
            {selectedNode.synopsis && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #333' }}>
                <h3 style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Synopsis</h3>
                <p style={{ fontSize: '13px', color: '#ccc', lineHeight: 1.6, maxHeight: '200px', overflowY: 'auto' }}>{selectedNode.synopsis}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
