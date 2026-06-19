import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function BlameGraph({ graphData }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return

    const width = 600
    const height = 300

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Add zoom behavior
    const g = svg.append('g')
    svg.call(d3.zoom().on('zoom', (event) => {
      g.attr('transform', event.transform)
    }))

    // Define marker arrowhead for directed edges
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18) // position of arrowhead on node edge
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#64748b')

    // Create D3 forces
    const simulation = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.edges).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))

    // Create absolute-positioned tooltip div in the parent container
    let tooltip = d3.select('#blame-graph-tooltip')
    if (tooltip.empty()) {
      tooltip = d3.select(svgRef.current.parentNode)
        .append('div')
        .attr('id', 'blame-graph-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', '#0f172a')
        .style('border', '1px solid #334155')
        .style('border-radius', '8px')
        .style('padding', '8px 12px')
        .style('color', '#f1f5f9')
        .style('font-size', '11px')
        .style('pointer-events', 'none')
        .style('z-index', '10')
        .style('box-shadow', '0 10px 15px -3px rgba(0, 0, 0, 0.5)')
    }

    // Draw links/edges
    const link = g.append('g')
      .selectAll('line')
      .data(graphData.edges)
      .enter().append('line')
      .attr('stroke', '#475569')
      .attr('stroke-width', d => Math.min(2 + (d.weight || 0) * 0.5, 6))
      .attr('marker-end', 'url(#arrow)')
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        let content = `<div class="font-bold text-slate-200 mb-0.5">Cascade Link</div>`
        content += `<div class="text-[10px] text-slate-400"><span class="font-semibold text-slate-300">Path:</span> ${d.source.id} &rarr; ${d.target.id}</div>`
        if (d.weight) {
          content += `<div class="text-[10px] text-slate-400"><span class="font-semibold text-slate-300">Weight:</span> ${d.weight}</div>`
        }
        if (d.reason) {
          content += `<div class="text-[10px] text-slate-400"><span class="font-semibold text-slate-300">Reason:</span> ${d.reason}</div>`
        }
        tooltip.html(content).style('visibility', 'visible')
      })
      .on('mousemove', (event) => {
        const [x, y] = d3.pointer(event, svgRef.current.parentNode)
        tooltip.style('top', `${y - 75}px`).style('left', `${x + 15}px`)
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden')
      })

    // Draw link labels (reasons)
    const linkText = g.append('g')
      .selectAll('text')
      .data(graphData.edges)
      .enter().append('text')
      .attr('font-size', '8px')
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .text(d => d.reason ? (d.reason.length > 25 ? d.reason.substring(0, 22) + "..." : d.reason) : "cascades")

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('mouseover', (event, d) => {
        let content = `<div class="font-bold text-slate-200 mb-1">${d.label || d.id}</div>`
        content += `<div class="text-[10px] text-slate-400"><span class="font-semibold text-slate-300">Type:</span> ${d.type.replace('_', ' ')}</div>`
        content += `<div class="text-[10px] text-slate-400"><span class="font-semibold text-slate-300">Severity:</span> <span class="capitalize ${d.severity === 'critical' ? 'text-red-400' : d.severity === 'high' ? 'text-amber-400' : 'text-slate-300'}">${d.severity}</span></div>`
        if (d.error_count > 0) {
          content += `<div class="text-[10px] text-slate-400"><span class="font-semibold text-slate-300">Errors:</span> ${d.error_count}</div>`
        }
        tooltip.html(content).style('visibility', 'visible')
      })
      .on('mousemove', (event) => {
        const [x, y] = d3.pointer(event, svgRef.current.parentNode)
        tooltip.style('top', `${y - 75}px`).style('left', `${x + 15}px`)
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden')
      })

    // Append circles for nodes with custom colors
    node.append('circle')
      .attr('r', d => d.type === 'root_cause' ? 14 : 10)
      .attr('fill', d => {
        if (d.type === 'root_cause') return '#ef4444'       // Red
        if (d.type === 'cascade') return '#f59e0b'          // Amber
        if (d.type === 'hypothesis') return '#3b82f6'       // Blue
        if (d.type === 'historical_match') return '#22c55e' // Green
        return '#64748b'
      })
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')

    // Append node labels
    node.append('text')
      .attr('dx', d => d.type === 'root_cause' ? 18 : 14)
      .attr('dy', 4)
      .attr('fill', '#f1f5f9')
      .attr('font-size', d => d.type === 'root_cause' ? '11px' : '9px')
      .attr('font-weight', d => d.type === 'root_cause' ? '700' : '500')
      .text(d => d.id.startsWith("hyp_") || d.id.startsWith("hist_") ? (d.label.length > 25 ? d.label.substring(0, 22) + "..." : d.label) : d.id)

    // Tick function to update coordinates
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      linkText
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2 - 4)

      node
        .attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Drag handlers
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    return () => {
      simulation.stop()
      // Cleanup tooltip if component unmounts
      d3.select('#blame-graph-tooltip').remove()
    }
  }, [graphData])

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-inner">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-300">Failure Propagation Blame Graph</h4>
          <span className="text-[10px] text-slate-500">Hover nodes/edges for details. Drag or scroll to zoom/pan.</span>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 block"></span>
            <span className="text-slate-400">Root Cause</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
            <span className="text-slate-400">Cascade</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block"></span>
            <span className="text-slate-400">Hypothesis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 block"></span>
            <span className="text-slate-400">Past Match</span>
          </div>
        </div>
      </div>
      <div className="border border-slate-800/80 bg-slate-950/40 rounded-xl overflow-hidden relative">
        <svg
          ref={svgRef}
          viewBox="0 0 600 300"
          className="w-full h-[300px]"
        />
      </div>
    </div>
  )
}
